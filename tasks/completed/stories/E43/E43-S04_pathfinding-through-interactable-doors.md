# E43-S04 — Pathfinding through interactable doors

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E43-S03 (Door and Gate Interaction), E04-S03 (A* Tile Pathfinding)
- Blocks: E43-S05, E43-S06

## Spec references

- `POC_SPEC.md` §11.3 (Pathfinding algorithm)
- `POC_SPEC.md` §11.4 (True tile semantics)
- `POC_SPEC.md` §12.1 (Click resolution — path to interaction tile)
- `docs/map/collision-and-route-rules.md`

## Objective

Update the pathfinder so that a closed door is not a hard blocker: the path can route through a door tile by first queuing an "Open" interaction, then walking through. This is essential for the OSRS feel of navigating a town with buildings.

## Required architectural decisions

- **Path cost model:** Closed doors add a cost penalty but are not impassable. If the door is open, the tile is passable. If closed, the path planner includes the door as an intermediate interactable goal.
- **Interaction prepending:** When the computed path contains a closed door tile, the movement system prepends the door-open interaction before the movement step that crosses the door.
- **Validation on every tick:** If the door state changes while pathing, the path is recomputed. The server never lets the client assume a door is open.
- **Fallback:** If a door is locked or cannot be opened (future feature), the pathfinder treats it as a full block.

## Implementation checklist

- [X] Extend A* to accept a predicate `canStepWithInteraction(current, next)` that returns whether the tile is passable or openable.
- [X] Implement `pathToGoal` that emits a list of movement steps and optional interaction steps.
- [X] Modify the movement system to execute door-open interactions before crossing the door tile.
- [X] Recompute path if door state changes mid-path.
- [X] Write test: path from outside to inside a building routes through the closed door and opens it.
- [X] Write test: path is recomputed when the door closes unexpectedly.
- [X] Write test: path avoids locked doors (future placeholder) and finds alternative route.

## Acceptance criteria

- [X] Pathfinding can route through closed doors by opening them.
- [X] The door-open interaction is queued before the crossing movement step.
- [X] Paths are recomputed when door state changes.
- [X] The player reaches the destination inside a building without manual door clicks.
- [X] No client-side path prediction; server always resolves the path.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — click inside a building and watch the player open the door and walk in — click inside a building and watch the player open the door and walk in

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E43/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
