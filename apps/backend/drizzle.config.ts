import { defineConfig } from 'drizzle-kit';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const dbPath = resolve((process.env['DB_PATH'] ?? '~/.velanza/data.db').replace(/^~/, homedir()));

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${dbPath}`,
  },
});
