<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import type { ExperimentRow } from '../lib/api.js';

  interface Props {
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { onNavigate }: Props = $props();

  let experiments = $state<ExperimentRow[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      experiments = await api.experiments.list();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  });

  function formatDate(unix: number): string {
    return new Date(unix * 1000).toLocaleString();
  }
</script>

<div class="dashboard">
  <div class="header">
    <h2>{$t.dashboard.title}</h2>
    <button onclick={() => onNavigate('new-experiment')}>{$t.dashboard.newExperiment}</button>
  </div>

  {#if loading}
    <p>{$t.common.loading}</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if experiments.length === 0}
    <div class="empty">
      <p>{$t.dashboard.empty}</p>
      <button onclick={() => onNavigate('new-experiment')}>{$t.dashboard.newExperiment}</button>
    </div>
  {:else}
    <div class="experiment-list">
      {#each experiments as exp}
        <div class="experiment-row">
          <div class="exp-info">
            <span class="exp-stage">Stage {exp.stage.replace('v', '')}</span>
            <span class="exp-lang">{exp.language.toUpperCase()}</span>
            <span class="exp-date">{formatDate(exp.createdAt)}</span>
          </div>
          <div class="exp-progress">
            <span class="status status-{exp.status}">{$t.dashboard.status[exp.status]}</span>
            <span class="runs">{exp.completedRuns} / {exp.totalRuns} runs</span>
          </div>
          <div class="exp-actions">
            <button onclick={() => onNavigate('run', { id: exp.id })}>
              {exp.status === 'completed' ? 'View' : exp.status === 'paused' ? 'Resume' : 'Run'}
            </button>
            {#if exp.status === 'completed'}
              <button onclick={() => onNavigate('validate', { id: exp.id })}>Validate</button>
              <button onclick={() => onNavigate('analyze', { id: exp.id })}>Analyze</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-dim);
  }
  h2 {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  button {
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.4rem 1rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  button:hover {
    background: var(--cyan-glow);
    box-shadow: var(--glow-sm);
  }

  .empty {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-dim);
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .experiment-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .experiment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    flex-wrap: wrap;
    gap: 0.75rem;
    transition: border-color 0.15s;
  }
  .experiment-row:hover {
    border-color: var(--border);
  }

  .exp-info {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .exp-stage {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cyan);
  }
  .exp-lang {
    font-size: 0.65rem;
    color: var(--text-dim);
    border: 1px solid var(--border-dim);
    padding: 0.1rem 0.4rem;
    border-radius: 2px;
    letter-spacing: 0.08em;
  }
  .exp-date {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .exp-progress {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .exp-actions {
    display: flex;
    gap: 0.5rem;
  }
  .exp-actions button {
    font-size: 0.65rem;
    padding: 0.3rem 0.75rem;
    border-color: var(--border);
    color: var(--text-secondary);
  }
  .exp-actions button:hover {
    border-color: var(--cyan-dim);
    color: var(--cyan);
  }

  .status {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: 2px;
    border: 1px solid currentColor;
  }
  .status-pending {
    color: var(--status-pending);
    background: rgba(245, 158, 11, 0.08);
  }
  .status-running {
    color: var(--status-running);
    background: rgba(0, 229, 204, 0.08);
  }
  .status-paused {
    color: var(--status-paused);
    background: rgba(167, 139, 250, 0.08);
  }
  .status-completed {
    color: var(--status-completed);
    background: rgba(52, 211, 153, 0.08);
  }
  .status-failed {
    color: var(--status-failed);
    background: rgba(255, 107, 107, 0.08);
  }

  .runs {
    font-size: 0.75rem;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }
  .error {
    color: var(--status-failed);
    font-size: 0.85rem;
  }
</style>
