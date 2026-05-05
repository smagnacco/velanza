import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { getDb } from './client.js';
import { logger } from '../lib/logger.js';

const db = getDb();
migrate(db, { migrationsFolder: './src/db/migrations' });
logger.info('Database migrations completed');
