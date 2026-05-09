import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/client.js';
import { concepts, ratings, runs } from '../db/schema.js';
import { ratingSchema, markPublishedSchema } from '@velanza/shared';

export const conceptsRouter = new Hono();

function now(): number {
  return Math.floor(Date.now() / 1000);
}

conceptsRouter.get('/', async (c) => {
  const db = getDb();
  const { experiment, domain, stabilized } = c.req.query();

  let query = db.query.concepts.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  // Drizzle query builder with filters
  const conditions = [];

  if (stabilized !== undefined) {
    const isStabilized = stabilized === 'true';
    const results = await db.query.concepts.findMany({
      where: eq(concepts.stabilized, isStabilized),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    if (experiment) {
      const filtered = [];
      for (const concept of results) {
        const run = await db.query.runs.findFirst({
          where: and(eq(runs.id, concept.runId), eq(runs.experimentId, experiment)),
        });
        if (run) filtered.push(concept);
      }
      return c.json(filtered);
    }

    return c.json(results);
  }

  const all = await query;

  if (experiment) {
    const filtered = [];
    for (const concept of all) {
      const run = await db.query.runs.findFirst({
        where: and(eq(runs.id, concept.runId), eq(runs.experimentId, experiment)),
      });
      if (run) filtered.push(concept);
    }
    return c.json(filtered);
  }

  return c.json(all);
});

conceptsRouter.get('/:id', async (c) => {
  const db = getDb();
  const concept = await db.query.concepts.findFirst({
    where: eq(concepts.id, c.req.param('id')),
  });
  if (!concept) return c.json({ error: 'Not found' }, 404);
  return c.json(concept);
});

conceptsRouter.put('/:id/rating', zValidator('json', ratingSchema), async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const concept = await db.query.concepts.findFirst({
    where: eq(concepts.id, id),
  });
  if (!concept) return c.json({ error: 'Not found' }, 404);

  const existing = await db.query.ratings.findFirst({
    where: and(eq(ratings.conceptId, id), eq(ratings.raterId, 'local-user')),
  });

  const timestamp = now();

  if (existing) {
    await db
      .update(ratings)
      .set({ ...body, updatedAt: timestamp })
      .where(eq(ratings.id, existing.id));
    return c.json({ updated: true });
  }

  await db.insert(ratings).values({
    id: uuidv4(),
    conceptId: id,
    raterId: 'local-user',
    recognized: body.recognized,
    spanishCovers: body.spanishCovers,
    englishCovers: body.englishCovers,
    usability: body.usability,
    wouldUse: body.wouldUse,
    comment: body.comment,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return c.json({ created: true }, 201);
});

conceptsRouter.get('/:id/rating', async (c) => {
  const db = getDb();
  const id = c.req.param('id');

  const rating = await db.query.ratings.findFirst({
    where: and(eq(ratings.conceptId, id), eq(ratings.raterId, 'local-user')),
  });

  if (!rating) return c.json(null);
  return c.json(rating);
});

conceptsRouter.post('/:id/mark-published', zValidator('json', markPublishedSchema), async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const concept = await db.query.concepts.findFirst({
    where: eq(concepts.id, id),
  });
  if (!concept) return c.json({ error: 'Not found' }, 404);

  await db
    .update(concepts)
    .set({
      markedAsPublishedAt: now(),
      markedAsPublishedUrl: body.url ?? null,
    })
    .where(eq(concepts.id, id));

  return c.json({ marked: true });
});
