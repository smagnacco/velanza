<script lang="ts">
  export interface StabilizedConcept {
    word: string;
    definition: string;
    etymology: string;
    existsInOtherLanguages: 'true' | 'false' | 'uncertain';
  }

  interface Props {
    concepts: StabilizedConcept[];
  }

  let { concepts }: Props = $props();

  const existsLabel: Record<string, string> = {
    true: 'existe en otras lenguas',
    false: 'sin equivalente conocido',
    uncertain: 'verificación incierta',
  };

  const existsClass: Record<string, string> = {
    true: 'exists-yes',
    false: 'exists-no',
    uncertain: 'exists-uncertain',
  };
</script>

<div class="stabilized-section">
  <div class="section-header">
    <span class="section-icon">◈</span>
    <span class="section-title">Conceptos estabilizados</span>
    <span class="section-count">{concepts.length}</span>
  </div>

  <div class="concepts-grid">
    {#each concepts as concept}
      <article class="concept-card" class:genuine={concept.existsInOtherLanguages === 'false'}>
        <div class="concept-word">{concept.word}</div>

        <p class="concept-definition">{concept.definition}</p>

        <div class="concept-meta">
          <span class="etymology-label">etim.</span>
          <span class="etymology-text">{concept.etymology}</span>
        </div>

        <div class="concept-status {existsClass[concept.existsInOtherLanguages]}">
          <span class="status-dot"></span>
          {existsLabel[concept.existsInOtherLanguages]}
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .stabilized-section {
    margin-top: 2rem;
    animation: fadeIn 0.6s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--border-dim);
  }

  .section-icon {
    color: var(--cyan);
    font-size: 0.9rem;
    text-shadow: var(--glow-sm);
  }

  .section-title {
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .section-count {
    font-size: 0.65rem;
    color: var(--cyan);
    background: rgba(0, 229, 204, 0.1);
    border: 1px solid rgba(0, 229, 204, 0.25);
    padding: 0.05rem 0.45rem;
    border-radius: 10px;
    font-variant-numeric: tabular-nums;
  }

  /* ── Grid ──────────────────────────────────────────────────────── */
  .concepts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  /* ── Card ──────────────────────────────────────────────────────── */
  .concept-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    padding: 1.1rem 1.15rem 0.85rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  /* Genuine gap: no equivalent found */
  .concept-card.genuine {
    border-color: rgba(0, 229, 204, 0.22);
  }
  .concept-card.genuine::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity: 0.6;
  }

  /* ── Word ──────────────────────────────────────────────────────── */
  .concept-word {
    font-family: var(--font-serif);
    font-size: 1.55rem;
    font-style: italic;
    font-weight: 400;
    color: var(--cyan);
    text-shadow: 0 0 28px rgba(0, 229, 204, 0.35);
    margin-bottom: 0.6rem;
    line-height: 1.1;
  }

  /* ── Definition ────────────────────────────────────────────────── */
  .concept-definition {
    font-family: var(--font-serif);
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-primary);
    margin: 0 0 0.75rem;
    border-left: 2px solid var(--border-dim);
    padding-left: 0.7rem;
  }

  /* ── Etymology ─────────────────────────────────────────────────── */
  .concept-meta {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    margin-bottom: 0.65rem;
  }

  .etymology-label {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    flex-shrink: 0;
  }

  .etymology-text {
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.45;
    font-style: italic;
    font-family: var(--font-serif);
  }

  /* ── Existence status ───────────────────────────────────────────── */
  .concept-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border-dim);
  }

  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .exists-no {
    color: var(--status-completed);
  }
  .exists-no .status-dot {
    background: var(--status-completed);
    box-shadow: 0 0 6px var(--status-completed);
  }

  .exists-yes {
    color: var(--text-dim);
  }
  .exists-yes .status-dot {
    background: var(--text-dim);
  }

  .exists-uncertain {
    color: var(--status-paused);
  }
  .exists-uncertain .status-dot {
    background: var(--status-paused);
  }
</style>
