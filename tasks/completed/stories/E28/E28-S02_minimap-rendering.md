# E28-S02 — Minimap Rendering

## Epic

E28 — Client UI and Visual Polish

## Dependency chain

- Depends on: E28-S01
- Blocks: E28-S03

## Spec references

- docs/content/runtime-gap-list.md
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement the minimap rendering. Show a small overview map with player position, NPCs, and points of interest.

## Implementation checklist

- [X] Write a failing test for minimap rendering.
- [X] Create minimap component in client UI.
- [X] Render region map tiles as small colored squares.
- [X] Render player position as arrow/dot.
- [X] Render nearby NPCs and objects as icons.
- [X] Render points of interest (banks, shops, shrines) as markers.
- [X] Write a passing test for minimap tile rendering.
- [X] Write a passing test for player position rendering.
- [X] Write a passing test for NPC icon rendering.
- [X] Write a passing test for POI marker rendering.

## Acceptance criteria

- [X] Minimap renders region tiles.
- [X] Player position is shown.
- [X] NPCs and POIs are visible.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E28/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
