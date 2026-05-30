# E06-S06 — Render projectiles, hitsplats, ground items, and overlays

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S05
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Add the visual feedback primitives needed by combat, drops, chat, and debugging.

## Implementation checklist

- [ ] Create ProjectileLayer with start/end tile interpolation.
- [ ] Create Hitsplat overlay anchored to actors.
- [ ] Create GroundItemLayer with sprite or tiny mesh items.
- [ ] Create overhead text rendering for chat.
- [ ] Create DebugLayer for true tile, paths, collision, LoS, and footprints when data is available.

## Acceptance criteria

- [ ] Visual effects are driven by packets/deltas only.
- [ ] Ground item and hitsplat visuals can be added/removed without scene leaks.
- [ ] Debug overlays can be toggled.

## Validation commands

- [ ] `bun run client:dev`
- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
