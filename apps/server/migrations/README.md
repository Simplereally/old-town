# Old Town Server Migrations

These SQL files define the PostgreSQL persistence schema for `POC_SPEC.md` section 20.
They are prepared now so the future PostgreSQL adapter can map to stable tables without changing
simulation systems.

Local POC runs do not require PostgreSQL. The server still uses the disabled adapter by default:

```sh
PERSISTENCE_ENABLED=false
```

For local JSON persistence, keep using the dev adapter:

```sh
PERSISTENCE_ENABLED=true
PERSISTENCE_FILE=.old-town/dev-persistence.json
```

When a PostgreSQL adapter is added, run the migrations against a database with `psql` or the chosen
migration runner:

```sh
psql "$DATABASE_URL" -f apps/server/migrations/0001_persistence_schema.up.sql
```

Rollback for local development databases:

```sh
psql "$DATABASE_URL" -f apps/server/migrations/0001_persistence_schema.down.sql
```

The `pgcrypto` extension is required for `gen_random_uuid()`. The up migration creates it if the
database role has permission.
