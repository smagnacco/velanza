export type ExperimentStage = 'v1' | 'v2' | 'v3';
export type ExperimentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type Language = 'es' | 'en';
export type ProviderName = 'anthropic' | 'openai' | 'google';
export type AgentRole = 'explorer' | 'critic' | 'verifier';
export type RoundRole = 'explorer' | 'critic' | 'verifier';
export type ExistenceStatus = 'true' | 'false' | 'uncertain';

export interface AvailableProvider {
  provider: ProviderName;
  models: string[];
}

export interface ExperimentConfig {
  domains: string[];
  runsPerDomain: number;
  language: Language;
  explorer: { provider: ProviderName; model: string; temperature: number };
  critic: { provider: ProviderName; model: string; temperature: number };
  verifier: { provider: ProviderName; model: string; temperature: number };
}

export interface Concept {
  id: string;
  runId: string;
  word: string;
  definition: string;
  etymology: string;
  stabilized: boolean;
  existsInOtherLanguages: ExistenceStatus;
  existenceEvidence: unknown[];
  draftGeneratedAt: number | null;
  draftTextEs: string | null;
  draftTextEn: string | null;
  markedAsPublishedAt: number | null;
  markedAsPublishedUrl: string | null;
  createdAt: number;
}

export interface Rating {
  id: string;
  conceptId: string;
  raterId: string;
  recognized: string;
  spanishCovers: string;
  englishCovers: string;
  usability: number;
  wouldUse: string;
  comment: string;
  createdAt: number;
  updatedAt: number;
}

export interface SSEEvent {
  type:
    | 'round-started'
    | 'round-completed'
    | 'run-started'
    | 'run-completed'
    | 'concept-stabilized'
    | 'experiment-completed'
    | 'error';
  payload: unknown;
}
