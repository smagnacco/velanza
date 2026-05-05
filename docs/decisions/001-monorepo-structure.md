# ADR 001 — Monorepo structure with Bun workspaces

## Status

Accepted

## Context

Velanza has a frontend (Svelte), a backend (Hono), and shared types/schemas used by both. The project is local-only and single-user. We need to decide how to organize code and manage dependencies.

## Decision

Bun workspaces monorepo with three packages:

- `apps/backend` — Hono REST API + experiment engine
- `apps/frontend` — Svelte 5 SPA
- `packages/shared` — Zod schemas and TypeScript types shared between both apps

## Consequences

- Single `bun install` at root installs everything.
- Shared types are imported as `@velanza/shared` without publishing to npm.
- `bun run --filter` runs scripts per-workspace from root.
- No need for Turborepo or Nx given the small project size.
