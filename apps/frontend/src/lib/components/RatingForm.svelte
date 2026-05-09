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
    <label>{$t.experiment.validate.recognized}</label>
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
    <label>{$t.experiment.validate.spanishCovers}</label>
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
    <label>{$t.experiment.validate.englishCovers}</label>
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
    <label>{$t.experiment.validate.usability} (1–5)</label>
    <input type="range" min="1" max="5" bind:value={usability} />
    <span>{usability}</span>
  </div>

  <div class="field">
    <label>{$t.experiment.validate.wouldUse}</label>
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
    <label>{$t.experiment.validate.comment}</label>
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
    gap: 1rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  label {
    font-weight: 500;
    font-size: 0.9rem;
  }
  .radio-group {
    display: flex;
    gap: 1rem;
  }
  .radio-group label {
    font-weight: normal;
    cursor: pointer;
  }
  textarea {
    resize: vertical;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    align-self: flex-start;
    padding: 0.5rem 1.5rem;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: #c62828;
    font-size: 0.9rem;
  }
</style>
