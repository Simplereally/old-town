# E46-S01 — Quest content and variable schema

## Epic

E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E45-S05 (XP Drops and Level-Ups), E12-S03 (Quest Requirement/Objective/Trigger Engine), E21-S02 (Quest State Machine and Progress Tracking)
- Blocks: E46-S02, E46-S03, E46-S04, E46-S05

## Spec references

- `POC_SPEC.md` §18.1-18.4 (Quest design, varbits, stages, dialogue graph)
- `POC_SPEC.md` §18.5 (POC quest — "Smoke Over Old Town")
- `content/quests/` — quest definitions
- `content/dialogue/` — dialogue graphs

## Objective

Define the "Smoke Over Old Town" quest content, stages, variables, and objectives. This is pure content and schema work; the runtime wiring happens in the following stories.

## Required architectural decisions

- **Quest file:** `content/quests/smoke-over-old-town.json`.
- **Quest vars:**
  - `quest.smoke_over_old_town.stage` (0 = not started, 1 = started, 2 = logs gathered, 3 = rats killed, 4 = oven lit, 5 = completed)
  - `quest.smoke_over_old_town.dry_logs` (count)
  - `quest.smoke_over_old_town.rats_killed` (count)
- **Stages:**
  - 0: Not started
  - 1: Talk to Pippa Hearth
  - 2: Gather 3 dry logs
  - 3: Kill 2 cellar rats
  - 4: Light the bakery oven
  - 5: Complete — receive reward
- **Objectives:** Each stage lists one objective. Triggers advance the stage when conditions are met.
- **Rewards:** `bread` × 5, `coins` × 50, Cooking XP 100, Quest Points 1, and unlock var `unlock.bakery_range`.
- **No hardcoded quest logic:** All stages, objectives, triggers, and rewards are in the quest JSON.

## Implementation checklist

- [X] Create `content/quests/smoke-over-old-town.json` with full stage/objective/trigger/reward definitions.
- [X] Verify the quest schema supports inventory count triggers, kill count triggers, and object interaction triggers.
- [X] Add the quest to the quest registry and content loader.
- [X] Add validation that the quest's referenced items, NPCs, and objects exist.
- [X] Write test: the quest JSON parses and all references resolve.
- [X] Write test: the quest reward items exist in the item registry.
- [X] Write test: the quest stages form a valid progression graph.

## Acceptance criteria

- [X] The "Smoke Over Old Town" quest is defined in `content/quests/`.
- [X] All quest stages, objectives, triggers, and rewards are content-driven.
- [X] All referenced content IDs (items, NPCs, objects) exist.
- [X] The quest schema validates the quest file.
- [X] No hardcoded quest logic in the engine.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E46/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
