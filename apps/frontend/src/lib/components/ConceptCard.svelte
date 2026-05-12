<script lang="ts">
  import { t } from '../i18n/index.js';
  import type { ConceptRow } from '../api.js';

  interface Props {
    concept: ConceptRow;
    domain?: string;
  }

  let { concept, domain }: Props = $props();

  const existsLabel = $derived(
    {
      true: $t.concept.exists.true,
      false: $t.concept.exists.false,
      uncertain: $t.concept.exists.uncertain,
    }[concept.existsInOtherLanguages]
  );
</script>

<article class="concept-card" class:stabilized={concept.stabilized}>
  <header>
    <h3>{concept.word}</h3>
    {#if domain}
      <span class="domain">{domain}</span>
    {/if}
    {#if concept.stabilized}
      <span class="badge badge-stabilized">{$t.concept.stabilized}</span>
    {/if}
  </header>
  <p class="definition">{concept.definition}</p>
  <p class="etymology"><strong>{$t.concept.etymology}:</strong> {concept.etymology}</p>
  <p class="existence">
    <strong>{$t.concept.existsInOtherLanguages}:</strong>
    {existsLabel}
  </p>
</article>

<style>
  .concept-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    padding: 1.25rem 1.25rem 1rem;
    transition: border-color 0.2s;
  }
  .concept-card.stabilized {
    border-color: rgba(0, 229, 204, 0.25);
    box-shadow: inset 0 0 40px rgba(0, 229, 204, 0.03);
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.85rem;
    flex-wrap: wrap;
  }

  h3 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1.6rem;
    font-weight: 400;
    font-style: italic;
    color: var(--cyan);
    letter-spacing: 0.02em;
    text-shadow: 0 0 30px rgba(0, 229, 204, 0.3);
  }

  .domain {
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--border-dim);
    padding: 0.1rem 0.4rem;
    border-radius: 2px;
  }

  .badge-stabilized {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--status-completed);
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid var(--status-completed);
    padding: 0.1rem 0.45rem;
    border-radius: 2px;
  }

  .definition {
    font-family: var(--font-serif);
    font-size: 1rem;
    line-height: 1.65;
    color: var(--text-primary);
    margin: 0 0 0.85rem;
    border-left: 2px solid var(--border);
    padding-left: 0.85rem;
  }

  .etymology {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin: 0.35rem 0 0;
    line-height: 1.5;
  }
  .etymology strong {
    color: var(--text-dim);
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    margin-right: 0.35rem;
  }

  .existence {
    font-size: 0.75rem;
    color: var(--text-dim);
    margin: 0.25rem 0 0;
  }
  .existence strong {
    color: var(--text-dim);
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    margin-right: 0.35rem;
  }
</style>
