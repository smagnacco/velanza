import { describe, it, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env['DB_PATH'] = join(tmpdir(), `velanza-test-${Date.now()}.db`);

import { healthRouter } from '../src/routes/health.js';
import { resetDb } from '../src/db/client.js';
import { initSchema as setupTestDb } from '../src/db/setup-test.js';

describe('GET /api/health', () => {
  const app = new Hono();
  app.route('/api/health', healthRouter);

  beforeAll(() => {
    resetDb();
    setupTestDb();
  });

  it('returns 200 with status ok when DB is reachable', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns JSON content-type', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
