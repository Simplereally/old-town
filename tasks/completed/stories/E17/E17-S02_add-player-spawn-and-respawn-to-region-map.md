# E17-S02 — Add Player Spawn and Respawn to Region Map

## Epic

E17 — Map Environment Schema Gaps

## Dependency chain

- Depends on: E17-S01
- Blocks: E17-S03

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- docs/content/map-regions.md

## Objective

Add `playerSpawnPoints` and `deathRespawnPoints` to the `regionMapDefSchema`, define the spawn schemas, and write failing tests first.

## Implementation checklist

- [X] Write a failing test for player spawn and respawn schemas in `packages/shared/src/content-schemas/__tests__/region-map.test.ts`.
- [X] Define `playerSpawnSchema` with fields: `tileX` (integer), `tileY` (integer), `plane` (integer, default `0`), `spawnType` (enum: `new_player`, `returning_player`, `default`), `requiresQuest` (questId, optional).
- [X] Define `deathRespawnSchema` with fields: `tileX` (integer), `tileY` (integer), `plane` (integer, default `0`), `respawnType` (enum: `nearest`, `fixed`, `home`), `requiresQuest` (questId, optional), `priority` (integer, default `0`).
- [X] Add `playerSpawnPoints` array field to `regionMapDefSchema`.
- [X] Add `deathRespawnPoints` array field to `regionMapDefSchema`.
- [X] Update `regionMapDefSchema` tests to include spawn point validation.
- [X] Write a passing test for `playerSpawnSchema` roundtrip validation.
- [X] Write a passing test for `deathRespawnSchema` roundtrip validation.
- [X] Write a passing test for spawn point default values.

## Acceptance criteria

- [X] `playerSpawnSchema` and `deathRespawnSchema` exist and are exported.
- [X] `regionMapDefSchema` includes `playerSpawnPoints` and `deathRespawnPoints` arrays.
- [X] Default values are correctly applied when fields are omitted.
- [X] Spawn type enums validate correctly.
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
