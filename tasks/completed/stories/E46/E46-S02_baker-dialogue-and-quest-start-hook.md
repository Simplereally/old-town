# E46-S02 — Baker dialogue and quest start hook

## Epic

E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E46-S01 (Quest Content), E44-S01 (Service NPC Dialogue Pack), E21-S02 (Quest State Machine)
- Blocks: E46-S03, E46-S04, E46-S05

## Spec references

- `POC_SPEC.md` §18.4 (Dialogue graph)
- `POC_SPEC.md` §18.5 (POC quest)
- `content/dialogue/pippa_hearth.json` (to be created)
- `content/npcs/pippa_hearth.json`

## Objective

Create the baker NPC (Pippa Hearth) dialogue and the quest start hook. The player must be able to talk to Pippa and start the "Smoke Over Old Town" quest. Her dialogue must reflect the quest stage: before the quest, during each stage, and after completion.

## Required architectural decisions

- **Dialogue branches:**
  - Before quest: Pippa explains the smoking oven and asks for help.
  - During logs stage: Pippa reminds the player to gather 3 dry logs.
  - During rats stage: Pippa reminds the player to kill 2 cellar rats.
  - During oven stage: Pippa tells the player to light the oven.
  - After completion: Pippa thanks the player and offers to sell bread.
- **Quest start:** A player option "Yes, I'll help" in the dialogue sets `quest.smoke_over_old_town.stage` to 1.
- **Dialogue engine integration:** The dialogue graph references quest vars via the `requirements` and `effects` fields. The engine evaluates these on the server.
- **NPC placement:** Pippa Hearth is already placed near the Market Bell kitchen area in the starter map.

## Implementation checklist

- [X] Create `content/dialogue/pippa_hearth.json` with all quest branches.
- [X] Update `content/npcs/pippa_hearth.json` to offer "Talk-to" option.
- [X] Implement dialogue requirements/effects for quest vars.
- [X] Wire the quest start effect to the quest state machine.
- [X] Write test: talking to Pippa before the quest starts shows the intro branch.
- [X] Write test: selecting the quest start option advances the quest stage.
- [X] Write test: after completion, Pippa shows the thank-you branch.

## Acceptance criteria

- [X] Pippa Hearth has dialogue for every quest stage.
- [X] Players can start the quest by talking to Pippa.
- [X] Dialogue branches are driven by quest var state.
- [X] The quest start effect is server-authoritative.
- [X] No hardcoded quest dialogue in the engine.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — start the quest by talking to Pippa

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E46/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
