# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Velanza — Notas para Claude Code

Antes de cualquier cambio, leer:

- README.md → tono y motivación
- SPEC.md → especificación autoritativa, sigue las fases en orden

Reglas del proyecto:

- No mezclar fases. Completar una antes de pasar a la siguiente.
- Tests pasando antes de cada commit.
- Documentar decisiones no triviales en docs/decisions/.
- Nunca commitear .env ni archivos \*.d

## Commands

```bash
# Install all dependencies (run from root)
bun install

# Run both dev servers concurrently
bun dev

# Backend only (port 3000)
bun run --filter './apps/backend' dev

# Frontend only (port 5173)
bun run --filter './apps/frontend' dev

# All tests
bun test

# Backend tests only (requires at least one API key env var)
ANTHROPIC_API_KEY=sk-ant-... bun test --cwd apps/backend

# Run a single test file
ANTHROPIC_API_KEY=sk-ant-... bun test --cwd apps/backend tests/health.test.ts

# Frontend tests
bun run --filter './apps/frontend' test

# Typecheck
bun run --filter './apps/backend' typecheck
bun run --filter './apps/frontend' typecheck

# Format (prettier)
bun run format

# Generate DB migrations (after schema changes)
bun db:generate

# Run DB migrations
bun db:migrate
```

## Architecture

Bun workspaces monorepo. Three packages talk to each other at build time, not runtime:

```
packages/shared      → TypeScript types + Zod schemas used by both apps
apps/backend         → Hono REST API on port 3000
apps/frontend        → Svelte 5 SPA on port 5173
```

The frontend proxies `/api/*` to the backend (configured in `vite.config.ts`), so in dev there's no CORS issue from the browser's perspective.

### Backend request path

`src/index.ts` mounts Hono routers. Each router lives in `src/routes/`. The env is loaded eagerly at startup via `src/env.ts` (Zod schema — throws if no API key is present). The DB singleton is in `src/db/client.ts` (`getDb()` / `resetDb()`). All tables are defined in `src/db/schema.ts`.

### Data model

Hierarchy: `experiments` → `runs` → `rounds` (raw LLM dialogue). Concepts are extracted from runs and stored in `concepts`. Human validation goes in `ratings` (always `rater_id = 'local-user'`). Stage 3 uses `protocol_generations` instead of runs/rounds.

All timestamps are Unix integers. JSON blobs (config, existence_evidence, dictionary_state) are stored as `text`.

### LLM provider layer (to be built in Phase 1)

Will live in `src/providers/`. The `LLMProvider` interface (defined in `packages/shared/src/types.ts`) is the contract:

- `availableModels()` → string[]
- `complete(model, req)` → `LLMCompletionResponse`

Register providers in `src/providers/registry.ts`. The backend never exposes API keys to the frontend — `GET /api/providers/available` returns only `[{provider, models}]`.

### SSE streaming

Experiment progress streams via Server-Sent Events at `/api/experiments/:id/stream`. Events: `round-started`, `round-completed`, `run-started`, `run-completed`, `concept-stabilized`, `experiment-completed`, `error`.

### i18n

UI strings: `apps/frontend/src/lib/i18n/{es,en}.ts` (typesafe-i18n).  
LLM prompts: `apps/backend/src/prompts/stage{1,2,3}.{es,en}.ts`.  
Prompts are written natively in each language — never translated on-the-fly.

## Language convention (strict)

All code must be in English: variable names, function names, comments, log messages, DB column names, test descriptions, ADRs, endpoint paths. The only exceptions are:

- `apps/backend/src/prompts/` — prompt content in es/en
- `apps/frontend/src/lib/i18n/` — UI strings in es/en
- `README.md` / `README.en.md` — user documentation

If Spanish appears anywhere else in the code, refactor it to English.

## Testing patterns

Backend tests use `bun:test`. To test anything that touches the DB, set `process.env['DB_PATH']` to a temp path **before** importing the module under test (see `tests/health.test.ts`), then call `resetDb()` in `beforeAll`. This is necessary because `getDb()` is a module-level singleton.

Frontend tests use Vitest with jsdom environment (configured in `vite.config.ts` under the `test` key).

E2E tests are gated by `RUN_E2E_TESTS=1` and make real API calls — don't run them in CI without that flag.

## Key constraints

- `better-sqlite3` is **not** supported in Bun. Use `bun:sqlite` (built-in) + `drizzle-orm/bun-sqlite`. See `docs/decisions/003-bun-sqlite.md`.
- Backend listens on `127.0.0.1` only (not `0.0.0.0`). CORS is restricted to `localhost:5173`.
- The logger (`src/lib/logger.ts`) redacts API key patterns before printing. Don't bypass it with `console.log` in backend code.
- Each implementation phase must have passing tests before the next phase starts.
- Architectural decisions go in `docs/decisions/` as numbered ADRs.
