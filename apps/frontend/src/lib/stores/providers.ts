import { writable } from 'svelte/store';
import { api } from '../api.js';
import type { AvailableProvider } from '@velanza/shared';

export const providers = writable<AvailableProvider[]>([]);
export const providersLoading = writable(true);
export const providersError = writable<string | null>(null);

export async function loadProviders() {
  providersLoading.set(true);
  providersError.set(null);
  try {
    const data = await api.providers.available();
    providers.set(data);
  } catch (e) {
    providersError.set(e instanceof Error ? e.message : 'Failed to load providers');
  } finally {
    providersLoading.set(false);
  }
}
