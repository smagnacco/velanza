# ADR 003 — bun:sqlite instead of better-sqlite3

## Status

Accepted

## Context

The SPEC listed `better-sqlite3` as the SQLite driver. During Phase 0 setup we discovered that `better-sqlite3` is a native Node.js addon and is explicitly not supported in Bun (tracked in oven-sh/bun#4290).

## Decision

Use `bun:sqlite` (Bun's built-in SQLite driver) with `drizzle-orm/bun-sqlite` adapter instead of `better-sqlite3` + `drizzle-orm/better-sqlite3`. The API surface is nearly identical: `Database` constructor, `db.run()`, WAL mode via `PRAGMA`.

## Consequences

- No extra dependency needed — `bun:sqlite` is part of the Bun runtime.
- Drizzle ORM supports `bun-sqlite` as a first-class dialect.
- `drizzle-kit generate` still works with `dialect: 'sqlite'`.
- The `@types/better-sqlite3` dev dependency is removed.
- Migration script uses `drizzle-orm/bun-sqlite/migrator`.
