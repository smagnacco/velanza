<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import DialogueLog from '../lib/components/DialogueLog.svelte';
  import StabilizedConcepts from '../lib/components/StabilizedConcepts.svelte';
  import type { ExperimentRow } from '../lib/api.js';
  import type { StabilizedConcept } from '../lib/components/StabilizedConcepts.svelte';
  import type { LogEntry } from '../lib/components/DialogueLog.svelte';

  interface Props {
    experimentId: string;
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { experimentId, onNavigate }: Props = $props();

  let experiment = $state<ExperimentRow | null>(null);
  let log = $state<LogEntry[]>([]);
  let stabilized = $state<StabilizedConcept[]>([]);
  let completed = $state(false);
  let loading = $state(false); // typing indicator
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
    loading = true;

    es.addEventListener('round-started', () => {
      loading = true;
    });

    es.addEventListener('round-completed', (e: MessageEvent) => {
      loading = false;
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
      stabilized = [
        ...stabilized,
        {
          word: data.word,
          definition: data.definition ?? '',
          etymology: data.etymology ?? '',
          existsInOtherLanguages: data.existsInOtherLanguages ?? 'uncertain',
        },
      ];
    });

    es.addEventListener('experiment-completed', () => {
      loading = false;
      completed = true;
      es.close();
    });

    es.addEventListener('error', (e: MessageEvent) => {
      loading = false;
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
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to pause';
    } finally {
      pausing = false;
    }
  }
</script>

<div class="run-view">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h2>{$t.experiment.run.title}</h2>
      {#if !completed && experiment?.status !== 'paused'}
        <span class="live-dot" aria-label="en vivo"></span>
      {/if}
    </div>
    <div class="header-actions">
      {#if !completed && experiment?.status === 'running'}
        <button onclick={pause} disabled={pausing}>
          {pausing ? $t.common.loading : $t.experiment.run.pause}
        </button>
      {/if}
      {#if experiment?.status === 'paused'}
        <button onclick={startStream}>{$t.experiment.run.resume}</button>
      {/if}
    </div>
  </div>

  {#if error}
    <p class="error-msg">{error}</p>
  {/if}

  <!-- Dialogue -->
  <DialogueLog entries={log} {loading} />

  <!-- Stabilized concepts appear inline as they emerge -->
  {#if stabilized.length > 0}
    <StabilizedConcepts concepts={stabilized} />
  {/if}

  <!-- Completed state -->
  {#if completed}
    <div class="completed-banner">
      <span>✓ {$t.experiment.run.completed}</span>
      <button onclick={() => onNavigate('validate', { id: experimentId })}>
        {$t.experiment.validate.title} →
      </button>
    </div>
  {/if}

  <!-- Footer -->
  <footer>
    <p>Cada ronda es una llamada independiente al modelo con system prompts distintos.</p>
    <p>Ninguna instancia conoce las instrucciones de la otra.</p>
    <p>El veredicto final no fue diseñado por ningún humano.</p>
  </footer>
</div>

<style>
  .run-view {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Header ──────────────────────────────────────────────────────── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border-dim);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  h2 {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  /* Pulsing live indicator */
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan);
    animation: livePulse 2s infinite ease-in-out;
  }
  @keyframes livePulse {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 8px var(--cyan);
    }
    50% {
      opacity: 0.4;
      box-shadow: 0 0 3px var(--cyan);
    }
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
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

  /* ── Error ───────────────────────────────────────────────────────── */
  .error-msg {
    color: var(--status-failed);
    font-size: 0.82rem;
    margin: 0 0 1rem;
  }

  /* ── Completed banner ────────────────────────────────────────────── */
  .completed-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    margin-top: 1.5rem;
    background: rgba(52, 211, 153, 0.05);
    border: 1px solid rgba(52, 211, 153, 0.2);
    border-radius: 2px;
  }
  .completed-banner span {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--status-completed);
  }
  .completed-banner button {
    border-color: var(--status-completed);
    color: var(--status-completed);
  }
  .completed-banner button:hover {
    background: rgba(52, 211, 153, 0.08);
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.2);
  }

  /* ── Footer ──────────────────────────────────────────────────────── */
  footer {
    margin-top: 3rem;
    padding: 1.5rem 0 1rem;
    border-top: 1px solid var(--border-dim);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  footer p {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 0.82rem;
    font-style: italic;
    color: var(--text-dim);
    line-height: 1.6;
    text-align: center;
    letter-spacing: 0.01em;
  }
</style>
