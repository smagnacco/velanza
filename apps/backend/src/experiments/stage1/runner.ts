import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { experiments, runs, rounds, concepts } from '../../db/schema.js';
import { getProvider } from '../../providers/registry.js';
import { resolveDomain } from './domains.js';
import type { LLMProvider } from '../../providers/types.js';
import { parseConcepts, parseVerdicts, parseVerification } from './parser.js';
import { logger } from '../../lib/logger.js';
import type { SSEEvent, Language, ExperimentConfig } from '@velanza/shared';
import * as promptsEs from '../../prompts/stage1.es.js';
import * as promptsEn from '../../prompts/stage1.en.js';

type Prompts = typeof promptsEs;

function getPrompts(lang: Language): Prompts {
  return lang === 'es' ? promptsEs : promptsEn;
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

import type { LLMProvider } from '../../providers/types.js';

interface RunnerOptions {
  experimentId: string;
  config: ExperimentConfig;
  emit: (event: SSEEvent) => void;
  providerOverride?: (name: string) => LLMProvider;
}

async function saveRound(
  runId: string,
  roundNumber: number,
  role: 'explorer' | 'critic' | 'verifier',
  systemPrompt: string,
  userPrompt: string,
  response: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number
): Promise<void> {
  const db = getDb();
  await db.insert(rounds).values({
    id: uuidv4(),
    runId,
    roundNumber,
    role,
    systemPrompt,
    userPrompt,
    response,
    inputTokens,
    outputTokens,
    latencyMs,
    createdAt: now(),
  });
}

async function executeRound(
  provider: LLMProvider,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  lang: Language
): Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const response = await provider.complete(model, {
    systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: 2048,
    temperature,
  });
  return {
    text: response.text,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    latencyMs: response.latencyMs,
  };
}

export async function executeRun(
  runId: string,
  domainId: string,
  config: ExperimentConfig,
  emit: (event: SSEEvent) => void,
  providerOverride?: (name: string) => LLMProvider
): Promise<void> {
  const db = getDb();
  const lang = config.language;
  const prompts = getPrompts(lang);

  // domainId here is the serialized domain entry from the run record
  const domainEntry =
    config.domains.find((d) =>
      typeof d === 'string'
        ? d === domainId
        : `custom_${d.label.toLowerCase().replace(/\s+/g, '_').slice(0, 32)}` === domainId
    ) ?? domainId;
  const domain = resolveDomain(domainEntry, lang);

  const resolveProvider = providerOverride ?? getProvider;
  const explorerProvider = resolveProvider(config.explorer.provider);
  const criticProvider = resolveProvider(config.critic.provider);
  const verifierProvider = resolveProvider(config.verifier.provider);

  await db.update(runs).set({ status: 'running', startedAt: now() }).where(eq(runs.id, runId));

  emit({ type: 'run-started', payload: { runId, domain: domainId } });

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const explorerSystem = prompts.explorerSystemPrompt();
    const criticSystem = prompts.criticSystemPrompt();

    // Round 1: Explorer proposes
    emit({ type: 'round-started', payload: { runId, round: 1, role: 'explorer' } });
    const round1UserPrompt = prompts.explorerFirstPrompt(domain);
    const round1 = await executeRound(
      explorerProvider,
      config.explorer.model,
      explorerSystem,
      round1UserPrompt,
      config.explorer.temperature,
      lang
    );
    totalInputTokens += round1.inputTokens;
    totalOutputTokens += round1.outputTokens;
    await saveRound(
      runId,
      1,
      'explorer',
      explorerSystem,
      round1UserPrompt,
      round1.text,
      round1.inputTokens,
      round1.outputTokens,
      round1.latencyMs
    );
    emit({
      type: 'round-completed',
      payload: {
        runId,
        round: 1,
        role: 'explorer',
        text: round1.text,
        inputTokens: round1.inputTokens,
        outputTokens: round1.outputTokens,
        latencyMs: round1.latencyMs,
      },
    });

    // Round 2: Critic evaluates
    emit({ type: 'round-started', payload: { runId, round: 2, role: 'critic' } });
    const round2UserPrompt = prompts.criticEvaluationPrompt(round1.text);
    const round2 = await executeRound(
      criticProvider,
      config.critic.model,
      criticSystem,
      round2UserPrompt,
      config.critic.temperature,
      lang
    );
    totalInputTokens += round2.inputTokens;
    totalOutputTokens += round2.outputTokens;
    await saveRound(
      runId,
      2,
      'critic',
      criticSystem,
      round2UserPrompt,
      round2.text,
      round2.inputTokens,
      round2.outputTokens,
      round2.latencyMs
    );
    emit({
      type: 'round-completed',
      payload: {
        runId,
        round: 2,
        role: 'critic',
        text: round2.text,
        inputTokens: round2.inputTokens,
        outputTokens: round2.outputTokens,
        latencyMs: round2.latencyMs,
      },
    });

    // Round 3: Explorer refines
    emit({ type: 'round-started', payload: { runId, round: 3, role: 'explorer' } });
    const round3UserPrompt = prompts.explorerRefinementPrompt(round2.text);
    const round3 = await executeRound(
      explorerProvider,
      config.explorer.model,
      explorerSystem,
      round3UserPrompt,
      config.explorer.temperature,
      lang
    );
    totalInputTokens += round3.inputTokens;
    totalOutputTokens += round3.outputTokens;
    await saveRound(
      runId,
      3,
      'explorer',
      explorerSystem,
      round3UserPrompt,
      round3.text,
      round3.inputTokens,
      round3.outputTokens,
      round3.latencyMs
    );
    emit({
      type: 'round-completed',
      payload: {
        runId,
        round: 3,
        role: 'explorer',
        text: round3.text,
        inputTokens: round3.inputTokens,
        outputTokens: round3.outputTokens,
        latencyMs: round3.latencyMs,
      },
    });

    // Round 4: Critic final verdict
    emit({ type: 'round-started', payload: { runId, round: 4, role: 'critic' } });
    const round4UserPrompt = prompts.criticFinalVerdictPrompt(round3.text);
    const round4 = await executeRound(
      criticProvider,
      config.critic.model,
      criticSystem,
      round4UserPrompt,
      config.critic.temperature,
      lang
    );
    totalInputTokens += round4.inputTokens;
    totalOutputTokens += round4.outputTokens;
    await saveRound(
      runId,
      4,
      'critic',
      criticSystem,
      round4UserPrompt,
      round4.text,
      round4.inputTokens,
      round4.outputTokens,
      round4.latencyMs
    );
    emit({
      type: 'round-completed',
      payload: {
        runId,
        round: 4,
        role: 'critic',
        text: round4.text,
        inputTokens: round4.inputTokens,
        outputTokens: round4.outputTokens,
        latencyMs: round4.latencyMs,
      },
    });

    // Parse verdicts and get stabilized concepts
    const verdicts = parseVerdicts(round4.text, lang);
    // round3 may not repeat the full format if explorer just defended; fall back to round1
    const finalConcepts =
      parseConcepts(round3.text, lang).length > 0
        ? parseConcepts(round3.text, lang)
        : parseConcepts(round1.text, lang);

    // Round 5: Verifier for each stabilized concept
    const verifierSystem = prompts.verifierSystemPrompt();

    for (const verdict of verdicts) {
      if (!verdict.stabilized) continue;

      const conceptData = finalConcepts.find(
        (c) => c.word.toLowerCase() === verdict.word.toLowerCase()
      );

      if (!conceptData) {
        logger.warn(`No concept data found for stabilized verdict word: ${verdict.word}`);
        continue;
      }

      emit({
        type: 'round-started',
        payload: { runId, round: 5, role: 'verifier', word: verdict.word },
      });
      const verifyUserPrompt = prompts.verifierCheckPrompt(
        conceptData.word,
        conceptData.definition
      );
      const round5 = await executeRound(
        verifierProvider,
        config.verifier.model,
        verifierSystem,
        verifyUserPrompt,
        config.verifier.temperature,
        lang
      );
      totalInputTokens += round5.inputTokens;
      totalOutputTokens += round5.outputTokens;
      await saveRound(
        runId,
        5,
        'verifier',
        verifierSystem,
        verifyUserPrompt,
        round5.text,
        round5.inputTokens,
        round5.outputTokens,
        round5.latencyMs
      );
      emit({
        type: 'round-completed',
        payload: {
          runId,
          round: 5,
          role: 'verifier',
          text: round5.text,
          inputTokens: round5.inputTokens,
          outputTokens: round5.outputTokens,
          latencyMs: round5.latencyMs,
        },
      });

      const verification = parseVerification(round5.text, lang);

      const conceptId = uuidv4();
      await db.insert(concepts).values({
        id: conceptId,
        runId,
        word: conceptData.word,
        definition: conceptData.definition,
        etymology: conceptData.etymology,
        stabilized: true,
        existsInOtherLanguages: verification.existsInOtherLanguages,
        existenceEvidence: JSON.stringify([{ text: verification.evidence }]),
        createdAt: now(),
      });

      emit({
        type: 'concept-stabilized',
        payload: {
          conceptId,
          word: conceptData.word,
          definition: conceptData.definition,
          etymology: conceptData.etymology,
          existsInOtherLanguages: verification.existsInOtherLanguages,
        },
      });
    }

    // Save rejected concepts too (without verification)
    for (const verdict of verdicts) {
      if (verdict.stabilized) continue;
      const conceptData =
        finalConcepts.find((c) => c.word.toLowerCase() === verdict.word.toLowerCase()) ??
        finalConcepts[verdicts.indexOf(verdict)];
      if (!conceptData) continue;

      await db.insert(concepts).values({
        id: uuidv4(),
        runId,
        word: conceptData.word,
        definition: conceptData.definition,
        etymology: conceptData.etymology,
        stabilized: false,
        existsInOtherLanguages: 'uncertain',
        existenceEvidence: JSON.stringify([]),
        createdAt: now(),
      });
    }

    await db
      .update(runs)
      .set({
        status: 'completed',
        completedAt: now(),
        totalInputTokens,
        totalOutputTokens,
      })
      .where(eq(runs.id, runId));

    emit({ type: 'run-completed', payload: { runId } });
  } catch (error) {
    logger.error(`Run ${runId} failed`, error);
    await db.update(runs).set({ status: 'failed', completedAt: now() }).where(eq(runs.id, runId));
    throw error;
  }
}

export async function executeExperiment(options: RunnerOptions): Promise<void> {
  const { experimentId, config, emit, providerOverride } = options;
  const db = getDb();

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });

  if (!experiment) throw new Error(`Experiment not found: ${experimentId}`);
  if (experiment.status === 'completed') return;

  await db.update(experiments).set({ status: 'running' }).where(eq(experiments.id, experimentId));

  const pendingRuns = await db.query.runs.findMany({
    where: eq(runs.experimentId, experimentId),
  });

  let completedCount = experiment.completedRuns;

  try {
    for (const run of pendingRuns) {
      if (run.status === 'completed') continue;
      if (run.status === 'failed') continue;

      const currentExperiment = await db.query.experiments.findFirst({
        where: eq(experiments.id, experimentId),
      });
      if (currentExperiment?.status === 'paused') {
        logger.info(`Experiment ${experimentId} paused before run ${run.id}`);
        return;
      }

      await executeRun(run.id, run.domain, config, emit, providerOverride);
      completedCount++;

      await db
        .update(experiments)
        .set({ completedRuns: completedCount })
        .where(eq(experiments.id, experimentId));
    }

    await db
      .update(experiments)
      .set({ status: 'completed' })
      .where(eq(experiments.id, experimentId));

    emit({ type: 'experiment-completed', payload: { experimentId } });
  } catch (error) {
    logger.error(`Experiment ${experimentId} failed`, error);
    await db.update(experiments).set({ status: 'failed' }).where(eq(experiments.id, experimentId));
    emit({ type: 'error', payload: { message: 'Experiment failed', experimentId } });
    throw error;
  }
}
