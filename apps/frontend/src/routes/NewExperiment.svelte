<script lang="ts">
  import { onMount } from 'svelte';
  import { t, currentLang } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import { providers, loadProviders } from '../lib/stores/providers.js';
  import ProviderSelector from '../lib/components/ProviderSelector.svelte';
  import { DEFAULT_DOMAINS } from '../lib/domains.js';
  import type { Language, CustomDomain, DomainEntry } from '@velanza/shared';

  interface Props {
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { onNavigate }: Props = $props();

  let selectedDomains = $state<DomainEntry[]>([
    'social_awkwardness',
    'temporal_perception',
    'identity_transition',
  ]);
  let runsPerDomain = $state(2);
  let language = $state<Language>($currentLang as Language);

  // Custom domain form state
  let showCustomForm = $state(false);
  let customLabel = $state('');
  let customSeed = $state('');

  let explorerProvider = $state('anthropic');
  let explorerModel = $state('');
  let explorerTemp = $state(1.0);

  let criticProvider = $state('anthropic');
  let criticModel = $state('');
  let criticTemp = $state(0.5);

  let verifierProvider = $state('anthropic');
  let verifierModel = $state('');
  let verifierTemp = $state(0.2);

  let creating = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadProviders();
    const first = $providers[0];
    if (first) {
      explorerProvider = first.provider;
      explorerModel = first.models[0] ?? '';
      criticProvider = first.provider;
      criticModel = first.models[0] ?? '';
      verifierProvider = first.provider;
      verifierModel = first.models[0] ?? '';
    }
  });

  function isPresetSelected(id: string): boolean {
    return selectedDomains.some((d) => d === id);
  }

  function toggleDomain(id: string) {
    if (isPresetSelected(id)) {
      if (selectedDomains.length > 1) {
        selectedDomains = selectedDomains.filter((d) => d !== id);
      }
    } else if (selectedDomains.length < 8) {
      selectedDomains = [...selectedDomains, id];
    }
  }

  function addCustomDomain() {
    if (!customLabel.trim() || !customSeed.trim()) return;
    if (selectedDomains.length >= 8) return;
    const custom: CustomDomain = { label: customLabel.trim(), seed: customSeed.trim() };
    selectedDomains = [...selectedDomains, custom];
    customLabel = '';
    customSeed = '';
    showCustomForm = false;
  }

  function removeCustomDomain(idx: number) {
    if (selectedDomains.length > 1) {
      selectedDomains = selectedDomains.filter((_, i) => i !== idx);
    }
  }

  const customDomains = $derived(
    selectedDomains.map((d, i) => ({ d, i })).filter(({ d }) => typeof d !== 'string') as {
      d: CustomDomain;
      i: number;
    }[]
  );

  const totalRuns = $derived(selectedDomains.length * runsPerDomain);

  async function start() {
    creating = true;
    error = null;
    try {
      const result = await api.experiments.create({
        stage: 'v1',
        config: {
          domains: selectedDomains,
          runsPerDomain,
          language,
          explorer: {
            provider: explorerProvider as any,
            model: explorerModel,
            temperature: explorerTemp,
          },
          critic: { provider: criticProvider as any, model: criticModel, temperature: criticTemp },
          verifier: {
            provider: verifierProvider as any,
            model: verifierModel,
            temperature: verifierTemp,
          },
        },
      });
      onNavigate('run', { id: result.id });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create experiment';
      creating = false;
    }
  }
</script>

<div class="new-experiment">
  <h2>{$t.experiment.new.title}</h2>

  <section>
    <h3>{$t.experiment.new.language}</h3>
    <div class="radio-group">
      <label><input type="radio" bind:group={language} value="es" /> Español</label>
      <label><input type="radio" bind:group={language} value="en" /> English</label>
    </div>
  </section>

  <section>
    <h3>{$t.experiment.new.domains}</h3>
    <p class="hint">{$t.experiment.new.domainsHint}</p>
    <div class="domain-grid">
      {#each DEFAULT_DOMAINS as domain}
        <label class="domain-option" class:selected={isPresetSelected(domain.id)}>
          <input
            type="checkbox"
            checked={isPresetSelected(domain.id)}
            onchange={() => toggleDomain(domain.id)}
          />
          {language === 'es' ? domain.label.es : domain.label.en}
        </label>
      {/each}
    </div>

    {#if customDomains.length > 0}
      <div class="custom-list">
        {#each customDomains as { d, i }}
          <div class="custom-chip">
            <span class="custom-chip-label">✦ {d.label}</span>
            <button class="custom-remove" onclick={() => removeCustomDomain(i)} title="Eliminar"
              >×</button
            >
          </div>
        {/each}
      </div>
    {/if}

    {#if showCustomForm}
      <div class="custom-form">
        <input
          class="custom-input"
          type="text"
          placeholder={language === 'es' ? 'Nombre del dominio' : 'Domain name'}
          bind:value={customLabel}
          maxlength="100"
        />
        <textarea
          class="custom-textarea"
          placeholder={language === 'es'
            ? 'Descripción del espacio experiencial que explorará el modelo (seed)'
            : 'Description of the experiential space the model will explore (seed)'}
          bind:value={customSeed}
          rows="3"
          maxlength="1000"
        ></textarea>
        <div class="custom-form-actions">
          <button
            class="custom-add-btn"
            onclick={addCustomDomain}
            disabled={!customLabel.trim() || !customSeed.trim() || selectedDomains.length >= 8}
          >
            {language === 'es' ? 'Agregar' : 'Add'}
          </button>
          <button
            class="custom-cancel-btn"
            onclick={() => {
              showCustomForm = false;
              customLabel = '';
              customSeed = '';
            }}
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      </div>
    {:else if selectedDomains.length < 8}
      <button class="add-custom-btn" onclick={() => (showCustomForm = true)}>
        + {language === 'es' ? 'Agregar dominio propio' : 'Add custom domain'}
      </button>
    {/if}
  </section>

  <section>
    <h3>{$t.experiment.new.runsPerDomain}</h3>
    <div class="runs-row">
      <input type="number" min="1" max="10" bind:value={runsPerDomain} />
      <span class="total">({totalRuns} total runs)</span>
    </div>
  </section>

  <section>
    <h3>{$t.experiment.new.agents}</h3>
    {#if $providers.length === 0}
      <p class="warning">{$t.providers.noProviders}</p>
    {:else}
      <ProviderSelector
        bind:selectedProvider={explorerProvider}
        bind:selectedModel={explorerModel}
        bind:temperature={explorerTemp}
        label={$t.experiment.new.explorer}
      />
      <ProviderSelector
        bind:selectedProvider={criticProvider}
        bind:selectedModel={criticModel}
        bind:temperature={criticTemp}
        label={$t.experiment.new.critic}
      />
      <ProviderSelector
        bind:selectedProvider={verifierProvider}
        bind:selectedModel={verifierModel}
        bind:temperature={verifierTemp}
        label={$t.experiment.new.verifier}
      />
    {/if}
  </section>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <button class="launch-btn" onclick={start} disabled={creating || $providers.length === 0}>
    {creating ? $t.common.loading : $t.experiment.new.start}
  </button>
</div>

<style>
  .new-experiment {
    max-width: 680px;
    margin: 0 auto;
  }

  h2 {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 2rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border-dim);
  }

  section {
    margin-bottom: 2rem;
  }

  h3 {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin: 0 0 0.75rem;
  }

  .hint {
    font-size: 0.78rem;
    color: var(--text-dim);
    margin-bottom: 0.65rem;
    font-style: italic;
    font-family: var(--font-serif);
  }

  .radio-group {
    display: flex;
    gap: 1.5rem;
  }
  .radio-group label {
    font-size: 0.8rem;
    text-transform: none;
    color: var(--text-secondary);
    cursor: pointer;
    letter-spacing: normal;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .radio-group label:hover {
    color: var(--text-primary);
  }

  .domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 0.4rem;
  }
  .domain-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-secondary);
    transition: all 0.15s;
    text-transform: none;
    letter-spacing: normal;
  }
  .domain-option:hover {
    border-color: var(--border);
    color: var(--text-primary);
  }
  .domain-option.selected {
    border-color: rgba(0, 229, 204, 0.4);
    color: var(--cyan);
    background: var(--cyan-trace);
  }

  .custom-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.5rem;
  }

  .custom-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.55rem 0.3rem 0.65rem;
    background: rgba(0, 229, 204, 0.06);
    border: 1px solid rgba(0, 229, 204, 0.3);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--cyan);
  }

  .custom-chip-label {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .custom-remove {
    background: none;
    border: none;
    color: var(--cyan);
    opacity: 0.5;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.1s;
  }
  .custom-remove:hover {
    opacity: 1;
  }

  .add-custom-btn {
    margin-top: 0.55rem;
    background: transparent;
    border: 1px dashed var(--border);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
    display: block;
  }
  .add-custom-btn:hover {
    border-color: var(--cyan-dim);
    color: var(--cyan);
  }

  .custom-form {
    margin-top: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.85rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
  }

  .custom-input,
  .custom-textarea {
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 0.45rem 0.65rem;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    transition: border-color 0.15s;
  }
  .custom-input:focus,
  .custom-textarea:focus {
    outline: none;
    border-color: rgba(0, 229, 204, 0.4);
  }
  .custom-textarea {
    font-family: var(--font-serif);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .custom-form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .custom-add-btn {
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.3rem 1rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .custom-add-btn:hover:not(:disabled) {
    background: var(--cyan-glow);
  }
  .custom-add-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .custom-cancel-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.3rem 1rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .custom-cancel-btn:hover {
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .runs-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  input[type='number'] {
    width: 72px;
  }
  .total {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .agent-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .launch-btn {
    margin-top: 0.5rem;
    padding: 0.6rem 2.5rem;
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .launch-btn:hover {
    background: var(--cyan-glow);
    box-shadow: var(--glow-sm);
  }
  .launch-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .error {
    color: var(--status-failed);
    font-size: 0.8rem;
  }
  .warning {
    color: var(--status-pending);
    font-size: 0.8rem;
    font-style: italic;
    font-family: var(--font-serif);
  }
</style>
