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
      <strong>{$t.experiment.run.conceptStabilized}:</strong>
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
    margin-bottom: 1rem;
  }
  h2 {
    margin: 0;
  }
  button {
    padding: 0.4rem 1rem;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .stabilized-concepts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #e8f5e9;
    border-radius: 6px;
  }
  .concept-badge {
    padding: 0.2rem 0.6rem;
    background: #4caf50;
    color: white;
    border-radius: 12px;
    font-size: 0.85rem;
  }
  .completed-banner {
    padding: 1rem;
    background: #e8f5e9;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .error {
    color: #c62828;
  }
</style>
