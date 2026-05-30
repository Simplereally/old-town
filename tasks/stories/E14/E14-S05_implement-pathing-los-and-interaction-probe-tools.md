# E14-S05 — Implement pathing, LoS, and interaction probe tools

## Epic

E14 — World Editor and Content Authoring Tooling

## Dependency chain

- Depends on: E14-S04
- Blocks: next story in `E14` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §19
- POC_SPEC.md §24
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Add editor probes that verify the exact primitives most likely to break gameplay.

## Implementation checklist

- [ ] Add path probe from tile A to tile B using shared/server pathfinding package.
- [ ] Add LoS probe using shared/server collision checks.
- [ ] Add interaction reach probe for object/NPC footprints.
- [ ] Display resulting path/ray/reach tiles.
- [ ] Export probe test fixtures for automated regression tests.

## Acceptance criteria

- [ ] Designer/agent can debug blocked movement without launching full game.
- [ ] Probe logic reuses production path/LoS code.
- [ ] Probe fixtures can be added to tests.

## Validation commands

- [ ] `bun run world-editor:dev`
- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E14/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
