# E17-S01 — Add Resource Node Placement to Region Map

## Epic

E17 — Map Environment Schema Gaps

## Dependency chain

- Depends on: E15-S05
- Blocks: E17-S02, E17-S03

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- docs/content/map-regions.md

## Objective

Add `resourceNodeSpawns` to the `regionMapDefSchema` in `packages/shared/src/content-schemas/region-map.ts`, define the `resourceNodeSpawnSchema`, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for `resourceNodeSpawnSchema` validation in `packages/shared/src/content-schemas/__tests__/region-map.test.ts`.
- [X] Define `resourceNodeSpawnSchema` with fields: `resourceNodeId` (reference), `tileX` (integer), `tileY` (integer), `plane` (integer, default `0`), `respawnTicks` (integer, default `100`), `initialDepletion` (boolean, default `false`).
- [X] Add `resourceNodeSpawns` array field to `regionMapDefSchema`.
- [X] Update `regionMapDefSchema` tests to include resource node spawn validation.
- [X] Add cross-reference validation in `content-references.ts` for `resourceNodeId` references.
- [X] Write a passing test for `resourceNodeSpawnSchema` roundtrip validation.
- [X] Write a passing test for `resourceNodeSpawnSchema` default values.
- [X] Write a passing test for `resourceNodeSpawnSchema` cross-reference validation.

## Acceptance criteria

- [X] `resourceNodeSpawnSchema` exists and is exported.
- [X] `regionMapDefSchema` includes `resourceNodeSpawns` array.
- [X] Default values are correctly applied when fields are omitted.
- [X] Cross-reference validation fails for invalid `resourceNodeId` references.
- [X] All existing region map tests still pass.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E17/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
