# E21-S01 — NPC Dialogue Runtime Routing

## Epic

E21 — NPC Dialogue and Quest Engine

## Dependency chain

- Depends on: E12-S02, E20
- Blocks: E21-S02, E21-S04

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 1)
- docs/content/action-wiring-audit.md (action IDs: `talk`, `read`, `quest`)
- POC_SPEC.md §12 (Dialogue & Quests)

## Objective

Implement the server-side NPC dialogue runtime routing so that NPC `talk` actions dispatch to the dialogue engine instead of emitting "not yet implemented." Wire the dialogue graph engine into the intent dispatcher and ECS.

## Implementation checklist

- [X] Write a failing test for NPC dialogue routing in `apps/server/src/systems/__tests__/dialogue.test.ts`.
- [X] Modify `intent-dispatcher.ts` to route `talk` actions to the dialogue system when the target has dialogue content.
- [X] Create `dialogue-system.ts` in `apps/server/src/systems/` that loads dialogue graphs from content registry.
- [X] Implement dialogue state per player (current node, available options) in a new ECS component or player var.
- [X] Handle dialogue node types: `text`, `option`, `end`, `quest_start`, `quest_complete`.
- [X] Write a passing test for full dialogue graph traversal.
- [X] Write a passing test for dialogue option selection.
- [X] Write a passing test for dialogue quest-start node routing.
- [X] Write a passing test for dialogue end-node cleanup.

## Acceptance criteria

- [X] `talk` action on NPCs with dialogue content routes to the dialogue system.
- [X] Dialogue state is tracked per player and cleaned up on end.
- [X] All dialogue node types are handled correctly.
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
- [X] Move this story file to `tasks/completed/stories/E21/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
