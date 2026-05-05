import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { sql } from 'drizzle-orm';

export const healthRouter = new Hono();

healthRouter.get('/', async (c) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    const db = getDb();
    db.run(sql`SELECT 1`);
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 200 : 503;

  return c.json(
    {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      version: '0.1.0',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    status
  );
});
