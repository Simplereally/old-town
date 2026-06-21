Based on the attached self-audit, my take is: **the agent did a useful honest implementation pass, but the persistence subsystem is not “done” in the sense you care about.** It is currently a **good scaffold with fake-driven behavioural coverage**, not a production-grade MMO persistence layer. The agent itself admits the biggest gaps: no real Postgres tests, non-atomic economy writes, optional idempotency, default-off leasing, possible duplicate ownership race, unbounded in-flight saves, no batching, and inert `content_version`. 

## Verdict

**Do not accept this as complete.**

Accept it only as **Phase 1: interfaces, wiring, migrations, and basic adapter shape**.

For an OSRS-like game, the unacceptable issues are not cosmetic. They are exactly the failure modes that create dupes, lost items, stale saves, phantom sessions, and “worked in tests but fails in real Postgres” bugs.

The biggest contradiction is:

> “All 8 checklist items are implemented”

versus the later admission that several were only implemented as **surface area**, not as hardened behaviour. The most important example is the economy ledger: there is a ledger, but it is not transactionally coupled to character state. That means the item/economy integrity problem is not actually solved.

---

## Severity ranking

### P0 — must fix before calling persistence real

#### 1. No-save fallback must not exist outside explicit sandbox mode

This is the most dangerous operational bug.

If `PERSISTENCE_DRIVER=postgres` and Postgres is down, missing, misconfigured, or missing `pg`, the server should **hard fail** unless the operator explicitly chose `dev:nosave`.

Correct shape:

```txt
dev:nosave
  allowed to run DisabledPersistenceAdapter
  must print huge visible warning

dev / dev:persist
  should use Postgres by default
  should fail if Postgres unavailable, unless dev explicitly opts out

prod / staging
  must always fail if configured persistence cannot start
```

The agent’s proposed `PERSISTENCE_ALLOW_NOSAVE=true` is good, but I would name it even more explicitly:

```txt
PERSISTENCE_UNSAFE_ALLOW_NOSAVE=true
```

Make the danger impossible to miss.

#### 2. `pg` must be a real dependency

If Postgres is the default persistence driver, then requiring a manual `bun add pg` is wrong.

Fix:

```json
{
  "dependencies": {
    "pg": "...",
    "zod": "...",
    "ws": "..."
  },
  "devDependencies": {
    "@types/pg": "..."
  }
}
```

Lazy import is still fine, but the package must be installed by default.

#### 3. Real Postgres tests are mandatory

The fake SQL client is useful, but dangerous if it is the only coverage. Dispatching on `op:<name>` comments means bad SQL can pass as long as the tag is right.

You need a real Postgres integration suite that runs:

```txt
migrations up
snapshot insert/load/update
optimistic version conflict
idempotency replay
same idempotency key with different payload
session acquisition race
lease expiry/reclaim
migration down/up smoke
```

Fake tests prove your TypeScript flow. Real Postgres tests prove your SQL and constraints.

#### 4. Economy mutations must be atomic

This is the worst game-specific gap.

The current design apparently allows:

```txt
snapshot save succeeds, ledger write fails
ledger write succeeds, snapshot save fails
```

That is how dupes and missing items happen.

The correct primitive is not:

```ts
mutate inventory component
enqueue character save
record item audit separately
```

The correct primitive is:

```ts
await economy.commitItemMutation({
  characterId,
  sessionId,
  expectedVersion,
  before,
  after,
  ledgerEntries,
  idempotencyKey,
});
```

And internally:

```txt
BEGIN
  update character_state where version = expectedVersion
  insert item/economy ledger row(s)
  insert outbox row if needed
COMMIT
```

Bank, trade, death, shop, admin grant, rare drop claim, and player-to-player item transfer must use this path.

#### 5. Idempotency must be required and payload-checked

Optional `idempotencyKey` is not idempotency. It is “dedupe if the caller remembered.”

For dupe-sensitive operations, the type should require it:

```ts
type EconomyMutation = {
  idempotencyKey: IdempotencyKey;
  payloadHash: string;
  ...
};
```

And replay semantics should be:

```txt
same key + same payload
  return previous success / no-op safely

same key + different payload
  throw PersistenceIdempotencyConflictError

missing key on economy mutation
  compile-time impossible, runtime rejected
```

`ON CONFLICT DO NOTHING` alone is too weak because it can silently hide a serious bug.

---

## P1 — needed before scale testing means anything

### 6. Session leasing should default on

Default-off session leasing means normal development does not exercise the real invariant:

```txt
one live owner per character
```

Multi-tab convenience should not weaken the core model. Better options:

```txt
dev creates multiple dev characters
dev uses explicit --allow-duplicate-character-session
dev tab gets separate characterId
```

But the normal path should enforce single ownership.

### 7. Fix the first-login session race

The self-audit says first-login can race because `SELECT ... FOR UPDATE` locks nothing when no row exists. That is a real distributed systems bug.

The acquisition must be a single atomic winner-takes-row operation.

A reasonable shape:

```sql
insert into world_sessions (...)
values (...)
on conflict (character_id) do update
set ...
where world_sessions.lease_expires_at < now()
returning *;
```

Then if `rowCount === 0`, acquisition failed.

Both contenders must not be able to believe they won.

### 8. Bound the save queue

Coalescing pending saves by character is good. Unbounded `inFlight` is not.

For 2,000 players, use:

```txt
maxInFlightSaves
maxSaveQueueAgeTicks
saveLagTicks metric
persistenceDegraded flag
```

If Postgres is slow/down, the system should coalesce and lag, not allocate infinite promises.

### 9. Add concurrency limits before batching

Do not jump straight to clever multi-row batching unless needed.

First:

```txt
max pg pool size explicit
max in-flight saves explicit
stagger periodic saves by character/entity hash
measure queue depth and lag
```

Then decide whether true batch upserts are needed.

---

## P2 — correctness/operations hardening

### 10. Shutdown needs timeout and lease cleanup

Current shape is close but incomplete.

Required:

```txt
stop accepting new sessions/input
stop tick loop
flush persistence with timeout
release active leases
close persistence adapter
close transport/http
exit non-zero if critical flush failed
```

Without a timeout, shutdown can hang forever. Without lease release, players wait for TTL after clean deploys.

### 11. `content_version` must do something

Storing `content_version` without enforcing it is mostly decorative.

On load:

```txt
if save.contentVersion === currentContentVersion
  load

if migratable
  run migration chain, then save upgraded state

if not migratable
  reject with clear error
```

This matters once item IDs, quest vars, region IDs, object definitions, or skill schemas change.

### 12. Add outbox after atomic economy commits

Outbox is not the first fix, but it becomes important for:

```txt
rare drop broadcasts
analytics
moderation events
GE/order updates
cross-world messages
high-score updates
```

Do not let external effects happen “near” a DB transaction but not inside a recoverable flow.

---

## What I would tell the agent now

I would not let it randomly fix everything. Give it a strict next phase.

**Phase 2 should be:**

```txt
1. Make no-save fallback explicitly unsafe and opt-in only.
2. Add pg as a real dependency.
3. Add real Postgres integration tests.
4. Implement atomic EconomyStore commit path.
5. Make idempotency required for economy mutations.
6. Detect same idempotency key with different payload.
7. Turn session leasing on by default.
8. Fix first-login lease acquisition race.
9. Add maxInFlight save limiter.
```

Everything else can wait.

---

## Acceptance criteria I’d require

The agent should not report “done” unless all of this is true:

```txt
bun install
bun run db:up
bun run db:migrate
bun run test:postgres
bun run dev:persist
```

And the tests prove:

```txt
two adapters cannot stale-save the same character
two worlds cannot acquire the same character
same idempotency key + same payload is safe
same idempotency key + different payload throws
bank mutation updates snapshot + ledger atomically
trade mutation updates both players atomically
Postgres unavailable causes dev:persist/prod startup failure
dev:nosave is the only no-save path
save queue does not grow unbounded when DB is slow
```

## My expert read

The agent’s answer is actually encouraging because it did not bullshit you. It exposed the right gaps. But architecturally, the implementation is still sitting at:

```txt
Persistence scaffold: good
Adapter shape: promising
Test quantity: high but fake-heavy
Production DB confidence: low
Economy integrity: not solved
Session ownership: not solved
Scale behaviour: unproven
```

The **single most important correction** is to stop thinking of this as “character save + audit log.” For an MMO, the primitive must be:

```txt
atomic game transaction
```

A character snapshot is just a cacheable representation of durable state. The economy transaction is the thing that must be sacred.
