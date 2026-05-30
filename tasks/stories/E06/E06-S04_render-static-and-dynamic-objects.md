# E06-S04 — Render static and dynamic objects

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E06-S03
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Render trees, rocks, doors, buildings, resource nodes, and interactive objects from entity spawn/update packets.

## Implementation checklist

- [ ] Create ObjectRenderer with object pooling.
- [ ] Use original placeholder GLB/primitive geometry where assets are absent.
- [ ] Use InstancedMesh or pooling for repeated trees/rocks.
- [ ] Apply rotation/state/transform updates.
- [ ] Render selection/hover ring hook but do not implement input yet.

## Acceptance criteria

- [ ] Objects appear at authoritative tile positions.
- [ ] Repeated objects do not create excessive unique materials/meshes.
- [ ] Object state updates can visually transform a node or door.

## Validation commands

- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
