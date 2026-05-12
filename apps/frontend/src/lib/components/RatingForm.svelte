<script lang="ts">
  import { t } from '../i18n/index.js';
  import { api } from '../api.js';
  import type { RatingInput } from '@velanza/shared';
  import type { RatingRow } from '../api.js';

  interface Props {
    conceptId: string;
    existing?: RatingRow | null;
    onsaved?: () => void;
  }

  let { conceptId, existing, onsaved }: Props = $props();

  let recognized = $state<'yes' | 'no' | 'uncertain'>(existing?.recognized ?? 'uncertain');
  let spanishCovers = $state<'yes' | 'no' | 'partially'>(existing?.spanishCovers ?? 'no');
  let englishCovers = $state<'yes' | 'no' | 'partially'>(existing?.englishCovers ?? 'no');
  let usability = $state<number>(existing?.usability ?? 3);
  let wouldUse = $state<'yes' | 'no' | 'maybe'>(existing?.wouldUse ?? 'maybe');
  let comment = $state<string>(existing?.comment ?? '');
  let saving = $state(false);
  let error = $state<string | null>(null);

  async function save() {
    saving = true;
    error = null;
    try {
      const body: RatingInput = {
        recognized,
        spanishCovers,
        englishCovers,
        usability,
        wouldUse,
        comment,
      };
      await api.concepts.saveRating(conceptId, body);
      onsaved?.();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Save failed';
    } finally {
      saving = false;
    }
  }
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    save();
  }}
>
  <div class="field">
    <span class="question">{$t.experiment.validate.recognized}</span>
    <div class="radio-group">
      <label
        ><input type="radio" bind:group={recognized} value="yes" />
        {$t.experiment.validate.yes}</label
      >
      <label
        ><input type="radio" bind:group={recognized} value="no" />
        {$t.experiment.validate.no}</label
      >
      <label
        ><input type="radio" bind:group={recognized} value="uncertain" />
        {$t.experiment.validate.uncertain}</label
      >
    </div>
  </div>

  <div class="field">
    <span class="question">{$t.experiment.validate.spanishCovers}</span>
    <div class="radio-group">
      <label
        ><input type="radio" bind:group={spanishCovers} value="yes" />
        {$t.experiment.validate.yes}</label
      >
      <label
        ><input type="radio" bind:group={spanishCovers} value="no" />
        {$t.experiment.validate.no}</label
      >
      <label
        ><input type="radio" bind:group={spanishCovers} value="partially" />
        {$t.experiment.validate.partially}</label
      >
    </div>
  </div>

  <div class="field">
    <span class="question">{$t.experiment.validate.englishCovers}</span>
    <div class="radio-group">
      <label
        ><input type="radio" bind:group={englishCovers} value="yes" />
        {$t.experiment.validate.yes}</label
      >
      <label
        ><input type="radio" bind:group={englishCovers} value="no" />
        {$t.experiment.validate.no}</label
      >
      <label
        ><input type="radio" bind:group={englishCovers} value="partially" />
        {$t.experiment.validate.partially}</label
      >
    </div>
  </div>

  <div class="field">
    <span class="question">{$t.experiment.validate.usability}</span>
    <div class="range-row">
      <input type="range" min="1" max="5" bind:value={usability} />
      <span class="range-val">{usability}</span>
    </div>
  </div>

  <div class="field">
    <span class="question">{$t.experiment.validate.wouldUse}</span>
    <div class="radio-group">
      <label
        ><input type="radio" bind:group={wouldUse} value="yes" />
        {$t.experiment.validate.yes}</label
      >
      <label
        ><input type="radio" bind:group={wouldUse} value="no" /> {$t.experiment.validate.no}</label
      >
      <label
        ><input type="radio" bind:group={wouldUse} value="maybe" />
        {$t.experiment.validate.maybe}</label
      >
    </div>
  </div>

  <div class="field">
    <span class="question">{$t.experiment.validate.comment}</span>
    <textarea bind:value={comment} rows="3" maxlength="2000"></textarea>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <button type="submit" disabled={saving}>
    {saving ? $t.common.loading : $t.experiment.validate.save}
  </button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem;
    background: var(--bg-raised);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .question {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    font-style: italic;
    color: var(--text-primary);
    font-weight: 300;
  }

  .radio-group {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .radio-group label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-transform: none;
    letter-spacing: normal;
    font-family: var(--font-mono);
    transition: color 0.15s;
  }
  .radio-group label:hover {
    color: var(--text-primary);
  }

  .range-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .range-row input {
    flex: 1;
  }
  .range-val {
    font-size: 0.85rem;
    color: var(--cyan);
    min-width: 1.2rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  textarea {
    background: var(--bg-deep);
    border-color: var(--border-dim);
    color: var(--text-primary);
    font-family: var(--font-serif);
    font-size: 0.9rem;
    min-height: 80px;
  }

  button {
    align-self: flex-start;
    padding: 0.45rem 1.5rem;
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  button:hover {
    background: var(--cyan-glow);
    box-shadow: var(--glow-sm);
  }
  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .error {
    color: var(--status-failed);
    font-size: 0.8rem;
  }
</style>
