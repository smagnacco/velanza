<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import ConceptCard from '../lib/components/ConceptCard.svelte';
  import RatingForm from '../lib/components/RatingForm.svelte';
  import type { ConceptRow, RatingRow } from '../lib/api.js';

  interface Props {
    experimentId: string;
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { experimentId, onNavigate }: Props = $props();

  let concepts = $state<ConceptRow[]>([]);
  let ratings = $state<Record<string, RatingRow | null>>({});
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeConceptId = $state<string | null>(null);

  onMount(async () => {
    try {
      const all = await api.concepts.list({ experiment: experimentId, stabilized: true });
      concepts = all;
      for (const c of all) {
        ratings[c.id] = await api.concepts.getRating(c.id);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  });

  async function onRatingSaved(conceptId: string) {
    ratings[conceptId] = await api.concepts.getRating(conceptId);
    activeConceptId = null;
  }
</script>

<div class="validate-view">
  <div class="header">
    <h2>{$t.experiment.validate.title}</h2>
    <button onclick={() => onNavigate('analyze', { id: experimentId })}>
      {$t.experiment.analyze.title} →
    </button>
  </div>

  {#if loading}
    <p>{$t.common.loading}</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if concepts.length === 0}
    <p>{$t.experiment.validate.noConceptsYet}</p>
  {:else}
    <div class="concepts">
      {#each concepts as concept}
        <div class="concept-section">
          <ConceptCard {concept} />
          {#if activeConceptId === concept.id}
            <RatingForm
              conceptId={concept.id}
              existing={ratings[concept.id]}
              onsaved={() => onRatingSaved(concept.id)}
            />
          {:else}
            <div class="rating-summary">
              {#if ratings[concept.id]}
                <span class="rated">✓ Rated</span>
              {/if}
              <button onclick={() => (activeConceptId = concept.id)}>
                {ratings[concept.id] ? 'Edit rating' : $t.experiment.validate.save}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .validate-view {
    max-width: 800px;
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
  }
  .concepts {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .concept-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .rating-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .rated {
    color: #2e7d32;
    font-size: 0.9rem;
  }
  .error {
    color: #c62828;
  }
</style>
