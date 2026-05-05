import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.js';

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

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  logger.error('Unhandled error', err);
  return c.json({ error: 'Internal server error' }, 500);
});

logger.info(`Velanza backend starting on ${env.HOST}:${env.PORT}`);

export default {
  port: env.PORT,
  hostname: env.HOST,
  fetch: app.fetch,
};
