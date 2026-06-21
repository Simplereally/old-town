# E45-S06 — End-to-end integration smoke test

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S01, E45-S02, E45-S03, E45-S04, E45-S05
- Blocks: E46-S01

## Spec references

- `POC_SPEC.md` §9 (Server tick loop phase order)
- `POC_SPEC.md` §10 (Action queue system)
- `POC_SPEC.md` §2.1 (Server is truth)
- `apps/server/src/sim/gameplay-loop.integration.test.ts` — existing integration test pattern

## Objective

Write an automated end-to-end test that exercises the full first-hour gameplay loop via tick commands, proving all E45 systems work together. This is the epic's defining acceptance criterion: "is it a game yet?"

## Required work

- [ ] Write an integration test in `apps/server/src/sim/` that performs the following sequence via tick-driven commands (no client, no WebSocket — direct simulation kernel calls):
  1. **Spawn:** Bootstrap a dev character and verify it spawns at the Market Bell tile (45, 45).
  2. **Move:** Issue a `MoveIntent` to walk near a `dry_tree_node` (e.g., (20, 25)).
  3. **Gather:** Issue an `ObjectIntent` with action `chop` on the tree. Advance ticks. Verify `dry_log` appears in inventory and Woodcutting XP increases.
  4. **Move:** Walk near a `copper_rock_node` (e.g., (30, 35)) or `tin_rock_node`.
  5. **Gather:** Issue a `mine` intent. Advance ticks. Verify ore (`copper_ore` or `tinstone`) appears in inventory and Mining XP increases.
  6. **Move:** Walk near a `foundry_furnace` station.
  7. **Process:** Issue a processing intent to smelt `penny_copper_ore` into `pennywrought_ingot` (or smelt the gathered ore if a matching recipe exists). Verify the ingot appears and Smithing XP increases.
  8. **Move:** Walk near a `cellar_rat` spawn (e.g., (28, 28) in Sootcellar).
  9. **Combat:** Issue an `NpcIntent` with action `attack` on the rat. Advance ticks until the rat dies. Verify hitsplat deltas, combat XP gain, and ground item drops (`rat_drops`).
  10. **Bank:** Move near a bank booth. Issue an `ItemIntent` to bank the loot. Verify the item moves from inventory to bank.
  11. **XP verification:** Verify that XP drops were emitted in deltas for woodcutting, mining, smithing, and combat skills.
- [ ] The test must use the real `SimulationKernel`, real content registries (loaded from `content/`), and the real region maps. No mocks of gameplay systems.
- [ ] The test must run in under 30 seconds (tick-based, no real-time delays).
- [ ] The test must be deterministic — use a seeded RNG so failure chances and drop rolls are reproducible.

## Acceptance criteria

- [ ] The integration test spawns a character, gathers resources, processes them, fights a creature, banks loot, and gains XP across multiple skills.
- [ ] The test passes with `bun run test`.
- [ ] The test exercises the real simulation kernel, content registries, and region maps — no gameplay system mocks.
- [ ] The test is deterministic (seeded RNG).

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.
