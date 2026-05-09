import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env['DB_PATH'] = join(tmpdir(), `velanza-integration-${Date.now()}.db`);
process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test-placeholder';

import { getDb, resetDb } from '../src/db/client.js';
import { setupTestDb } from '../src/db/setup-test.js';
import { experiments, runs, rounds, concepts } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { executeRun } from '../src/experiments/stage1/runner.js';
import type { ExperimentConfig } from '@velanza/shared';
import type {
  LLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
} from '../src/providers/types.js';
import { v4 as uuidv4 } from 'uuid';

// ── Mock provider ─────────────────────────────────────────────────────────────

function makeMockExplorerResponse(lang: 'es' | 'en'): string {
  if (lang === 'es') {
    return `
CONCEPTO: velanza
DEFINICIÓN: Estado en que un pensamiento propio existe sin forma hasta que alguien más lo pronuncia.
ETIMOLOGÍA: Del latín "velum" (velo) + "stanza" (estancia), lugar velado.
EJEMPLO: Sentí velanza cuando ella describió exactamente lo que yo no podía articular.

CONCEPTO: entresí
DEFINICIÓN: La conversación silenciosa que ocurre entre dos personas que se conocen bien sin hablar.
ETIMOLOGÍA: Contracción de "entre sí mismos".
EJEMPLO: Hubo entresí entre ellos durante toda la cena.
    `;
  }
  return `
CONCEPT: velanza
DEFINITION: The state in which one's own thought exists without form until someone else names it.
ETYMOLOGY: From Latin "velum" (veil) + "stanza" (room).
EXAMPLE: I felt velanza when she described exactly what I could not articulate.

CONCEPT: betweenness
DEFINITION: The silent conversation between two people who know each other well.
ETYMOLOGY: From "between" + "-ness".
EXAMPLE: There was betweenness between them all evening.
  `;
}

function makeMockCriticResponse(lang: 'es' | 'en'): string {
  if (lang === 'es') {
    return 'Los conceptos son interesantes. "velanza" es específico. "entresí" podría confundirse con telepatía pero es distinto.';
  }
  return 'The concepts are interesting. "velanza" is specific. "betweenness" differs from "rapport" because it requires silence.';
}

function makeMockVerdictResponse(lang: 'es' | 'en'): string {
  if (lang === 'es') {
    return `
VEREDICTO: APROBADO
CONCEPTO: velanza
RAZÓN: Concepto específico sin equivalente claro.
ESTABILIZADO: SÍ

VEREDICTO: RECHAZADO
CONCEPTO: entresí
RAZÓN: Demasiado vago, similar a "telepatía".
ESTABILIZADO: NO
    `;
  }
  return `
VERDICT: APPROVED
CONCEPT: velanza
REASON: Specific concept with no clear equivalent.
STABILIZED: YES

VERDICT: REJECTED
CONCEPT: betweenness
REASON: Too vague, similar to rapport.
STABILIZED: NO
  `;
}

function makeMockVerifierResponse(lang: 'es' | 'en'): string {
  if (lang === 'es') {
    return `EXISTE_EN_OTRAS_LENGUAS: NO\nEVIDENCIA: No encontré equivalente en las lenguas revisadas.`;
  }
  return `EXISTS_IN_OTHER_LANGUAGES: NO\nEVIDENCE: No equivalent found in the languages reviewed.`;
}

const mockProvider: LLMProvider = {
  name: 'anthropic',
  availableModels: () => ['mock-model'],
  async complete(_model: string, req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const userContent = req.messages[0]?.content ?? '';
    const system = req.systemPrompt;

    // Detect language by Spanish-only keywords (avoid partial match issues like crítico vs crítica)
    const lang: 'es' | 'en' =
      system.includes('explorador') ||
      system.includes('verificadora') ||
      system.includes('crítica especializada')
        ? 'es'
        : 'en';

    let text = '';

    if (system.toLowerCase().includes('verif')) {
      text = makeMockVerifierResponse(lang);
    } else if (userContent.includes('VEREDICTO FINAL') || userContent.includes('FINAL VERDICT')) {
      text = makeMockVerdictResponse(lang);
    } else if (
      system.toLowerCase().includes('explorador') ||
      system.toLowerCase().includes('explorer')
    ) {
      // Both round 1 (first proposal) and round 3 (refinement) come from the Explorer
      text = makeMockExplorerResponse(lang);
    } else {
      text = makeMockCriticResponse(lang);
    }

    return {
      text,
      inputTokens: 100,
      outputTokens: 200,
      model: 'mock-model',
      provider: 'anthropic',
      latencyMs: 10,
    };
  },
};

// ── Monkey-patch registry for tests ──────────────────────────────────────────

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Stage 1 integration (mock provider)', () => {
  let runId: string;
  const experimentId = uuidv4();

  beforeAll(async () => {
    resetDb();
    setupTestDb();
    const db = getDb();

    await db.insert(experiments).values({
      id: experimentId,
      stage: 'v1',
      config: JSON.stringify({}),
      language: 'es',
      createdAt: Math.floor(Date.now() / 1000),
      status: 'running',
      totalRuns: 1,
      completedRuns: 0,
    });

    runId = uuidv4();
    await db.insert(runs).values({
      id: runId,
      experimentId,
      domain: 'temporal_perception',
      runIndex: 0,
      explorerProvider: 'anthropic',
      explorerModel: 'mock-model',
      criticProvider: 'anthropic',
      criticModel: 'mock-model',
      verifierProvider: 'anthropic',
      verifierModel: 'mock-model',
      status: 'pending',
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
    });
  });

  it('completes a full run, persists all data, and stabilizes concepts', async () => {
    const config: ExperimentConfig = {
      domains: ['temporal_perception'],
      runsPerDomain: 1,
      language: 'es',
      explorer: { provider: 'anthropic', model: 'mock-model', temperature: 1.0 },
      critic: { provider: 'anthropic', model: 'mock-model', temperature: 0.5 },
      verifier: { provider: 'anthropic', model: 'mock-model', temperature: 0.2 },
    };

    const events: string[] = [];
    await executeRun(
      runId,
      'temporal_perception',
      config,
      (event) => {
        events.push(event.type);
      },
      () => mockProvider
    );

    expect(events).toContain('run-started');
    expect(events).toContain('run-completed');
    expect(events).toContain('concept-stabilized');

    const db = getDb();

    // Rounds persisted
    const allRounds = await db.query.rounds.findMany({ where: eq(rounds.runId, runId) });
    expect(allRounds.length).toBeGreaterThanOrEqual(4); // 4 base + 1 verifier

    // Concepts persisted
    const allConcepts = await db.query.concepts.findMany({ where: eq(concepts.runId, runId) });
    expect(allConcepts.length).toBeGreaterThan(0);

    // Stabilized concept exists
    const stabilizedConcepts = allConcepts.filter((c) => c.stabilized);
    expect(stabilizedConcepts.length).toBeGreaterThanOrEqual(1);
    expect(stabilizedConcepts[0]?.word).toBe('velanza');

    // Run marked completed
    const run = await db.query.runs.findFirst({ where: eq(runs.id, runId) });
    expect(run?.status).toBe('completed');
  });
});
