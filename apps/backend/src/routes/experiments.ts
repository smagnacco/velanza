import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/client.js';
import { experiments, runs } from '../db/schema.js';
import { createExperimentSchema } from '@velanza/shared';
import { executeExperiment } from '../experiments/stage1/runner.js';
import { resolveDomain } from '../experiments/stage1/domains.js';
import { createSSEStream } from '../lib/sse.js';
import { logger } from '../lib/logger.js';
import type { ExperimentConfig } from '@velanza/shared';

export const experimentsRouter = new Hono();

function now(): number {
  return Math.floor(Date.now() / 1000);
}

experimentsRouter.post('/', zValidator('json', createExperimentSchema), async (c) => {
  const body = c.req.valid('json');
  const db = getDb();

  const config = body.config as ExperimentConfig;
  const totalRuns = config.domains.length * config.runsPerDomain;
  const experimentId = uuidv4();

  await db.insert(experiments).values({
    id: experimentId,
    stage: body.stage,
    config: JSON.stringify(config),
    language: config.language,
    createdAt: now(),
    status: 'pending',
    totalRuns,
    completedRuns: 0,
  });

  // Pre-create all run records so progress is trackable and resumable
  const runRecords = [];
  for (const domainEntry of config.domains) {
    const domainId = resolveDomain(domainEntry, config.language).id;
    for (let i = 0; i < config.runsPerDomain; i++) {
      runRecords.push({
        id: uuidv4(),
        experimentId,
        domain: domainId,
        runIndex: i,
        explorerProvider: config.explorer.provider,
        explorerModel: config.explorer.model,
        criticProvider: config.critic.provider,
        criticModel: config.critic.model,
        verifierProvider: config.verifier.provider,
        verifierModel: config.verifier.model,
        status: 'pending' as const,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
      });
    }
  }

  for (const run of runRecords) {
    await db.insert(runs).values(run);
  }

  return c.json({ id: experimentId, totalRuns }, 201);
});

experimentsRouter.get('/', async (c) => {
  const db = getDb();
  const all = await db.query.experiments.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return c.json(all);
});

experimentsRouter.get('/:id', async (c) => {
  const db = getDb();
  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, c.req.param('id')),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);
  return c.json(experiment);
});

experimentsRouter.post('/:id/start', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);
  if (experiment.status === 'running') return c.json({ error: 'Already running' }, 409);
  if (experiment.status === 'completed') return c.json({ error: 'Already completed' }, 409);

  return c.json({ started: true, streamUrl: `/api/experiments/${id}/stream` });
});

experimentsRouter.get('/:id/stream', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);

  const config = JSON.parse(experiment.config) as ExperimentConfig;

  return createSSEStream(c, async (emit, close) => {
    try {
      await executeExperiment({ experimentId: id, config, emit });
    } catch (error) {
      logger.error(`Stream error for experiment ${id}`, error);
    } finally {
      close();
    }
  });
});

experimentsRouter.post('/:id/pause', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);
  if (experiment.status !== 'running') return c.json({ error: 'Not running' }, 409);

  await db.update(experiments).set({ status: 'paused' }).where(eq(experiments.id, id));
  return c.json({ paused: true });
});

experimentsRouter.post('/:id/resume', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);
  if (experiment.status !== 'paused') return c.json({ error: 'Not paused' }, 409);

  return c.json({ resumed: true, streamUrl: `/api/experiments/${id}/stream` });
});

experimentsRouter.delete('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, id),
  });
  if (!experiment) return c.json({ error: 'Not found' }, 404);

  await db.delete(experiments).where(eq(experiments.id, id));
  return c.json({ deleted: true });
});
