import { getDb } from './client.js';

export function setupTestDb(): void {
  const db = getDb();
  const sqlite = (db as any).session.client;

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      stage TEXT NOT NULL,
      config TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total_runs INTEGER NOT NULL DEFAULT 0,
      completed_runs INTEGER NOT NULL DEFAULT 0
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      run_index INTEGER NOT NULL,
      explorer_provider TEXT NOT NULL,
      explorer_model TEXT NOT NULL,
      critic_provider TEXT NOT NULL,
      critic_model TEXT NOT NULL,
      verifier_provider TEXT NOT NULL,
      verifier_model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at INTEGER,
      completed_at INTEGER,
      total_input_tokens INTEGER NOT NULL DEFAULT 0,
      total_output_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost_usd REAL NOT NULL DEFAULT 0
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      role TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      word TEXT NOT NULL,
      definition TEXT NOT NULL,
      etymology TEXT NOT NULL,
      stabilized INTEGER NOT NULL DEFAULT 0,
      exists_in_other_languages TEXT NOT NULL DEFAULT 'uncertain',
      existence_evidence TEXT NOT NULL DEFAULT '[]',
      draft_generated_at INTEGER,
      draft_text_es TEXT,
      draft_text_en TEXT,
      marked_as_published_at INTEGER,
      marked_as_published_url TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      rater_id TEXT NOT NULL DEFAULT 'local-user',
      recognized TEXT NOT NULL,
      spanish_covers TEXT NOT NULL,
      english_covers TEXT NOT NULL,
      usability INTEGER NOT NULL,
      would_use TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS protocol_generations (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
      generation_number INTEGER NOT NULL,
      task_seed TEXT NOT NULL,
      message_a_to_b TEXT NOT NULL,
      message_length_tokens INTEGER NOT NULL,
      reconstruction_quality REAL,
      dictionary_state TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    )
  `);
}
