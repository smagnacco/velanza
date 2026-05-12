<script lang="ts">
  import { providers } from '../stores/providers.js';
  import type { AvailableProvider } from '@velanza/shared';

  interface Props {
    selectedProvider: string;
    selectedModel: string;
    temperature: number;
    onchange?: (provider: string, model: string, temperature: number) => void;
    label: string;
  }

  let {
    selectedProvider = $bindable(),
    selectedModel = $bindable(),
    temperature = $bindable(),
    label,
    onchange,
  }: Props = $props();

  const availableModels = $derived(
    $providers.find((p) => p.provider === selectedProvider)?.models ?? []
  );

  function handleProviderChange(e: Event) {
    const newProvider = (e.target as HTMLSelectElement).value;
    selectedProvider = newProvider;
    const providerData = $providers.find((p) => p.provider === newProvider);
    selectedModel = providerData?.models[0] ?? '';
    onchange?.(selectedProvider, selectedModel, temperature);
  }

  function handleModelChange(e: Event) {
    selectedModel = (e.target as HTMLSelectElement).value;
    onchange?.(selectedProvider, selectedModel, temperature);
  }

  function handleTempChange(e: Event) {
    temperature = parseFloat((e.target as HTMLInputElement).value);
    onchange?.(selectedProvider, selectedModel, temperature);
  }
</script>

<fieldset>
  <legend>{label}</legend>
  <div class="fields">
    <div class="field">
      <label>Provider</label>
      <select value={selectedProvider} onchange={handleProviderChange}>
        {#each $providers as p}
          <option value={p.provider}>{p.provider}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label>Model</label>
      <select value={selectedModel} onchange={handleModelChange}>
        {#each availableModels as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label>Temperature</label>
      <div class="temp-row">
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          oninput={handleTempChange}
          style="flex:1; min-width:80px;"
        />
        <span class="temp-value">{temperature.toFixed(1)}</span>
      </div>
    </div>
  </div>
</fieldset>

<style>
  fieldset {
    background: var(--bg-raised);
    border: 1px solid var(--border-dim);
    border-radius: 2px;
    padding: 0.75rem 1rem;
  }
  legend {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    padding: 0 0.4rem;
  }
  .fields {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 140px;
  }
  .temp-value {
    font-size: 0.75rem;
    color: var(--cyan);
    min-width: 2rem;
    font-variant-numeric: tabular-nums;
  }
  .temp-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
