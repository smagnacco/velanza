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
  let exportingMarkdown = $state(false);
  let savedMarkdownPath = $state<string | null>(null);
  let wikipediaId = $state<string | null>(null);
  let wikiModal = $state<{ word: string; wikitext: string } | null>(null);
  let wikiCopied = $state(false);

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
        c.existsInOtherLanguages !== 'true'
    )
  );

  const confirmedGaps = $derived(
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

  async function exportMarkdown() {
    exportingMarkdown = true;
    savedMarkdownPath = null;
    try {
      const result = await api.exports.markdown(experimentId);
      savedMarkdownPath = result.path;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to export';
    } finally {
      exportingMarkdown = false;
    }
  }

  async function openWikipediaDraft(concept: ConceptWithRating) {
    wikipediaId = concept.id;
    wikiCopied = false;
    try {
      const result = await api.exports.wikipedia(concept.id, $currentLang as 'es' | 'en');
      wikiModal = { word: result.word, wikitext: result.wikitext };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate Wikipedia draft';
    } finally {
      wikipediaId = null;
    }
  }

  async function copyWikitext() {
    if (!wikiModal) return;
    await navigator.clipboard.writeText(wikiModal.wikitext);
    wikiCopied = true;
    setTimeout(() => (wikiCopied = false), 2000);
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
      <button class="export-md-btn" onclick={exportMarkdown} disabled={exportingMarkdown}>
        {exportingMarkdown ? $t.common.loading : $t.experiment.analyze.exportMarkdown}
      </button>
      {#if savedMarkdownPath}
        <span class="saved-path"
          >{$t.experiment.analyze.exportMarkdownSaved} {savedMarkdownPath}</span
        >
      {/if}
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
      <div class="stat highlight" title={$t.experiment.analyze.genuineGapsTooltip}>
        <div class="stat-value">{genuineGaps.length}</div>
        <div class="stat-label">{$t.experiment.analyze.genuineGaps}</div>
        <div class="stat-hint">?</div>
      </div>
      <div class="stat highlight-strict" title={$t.experiment.analyze.confirmedGapsTooltip}>
        <div class="stat-value">{confirmedGaps.length}</div>
        <div class="stat-label">{$t.experiment.analyze.confirmedGaps}</div>
        <div class="stat-hint">?</div>
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
              <button
                class="wiki-btn"
                onclick={() => openWikipediaDraft(concept)}
                disabled={wikipediaId === concept.id}
              >
                {wikipediaId === concept.id
                  ? $t.common.loading
                  : $t.experiment.analyze.wikipediaDraft}
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

{#if wikiModal}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="wiki-overlay" onclick={() => (wikiModal = null)}>
    <div class="wiki-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="wiki-modal-header">
        <span class="wiki-modal-title"
          >{$t.experiment.analyze.wikipediaModalTitle} — <em>{wikiModal.word}</em></span
        >
        <button class="wiki-close" onclick={() => (wikiModal = null)}>×</button>
      </div>
      <p class="wiki-hint">{$t.experiment.analyze.wikipediaModalHint}</p>
      <textarea class="wiki-textarea" readonly value={wikiModal.wikitext}></textarea>
      <div class="wiki-modal-actions">
        <button class="wiki-copy-btn" onclick={copyWikitext}>
          {wikiCopied ? $t.experiment.analyze.wikipediaCopied : $t.experiment.analyze.wikipediaCopy}
        </button>
        <button class="wiki-dismiss-btn" onclick={() => (wikiModal = null)}>
          {$t.experiment.analyze.wikipediaClose}
        </button>
      </div>
    </div>
  </div>
{/if}

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
  .export-md-btn {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.85rem;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .export-md-btn:hover:not(:disabled) {
    border-color: var(--border-bright);
    color: var(--text-primary);
  }
  .export-md-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .saved-path {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--cyan);
    opacity: 0.75;
    align-self: center;
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
  .stat.highlight-strict {
    border-color: rgba(0, 229, 204, 0.15);
    background: rgba(0, 229, 204, 0.02);
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
  .stat.highlight-strict .stat-value {
    color: rgba(0, 229, 204, 0.55);
  }
  .stat-label {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 0.5rem;
  }
  .stat-hint {
    font-size: 0.55rem;
    color: var(--text-dim);
    opacity: 0.45;
    margin-top: 0.25rem;
    font-family: var(--font-mono);
    cursor: help;
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

  .wiki-btn {
    background: transparent;
    border: 1px solid rgba(148, 163, 184, 0.3);
    color: var(--text-dim);
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
  .wiki-btn:hover:not(:disabled) {
    border-color: rgba(148, 163, 184, 0.6);
    color: var(--text-secondary);
  }
  .wiki-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ── Wikipedia modal ─────────────────────────────────────────────── */
  .wiki-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1.5rem;
  }

  .wiki-modal {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 2px;
    width: 100%;
    max-width: 680px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.6);
  }

  .wiki-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }

  .wiki-modal-title {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .wiki-modal-title em {
    font-style: italic;
    font-family: var(--font-serif);
    text-transform: none;
    color: var(--cyan);
    letter-spacing: normal;
    font-size: 0.9rem;
  }

  .wiki-close {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: color 0.1s;
  }
  .wiki-close:hover {
    color: var(--text-primary);
  }

  .wiki-hint {
    font-family: var(--font-serif);
    font-size: 0.82rem;
    font-style: italic;
    color: var(--text-dim);
    margin: 0;
    line-height: 1.5;
  }

  .wiki-textarea {
    flex: 1;
    min-height: 320px;
    max-height: 50vh;
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    line-height: 1.6;
    padding: 0.85rem 1rem;
    resize: vertical;
    white-space: pre;
    overflow: auto;
  }

  .wiki-modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .wiki-copy-btn {
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 1.25rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .wiki-copy-btn:hover {
    background: var(--cyan-glow);
  }

  .wiki-dismiss-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 1.25rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .wiki-dismiss-btn:hover {
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .error {
    color: var(--status-failed);
    font-size: 0.85rem;
  }
</style>
