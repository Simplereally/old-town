# E62-S03 — Adapter integration: migrate-on-load with atomic write-back

## Epic

E62 — Save and Content Safety

## Dependency chain

- Depends on: E62-S02
- Blocks: E62-S04

## Objective

Wire the chain + lifecycle into the real load path for all adapter kinds, with a write-back
that can crash at any point without losing the old save.

## Implementation guidance

- **Hook point**: find the single place snapshots are parsed after adapter fetch (likely in
  `character-state.ts` or the adapter shared code — there should be exactly one; if parsing
  is scattered per adapter, consolidating it is IN scope and the main value of this story).
  Order: raw JSON → `migrateSnapshot` → schema parse → hydration (with S02 resolution).
- **Write-back**: after a load that migrated (version changed) or quarantined/resolved
  anything, mark the character dirty through the NORMAL save-queue path
  (`createPersistenceDirtyObserver` precedent — do not add a special-cased immediate write;
  the queue's existing atomicity guarantees are the crash-safety story; verify the postgres
  adapter writes snapshots transactionally and the file adapter writes temp+rename — read
  both, fix the file adapter if it doesn't).
- **Adapter matrix**: memory, file, postgres (+ whatever the fourth kind is — `factory.ts`
  enumerates; test each). Postgres: the stored version column (if one exists — check the
  schema in `apps/server/src/persistence/postgres/`) must not also enforce the literal.
- **Failure containment**: a snapshot that fails EVEN after migration+quarantine (corrupt
  JSON, structural damage) must fail that character's load with a typed error and a clear log
  — and must not take the server down or the session slot with it (read how bootstrap errors
  propagate in `dev-session.ts` connect flow; the client should see a clean rejection).

## Required work

- [ ] Consolidated parse point + pipeline order + dirty-marking write-back.
- [ ] File-adapter atomicity verification/fix; postgres transactional write verification.
- [ ] Per-adapter integration tests: v1 fixture in each store loads on a synthetic-v2 build,
      migrates, write-back lands as v2, second load takes the fast path (no migration).
- [ ] Crash-window test: kill between migrate and flush (rig the queue) → reload still finds
      loadable v1.
- [ ] Corrupt-snapshot test: connect fails cleanly, server lives.

## Acceptance criteria

- [ ] All adapters migrate-on-load; the second-load fast path is measurably free (no
      migration invoked — assert via spy).
- [ ] No new save path exists (review criterion: write-back rides the queue).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
