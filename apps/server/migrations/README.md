# Old Town Server Migrations

These SQL files define the PostgreSQL persistence schema (POC_SPEC.md §20 plus the persistence
subsystem). Postgres is the default development persistence driver.

## Files

- `0001_persistence_schema.{up,down}.sql` — accounts, characters, normalized character tables, the
  world ground-item table, and the `audit_item_transactions` ledger.
- `0002_persistence_subsystem.{up,down}.sql` — the versioned `character_state` snapshot table
  (optimistic `version` + `content_version`), the `world_sessions` lease table (one live owner per
  character), and idempotency-key hardening on the item ledger.

## Local setup

```sh
bun run db:up        # start PostgreSQL 18 via docker compose
bun add pg --cwd apps/server   # one-time: install the driver used by the runner + adapter
bun run db:migrate   # apply all pending migrations
bun run dev          # client + server (server uses the postgres driver by default)
```

Roll back the most recent migration with `bun run db:rollback` (add `down all` to revert
everything: `bun scripts/db-migrate.ts down all`).

The runner tracks applied versions in `schema_migrations`, so `db:migrate` is safe to re-run. The
migrations themselves use `IF NOT EXISTS`, so applying them directly with `psql` also works:

```sh
psql "$DATABASE_URL" -f apps/server/migrations/0001_persistence_schema.up.sql
psql "$DATABASE_URL" -f apps/server/migrations/0002_persistence_subsystem.up.sql
```

## Running without a database

The server boots even when Postgres is unreachable: it logs a single warning and falls back to the
no-save (`disabled`) adapter. Use `bun run dev:nosave` to opt into that explicitly, or set
`PERSISTENCE_DRIVER=memory` for an ephemeral in-process store. The `pgcrypto` extension is required
for `gen_random_uuid()`; the up migration creates it when the role has permission.
