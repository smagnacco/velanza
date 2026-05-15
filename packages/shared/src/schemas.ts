import { z } from 'zod';

export const providerNameSchema = z.enum(['anthropic', 'openai', 'google']);
export const languageSchema = z.enum(['es', 'en']);
export const experimentStageSchema = z.enum(['v1', 'v2', 'v3']);
export const experimentStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
]);

export const agentConfigSchema = z.object({
  provider: providerNameSchema,
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
});

export const customDomainSchema = z.object({
  label: z.string().min(1).max(100),
  seed: z.string().min(1).max(1000),
});

export const domainEntrySchema = z.union([z.string().min(1), customDomainSchema]);

export const experimentConfigSchema = z.object({
  domains: z.array(domainEntrySchema).min(1).max(8),
  runsPerDomain: z.number().int().min(1).max(10),
  language: languageSchema,
  explorer: agentConfigSchema,
  critic: agentConfigSchema,
  verifier: agentConfigSchema,
});

export const createExperimentSchema = z.object({
  stage: experimentStageSchema,
  config: experimentConfigSchema,
});

export const ratingSchema = z.object({
  recognized: z.enum(['yes', 'no', 'uncertain']),
  spanishCovers: z.enum(['yes', 'no', 'partially']),
  englishCovers: z.enum(['yes', 'no', 'partially']),
  usability: z.number().int().min(1).max(5),
  wouldUse: z.enum(['yes', 'no', 'maybe']),
  comment: z.string().max(2000).optional().default(''),
});

export const markPublishedSchema = z.object({
  url: z.string().url().optional(),
});

export const xDraftRequestSchema = z.object({
  conceptId: z.string().uuid(),
  language: languageSchema,
});

export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type MarkPublishedInput = z.infer<typeof markPublishedSchema>;
export type XDraftRequestInput = z.infer<typeof xDraftRequestSchema>;
