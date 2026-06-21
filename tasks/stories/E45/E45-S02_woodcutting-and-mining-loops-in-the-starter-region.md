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
- `content/resource-nodes/starter-nodes.json` — resource node definitions
- `content/objects/starter-objects.json` — tree, ore node object definitions
- `docs/areas/first-ring-areas.md` — starter resources

## Objective

Verify and wire the gatherable resource nodes in the starter region so the player can chop trees and mine ore in the first hour. The player should be able to walk to a tree, click "Chop", and receive logs and XP over repeated ticks. The same for mining ore nodes.

## What already exists (verify, do not rebuild)

- **Gathering system:** `apps/server/src/systems/skilling-system.ts` implements the full gathering loop: `handleObjectSkillingIntent` routes `chop`/`mine`/`fish` actions, `validateGatherAction` checks range/level/tool/inventory, `handleGather` rolls success, adds items, grants XP, and depletes nodes. Tests exist in `skilling-system.test.ts`.
- **Resource node runtime:** `apps/server/src/systems/resource-node-system.ts` implements depletion, visual transform, collision changes, and respawn via queued tick actions. Tests exist in `resource-node-system.test.ts`.
- **Starter tools:** `STARTER_ITEMS` in `dev-session.ts` already includes `pennywrought_axe` (tag `["axe"]`) and `pennywrought_pickaxe` (tag `["pickaxe"]`). Both tool gaps are resolved — no additional pickaxe or axe placement needed.
- **Map placements in `old-town-0-0-0.json`:** The following nodes are already placed:
  - `oak_tree_node` at (10, 15) — woodcutting level 15
  - `oldroad_oak_tree` at (12, 42) — woodcutting level 15
  - `dry_tree_node` at (20, 25) — woodcutting level 1 ✓
  - `copper_rock_node` at (30, 35) — mining level 1 ✓
  - `scrub_tree` at (42, 26) — woodcutting level 1 ✓
- **Map placements in `old-town-0-1-0.json`:** The following nodes are already placed:
  - `penny_copper_deposit` at (44, 10) — mining level 1 ✓
  - `tinstone_deposit` at (46, 14) — mining level 15
  - `pig_iron_outcrop` at (48, 14) — mining level 20
  - `blackcoal_pocket` at (50, 10) — mining level 10

## Required work

This story is primarily a **verification and content-gap-filling** story. The gathering engine is built; the work is ensuring the starter region has accessible level-1 nodes and the client renders node state.

- [ ] **Verify level-1 node access:** The starter region (`old-town-0-0-0.json`) already has `dry_tree_node` (lvl 1), `scrub_tree` (lvl 1), and `copper_rock_node` (lvl 1) placed. Verify these are reachable from the Market Bell spawn (45, 45) without crossing impassable terrain.
- [ ] **Add a level-1 tinstone node placement:** `tin_rock_node` (mining level 1, outputs `tinstone`) exists in `starter-nodes.json` but is not placed in any map. Add at least one `tin_rock_node` spawn in `old-town-0-0-0.json` near the quarry area (e.g., near the existing `copper_rock_node` at (30, 35)) so starters can mine tinstone without traveling to region 0-1-0. This supports the smithing loop in S03 which uses `penny_copper_ore` → `pennywrought_ingot`.
- [ ] **Verify client rendering:** The client must render resource nodes in their normal and depleted (transformed) states. The server sends transform updates via entity update deltas. Verify the client applies the `transform` change to swap the object's visual model.
- [ ] Write test: chopping `dry_tree_node` gives `dry_log` and Woodcutting XP (already exists in `skilling-system.test.ts` — verify it covers the starter nodes).
- [ ] Write test: mining `copper_rock_node` gives `copper_ore` and Mining XP (already exists — verify coverage).
- [ ] Write test: depleted nodes respawn after their `respawnTicks` (already exists in `resource-node-system.test.ts`).

## Content level reference

For the first-hour loop, only level-1 nodes are accessible to a fresh starter (all skills start at level 1):

| Node ID | Skill | Level | Output | Placed in |
|---------|-------|-------|--------|-----------|
| `dry_tree_node` | woodcutting | 1 | `dry_log` | 0-0-0 ✓ |
| `scrub_tree` | woodcutting | 1 | `dry_log` | 0-0-0 ✓ |
| `copper_rock_node` | mining | 1 | `copper_ore` | 0-0-0 ✓ |
| `penny_copper_deposit` | mining | 1 | `penny_copper_ore` | 0-1-0 ✓ |
| `tin_rock_node` | mining | 1 | `tinstone` | **not placed — add** |
| `river_perch_spot` | fishing | 1 | `raw_fish` | 0-0-0 ✓ |

Higher-level nodes (`oldroad_oak_tree` lvl 15, `tinstone_deposit` lvl 15, `pig_iron_outcrop` lvl 20) are progression content, not first-hour content.

## Acceptance criteria

- [ ] Players can chop level-1 trees in the starter region for `dry_log` and Woodcutting XP.
- [ ] Players can mine level-1 ore nodes for ore and Mining XP.
- [ ] `tin_rock_node` is placed in the starter region so tinstone is accessible without region travel.
- [ ] Nodes deplete and respawn on the 600 ms tick.
- [ ] Tool requirements (axe for woodcutting, pickaxe for mining) are enforced server-side.
- [ ] Inventory and XP deltas are broadcast to the client.
- [ ] Visual state updates when a node depletes (transform applied on client).

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
