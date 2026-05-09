import { Hono } from 'hono';
import { getAvailableProviders } from '../providers/registry.js';

export const providersRouter = new Hono();

providersRouter.get('/available', (c) => {
  const providers = getAvailableProviders();
  return c.json(providers);
});
