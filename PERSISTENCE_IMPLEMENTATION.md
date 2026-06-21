I would use **PostgreSQL as the authoritative persistence DB** in 2026.

More specifically: **Postgres 18.x for prod**, with **Valkey only for ephemeral coordination**, and optionally **SQLite/WAL only for single-dev convenience or tooling**, not as the main game DB. PostgreSQL 18 shipped in September 2025 and the 18.x line is active; PostgreSQL 19 is only beta as of June 2026, so I would not build prod on 19 yet. ([PostgreSQL][1])

For an OSRS-like world capped at 2,000 players, the persistence problem is not “can the DB handle every tick?” It is: **how do we avoid ever needing the DB inside the tick loop?**

---

## My architecture call

**Live world truth:** in-memory, server-authoritative ECS/actor state.

**Durable truth:** Postgres.

**Fast/ephemeral coordination:** Valkey, later.

**Local dev default:** Docker Compose Postgres + migrations + seed data.

**Local dev optional:** SQLite adapter for quick offline hacking, but never as the canonical dev path.

**Remove over time:** JSON file persistence as a serious dev mode. Keep it only for tiny smoke tests or “save a local sandbox character” demos.

Postgres fits this shape because you need ACID transactions, relational constraints, row locking, versioning, foreign keys, JSONB escape hatches, and long-term operational confidence. Its own docs define ACID as guaranteeing validity under concurrency and failures, which is exactly what matters for inventory, bank, trade, deaths, quests, and economy state. ([PostgreSQL][2]) Postgres also gives you JSONB for semi-structured character substate while still allowing indexes and relational constraints where integrity matters. ([PostgreSQL][3])

---

## The first-principles model

An OSRS-like server should think in three different kinds of state:

### 1. Hot simulation state

This is the live ECS/actor state:

```ts
position
movement queue
combat target
animation state
npc aggression
current hp/prayer/run energy
temporary effects
pending path
open interface
```

This lives in memory. Do **not** round-trip this to the DB per tick.

### 2. Durable character state

This is recoverable account state:

```ts
tile / region / world
inventory
equipment
bank
skills xp
quest vars
spellbook
unlocked content
settings
respawn point
collection log
cooldowns that survive logout
```

This is saved to Postgres at controlled boundaries.

### 3. Economic/audit state

This is the stuff you should be paranoid about:

```ts
trade completion
bank deposits/withdrawals
item drops picked up
shops
grand-exchange-like orders
deaths
admin grants
dupe-sensitive mutations
currency movement
```

This should be **append-only or transactionally logged**, not merely overwritten as part of a character blob.

That distinction is the whole game.

---

## I would not persist every tick

At 600ms, 2,000 players gives you ~3,333 player-tick participations per second per world. Persisting every entity mutation is self-inflicted pain.

Instead:

```txt
tick loop:
  read inputs
  advance simulation
  produce deterministic state changes
  enqueue durable save intents
  send network snapshots

persistence loop:
  coalesce character saves
  flush outside the tick
  retry safely
  report lag/backpressure
```

The game server must keep ticking even if Postgres has a 200ms hiccup. A delayed save is acceptable. A delayed tick is player-visible.

---

## Save boundaries I would use

I would persist at **semantic safety points**, not arbitrary ECS writes.

Save immediately for:

```txt
logout
world hop
trade accepted
bank mutation
quest completion
level-up
death item resolution
rare drop claim
shop purchase/sale
admin action
currency/item movement between owners
```

Save lazily for:

```txt
position
current hp/prayer/run
skill progress during normal skilling
minor settings
quest var progress
temporary cooldowns
```

Your existing `CharacterSaveQueue` with immediate vs lazy every 10 ticks is directionally good. I would harden it into a first-class persistence subsystem with backpressure, idempotency, version checks, and metrics.

---

## Data shape: blob + relational ledger

Do **not** go fully normalized for every inventory slot, quest var, and skill field from day one. Also do **not** go fully blob-only.

I would use a hybrid:

```sql
accounts
characters
character_state
character_locks
item_definitions_snapshot
character_item_ledger
trade_ledger
bank_audit_log
world_sessions
world_hop_log
save_outbox
content_versions
```

For `character_state`, I would store a compact snapshot:

```sql
character_id uuid primary key
version bigint not null
content_version int not null
world_id int
tile_x int
tile_y int
plane int
skills jsonb not null
inventory jsonb not null
equipment jsonb not null
bank jsonb not null
quest_vars jsonb not null
settings jsonb not null
updated_at timestamptz not null
```

Then for dupe-sensitive operations, I would also write append-only facts:

```sql
character_item_ledger
trade_ledger
death_ledger
bank_audit_log
admin_grant_log
```

The snapshot lets you load a character fast. The ledger lets you investigate, reconcile, and prove that item/currency movement happened exactly once.

Postgres partitioning is useful later for very large logs because declarative partitioning routes rows into child tables by a partition key, with each partition storing a subset of the data. ([PostgreSQL][4]) I would not overbuild partitioning on day one, but I would design audit tables with `created_at` and `world_id` so monthly/time partitioning is easy later.

---

## Core invariant: one live owner per character

You need a hard rule:

```txt
A character can be actively owned by exactly one world process at a time.
```

Use a DB-backed session lease:

```sql
world_sessions
character_id
world_id
session_id
lease_expires_at
last_heartbeat_at
```

On login:

```txt
BEGIN
  lock character row
  check no valid active session
  create new session lease
  load character snapshot
COMMIT
```

On world hop:

```txt
source world freezes character
source world flushes immediate save
DB changes session owner
target world loads from committed snapshot
source world releases ownership
```

On crash:

```txt
lease expires
new login can recover from latest committed snapshot
possibly replay unresolved outbox entries
```

Do not rely on Valkey alone for this. Valkey can help with fast discovery and presence, but the durable ownership truth should be in Postgres.

Valkey is good for ephemeral data and streams, and its docs describe RDB snapshots, AOF logs, and no-persistence modes. ([Valkey][5]) But the same docs warn that replication with persistence disabled can wipe replicas if a primary restarts empty, which is exactly why I would not make it your source of truth for character state. ([Valkey][6])

---

## How I would handle local development

Your current modes:

```txt
Disabled
Memory
JsonFile
future Postgres
```

I would change that to:

```txt
Memory        -> tests only
Postgres      -> default local/dev/prod path
SQLite        -> optional offline/single-dev path
JsonFile      -> deprecated / debug export only
Disabled      -> explicit no-save sandbox
```

The default dev command should start the real shape:

```txt
bun run dev
  starts client
  starts server
  starts postgres via compose if not running
  runs migrations
  seeds dev account/characters/content version
```

I would add:

```txt
bun run db:up
bun run db:down
bun run db:reset
bun run db:migrate
bun run db:seed
bun run db:studio
bun run dev:fresh
bun run dev:persist
bun run dev:nosave
```

For every developer, the happy path should be:

```txt
git clone
bun install
bun run db:up
bun run dev
```

No hand-editing `.env`. No “copy this database from Josh.” No relying on JSON files.

SQLite is still useful for tooling and maybe the world editor. SQLite WAL mode allows readers and a writer to operate concurrently, but it still has a single writer at a time, and WAL-mode databases have caveats around checkpointing, long read transactions, and keeping WAL files with the DB. ([SQLite][7]) That makes it fine for local tools, not ideal as the canonical multiplayer dev/prod persistence path.

---

## What I would change in your current stack

Your stack is already sane. I would not add Colyseus just because the spec mentioned it. Raw `ws` is fine while the protocol is small and you want to learn your own primitives.

The changes I would make:

### 1. Implement the Postgres adapter now

Do not let JSON persistence become the shape your game code grows around.

Add:

```txt
PostgresPersistenceAdapter
PostgresCharacterRepository
PostgresWorldSessionRepository
PostgresItemLedgerRepository
PostgresMigrationRunner
```

### 2. Split “snapshot save” from “economic transaction”

Right now `CharacterSaveQueue` sounds snapshot-oriented. Keep it, but add a separate concept:

```ts
gameTxn.commitItemMutation(...)
gameTxn.commitTrade(...)
gameTxn.commitBankMutation(...)
gameTxn.commitDeathResolution(...)
```

A bank withdrawal should not be “eventually included in the next character snapshot.” It should be a small atomic durable transaction.

### 3. Make persistence tick-aware

The persistence system should know the tick number that produced a save.

```ts
type SaveReason =
  | "login"
  | "logout"
  | "periodic"
  | "world-hop"
  | "bank"
  | "trade"
  | "death"
  | "quest"
  | "admin";

type CharacterSaveIntent = {
  characterId: CharacterId;
  worldId: WorldId;
  sessionId: SessionId;
  tick: number;
  reason: SaveReason;
  priority: "immediate" | "lazy";
  snapshot: CharacterSnapshot;
};
```

This gives you observability: “character X is 42 ticks behind durable state” is a real metric.

### 4. Add optimistic versioning

Every character snapshot should have a version:

```sql
update character_state
set snapshot = $snapshot,
    version = version + 1
where character_id = $id
  and version = $expectedVersion;
```

If that updates zero rows, something is wrong: duplicate session, stale save, crash recovery edge case, or a bug.

### 5. Make content version explicit

Your content pipeline is good. Tie saves to content:

```txt
character_state.content_version
item_ledger.content_version
world_sessions.protocol_version
```

When item IDs, quest vars, map regions, or spell definitions change, you need migration logic. Otherwise old character saves become mystery meat.

### 6. Add an outbox

For any operation that must produce downstream effects:

```txt
trade completed
rare drop broadcast
analytics event
moderation flag
GE order update
```

write the DB mutation and outbox row in the same DB transaction. A worker drains the outbox. This prevents “trade committed but broadcast failed” bugs from becoming unrecoverable ambiguity.

### 7. Keep Valkey optional until needed

Add Valkey when you need:

```txt
world registry
presence
rate limiting
login queue
chat fanout
cross-world messages
high-score cache
server discovery
```

Do not add it for character durability.

Valkey Streams are attractive later because streams act like append-only logs and their consumer-group state is also persisted to AOF/RDB and replicas. ([Valkey][8]) But I would still treat Postgres as the durable game-state source of truth.

---

## Ideal user-land API

The game code should not know SQL exists.

The API I would want systems to see is something like this:

```ts
export interface Persistence {
  characters: CharacterStore;
  sessions: SessionStore;
  economy: EconomyStore;
  outbox: OutboxStore;
}

export interface CharacterStore {
  loadForLogin(input: {
    accountId: AccountId;
    characterId: CharacterId;
    worldId: WorldId;
    sessionId: SessionId;
    now: Instant;
  }): Promise<LoginLoadResult>;

  enqueueSave(intent: CharacterSaveIntent): void;

  flushCharacter(input: {
    characterId: CharacterId;
    reason: SaveReason;
    deadlineMs?: number;
  }): Promise<FlushResult>;

  releaseSession(input: {
    characterId: CharacterId;
    sessionId: SessionId;
    finalSnapshot: CharacterSnapshot;
    reason: "logout" | "world-hop" | "kick" | "shutdown";
  }): Promise<void>;
}
```

For item-sensitive code:

```ts
export interface EconomyStore {
  commitBankMutation(input: {
    characterId: CharacterId;
    sessionId: SessionId;
    tick: number;
    idempotencyKey: string;
    before: InventoryState;
    after: InventoryState;
    audit: BankAuditEntry;
  }): Promise<CommitResult>;

  commitTrade(input: {
    tradeId: TradeId;
    tick: number;
    left: TradeParticipantCommit;
    right: TradeParticipantCommit;
    idempotencyKey: string;
  }): Promise<CommitResult>;

  commitDeathResolution(input: {
    deathId: DeathId;
    tick: number;
    victimId: CharacterId;
    killerId?: CharacterId;
    keptItems: ItemStack[];
    droppedItems: ItemStack[];
    idempotencyKey: string;
  }): Promise<CommitResult>;
}
```

The game-facing code should feel like:

```ts
await game.persistence.economy.commitTrade({
  tradeId,
  tick: world.tick,
  left,
  right,
  idempotencyKey: `trade:${tradeId}:accept:${finalAcceptTick}`,
});
```

Not:

```ts
await db.query("update character_state set ...");
```

The design goal is that gameplay systems speak in **game concepts**, while the persistence adapter enforces DB mechanics.

---

## Write strategy

For each world process:

```txt
1. World owns live state.
2. Mutations mark characters dirty.
3. Dirty saves are coalesced.
4. Immediate saves bypass debounce.
5. Persistence worker flushes batches.
6. Failed lazy saves retry.
7. Failed immediate saves can block logout/world-hop/trade finalization.
8. Metrics expose save lag, queue depth, failure count, oldest dirty tick.
```

The important rule:

```txt
Lazy save failure should not stop the tick.
Immediate economic commit failure should stop that action from completing.
```

So chopping a tree can keep playing during DB lag. Completing a trade cannot.

---

## Suggested Postgres schema strategy

I would use UUIDv7 or monotonic IDs for major entities where useful. PostgreSQL 18 includes `uuidv7()` for timestamp-ordered UUID generation. ([PostgreSQL][1])

A sane first schema:

```sql
accounts (
  id uuid primary key,
  created_at timestamptz not null
);

characters (
  id uuid primary key,
  account_id uuid not null references accounts(id),
  name text not null unique,
  created_at timestamptz not null,
  deleted_at timestamptz
);

character_state (
  character_id uuid primary key references characters(id),
  version bigint not null,
  content_version int not null,
  world_id int,
  tile_x int not null,
  tile_y int not null,
  plane int not null,
  skills jsonb not null,
  inventory jsonb not null,
  equipment jsonb not null,
  bank jsonb not null,
  quest_vars jsonb not null,
  settings jsonb not null,
  updated_at timestamptz not null
);

world_sessions (
  character_id uuid primary key references characters(id),
  world_id int not null,
  session_id uuid not null,
  lease_expires_at timestamptz not null,
  last_heartbeat_at timestamptz not null
);

item_ledger (
  id uuid primary key,
  character_id uuid references characters(id),
  tick bigint not null,
  reason text not null,
  item_id int not null,
  quantity_delta bigint not null,
  idempotency_key text not null unique,
  created_at timestamptz not null
);
```

Later, partition `item_ledger`, `trade_ledger`, chat logs, analytics, and audit logs by time. Do not prematurely partition `character_state`.

---

## What I would not do

I would not use MongoDB as primary persistence for this. The hard problems are relational integrity, item movement, transactions, uniqueness, audit, and operational correctness. Document shape is convenient, but the game’s most dangerous bugs are economic consistency bugs.

I would not use Redis/Valkey as primary persistence. Great cache/coordination layer; wrong source of truth for player wealth.

I would not use SQLite as the shared production DB. Great embedded DB; wrong concurrency and operational shape for many live world processes.

I would not write full ECS snapshots to Postgres every tick.

I would not make the renderer/client persistence-aware.

I would not let content JSON and DB state drift without explicit content versions and migrations.

---

## Recommended target architecture

```txt
Browser client
  |
  | websocket protocol
  v
World process, max 2k players
  - authoritative tick loop
  - ECS/actors
  - collision/maps/content loaded from JSON/build artifacts
  - dirty character tracking
  - immediate economic transactions
  |
  | async saves / atomic commits
  v
PostgreSQL 18.x
  - accounts
  - characters
  - snapshots
  - sessions
  - ledgers
  - audit logs
  - outbox
  |
  | optional
  v
Valkey
  - world registry
  - presence
  - queues
  - pub/sub
  - cache
```

For your repo, the next technical move is very clear:

```txt
[X] - 1. Implement PostgresPersistenceAdapter.
[X] - 2. Make Postgres the default dev persistence.
[X] - 3. Keep Memory for tests.
[X] - 4. Deprecate JsonFile for real development.
[X] - 5. Add session leasing.
[X] - 6. Add character versioning.
[X] - 7. Add item/economy ledger.
[X] - 8. Add persistence metrics.
```

---

## Implementation notes (refactored into the repo's shapes)

Done in this repo's idioms (`PersistenceAdapter`, `CharacterSaveQueue`, `CharacterSnapshot`,
`ItemAuditLog`, normalized migrations, `env.ts`/`factory.ts`/kernel wiring) rather than the doc's
generic `Persistence`/`CharacterStore`/`EconomyStore` sketches.

1. **PostgresPersistenceAdapter** — `apps/server/src/persistence/postgres/`. Port/adapter layering:
   a `SqlClient` port (`sql-client.ts`), a lazy `pg`-backed driver (`pg-sql-client.ts`), pure
   snapshot↔row mapping (`character-state-row.ts`), and the adapter (`postgres-adapter.ts`). It maps
   `CharacterSnapshot` onto the doc's compact `character_state` blob table (lossless, queryable).
2. **Postgres default** — `PERSISTENCE_DRIVER` config (default `postgres`, legacy `PERSISTENCE_ENABLED`
   still honoured), `factory.ts` driver selection, `docker-compose.yml`, `db:up/down/reset/migrate/
   rollback` + `dev:persist/dev:nosave` scripts, `scripts/db-migrate.ts` runner. Boot falls back to
   the no-save adapter (one warning) if the DB is unreachable, so a delayed save never blocks startup.
3. **Memory for tests** — `MemoryPersistenceAdapter` kept and selectable (`driver: "memory"`); the
   integration tests and adapter tests run on it.
4. **JsonFile deprecated** — `@deprecated` on the adapter; the factory logs a deprecation warning
   when it is selected; env/README mark it debug-export only.
5. **Session leasing** — `world_sessions` table + `WorldSessionStore` (Postgres + Memory) enforcing
   one live owner per character; wired into the kernel connect/disconnect path behind
   `PERSISTENCE_SESSION_LEASING` (default off to preserve the single-process POC).
6. **Character versioning** — `character_state.version` with optimistic concurrency in the adapter
   (per-process version cache); a stale save throws `PersistenceVersionConflictError`.
7. **Item/economy ledger** — `idempotencyKey` on the audit contract + a partial-unique index;
   Postgres/Memory/JSON ledgers apply a keyed economic mutation exactly once.
8. **Persistence metrics** — `PersistenceMetrics` (save lag, queue depth, throughput, failures,
   version conflicts, ledger writes) fed by the save queue + item-audit log, surfaced via
   `kernel.persistenceMetrics()`, `/debug/persistence`, and `/debug/stats`.

Validation: `bun run typecheck`, `bun run test` (2157 tests), `bun run lint`, `bun run content:validate`
all pass. Schema in `apps/server/migrations/0002_persistence_subsystem.{up,down}.sql`.

That gives you the right primitive: **a world can crash, restart, and recover without inventing new rules about what “really happened.”**

[1]: https://www.postgresql.org/docs/release/18.0/ "PostgreSQL: Release Notes"
[2]: https://www.postgresql.org/docs/current/glossary.html "PostgreSQL: Documentation: 18: Appendix M. Glossary"
[3]: https://www.postgresql.org/docs/current/datatype-json.html "PostgreSQL: Documentation: 18: 8.14. JSON Types"
[4]: https://www.postgresql.org/docs/current/ddl-partitioning.html "PostgreSQL: Documentation: 18: 5.12. Table Partitioning"
[5]: https://valkey.io/topics/persistence/ "Valkey Documentation · Persistence"
[6]: https://valkey.io/topics/replication/ "Valkey Documentation · Replication"
[7]: https://sqlite.org/wal.html "Write-Ahead Logging"
[8]: https://valkey.io/topics/streams-intro/ "Valkey Documentation · Streams"
