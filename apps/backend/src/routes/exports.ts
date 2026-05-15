import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { getDb } from '../db/client.js';
import { concepts, experiments, ratings, runs, rounds } from '../db/schema.js';

// Resolved once at module load; works regardless of process CWD.
const RESULTS_DIR = join(import.meta.dir, '../../../../results');

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

exportsRouter.post('/markdown', async (c) => {
  const db = getDb();
  const body = await c.req.json<{ experiment: string }>();
  const experimentId = body?.experiment;
  if (!experimentId) return c.json({ error: 'experiment required' }, 400);

  const experiment = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });
  if (!experiment) return c.json({ error: 'experiment not found' }, 404);

  const experimentRuns = await db.query.runs.findMany({
    where: eq(runs.experimentId, experimentId),
  });

  type ConceptWithMeta = {
    concept: typeof concepts.$inferSelect;
    rating: typeof ratings.$inferSelect | null;
    domain: string;
  };

  const allConcepts: ConceptWithMeta[] = [];
  for (const run of experimentRuns) {
    const runConcepts = await db.query.concepts.findMany({
      where: eq(concepts.runId, run.id),
    });
    for (const concept of runConcepts) {
      const rating = await db.query.ratings.findFirst({
        where: and(eq(ratings.conceptId, concept.id), eq(ratings.raterId, 'local-user')),
      });
      allConcepts.push({ concept, rating: rating ?? null, domain: run.domain });
    }
  }

  const stabilized = allConcepts.filter((c) => c.concept.stabilized);
  const genuineGaps = stabilized.filter(
    (c) =>
      c.rating?.recognized === 'yes' &&
      c.rating?.spanishCovers === 'no' &&
      c.concept.existsInOtherLanguages !== 'true'
  );
  const confirmedGaps = stabilized.filter(
    (c) =>
      c.rating?.recognized === 'yes' &&
      c.rating?.spanishCovers === 'no' &&
      c.concept.existsInOtherLanguages === 'false'
  );

  const stageLabel: Record<string, string> = { v1: 'Stage 1', v2: 'Stage 2', v3: 'Stage 3' };
  const existsLabel: Record<string, string> = {
    true: 'Yes',
    false: 'No',
    uncertain: 'Uncertain',
  };

  function conceptBlock(item: ConceptWithMeta): string {
    const { concept, rating, domain } = item;
    const lines = [
      `### ${concept.word}`,
      '',
      `**Definition:** ${concept.definition}`,
      '',
      `**Etymology:** ${concept.etymology}`,
      '',
      `**Domain:** ${domain}`,
      `**Exists in other languages:** ${existsLabel[concept.existsInOtherLanguages] ?? concept.existsInOtherLanguages}`,
    ];
    if (concept.existenceEvidence && concept.existenceEvidence !== '[]') {
      lines.push(`**Existence evidence:** ${concept.existenceEvidence}`);
    }
    if (rating) {
      lines.push('');
      lines.push('**Human rating:**');
      lines.push(`- Recognized: ${rating.recognized}`);
      lines.push(`- Spanish covers: ${rating.spanishCovers}`);
      lines.push(`- Would use: ${rating.wouldUse}`);
      if (rating.comment) lines.push(`- Comment: ${rating.comment}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    return lines.join('\n');
  }

  const createdAt = new Date(experiment.createdAt * 1000)
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const topWords = stabilized
    .slice(0, 2)
    .map((c) => c.concept.word.toLowerCase().replace(/\s+/g, '_'))
    .join('_');
  const stageSlug = experiment.stage;
  const filename = `${stageSlug}_${topWords}_results_${createdAt}.md`;

  const sections: string[] = [
    `# Velanza Export — ${stageLabel[experiment.stage] ?? experiment.stage}`,
    '',
    `**Experiment ID:** ${experimentId}`,
    `**Language:** ${experiment.language}`,
    `**Created:** ${new Date(experiment.createdAt * 1000).toISOString()}`,
    `**Status:** ${experiment.status}`,
    '',
    '## Summary',
    '',
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total concepts | ${allConcepts.length} |`,
    `| Stabilized | ${stabilized.length} |`,
    `| Genuine gaps (not confirmed in other languages) | ${genuineGaps.length} |`,
    `| Confirmed gaps (explicitly absent in other languages) | ${confirmedGaps.length} |`,
    '',
    '> **Genuine gaps** — recognized by human rater, Spanish has no equivalent, verifier did not confirm existence in other languages (includes uncertain).',
    '> **Confirmed gaps** — same as above but verifier explicitly returned "does not exist" (strict criterion).',
    '',
  ];

  if (confirmedGaps.length > 0) {
    sections.push('## Confirmed gaps\n');
    confirmedGaps.forEach((item) => sections.push(conceptBlock(item)));
  }

  if (genuineGaps.length > 0) {
    const nonConfirmed = genuineGaps.filter((g) => g.concept.existsInOtherLanguages !== 'false');
    if (nonConfirmed.length > 0) {
      sections.push('## Genuine gaps (uncertain existence)\n');
      nonConfirmed.forEach((item) => sections.push(conceptBlock(item)));
    }
  }

  if (stabilized.length > 0) {
    sections.push('## All stabilized concepts\n');
    stabilized.forEach((item) => sections.push(conceptBlock(item)));
  }

  const markdown = sections.join('\n');

  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(join(RESULTS_DIR, filename), markdown, 'utf-8');

  return c.json({ filename, path: `results/${filename}` });
});

exportsRouter.post('/wikipedia', async (c) => {
  const db = getDb();
  const body = await c.req.json<{ conceptId: string; language?: string }>();
  const { conceptId, language = 'es' } = body ?? {};
  if (!conceptId) return c.json({ error: 'conceptId required' }, 400);

  const concept = await db.query.concepts.findFirst({ where: eq(concepts.id, conceptId) });
  if (!concept) return c.json({ error: 'concept not found' }, 404);

  const rating = await db.query.ratings.findFirst({
    where: and(eq(ratings.conceptId, conceptId), eq(ratings.raterId, 'local-user')),
  });

  const year = new Date().getFullYear();
  const lang = language === 'en' ? 'en' : 'es';

  // Wikitext differs slightly by language
  let wikitext: string;

  if (lang === 'es') {
    wikitext = `{{En desarrollo}}
<!-- BORRADOR — revisar antes de publicar en Wikipedia -->
<!-- Asegurarse de que el concepto cumple con los criterios de notabilidad de Wikipedia -->

''''${concept.word}'''' es un [[neologismo]] propuesto en español para nombrar una experiencia emocional o cognitiva que carece de denominación concisa en el idioma.

== Definición ==
${concept.definition}

== Etimología ==
${concept.etymology}

== Contexto de creación ==
La palabra fue generada en el marco del proyecto [[Velanza]], un experimento de [[lexicalización]] asistida por [[inteligencia artificial]] que busca identificar huecos léxicos en el español mediante diálogo entre agentes de lenguaje. El concepto fue propuesto, evaluado críticamente y verificado en un proceso de ${5} rondas de debate automatizado.

== Verificación lingüística ==
${
  concept.existsInOtherLanguages === 'false'
    ? `El verificador automático determinó que no existe un equivalente directo en otras lenguas consultadas.`
    : concept.existsInOtherLanguages === 'uncertain'
      ? `La existencia de un equivalente en otras lenguas no pudo determinarse con certeza.`
      : `Se identificaron posibles equivalentes en otras lenguas.`
}
${
  concept.existenceEvidence && concept.existenceEvidence !== '[]'
    ? `\nEvidencia registrada: ${JSON.parse(concept.existenceEvidence)?.[0]?.text ?? ''}`
    : ''
}
== Véase también ==
* [[Neologismo]]
* [[Hipótesis de Sapir-Whorf]]
* [[Lexicalización]]
* [[Intraducible]]

== Referencias ==
<references />

== Notas ==
* Este artículo fue generado como borrador a partir de datos del proyecto Velanza (${year}).
* Requiere revisión editorial y verificación de fuentes antes de ser publicado.

[[Categoría:Neologismos del español]]
[[Categoría:Psicología del lenguaje]]`;
  } else {
    wikitext = `{{Under construction}}
<!-- DRAFT — review before publishing on Wikipedia -->
<!-- Ensure the concept meets Wikipedia's notability guidelines -->

''''${concept.word}'''' is a proposed [[neologism]] in Spanish to name an emotional or cognitive experience that lacks a concise name in the language.

== Definition ==
${concept.definition}

== Etymology ==
${concept.etymology}

== Background ==
The word was generated as part of the [[Velanza]] project, an AI-assisted [[lexicalization]] experiment that seeks to identify lexical gaps in Spanish through dialogue between language agents. The concept was proposed, critically evaluated, and verified over a ${5}-round automated debate process.

== Linguistic verification ==
${
  concept.existsInOtherLanguages === 'false'
    ? `The automated verifier determined that no direct equivalent exists in the other languages consulted.`
    : concept.existsInOtherLanguages === 'uncertain'
      ? `The existence of an equivalent in other languages could not be determined with certainty.`
      : `Possible equivalents were identified in other languages.`
}
${
  concept.existenceEvidence && concept.existenceEvidence !== '[]'
    ? `\nRecorded evidence: ${JSON.parse(concept.existenceEvidence)?.[0]?.text ?? ''}`
    : ''
}
== See also ==
* [[Neologism]]
* [[Sapir–Whorf hypothesis]]
* [[Lexicalization]]
* [[Untranslatability]]

== References ==
<references />

== Notes ==
* This article was generated as a draft from data produced by the Velanza project (${year}).
* Requires editorial review and source verification before publication.

[[Category:Spanish neologisms]]
[[Category:Psychology of language]]`;
  }

  return c.json({ wikitext, word: concept.word });
});
