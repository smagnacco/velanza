import { z } from 'zod';

const API_KEY_PATTERN = /^sk-|^AIza|^ya29\./;

const envSchema = z
  .object({
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default('127.0.0.1'),
    DB_PATH: z.string().default('~/.velanza/data.db'),

    ANTHROPIC_DEFAULT_MODEL: z.string().default('claude-sonnet-4-6'),
    OPENAI_DEFAULT_MODEL: z.string().default('gpt-4o'),
    GOOGLE_DEFAULT_MODEL: z.string().default('gemini-2.5-flash'),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    LLM_CONCURRENCY_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
    LLM_TIMEOUT_MS: z.coerce.number().int().min(5000).max(300000).default(60000),

    RUN_E2E_TESTS: z.coerce.number().int().min(0).max(1).default(0),
  })
  .refine((data) => data.ANTHROPIC_API_KEY || data.OPENAI_API_KEY || data.GOOGLE_API_KEY, {
    message: 'At least one LLM provider API key is required',
  });

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }
  return result.data;
}

export const env = loadEnv();
export { API_KEY_PATTERN };

export type Env = typeof env;
