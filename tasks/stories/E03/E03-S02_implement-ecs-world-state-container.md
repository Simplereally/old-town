# E03-S02 — Implement ECS world state container

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E03-S01
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Create a server-authoritative data model for entities and components without renderer dependencies.

## Implementation checklist

- [ ] Define entity ID allocation and recycling policy.
- [ ] Implement component stores for position, movement, actor, player, NPC, object, inventory, equipment, combatant, resource node, quest vars.
- [ ] Implement create/destroy entity functions.
- [ ] Implement component query helpers needed by systems.
- [ ] Add tests for entity lifecycle and component isolation.

## Acceptance criteria

- [ ] No Three.js or DOM dependency exists in server simulation.
- [ ] Destroyed entities cannot be updated in later systems.
- [ ] Entity IDs remain stable while entity exists.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
