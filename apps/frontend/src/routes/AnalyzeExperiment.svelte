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
    margin-bottom: 2rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border-dim);
  }
  h2 {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .export-buttons {
    display: flex;
    gap: 0.5rem;
  }
  a {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.85rem;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 2px;
    text-decoration: none;
    transition: all 0.15s;
  }
  a:hover {
    border-color: var(--border-bright);
    color: var(--text-primary);
  }

  .stats-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }
  .stat {
    flex: 1;
    min-width: 120px;
    padding: 1.25rem 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    text-align: center;
  }
  .stat.highlight {
    border-color: rgba(0, 229, 204, 0.3);
    background: rgba(0, 229, 204, 0.04);
    box-shadow: inset 0 0 40px rgba(0, 229, 204, 0.04);
  }
  .stat-value {
    font-size: 2.2rem;
    font-weight: 300;
    color: var(--text-primary);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .stat.highlight .stat-value {
    color: var(--cyan);
    text-shadow: 0 0 20px rgba(0, 229, 204, 0.4);
  }
  .stat-label {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 0.5rem;
  }

  section {
    margin-bottom: 2.5rem;
  }

  h3 {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
  }
  .hint {
    font-family: var(--font-serif);
    font-size: 0.88rem;
    font-style: italic;
    color: var(--text-dim);
    margin-bottom: 1rem;
  }

  .concept-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }
  .concept-with-actions {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .publish-btn {
    background: transparent;
    border: 1px solid rgba(167, 139, 250, 0.4);
    color: var(--verifier);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
  }
  .publish-btn:hover {
    background: rgba(167, 139, 250, 0.08);
    border-color: var(--verifier);
  }
  .publish-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .error {
    color: var(--status-failed);
    font-size: 0.85rem;
  }
</style>
