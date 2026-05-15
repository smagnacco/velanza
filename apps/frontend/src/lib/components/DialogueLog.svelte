<script lang="ts">
  import { t } from '../i18n/index.js';
  import { tick } from 'svelte';

  export interface LogEntry {
    round: number;
    role: 'explorer' | 'critic' | 'verifier';
    text: string;
    timestamp: Date;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  }

  interface Props {
    entries: LogEntry[];
    loading?: boolean;
  }

  let { entries, loading = false }: Props = $props();

  let scrollEl = $state<HTMLElement | null>(null);

  // Scroll to bottom whenever entries change
  $effect(() => {
    entries;
    tick().then(() => {
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  });

  const roleLabel: Record<string, string> = {
    explorer: 'Exploradora',
    critic: 'Crítica',
    verifier: 'Verificadora',
  };

  // Group consecutive entries by the same domain run for visual separation
  function isFirstInRun(entries: LogEntry[], i: number): boolean {
    if (i === 0) return true;
    const prev = entries[i - 1];
    const curr = entries[i];
    if (!prev || !curr) return false;
    // New run if round number resets (round 1 after something higher)
    return curr.round === 1 && prev.round > 1;
  }
</script>

<div class="chat" bind:this={scrollEl}>
  {#each entries as entry, i (entry.round + entry.role + entry.timestamp.toISOString())}
    {#if isFirstInRun(entries, i)}
      <div class="run-separator">
        <span>— nueva corrida —</span>
      </div>
    {/if}

    <div class="message message-{entry.role}">
      <div class="avatar" aria-label={roleLabel[entry.role]}>
        {#if entry.role === 'explorer'}
          <span class="avatar-icon">◈</span>
        {:else if entry.role === 'critic'}
          <span class="avatar-icon">◇</span>
        {:else}
          <span class="avatar-icon">◉</span>
        {/if}
      </div>

      <div class="bubble">
        <div class="bubble-header">
          <span class="role-name">{roleLabel[entry.role]}</span>
          <span class="round-tag">ronda {entry.round}</span>
          {#if entry.inputTokens != null}
            <span class="tokens-tag" title="tokens entrada / salida"
              >{entry.inputTokens}↑ {entry.outputTokens}↓</span
            >
          {/if}
          {#if entry.latencyMs != null}
            <span class="latency-tag">{(entry.latencyMs / 1000).toFixed(1)}s</span>
          {/if}
          <span class="ts">{entry.timestamp.toLocaleTimeString()}</span>
        </div>
        <div class="bubble-text">{entry.text}</div>
      </div>
    </div>
  {/each}

  {#if loading}
    <div class="thinking">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  {/if}
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-height: 620px;
    overflow-y: auto;
    padding: 1rem 0.5rem;
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    scroll-behavior: smooth;
  }

  /* ── Run separator ───────────────────────────────────────────────── */
  .run-separator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.25rem 0 1rem;
    color: var(--text-dim);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .run-separator::before,
  .run-separator::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-dim);
  }

  /* ── Message layout ──────────────────────────────────────────────── */
  .message {
    display: flex;
    gap: 0.65rem;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.5rem;
    align-items: flex-start;
  }

  /* Explorer: left-aligned */
  .message-explorer {
    flex-direction: row;
  }

  /* Critic: right-aligned */
  .message-critic {
    flex-direction: row-reverse;
  }

  /* Verifier: centered */
  .message-verifier {
    flex-direction: column;
    align-items: center;
    margin: 0.75rem 1.5rem;
  }
  .message-verifier .bubble {
    width: 100%;
    border-style: dashed;
    background: rgba(167, 139, 250, 0.04);
  }
  .message-verifier .avatar {
    flex-direction: row;
    gap: 0.5rem;
    align-self: center;
  }

  /* ── Avatar ─────────────────────────────────────────────────────── */
  .avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    padding-top: 0.2rem;
  }

  .avatar-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .message-explorer .avatar-icon {
    color: var(--explorer);
  }
  .message-critic .avatar-icon {
    color: var(--critic);
  }
  .message-verifier .avatar-icon {
    color: var(--verifier);
  }

  /* ── Bubble ─────────────────────────────────────────────────────── */
  .bubble {
    max-width: 82%;
    padding: 0.65rem 0.9rem;
    border-radius: 2px;
    border: 1px solid;
    position: relative;
  }

  .message-explorer .bubble {
    background: rgba(0, 229, 204, 0.04);
    border-color: rgba(0, 229, 204, 0.18);
    border-top-left-radius: 0;
  }

  .message-critic .bubble {
    background: rgba(255, 107, 107, 0.04);
    border-color: rgba(255, 107, 107, 0.18);
    border-top-right-radius: 0;
  }

  /* ── Bubble header ───────────────────────────────────────────────── */
  .bubble-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.45rem;
  }

  .role-name {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .message-explorer .role-name {
    color: var(--explorer);
  }
  .message-critic .role-name {
    color: var(--critic);
  }
  .message-verifier .role-name {
    color: var(--verifier);
  }

  .round-tag {
    font-size: 0.58rem;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    border: 1px solid var(--border-dim);
    padding: 0.05rem 0.35rem;
    border-radius: 2px;
  }

  .tokens-tag {
    font-size: 0.56rem;
    letter-spacing: 0.04em;
    color: var(--text-dim);
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }

  .latency-tag {
    font-size: 0.56rem;
    color: var(--text-dim);
    opacity: 0.55;
    font-variant-numeric: tabular-nums;
  }

  .ts {
    font-size: 0.57rem;
    color: var(--text-dim);
    opacity: 0.5;
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  /* ── Bubble text ─────────────────────────────────────────────────── */
  .bubble-text {
    font-family: var(--font-serif);
    font-size: 0.9rem;
    line-height: 1.65;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── Typing indicator ───────────────────────────────────────────── */
  .thinking {
    display: flex;
    gap: 0.3rem;
    padding: 0.75rem 1rem;
    align-items: center;
    justify-content: center;
  }

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-dim);
    animation: pulse 1.4s infinite ease-in-out;
  }
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.2;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
