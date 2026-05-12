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
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-void);
  }

  nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.5rem;
    height: 52px;
    background: var(--bg-deep);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand {
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: none;
    border: none;
    color: var(--cyan);
    cursor: pointer;
    padding: 0;
    margin-right: 1.5rem;
    text-shadow: var(--glow-sm);
    transition: text-shadow 0.2s;
  }
  .nav-brand:hover {
    text-shadow: var(--glow-cyan);
  }

  .nav-links {
    display: flex;
    gap: 0.1rem;
    flex: 1;
  }

  .nav-links button {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.35rem 0.75rem;
    border-radius: 2px;
    transition: color 0.15s;
  }
  .nav-links button:hover {
    color: var(--text-primary);
    background: var(--cyan-trace);
  }

  .lang-toggle {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    font-weight: 700;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem 0.6rem;
    border-radius: 2px;
    transition: all 0.15s;
  }
  .lang-toggle:hover {
    border-color: var(--cyan-dim);
    color: var(--cyan);
  }

  main {
    flex: 1;
    padding: 2rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }
</style>
