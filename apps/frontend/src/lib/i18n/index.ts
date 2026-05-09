import { writable, derived } from 'svelte/store';
import { es } from './es.js';
import { en } from './en.js';
import type { I18n } from './es.js';

export type Language = 'es' | 'en';

const STORAGE_KEY = 'velanza_lang';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch {}
  return 'es';
}

export const currentLang = writable<Language>(getInitialLang());

currentLang.subscribe((lang) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
});

const translations: Record<Language, I18n> = { es, en };

export const t = derived(currentLang, ($lang) => translations[$lang]);
