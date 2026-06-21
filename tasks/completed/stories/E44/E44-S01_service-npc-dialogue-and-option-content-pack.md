# E44-S01 — Service NPC dialogue and option content pack

## Epic

E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E43-S06 (Starter Region Topology), E21-S01 (NPC Dialogue Runtime Routing), E21-S04 (Dialogue UI Protocol and Client Rendering)
- Blocks: E44-S02, E44-S03, E44-S04, E44-S05

## Spec references

- `POC_SPEC.md` §14.1 (NPC definition)
- `POC_SPEC.md` §18.4 (Dialogue graph)
- `POC_SPEC.md` §22 (UI system — dialogue box, right-click menu)
- `docs/world/districts-and-routes.md` — NPC list and services
- `content/npcs/` — NPC definitions
- `content/dialogue/` — dialogue graphs

## Objective

Create the dialogue graphs and right-click options for all 14 starter service NPCs. Each NPC must have a default greeting, district-appropriate flavor, and a functional option that routes to the correct system (bank, shop, station, contract, quest).

## Required architectural decisions

- **Dialogue file per NPC:** `content/dialogue/{npc_id}.json` follows the `DialogueNode` schema.
- **NPC option routing:** NPCs expose options in their definition. The right-click menu reads these options and emits intents: `NpcIntent { npcEntityId, actionId: "talk" | "bank" | "shop" | "contract" | "quest" }`.
- **Functional option mapping:**
  - Tomas Tally → "Bank"
  - Osric Penny → "Shop" (forge supplies)
  - Letha Lath → "Shop" (bowcraft supplies)
  - Nell Patch → "Shop" (tailoring supplies)
  - Mother Tallow → "Shop" (beadwork supplies)
  - Pippa Hearth → "Talk-to" (quest start)
  - Warden Holt → "Contract"
  - Sister Writ → "Talk-to" (shrine/favour)
  - Others → "Talk-to" / "Examine"
- **Quest-aware dialogue:** NPCs with quest roles have different dialogue branches based on quest var state.

## Implementation checklist

- [X] Create/complete dialogue JSON for all 14 starter NPCs:
  - `mara_bellkeeper`, `tomas_tally`, `osric_penny`, `letha_lath`, `nell_patch`, `mother_tallow`, `warden_holt`, `sister_writ`, `finch_quill`, `edda_tinfin`, `bramble_hook`, `marn_lock`, `pippa_hearth`, `gravekeeper_soll`.
- [X] Update NPC definitions in `content/npcs/` to include correct options.
- [X] Implement option routing in the server intent dispatcher.
- [X] Add client right-click menu support for NPC options.
- [X] Write test: every starter NPC has at least one dialogue node and one option.
- [X] Write test: "Bank" option on Tomas Tally routes to the bank system.
- [X] Write test: "Talk-to" Pippa Hearth opens the correct dialogue graph.

## Acceptance criteria

- [X] All 14 starter NPCs have dialogue and functional options.
- [X] Right-clicking an NPC shows the correct options.
- [X] Selecting an option routes to the correct server system.
- [X] Dialogue is content-driven, not hardcoded.
- [X] No copied OSRS dialogue or NPC names.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — manually talk to each NPC type

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E44/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
