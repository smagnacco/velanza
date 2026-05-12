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
    explorer: 'var(--explorer)',
    critic: 'var(--critic)',
    verifier: 'var(--verifier)',
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
    gap: 0.5rem;
    max-height: 640px;
    overflow-y: auto;
    padding: 0.25rem;
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
  }

  .entry {
    border-left: 2px solid var(--role-color);
    padding: 0.65rem 0.85rem;
    background: var(--bg-surface);
    position: relative;
    transition: background 0.15s;
  }
  .entry:hover {
    background: var(--bg-raised);
  }

  /* subtle ambient glow from the role color */
  .entry::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(var(--role-color-raw, 0, 229, 204), 0.04) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  .entry-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .role {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--role-color);
  }

  .round {
    font-size: 0.65rem;
    color: var(--text-dim);
    letter-spacing: 0.06em;
  }

  .time {
    font-size: 0.65rem;
    color: var(--text-dim);
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    opacity: 0.6;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--font-serif);
    font-size: 0.9rem;
    line-height: 1.65;
    color: var(--text-primary);
  }
</style>
