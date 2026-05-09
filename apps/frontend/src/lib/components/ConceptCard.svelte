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
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    background: #fff;
  }
  .concept-card.stabilized {
    border-color: #4caf50;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  h3 {
    margin: 0;
    font-size: 1.25rem;
  }
  .domain {
    font-size: 0.75rem;
    color: #888;
    background: #f5f5f5;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }
  .badge-stabilized {
    font-size: 0.7rem;
    background: #e8f5e9;
    color: #2e7d32;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }
  .definition {
    margin: 0.5rem 0;
    line-height: 1.5;
  }
  .etymology,
  .existence {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #444;
  }
</style>
