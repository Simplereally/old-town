# E44-S04 — Skill station objects and recipe routing

## Epic

E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E44-S01 (Service NPC Dialogue Pack), E37-S01 (Recipe Selection Packet and UI), E37-S02 (Server-Side Recipe Selection Handler), E25-S01 (Object Non-Skilling Interaction Router)
- Blocks: E44-S05

## Spec references

- `POC_SPEC.md` §12 (Interaction model — object options)
- `POC_SPEC.md` §15.4 (Resource node definition)
- `POC_SPEC.md` §22 (UI system — recipe UI)
- `docs/world/districts-and-routes.md` — station placement
- `content/objects/` — station objects
- `content/processing-recipes/` — recipes

## Objective

Wire the skill station objects (forge furnace, anvil, bow bench, tanning frame, dye vat, bead kiln, bead loom, kitchen range, map table) to the recipe selection system. Clicking a station opens the recipe UI, and selecting a recipe sends the correct processing command to the server.

## Required architectural decisions

- **Station object options:** Each station object exposes an option like "Smelt", "Fletch", "Tan", "Fire", "Cook", "Survey" that maps to a recipe category.
- **Recipe selection flow:** `ObjectIntent { objectEntityId, actionId: "use" }` → server opens recipe UI for the station's category → player selects recipe → client sends `C2S_UI_ACTION { action: "recipe_select", recipeId }` → server validates and starts the processing action.
- **Processing action:** Uses the action queue system (E03-S05) with a repeat interval, tool requirements, and ingredient consumption. The station object itself is the target for range/line-of-sight checks.
- **POC recipes:** Implement one recipe per station category:
  - Smelt `tinstone` → `tin_bar`
  - Fletch `oldroad_oak_log` → `oldroad_oak_shortbow`
  - Tan `rabbit_hide` → `soft_leather`
  - Cook `raw_fish` → `cooked_fish`

## Implementation checklist

- [X] Verify station object definitions exist for Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court, and River Stoop.
- [X] Add interaction options to each station object in `content/objects/`.
- [X] Implement station object interaction routing on the server.
- [X] Open recipe selection UI for the station's category.
- [X] Handle recipe selection and start the processing action queue.
- [X] Write test: clicking the furnace opens the smelting recipe UI.
- [X] Write test: selecting a recipe consumes ingredients and produces output.
- [X] Write test: processing gives the correct skill XP.

## Acceptance criteria

- [X] All skill stations have usable interaction options.
- [X] Clicking a station opens the correct recipe category.
- [X] Selecting a recipe starts a server-authoritative processing action.
- [X] Ingredients are consumed and products are added to inventory.
- [X] Skill XP is granted on successful processing.
- [X] No station behavior is hardcoded; all recipes and categories are content-driven.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — use each station category at least once

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E44/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
