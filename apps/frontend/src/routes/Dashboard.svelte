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
    margin-bottom: 1.5rem;
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
    font-size: 0.85rem;
  }
  .empty {
    text-align: center;
    padding: 3rem;
  }
  .experiment-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .experiment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .exp-info {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .exp-stage {
    font-weight: 600;
  }
  .exp-lang {
    font-size: 0.75rem;
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }
  .exp-date {
    font-size: 0.8rem;
    color: #888;
  }
  .exp-progress {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .exp-actions {
    display: flex;
    gap: 0.5rem;
  }
  .status {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
  }
  .status-pending {
    background: #fff3e0;
    color: #e65100;
  }
  .status-running {
    background: #e3f2fd;
    color: #1565c0;
  }
  .status-paused {
    background: #fce4ec;
    color: #880e4f;
  }
  .status-completed {
    background: #e8f5e9;
    color: #2e7d32;
  }
  .status-failed {
    background: #ffebee;
    color: #b71c1c;
  }
  .runs {
    font-size: 0.8rem;
    color: #666;
  }
  .error {
    color: #c62828;
  }
</style>
