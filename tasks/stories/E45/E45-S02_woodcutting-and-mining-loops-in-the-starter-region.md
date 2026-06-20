# E45-S02 — Woodcutting and mining loops in the starter region

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S01 (Starter Spawn Point), E09-S03 (Woodcutting Loop), E09-S04 (Mining Loop), E09-S01 (Resource Node Runtime State)
- Blocks: E45-S03, E45-S04, E45-S05

## Spec references

- `POC_SPEC.md` §15.4 (Resource node definition)
- `POC_SPEC.md` §15.6 (Gathering loop)
- `POC_SPEC.md` §10 (Action queue system)
- `content/resource-nodes/` — resource node definitions
- `content/objects/` — tree, ore node object definitions
- `docs/areas/first-ring-areas.md` — starter resources

## Objective

Place gatherable resource nodes in the starter region and wire the woodcutting and mining loops. The player should be able to walk to a tree, click "Chop", and receive logs and XP over repeated ticks. The same for mining ore nodes.

## Required architectural decisions

- **Resource node placement:** Place resource nodes in the world editor or generator:
  - Oldroad Gate / Lath Yard: `oldroad_oak_tree` (woodcutting level 1)
  - North Quarry Road: `tinstone_outcrop` (mining level 1) and `pig_iron_ore` (mining level 5)
- **Node runtime state:** Each node has a `depleted` state and a `respawnAtTick`. When depleted, the object transforms visually to a stump or empty rock and blocks gathering until respawn.
- **Tool requirement:** Woodcutting requires an axe in inventory or equipped. Mining requires a pickaxe. The starter character has a cobbled pickaxe? No, only a shortblade. Add a starter pickaxe to bootstrap or place one as a ground item near the quarry.
- **Action queue:** Gathering is a weak action that repeats every `actionTicks` until depleted, interrupted, or the player moves away.
- **XP and drops:** On success, add the resource item to inventory and grant XP to the relevant skill. Broadcast inventory delta and XP drop.

## Implementation checklist

- [ ] Place resource nodes in `content/maps/old-town-0-0-0.json` via the world editor or generator.
- [ ] Add or verify resource node definitions in `content/resource-nodes/`.
- [ ] Wire the woodcutting action handler to the object interaction router.
- [ ] Wire the mining action handler to the object interaction router.
- [ ] Implement node depletion, visual transformation, and respawn.
- [ ] Add a starter pickaxe to the bootstrap or place it near the quarry.
- [ ] Write test: chopping a tree gives logs and Woodcutting XP.
- [ ] Write test: mining an ore node gives ore and Mining XP.
- [ ] Write test: depleted nodes respawn after their respawn ticks.

## Acceptance criteria

- [ ] Players can chop trees in the starter region for logs and XP.
- [ ] Players can mine ore nodes for ore and XP.
- [ ] Nodes deplete and respawn on the 600 ms tick.
- [ ] Tool requirements are enforced server-side.
- [ ] Inventory and XP deltas are broadcast to the client.
- [ ] Visual state updates when a node depletes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — chop a tree and mine an ore node

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
