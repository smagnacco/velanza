import type {
  AvailableProvider,
  CreateExperimentInput,
  RatingInput,
  MarkPublishedInput,
} from '@velanza/shared';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  health: {
    get: () => request<{ status: string; version: string; db: string }>('/health'),
  },

  providers: {
    available: () => request<AvailableProvider[]>('/providers/available'),
  },

  experiments: {
    list: () => request<ExperimentRow[]>('/experiments'),
    get: (id: string) => request<ExperimentRow>(`/experiments/${id}`),
    create: (body: CreateExperimentInput) =>
      request<{ id: string; totalRuns: number }>('/experiments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    start: (id: string) =>
      request<{ started: boolean; streamUrl: string }>(`/experiments/${id}/start`, {
        method: 'POST',
      }),
    pause: (id: string) =>
      request<{ paused: boolean }>(`/experiments/${id}/pause`, { method: 'POST' }),
    resume: (id: string) =>
      request<{ resumed: boolean; streamUrl: string }>(`/experiments/${id}/resume`, {
        method: 'POST',
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/experiments/${id}`, { method: 'DELETE' }),
    stream: (id: string) => new EventSource(`${BASE}/experiments/${id}/stream`),
  },

  concepts: {
    list: (params?: { experiment?: string; stabilized?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.experiment) q.set('experiment', params.experiment);
      if (params?.stabilized !== undefined) q.set('stabilized', String(params.stabilized));
      const qs = q.toString();
      return request<ConceptRow[]>(`/concepts${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<ConceptRow>(`/concepts/${id}`),
    getRating: (id: string) => request<RatingRow | null>(`/concepts/${id}/rating`),
    saveRating: (id: string, body: RatingInput) =>
      request<{ created?: boolean; updated?: boolean }>(`/concepts/${id}/rating`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    markPublished: (id: string, body: MarkPublishedInput) =>
      request<{ marked: boolean }>(`/concepts/${id}/mark-published`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  xPublisher: {
    draft: (conceptId: string, language: 'es' | 'en') =>
      request<{ text: string; url: string; exceedsLimit: boolean; charCount: number }>(
        '/x-publisher/draft',
        {
          method: 'POST',
          body: JSON.stringify({ conceptId, language }),
        }
      ),
  },

  exports: {
    json: (experimentId: string) => `${BASE}/exports/json?experiment=${experimentId}`,
    csv: (experimentId: string) => `${BASE}/exports/csv?experiment=${experimentId}`,
    markdown: (experimentId: string) =>
      request<{ filename: string; path: string }>('/exports/markdown', {
        method: 'POST',
        body: JSON.stringify({ experiment: experimentId }),
      }),
    wikipedia: (conceptId: string, language: 'es' | 'en') =>
      request<{ wikitext: string; word: string }>('/exports/wikipedia', {
        method: 'POST',
        body: JSON.stringify({ conceptId, language }),
      }),
  },
};

// Local row types matching DB schema
export interface ExperimentRow {
  id: string;
  stage: 'v1' | 'v2' | 'v3';
  config: string;
  language: 'es' | 'en';
  createdAt: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalRuns: number;
  completedRuns: number;
}

export interface ConceptRow {
  id: string;
  runId: string;
  word: string;
  definition: string;
  etymology: string;
  stabilized: boolean;
  existsInOtherLanguages: 'true' | 'false' | 'uncertain';
  existenceEvidence: string;
  draftGeneratedAt: number | null;
  draftTextEs: string | null;
  draftTextEn: string | null;
  markedAsPublishedAt: number | null;
  markedAsPublishedUrl: string | null;
  createdAt: number;
}

export interface RatingRow {
  id: string;
  conceptId: string;
  raterId: string;
  recognized: 'yes' | 'no' | 'uncertain';
  spanishCovers: 'yes' | 'no' | 'partially';
  englishCovers: 'yes' | 'no' | 'partially';
  usability: number;
  wouldUse: 'yes' | 'no' | 'maybe';
  comment: string;
  createdAt: number;
  updatedAt: number;
}
