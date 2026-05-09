import { env } from '../env.js';
import { anthropicProvider } from './anthropic.js';
import type { LLMProvider } from './types.js';
import type { ProviderName } from '@velanza/shared';

const ALL_PROVIDERS: LLMProvider[] = [anthropicProvider];

export function getAvailableProviders(): Array<{ provider: ProviderName; models: string[] }> {
  const result: Array<{ provider: ProviderName; models: string[] }> = [];

  for (const p of ALL_PROVIDERS) {
    const hasKey =
      (p.name === 'anthropic' && !!env.ANTHROPIC_API_KEY) ||
      (p.name === 'openai' && !!env.OPENAI_API_KEY) ||
      (p.name === 'google' && !!env.GOOGLE_API_KEY);

    if (hasKey) {
      result.push({ provider: p.name, models: p.availableModels() });
    }
  }

  return result;
}

export function getProvider(name: ProviderName): LLMProvider {
  const provider = ALL_PROVIDERS.find((p) => p.name === name);
  if (!provider) {
    throw new Error(`Provider not found: ${name}`);
  }
  return provider;
}
