import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { concepts, ratings, runs, rounds } from '../db/schema.js';

export const exportsRouter = new Hono();

exportsRouter.get('/json', async (c) => {
  const db = getDb();
  const experimentId = c.req.query('experiment');
  if (!experimentId) return c.json({ error: 'experiment query param required' }, 400);

  const experimentRuns = await db.query.runs.findMany({
    where: eq(runs.experimentId, experimentId),
  });

  const runIds = experimentRuns.map((r) => r.id);
  const allConcepts = [];
  const allRounds = [];

  for (const runId of runIds) {
    const runConcepts = await db.query.concepts.findMany({
      where: eq(concepts.runId, runId),
    });
    for (const concept of runConcepts) {
      const rating = await db.query.ratings.findFirst({
        where: and(eq(ratings.conceptId, concept.id), eq(ratings.raterId, 'local-user')),
      });
      allConcepts.push({ ...concept, rating: rating ?? null });
    }

    const runRounds = await db.query.rounds.findMany({
      where: eq(rounds.runId, runId),
    });
    allRounds.push(...runRounds);
  }

  return c.json({
    experimentId,
    runs: experimentRuns,
    concepts: allConcepts,
    rounds: allRounds,
  });
});

exportsRouter.get('/csv', async (c) => {
  const db = getDb();
  const experimentId = c.req.query('experiment');
  if (!experimentId) return c.json({ error: 'experiment query param required' }, 400);

  const experimentRuns = await db.query.runs.findMany({
    where: eq(runs.experimentId, experimentId),
  });

  const rows: string[] = [
    'concept_id,word,definition,etymology,stabilized,exists_in_other_languages,domain,run_index,recognized,spanish_covers,english_covers,usability,would_use',
  ];

  for (const run of experimentRuns) {
    const runConcepts = await db.query.concepts.findMany({
      where: eq(concepts.runId, run.id),
    });

    for (const concept of runConcepts) {
      const rating = await db.query.ratings.findFirst({
        where: and(eq(ratings.conceptId, concept.id), eq(ratings.raterId, 'local-user')),
      });

      const escape = (v: string | null | undefined) =>
        v ? `"${String(v).replace(/"/g, '""')}"` : '""';

      rows.push(
        [
          escape(concept.id),
          escape(concept.word),
          escape(concept.definition),
          escape(concept.etymology),
          String(concept.stabilized),
          escape(concept.existsInOtherLanguages),
          escape(run.domain),
          String(run.runIndex),
          escape(rating?.recognized),
          escape(rating?.spanishCovers),
          escape(rating?.englishCovers),
          rating?.usability != null ? String(rating.usability) : '""',
          escape(rating?.wouldUse),
        ].join(',')
      );
    }
  }

  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="velanza-${experimentId}.csv"`,
    },
  });
});
