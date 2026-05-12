<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t, currentLang } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import DialogueLog from '../lib/components/DialogueLog.svelte';
  import type { ExperimentRow } from '../lib/api.js';

  interface Props {
    experimentId: string;
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { experimentId, onNavigate }: Props = $props();

  interface LogEntry {
    round: number;
    role: 'explorer' | 'critic' | 'verifier';
    text: string;
    timestamp: Date;
  }

  let experiment = $state<ExperimentRow | null>(null);
  let log = $state<LogEntry[]>([]);
  let stabilizedWords = $state<string[]>([]);
  let completed = $state(false);
  let pausing = $state(false);
  let error = $state<string | null>(null);
  let eventSource = $state<EventSource | null>(null);

  onMount(async () => {
    try {
      experiment = await api.experiments.get(experimentId);
      if (experiment.status === 'completed') {
        completed = true;
        return;
      }
      await startStream();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load experiment';
    }
  });

  onDestroy(() => {
    eventSource?.close();
  });

  async function startStream() {
    await api.experiments.start(experimentId);
    const es = api.experiments.stream(experimentId);
    eventSource = es;

    es.addEventListener('round-completed', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.text) {
        log = [
          ...log,
          {
            round: data.round,
            role: data.role,
            text: data.text,
            timestamp: new Date(),
          },
        ];
      }
    });

    es.addEventListener('concept-stabilized', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      stabilizedWords = [...stabilizedWords, data.word];
    });

    es.addEventListener('experiment-completed', () => {
      completed = true;
      es.close();
    });

    es.addEventListener('error', (e: MessageEvent) => {
      const data = JSON.parse(e.data ?? '{}');
      error = data.message ?? 'Stream error';
      es.close();
    });
  }

  async function pause() {
    pausing = true;
    try {
      await api.experiments.pause(experimentId);
      eventSource?.close();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to pause';
    } finally {
      pausing = false;
    }
  }
</script>

<div class="run-view">
  <div class="header">
    <h2>{$t.experiment.run.title}</h2>
    {#if !completed && experiment?.status === 'running'}
      <button onclick={pause} disabled={pausing}>
        {pausing ? $t.common.loading : $t.experiment.run.pause}
      </button>
    {/if}
    {#if experiment?.status === 'paused'}
      <button onclick={startStream}>{$t.experiment.run.resume}</button>
    {/if}
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if stabilizedWords.length > 0}
    <div class="stabilized-concepts">
      <span class="stabilized-label">{$t.experiment.run.conceptStabilized}</span>
      {#each stabilizedWords as word}
        <span class="concept-badge">{word}</span>
      {/each}
    </div>
  {/if}

  {#if completed}
    <div class="completed-banner">
      <p>✓ {$t.experiment.run.completed}</p>
      <button onclick={() => onNavigate('validate', { id: experimentId })}>
        {$t.experiment.validate.title}
      </button>
    </div>
  {/if}

  <DialogueLog entries={log} />
</div>

<style>
  .run-view {
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border-dim);
  }
  h2 {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  button {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  button:hover {
    border-color: var(--cyan-dim);
    color: var(--cyan);
  }
  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .stabilized-concepts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 229, 204, 0.05);
    border: 1px solid rgba(0, 229, 204, 0.2);
    border-radius: 2px;
    align-items: center;
  }
  .stabilized-label {
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-right: 0.25rem;
  }
  .concept-badge {
    font-family: var(--font-serif);
    font-size: 0.9rem;
    font-style: italic;
    color: var(--cyan);
    padding: 0.1rem 0.6rem;
    border: 1px solid rgba(0, 229, 204, 0.3);
    border-radius: 2px;
    text-shadow: 0 0 12px rgba(0, 229, 204, 0.4);
  }

  .completed-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    margin-bottom: 1rem;
    background: rgba(52, 211, 153, 0.06);
    border: 1px solid rgba(52, 211, 153, 0.25);
    border-radius: 2px;
  }
  .completed-banner p {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--status-completed);
  }

  .error {
    color: var(--status-failed);
    font-size: 0.85rem;
  }
</style>
