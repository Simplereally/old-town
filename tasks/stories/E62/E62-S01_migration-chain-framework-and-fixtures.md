# E62-S01 — Migration chain framework and the version-fixture corpus

## Epic

E62 — Save and Content Safety

## Dependency chain

- Depends on: none
- Blocks: E62-S02

## Objective

The chain itself: registered pure hops, a runner, and the frozen fixture corpus that makes
every future migration provably correct.

## Implementation guidance

- **Module**: `packages/shared/src/persistence/snapshot-migrations.ts` (shared, not server —
  tools/tests outside the server will want it; it must not import server code).
  `registerMigration(from, to, fn)` with `to === from + 1` enforced;
  `migrateSnapshot(raw: unknown): CharacterSnapshot` — reads `raw.version` (tolerate only
  integers within known range; anything else → typed `SnapshotMigrationError`), applies hops
  in sequence, then parses with the CURRENT zod schema as the final gate (the schema stays
  the single validator; migrations only reshape).
- **Loosen the load path, not the schema**: `characterSnapshotSchema` keeps its
  `z.literal(CURRENT)` — migration runs BEFORE schema parse. Old versions are validated
  structurally only as much as each hop needs (each hop defensively checks what it touches).
- **Fixture corpus**: `packages/shared/src/persistence/__fixtures__/snapshots/v1.json` —
  capture a REAL, maximal v1 snapshot now (every optional field populated: inventory with
  stacks, bank, equipment, skills with xp, quest varbits — generate from a played dev session,
  then commit frozen). Rule documented in the module docstring: every version bump commits a
  fixture of the OUTGOING version before the bump.
- **Chain test**: replay every fixture through `migrateSnapshot`, assert current-schema parse
  succeeds and spot-check semantic preservation (xp totals, item counts survive). Property:
  migrating an already-current snapshot is identity.
- **Retroactive hop**: there is only v1 today, so ship the framework with a synthetic v1→v2
  test-only hop to prove the machinery, and the REAL first hop lands with whichever epic bumps
  first (E57/E58/E59 each reference this) — the framework must make that a 10-line diff.

## Required work

- [ ] Framework + error types + runner + identity property + docstring rules.
- [ ] v1 fixture (maximal, real) + chain test + synthetic-hop test proving multi-hop.
- [ ] `docs/engine/save-migrations.md`: how to add a hop (the playbook S04's CI check
      enforces), fixture rule, what belongs in a migration vs the content lifecycle.

## Acceptance criteria

- [ ] Adding a hypothetical field via the synthetic hop: fixture→current works; skipping the
      hop registration fails the chain test loudly.
- [ ] Framework has zero server imports (review criterion).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
