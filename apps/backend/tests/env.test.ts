import { describe, it, expect } from 'bun:test';
import { z } from 'zod';

describe('env schema validation', () => {
  const agentConfigSchema = z.object({
    provider: z.enum(['anthropic', 'openai', 'google']),
    model: z.string().min(1),
    temperature: z.number().min(0).max(2),
  });

  it('validates a valid agent config', () => {
    const result = agentConfigSchema.safeParse({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      temperature: 1.0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects temperature above 2', () => {
    const result = agentConfigSchema.safeParse({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      temperature: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown provider', () => {
    const result = agentConfigSchema.safeParse({
      provider: 'cohere',
      model: 'command',
      temperature: 1.0,
    });
    expect(result.success).toBe(false);
  });
});
