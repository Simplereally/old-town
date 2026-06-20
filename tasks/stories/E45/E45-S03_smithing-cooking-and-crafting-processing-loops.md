# E45-S03 — Smithing, cooking, and crafting processing loops

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S02 (Woodcutting and Mining), E37-S01 (Recipe Selection Packet and UI), E37-S02 (Server-Side Recipe Selection Handler), E44-S04 (Skill Station Objects and Recipe Routing)
- Blocks: E45-S04, E45-S05

## Spec references

- `POC_SPEC.md` §15 (Skills and XP)
- `POC_SPEC.md` §15.6 (Gathering loop — pattern for processing)
- `POC_SPEC.md` §22 (UI system — recipe selection)
- `content/processing-recipes/` — recipes
- `docs/world/districts-and-routes.md` — station placement

## Objective

Connect the resource loop to processing. The player should be able to smelt ore into bars at the furnace, fletch logs into bows at the bow bench, cook fish at the kitchen range, and tan hides at the tanning frame. For POC, implement one core recipe per processing skill.

## Required architectural decisions

- **POC recipes:**
  - Smithing: `tinstone` × 1 + `coal`? No, keep it simple. `tinstone` × 1 → `tin_bar` at furnace. Actually smelting usually requires ore. Use `tinstone` → `tin_bar` (no coal for starter tier).
  - Cooking: `raw_perch` → `cooked_perch` at kitchen range. Add raw fish resource node near River Stoop.
  - Bowcraft: `oldroad_oak_log` → `oldroad_oak_shortbow` at bow bench.
  - Tailoring: `rabbit_hide` → `soft_leather` at tanning frame.
- **Processing action:** Like gathering, processing is a weak action that repeats if the recipe allows multiple. It consumes inputs, produces outputs, and grants XP.
- **Range check:** The player must be adjacent to the station. The station object is the interaction target.
- **Inventory updates:** Broadcast inventory and skill deltas. Show XP drops.

## Implementation checklist

- [ ] Add POC recipes to `content/processing-recipes/` for smithing, cooking, bowcraft, and tailoring.
- [ ] Add a raw fish resource node near River Stoop if not present.
- [ ] Wire the furnace to smelting recipes.
- [ ] Wire the bow bench to bowcraft recipes.
- [ ] Wire the kitchen range to cooking recipes.
- [ ] Wire the tanning frame to tailoring recipes.
- [ ] Implement processing repeat, consumption, and XP.
- [ ] Write test: smelting tinstone produces a tin bar and Smithing XP.
- [ ] Write test: cooking raw fish produces cooked fish and Cooking XP.
- [ ] Write test: fletching a log produces a shortbow and Bowcraft XP.

## Acceptance criteria

- [ ] Players can smelt, cook, fletch, and tan at the correct stations.
- [ ] Processing consumes inputs and produces outputs server-side.
- [ ] Each processing action grants the correct skill XP.
- [ ] Recipe selection UI is wired to the server.
- [ ] Stations enforce range and tool requirements.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — run one recipe at each station

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
