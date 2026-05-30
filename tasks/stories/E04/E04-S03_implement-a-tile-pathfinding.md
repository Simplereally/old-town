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

- [ ] Implement A* over tile grid with 8-way movement.
- [ ] Use Chebyshev heuristic.
- [ ] Respect collision and footprints.
- [ ] Cap path length and search budget.
- [ ] Return nearest reachable tile when destination is blocked/unreachable.
- [ ] Add tests for blocked goals, doors, diagonal movement, and max length.

## Acceptance criteria

- [ ] Pathfinding returns tile paths only.
- [ ] No navmesh or physics dependency exists.
- [ ] Path tests are deterministic.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E04/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
