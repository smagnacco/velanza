<script lang="ts">
  import { t } from '../i18n/index.js';

  interface LogEntry {
    round: number;
    role: 'explorer' | 'critic' | 'verifier';
    text: string;
    timestamp: Date;
  }

  interface Props {
    entries: LogEntry[];
  }

  let { entries }: Props = $props();

  const roleColors: Record<string, string> = {
    explorer: '#1565c0',
    critic: '#b71c1c',
    verifier: '#2e7d32',
  };
</script>

<div class="dialogue-log">
  {#each entries as entry (entry.round + entry.role + entry.timestamp.toISOString())}
    <div class="entry" style="--role-color: {roleColors[entry.role] ?? '#333'}">
      <div class="entry-header">
        <span class="role">{$t.experiment.run.role[entry.role]}</span>
        <span class="round">{$t.experiment.run.round} {entry.round}</span>
        <span class="time">{entry.timestamp.toLocaleTimeString()}</span>
      </div>
      <pre class="text">{entry.text}</pre>
    </div>
  {/each}
</div>

<style>
  .dialogue-log {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 600px;
    overflow-y: auto;
    padding: 0.5rem;
  }
  .entry {
    border-left: 3px solid var(--role-color);
    padding: 0.5rem 0.75rem;
    background: #fafafa;
    border-radius: 0 4px 4px 0;
  }
  .entry-header {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
    font-size: 0.8rem;
  }
  .role {
    font-weight: 700;
    color: var(--role-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .round {
    color: #666;
  }
  .time {
    color: #999;
    margin-left: auto;
  }
  .text {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #333;
  }
</style>
