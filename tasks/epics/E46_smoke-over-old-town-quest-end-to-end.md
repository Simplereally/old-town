# E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E45 (Core Gameplay Loop), E12 (Dialogue, Quest Vars, Quest Engine, and POC Quest), E21 (NPC Dialogue and Quest Engine), E44 (Service NPCs and Economy Wiring)
- Unlocks: E47 (Audio, Atmosphere, and UI Juice)

## Spec references

- `POC_SPEC.md` §18.5 (POC quest — "Smoke Over Old Town")
- `POC_SPEC.md` §18.1-18.4 (Quest design, varbits, stages, dialogue graph)
- `POC_SPEC.md` §22 (UI system — quest journal, dialogue box)
- `docs/quests/` — quest design documentation
- `content/quests/` — quest definitions
- `content/dialogue/` — dialogue graphs
- `scripts/generate-old-town-map.ts` — quest object placements

## Epic goal

The POC quest "Smoke Over Old Town" is the tutorial that proves every core system works together: dialogue, inventory, skilling, combat, object interaction, quest variables, rewards, and area unlocks. The player must be able to start it, complete all stages, and receive the reward. This epic wires the quest content and dialogue end-to-end, adds the quest journal UI, and validates the full flow.

The quest flow:
1. Talk to Pippa Hearth (baker) at Market Bell.
2. Gather 3 dry logs (woodcutting).
3. Kill 2 cellar rats (combat).
4. Light the bakery oven (object interaction).
5. Receive bread, coins, Cooking XP, 1 Quest Point, and unlock the bakery range.

## Approach summary

1. **Quest content and variables.** Define the quest in `content/quests/smoke-over-old-town.json` with stages, requirements, objectives, and triggers. Define the quest vars: `quest.smoke_over_old_town.stage`, `.spoke_to_pippa`, `.dry_logs`, `.rats_killed`, `.oven_lit`, `.completed`.
2. **Dialogue hooks.** Create `content/dialogue/pippa_hearth.json` with branches that start the quest, advance stages, and give the reward. The baker has different dialogue before, during, and after the quest.
3. **Objective triggers.** Implement the objective triggers: inventory count of `dry_log` reaches 3; kill counter for `cellar_rat` reaches 2; object interaction with `market_kitchen_hearth` using `dry_log` lights the oven.
4. **Reward application.** On completion, give the player `bread`, coins, Cooking XP, 1 Quest Point, and set the var that unlocks the bakery range (future recipe benefit).
5. **Quest journal UI.** Add a client quest journal panel that reads the player's quest var state and shows current stage, objectives, and completed quests.
6. **End-to-end test.** Write a test that runs the quest from start to finish using tick commands and asserts the final reward and var state.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E46/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E46-S01` — [Quest content and variable schema](stories/E46/E46-S01_quest-content-and-variable-schema.md)
- [ ] `E46-S02` — [Baker dialogue and quest start hook](stories/E46/E46-S02_baker-dialogue-and-quest-start-hook.md)
- [ ] `E46-S03` — [Gather, kill, and light objectives](stories/E46/E46-S03_gather-kill-and-light-objectives.md)
- [ ] `E46-S04` — [Quest rewards and completion](stories/E46/E46-S04_quest-rewards-and-completion.md)
- [ ] `E46-S05` — [Quest journal UI and end-to-end test](stories/E46/E46-S05_quest-journal-ui-and-end-to-end-test.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The "Smoke Over Old Town" quest can be started by talking to Pippa Hearth.
- [ ] The quest tracks gathering 3 dry logs, killing 2 cellar rats, and lighting the oven.
- [ ] Completing the quest gives bread, coins, Cooking XP, 1 Quest Point, and unlocks the bakery range.
- [ ] The quest journal UI shows active and completed quests.
- [ ] An end-to-end test completes the quest via tick commands and asserts final state.
- [ ] No quest logic is hardcoded in engine code; all stages, dialogue, and rewards are content-driven.
