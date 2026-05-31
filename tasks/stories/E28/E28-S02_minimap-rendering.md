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

- [ ] Write a failing test for minimap rendering.
- [ ] Create minimap component in client UI.
- [ ] Render region map tiles as small colored squares.
- [ ] Render player position as arrow/dot.
- [ ] Render nearby NPCs and objects as icons.
- [ ] Render points of interest (banks, shops, shrines) as markers.
- [ ] Write a passing test for minimap tile rendering.
- [ ] Write a passing test for player position rendering.
- [ ] Write a passing test for NPC icon rendering.
- [ ] Write a passing test for POI marker rendering.

## Acceptance criteria

- [ ] Minimap renders region tiles.
- [ ] Player position is shown.
- [ ] NPCs and POIs are visible.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E28/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
