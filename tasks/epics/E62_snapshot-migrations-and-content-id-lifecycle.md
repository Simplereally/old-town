# E62 — Save and Content Safety: Snapshot Migrations and Content-ID Lifecycle

## Dependency chain

- Depends on: nothing
- Unlocks: every epic that grows the snapshot (E57 trade components, E58 social edges, E59
  energy — each becomes a one-hop migration instead of a save-wipe); safe content renames/
  removals forever. **Do this BEFORE those epics land their schema changes.**

## Spec references

- `packages/shared/src/persistence/character-snapshot.ts` — `CHARACTER_SNAPSHOT_VERSION = 1`
  (line 18), pinned via `version: z.literal(CHARACTER_SNAPSHOT_VERSION)` (line 114); the test
  suite confirms wrong versions are REJECTED — today a bump bricks every existing save.
- `apps/server/src/persistence/adapter.ts` + `factory.ts` — the adapter interface all four
  adapter kinds implement; load is where migration hooks in.
- `apps/server/src/persistence/character-state.ts` — snapshot ↔ world hydration; where
  unknown content ids would explode on load.
- `content/` + `apps/server/src/content-loader.ts` — registries; the content-fingerprint
  concept E56 introduces is a cousin (replay wants exact match; saves want graceful drift).
- 🔒 Content-driven invariant: content will churn constantly BY DESIGN — the save layer must
  absorb renames and removals as a matter of course, not crisis.

## Epic goal

Two safety rails. (1) A snapshot migration chain: versioned, pure, tested hop functions
(v1→v2→…), applied on load, written back at current version — so schema growth never bricks a
save again. (2) A content-id lifecycle: aliases (renames resolve transparently) and tombstones
(removed content degrades gracefully — items to a documented fallback, not a crash), enforced
by a validator that knows the id-usage corpus.

## Design invariants (bind every story)

- Migrations are pure functions `(vN snapshot JSON) → (vN+1 snapshot JSON)` — no world, no
  registries (content resolution is the lifecycle layer's job, separate concern), no I/O.
- Every historical version keeps a frozen fixture; the chain test replays every fixture to
  current and validates against the current schema. Deleting a migration is forbidden.
- Unknown/removed content ids NEVER crash a load. Alias → resolve silently; tombstone →
  documented fallback (item becomes `coins`-equivalent? held placeholder? — S02 decides the
  policy explicitly per content kind); truly unknown → quarantine + loud log, load proceeds.
- The write-back after migration is atomic-per-character via the existing save path (a crash
  mid-migration-flush must leave the old, still-loadable snapshot).

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E62/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E62-S01` — [Migration chain framework and the version-fixture corpus](../stories/E62/E62-S01_migration-chain-framework-and-fixtures.md)
- [ ] `E62-S02` — [Content-id lifecycle: aliases, tombstones, and load-time resolution](../stories/E62/E62-S02_content-id-lifecycle-aliases-and-tombstones.md)
- [ ] `E62-S03` — [Adapter integration: migrate-on-load with atomic write-back](../stories/E62/E62-S03_adapter-integration-migrate-on-load-atomic-writeback.md)
- [ ] `E62-S04` — [Guard rails: CI enforcement and the schema-change playbook](../stories/E62/E62-S04_ci-enforcement-and-schema-change-playbook.md)

## Epic acceptance criteria

- [ ] A v1 snapshot fixture loads on a server whose current version is v3 (two synthetic hops
      added in tests) and round-trips at v3.
- [ ] Renaming an item id in content + adding an alias: existing saves holding that item load
      with the new id, zero data loss.
- [ ] Removing an item id + adding a tombstone: saves load with the documented fallback and a
      structured log line; no crash, no silent vanish (the player can see what happened).
- [ ] CI fails any PR that changes the snapshot schema without bumping the version and adding
      a migration + fixture; and any content PR that removes/renames an id without an alias or
      tombstone.
