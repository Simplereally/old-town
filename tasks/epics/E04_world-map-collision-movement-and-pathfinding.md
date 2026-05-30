# E04 — World Map, Collision, Movement, and Pathfinding

## Dependency chain

- Depends on: E03
- Unlocks: E05

## Spec references

- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §6
- POC_SPEC.md §11
- POC_SPEC.md §12

## Epic goal

Make the authoritative world navigable: load regions, maintain tile/collision state, validate movement, compute paths, process walk/run movement, and resolve interactions to reachable tiles.

## Completion checklist

- [ ] Read `POC_SPEC.md` sections referenced above.
- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E04/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E04-S01` — [Load map regions into server world](../completed/stories/E04/E04-S01_load-map-regions-into-server-world.md)
- [ ] `E04-S02` — [Implement collision mask system](../stories/E04/E04-S02_implement-collision-mask-system.md)
- [ ] `E04-S03` — [Implement A* tile pathfinding](../stories/E04/E04-S03_implement-a-tile-pathfinding.md)
- [ ] `E04-S04` — [Implement movement system](../stories/E04/E04-S04_implement-movement-system.md)
- [ ] `E04-S05` — [Implement interaction reach resolution](../stories/E04/E04-S05_implement-interaction-reach-resolution.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.
