# E04-S03 — Implement A* tile pathfinding

## Epic

E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E04-S02
- Blocks: next story in `E04` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Objective

Create bounded server-side pathfinding for click-to-move and interaction movement.

## Implementation checklist

- [X] Implement A* over tile grid with 8-way movement.
- [X] Use Chebyshev heuristic.
- [X] Respect collision and footprints.
- [X] Cap path length and search budget.
- [X] Return nearest reachable tile when destination is blocked/unreachable.
- [X] Add tests for blocked goals, doors, diagonal movement, and max length.

## Acceptance criteria

- [X] Pathfinding returns tile paths only.
- [X] No navmesh or physics dependency exists.
- [X] Path tests are deterministic.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
