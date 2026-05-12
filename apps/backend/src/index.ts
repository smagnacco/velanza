import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { initSchema } from './db/setup-test.js';
import { healthRouter } from './routes/health.js';
import { providersRouter } from './routes/providers.js';
import { experimentsRouter } from './routes/experiments.js';
import { conceptsRouter } from './routes/concepts.js';
import { exportsRouter } from './routes/exports.js';
import { xPublisherRouter } from './routes/x-publisher.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    exposeHeaders: ['Content-Type'],
  })
);

app.use('*', secureHeaders());

app.route('/api/health', healthRouter);
app.route('/api/providers', providersRouter);
app.route('/api/experiments', experimentsRouter);
app.route('/api/concepts', conceptsRouter);
app.route('/api/exports', exportsRouter);
app.route('/api/x-publisher', xPublisherRouter);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  logger.error('Unhandled error', err);
  return c.json({ error: 'Internal server error' }, 500);
});

initSchema();
logger.info(`Velanza backend starting on ${env.HOST}:${env.PORT}`);

export default {
  port: env.PORT,
  hostname: env.HOST,
  fetch: app.fetch,
};
