import Anthropic, { RateLimitError, InternalServerError } from '@anthropic-ai/sdk';
import { env } from '../env.js';
import { logger } from '../lib/logger.js';
import { withConcurrencyLimit } from './rate-limit.js';
import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from './types.js';

const DEFAULT_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isRetryable(error: unknown): boolean {
  return error instanceof RateLimitError || error instanceof InternalServerError;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const anthropicProvider: LLMProvider = {
  name: 'anthropic',

  availableModels(): string[] {
    const override = env.ANTHROPIC_DEFAULT_MODEL;
    const base = DEFAULT_MODELS.includes(override) ? DEFAULT_MODELS : [override, ...DEFAULT_MODELS];
    return base;
  },

  async complete(model: string, req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      timeout: env.LLM_TIMEOUT_MS,
      maxRetries: 0,
    });

    return withConcurrencyLimit(async () => {
      let lastError: unknown;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
          logger.info(`Anthropic retry attempt ${attempt}/${MAX_RETRIES} for model ${model}`);
        }

        const start = Date.now();
        try {
          const response = await client.messages.create({
            model,
            max_tokens: req.maxTokens ?? 2048,
            temperature: req.temperature ?? 1.0,
            system: req.systemPrompt,
            messages: req.messages,
          });

          const latencyMs = Date.now() - start;
          const content = response.content[0];
          if (!content || content.type !== 'text') {
            throw new Error('Unexpected response format from Anthropic');
          }

          return {
            text: content.text,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            model: response.model,
            provider: 'anthropic',
            latencyMs,
          };
        } catch (error) {
          lastError = error;
          if (!isRetryable(error) || attempt === MAX_RETRIES) {
            throw error;
          }
        }
      }

      throw lastError;
    });
  },
};
