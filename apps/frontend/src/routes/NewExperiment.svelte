<script lang="ts">
  import { onMount } from 'svelte';
  import { t, currentLang } from '../lib/i18n/index.js';
  import { api } from '../lib/api.js';
  import { providers, loadProviders } from '../lib/stores/providers.js';
  import ProviderSelector from '../lib/components/ProviderSelector.svelte';
  import { DEFAULT_DOMAINS } from '../lib/domains.js';
  import type { Language } from '@velanza/shared';

  interface Props {
    onNavigate: (route: string, params?: Record<string, string>) => void;
  }
  let { onNavigate }: Props = $props();

  let selectedDomains = $state<string[]>([
    'social_awkwardness',
    'temporal_perception',
    'identity_transition',
  ]);
  let runsPerDomain = $state(2);
  let language = $state<Language>($currentLang as Language);

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

  function toggleDomain(id: string) {
    if (selectedDomains.includes(id)) {
      if (selectedDomains.length > 1) {
        selectedDomains = selectedDomains.filter((d) => d !== id);
      }
    } else if (selectedDomains.length < 8) {
      selectedDomains = [...selectedDomains, id];
    }
  }

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
        <label class="domain-option" class:selected={selectedDomains.includes(domain.id)}>
          <input
            type="checkbox"
            checked={selectedDomains.includes(domain.id)}
            onchange={() => toggleDomain(domain.id)}
          />
          {language === 'es' ? domain.label.es : domain.label.en}
        </label>
      {/each}
    </div>
  </section>

  <section>
    <h3>{$t.experiment.new.runsPerDomain}</h3>
    <input type="number" min="1" max="10" bind:value={runsPerDomain} />
    <span class="total">({totalRuns} total runs)</span>
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

  <button onclick={start} disabled={creating || $providers.length === 0}>
    {creating ? $t.common.loading : $t.experiment.new.start}
  </button>
</div>

<style>
  .new-experiment {
    max-width: 700px;
    margin: 0 auto;
  }
  h2 {
    margin-bottom: 1.5rem;
  }
  section {
    margin-bottom: 1.5rem;
  }
  h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .hint {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  .radio-group {
    display: flex;
    gap: 1.5rem;
  }
  .radio-group label {
    cursor: pointer;
  }
  .domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.5rem;
  }
  .domain-option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .domain-option.selected {
    border-color: #1976d2;
    background: #e3f2fd;
  }
  input[type='number'] {
    width: 80px;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .total {
    font-size: 0.85rem;
    color: #666;
    margin-left: 0.5rem;
  }
  button {
    padding: 0.6rem 2rem;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: #c62828;
  }
  .warning {
    color: #e65100;
    font-size: 0.9rem;
  }
</style>
