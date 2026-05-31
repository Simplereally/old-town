# E09-S01 — Implement resource node runtime state

## Epic

E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E08-S05
- Blocks: next story in `E09` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Represent placed trees, rocks, and other resource nodes as authoritative object entities with depletion and respawn state.

## Implementation checklist

- [X] Create ResourceNodeComponent linked to ResourceNodeDef.
- [X] Track active/depleted state and respawn tick.
- [X] Transform object appearance/state on depletion.
- [X] Clear or alter collision if required by content.
- [X] Emit object transform update masks.
- [X] Add tests for deplete and respawn transitions.

## Acceptance criteria

- [X] Resource node state is runtime state, not content mutation.
- [X] Respawn is queued by ticks, not async timers.
- [X] Client sees node transform through deltas.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
