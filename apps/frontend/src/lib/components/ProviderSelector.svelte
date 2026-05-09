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
      <label>Temperature ({temperature.toFixed(1)})</label>
      <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={temperature}
        oninput={handleTempChange}
      />
    </div>
  </div>
</fieldset>

<style>
  fieldset {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 0.75rem 1rem;
  }
  legend {
    font-weight: 600;
    padding: 0 0.25rem;
  }
  .fields {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 140px;
  }
  label {
    font-size: 0.8rem;
    color: #555;
  }
  select {
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>
