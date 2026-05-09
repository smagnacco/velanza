<script lang="ts">
  import { t, currentLang } from './lib/i18n/index.js';
  import Dashboard from './routes/Dashboard.svelte';
  import NewExperiment from './routes/NewExperiment.svelte';
  import RunExperiment from './routes/RunExperiment.svelte';
  import ValidateConcepts from './routes/ValidateConcepts.svelte';
  import AnalyzeExperiment from './routes/AnalyzeExperiment.svelte';

  type Route =
    | { name: 'dashboard' }
    | { name: 'new-experiment' }
    | { name: 'run'; id: string }
    | { name: 'validate'; id: string }
    | { name: 'analyze'; id: string };

  let route = $state<Route>({ name: 'dashboard' });

  function navigate(name: string, params?: Record<string, string>) {
    if (name === 'dashboard') route = { name: 'dashboard' };
    else if (name === 'new-experiment') route = { name: 'new-experiment' };
    else if (name === 'run' && params?.id) route = { name: 'run', id: params.id };
    else if (name === 'validate' && params?.id) route = { name: 'validate', id: params.id };
    else if (name === 'analyze' && params?.id) route = { name: 'analyze', id: params.id };
    else route = { name: 'dashboard' };
  }

  function toggleLang() {
    currentLang.update((l) => (l === 'es' ? 'en' : 'es'));
  }
</script>

<div class="app">
  <nav>
    <button class="nav-brand" onclick={() => navigate('dashboard')}>{$t.app.title}</button>
    <div class="nav-links">
      <button onclick={() => navigate('dashboard')}>{$t.app.nav.dashboard}</button>
      <button onclick={() => navigate('new-experiment')}>{$t.app.nav.newExperiment}</button>
    </div>
    <button class="lang-toggle" onclick={toggleLang}>
      {$currentLang === 'es' ? 'EN' : 'ES'}
    </button>
  </nav>

  <main>
    {#if route.name === 'dashboard'}
      <Dashboard onNavigate={navigate} />
    {:else if route.name === 'new-experiment'}
      <NewExperiment onNavigate={navigate} />
    {:else if route.name === 'run'}
      <RunExperiment experimentId={route.id} onNavigate={navigate} />
    {:else if route.name === 'validate'}
      <ValidateConcepts experimentId={route.id} onNavigate={navigate} />
    {:else if route.name === 'analyze'}
      <AnalyzeExperiment experimentId={route.id} onNavigate={navigate} />
    {/if}
  </main>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    background: #f5f5f5;
    color: #212121;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.5rem;
    height: 56px;
    background: #1565c0;
    color: white;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-brand {
    font-size: 1.2rem;
    font-weight: 700;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    margin-right: 1rem;
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
    flex: 1;
  }

  .nav-links button,
  .lang-toggle {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .nav-links button:hover,
  .lang-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .lang-toggle {
    margin-left: auto;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  main {
    flex: 1;
    padding: 2rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }
</style>
