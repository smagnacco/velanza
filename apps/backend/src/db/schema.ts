import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const experiments = sqliteTable(
  'experiments',
  {
    id: text('id').primaryKey(),
    stage: text('stage', { enum: ['v1', 'v2', 'v3'] }).notNull(),
    config: text('config').notNull(),
    language: text('language', { enum: ['es', 'en'] }).notNull(),
    createdAt: integer('created_at').notNull(),
    status: text('status', {
      enum: ['pending', 'running', 'paused', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    totalRuns: integer('total_runs').notNull().default(0),
    completedRuns: integer('completed_runs').notNull().default(0),
  },
  (table) => [index('experiments_status_idx').on(table.status)]
);

export const runs = sqliteTable(
  'runs',
  {
    id: text('id').primaryKey(),
    experimentId: text('experiment_id')
      .notNull()
      .references(() => experiments.id, { onDelete: 'cascade' }),
    domain: text('domain').notNull(),
    runIndex: integer('run_index').notNull(),
    explorerProvider: text('explorer_provider').notNull(),
    explorerModel: text('explorer_model').notNull(),
    criticProvider: text('critic_provider').notNull(),
    criticModel: text('critic_model').notNull(),
    verifierProvider: text('verifier_provider').notNull(),
    verifierModel: text('verifier_model').notNull(),
    status: text('status', {
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
    })
      .notNull()
      .default('pending'),
    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    totalInputTokens: integer('total_input_tokens').notNull().default(0),
    totalOutputTokens: integer('total_output_tokens').notNull().default(0),
    totalCostUsd: real('total_cost_usd').notNull().default(0),
  },
  (table) => [
    index('runs_experiment_id_idx').on(table.experimentId),
    index('runs_status_idx').on(table.status),
  ]
);

export const rounds = sqliteTable(
  'rounds',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    role: text('role', { enum: ['explorer', 'critic', 'verifier'] }).notNull(),
    systemPrompt: text('system_prompt').notNull(),
    userPrompt: text('user_prompt').notNull(),
    response: text('response').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('rounds_run_id_idx').on(table.runId)]
);

export const concepts = sqliteTable(
  'concepts',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    word: text('word').notNull(),
    definition: text('definition').notNull(),
    etymology: text('etymology').notNull(),
    stabilized: integer('stabilized', { mode: 'boolean' }).notNull().default(false),
    existsInOtherLanguages: text('exists_in_other_languages', {
      enum: ['true', 'false', 'uncertain'],
    })
      .notNull()
      .default('uncertain'),
    existenceEvidence: text('existence_evidence').notNull().default('[]'),
    draftGeneratedAt: integer('draft_generated_at'),
    draftTextEs: text('draft_text_es'),
    draftTextEn: text('draft_text_en'),
    markedAsPublishedAt: integer('marked_as_published_at'),
    markedAsPublishedUrl: text('marked_as_published_url'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('concepts_run_id_idx').on(table.runId),
    index('concepts_stabilized_idx').on(table.stabilized),
  ]
);

export const ratings = sqliteTable('ratings', {
  id: text('id').primaryKey(),
  conceptId: text('concept_id')
    .notNull()
    .references(() => concepts.id, { onDelete: 'cascade' }),
  raterId: text('rater_id').notNull().default('local-user'),
  recognized: text('recognized', { enum: ['yes', 'no', 'uncertain'] }).notNull(),
  spanishCovers: text('spanish_covers', { enum: ['yes', 'no', 'partially'] }).notNull(),
  englishCovers: text('english_covers', { enum: ['yes', 'no', 'partially'] }).notNull(),
  usability: integer('usability').notNull(),
  wouldUse: text('would_use', { enum: ['yes', 'no', 'maybe'] }).notNull(),
  comment: text('comment').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const protocolGenerations = sqliteTable(
  'protocol_generations',
  {
    id: text('id').primaryKey(),
    experimentId: text('experiment_id')
      .notNull()
      .references(() => experiments.id, { onDelete: 'cascade' }),
    generationNumber: integer('generation_number').notNull(),
    taskSeed: text('task_seed').notNull(),
    messageAToB: text('message_a_to_b').notNull(),
    messageLengthTokens: integer('message_length_tokens').notNull(),
    reconstructionQuality: real('reconstruction_quality'),
    dictionaryState: text('dictionary_state').notNull().default('{}'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('protocol_gen_experiment_idx').on(table.experimentId)]
);
