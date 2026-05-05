# ADR 002 — SQLite + Drizzle ORM

## Status

Accepted (Decision D2 from SPEC)

## Context

Velanza is a local single-user application. It needs persistence for experiments, runs, rounds, concepts, and ratings. Cloud databases would add unnecessary complexity and cost.

## Decision

SQLite via `better-sqlite3` with Drizzle ORM for type-safe queries. Database file stored at `~/.velanza/data.db` (configurable via `DB_PATH`).

## Consequences

- Zero network overhead; all queries are local filesystem I/O.
- File permissions set to `0600` to restrict access.
- WAL mode enabled for better concurrent read performance.
- Drizzle provides type-safe query builder without code generation overhead.
- Migrations managed via `drizzle-kit generate` + custom migrate script.
- No encryption at rest — documented as known risk in README.
