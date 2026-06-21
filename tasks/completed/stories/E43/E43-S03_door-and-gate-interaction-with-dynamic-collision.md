# E43-S03 — Door and gate interaction with dynamic collision

## Epic

E43 — Old Town Buildings, Collision, and World Topology

## Dependency chain

- Depends on: E43-S02 (Collision Mask Generation), E25-S01 (Object Non-Skilling Interaction Router)
- Blocks: E43-S04, E43-S05, E43-S06

## Spec references

- `POC_SPEC.md` §5.3 (Dynamic collision — doors, gates)
- `POC_SPEC.md` §10 (Action queue system)
- `POC_SPEC.md` §12 (Interaction model)
- `POC_SPEC.md` §14.3 (NPC rules — dynamic occupancy)

## Objective

Implement the "Open" and "Close" interactions for doors and gates. Opening a door updates the visual model and removes the movement block on the door tile; closing restores it. The change must be deterministic and broadcast to clients in the tick delta.

## Required architectural decisions

- **Door state:** Doors have a server-side state component: `isOpen: boolean`. The state is part of the object entity and is included in the object update mask.
- **Collision update:** When a door is opened, remove `BLOCK_FULL` from the door tile. When closed, restore it. For gates, update both tiles.
- **Visual update:** The client rotates the door model 90° when open and resets it when closed. No animation interpolation is required for POC.
- **Action queue:** Door open/close is a normal action that resolves immediately on the tick it is processed. It does not repeat.
- **Persistence:** Door state is transient (resets on server restart for POC). Later, it can be persisted with region state.

## Implementation checklist

- [X] Add an `Openable` component or state to door/gate object entities.
- [X] Implement the "Open" and "Close" interaction handlers in the object interaction router.
- [X] Update collision mask when door state changes.
- [X] Broadcast object update mask with the new open state.
- [X] Update client object renderer to rotate door visuals based on state.
- [X] Write test: opening a door removes movement block on the door tile.
- [X] Write test: closing a door restores movement block.
- [X] Write test: two players see the same door state after a tick delta.

## Acceptance criteria

- [X] Doors and gates can be opened and closed via right-click or interaction.
- [X] Collision is updated immediately when door state changes.
- [X] The visual door model reflects open/closed state.
- [X] Door state changes are broadcast to all observing clients.
- [X] Server remains authoritative over collision and door state.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — manually open and close doors

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E43/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
