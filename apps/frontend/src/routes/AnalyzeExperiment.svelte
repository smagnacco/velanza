<script lang="ts">
  import { onMount } from 'svelte';
  import { t, currentLang } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import ConceptCard from '../lib/components/ConceptCard.svelte';
  import type { ConceptRow, RatingRow } from '../lib/api.js';
  import { DEFAULT_DOMAINS } from '../lib/domains.js';

  interface Props {
    experimentId: string;
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { experimentId, onNavigate }: Props = $props();

  interface ConceptWithRating extends ConceptRow {
    rating: RatingRow | null;
  }

  let concepts = $state<ConceptWithRating[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let publishingId = $state<string | null>(null);

  onMount(async () => {
    try {
      const all = await api.concepts.list({ experiment: experimentId });
      const withRatings = await Promise.all(
        all.map(async (c) => ({ ...c, rating: await api.concepts.getRating(c.id) }))
      );
      concepts = withRatings;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  });

  const stabilized = $derived(concepts.filter((c) => c.stabilized));

  const genuineGaps = $derived(
    stabilized.filter(
      (c) =>
        c.rating?.recognized === 'yes' &&
        c.rating?.spanishCovers === 'no' &&
        c.existsInOtherLanguages === 'false'
    )
  );

  function getDomainLabel(id: string): string {
    const domain = DEFAULT_DOMAINS.find((d) => d.id === id);
    return domain ? ($currentLang === 'es' ? domain.label.es : domain.label.en) : id;
  }

  async function publishToX(concept: ConceptWithRating) {
    publishingId = concept.id;
    try {
      const draft = await api.xPublisher.draft(concept.id, $currentLang as 'es' | 'en');
      window.open(draft.url, '_blank');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate draft';
    } finally {
      publishingId = null;
    }
  }
</script>

<div class="analyze-view">
  <div class="header">
    <h2>{$t.experiment.analyze.title}</h2>
    <div class="export-buttons">
      <a href={api.exports.json(experimentId)} download>{$t.experiment.analyze.exportJson}</a>
      <a href={api.exports.csv(experimentId)} download>{$t.experiment.analyze.exportCsv}</a>
    </div>
  </div>

  {#if loading}
    <p>{$t.common.loading}</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="stats-row">
      <div class="stat">
        <div class="stat-value">{concepts.length}</div>
        <div class="stat-label">{$t.experiment.analyze.totalConcepts}</div>
      </div>
      <div class="stat">
        <div class="stat-value">{stabilized.length}</div>
        <div class="stat-label">{$t.experiment.analyze.stabilized}</div>
      </div>
      <div class="stat highlight">
        <div class="stat-value">{genuineGaps.length}</div>
        <div class="stat-label">{$t.experiment.analyze.genuineGaps}</div>
      </div>
    </div>

    {#if genuineGaps.length > 0}
      <section>
        <h3>{$t.experiment.analyze.genuineGaps}</h3>
        <p class="hint">{$t.experiment.analyze.genuineGapsDesc}</p>
        <div class="concept-grid">
          {#each genuineGaps as concept}
            <div class="concept-with-actions">
              <ConceptCard {concept} />
              <button
                class="publish-btn"
                onclick={() => publishToX(concept)}
                disabled={publishingId === concept.id}
              >
                {publishingId === concept.id ? $t.common.loading : $t.experiment.analyze.publishX}
              </button>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if stabilized.length > 0}
      <section>
        <h3>{$t.experiment.analyze.stabilized}</h3>
        <div class="concept-grid">
          {#each stabilized as concept}
            <ConceptCard {concept} />
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .analyze-view {
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
  .export-buttons {
    display: flex;
    gap: 0.5rem;
  }
  a {
    padding: 0.4rem 1rem;
    background: #546e7a;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .stats-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  .stat {
    padding: 1rem 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-align: center;
    background: white;
  }
  .stat.highlight {
    border-color: #4caf50;
    background: #e8f5e9;
  }
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
  }
  .stat-label {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
  }
  section {
    margin-bottom: 2rem;
  }
  h3 {
    margin-bottom: 0.5rem;
  }
  .hint {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.75rem;
  }
  .concept-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  .concept-with-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .publish-btn {
    padding: 0.4rem 1rem;
    background: #1da1f2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .publish-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: #c62828;
  }
</style>
