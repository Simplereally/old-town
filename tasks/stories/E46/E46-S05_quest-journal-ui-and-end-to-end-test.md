# E46-S05 — Quest journal UI and end-to-end test

## Epic

E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E46-S04 (Quest Rewards and Completion), E21-S04 (Dialogue UI Protocol and Client Rendering), E12-S01 (Player Var and Quest Var Storage)
- Blocks: E47-S01

## Spec references

- `POC_SPEC.md` §18.2 (Varbits / varps)
- `POC_SPEC.md` §18.3 (Quest definition — stages, journalText)
- `POC_SPEC.md` §22 (UI system — quest journal)
- `content/quests/smoke-over-old-town.json`

## Objective

Add the quest journal UI that shows active and completed quests. Then write an end-to-end test that completes "Smoke Over Old Town" from start to finish using tick commands.

## Required architectural decisions

- **Quest journal packet:** The server sends the player's quest var state as part of the full state and as deltas when quest vars change. The client journal reads this state.
- **Journal UI:** A panel listing active quests with stage text and objectives, plus a completed quests section. Clicking a quest shows details.
- **Journal text source:** `journalText` from the quest stage definition is used verbatim.
- **End-to-end test:** A test harness spawns a character, runs the quest commands:
  1. Start quest via dialogue
  2. Add 3 dry logs to inventory
  3. Kill 2 cellar rats
  4. Light the oven
  5. Assert rewards and quest completion
- **Manual validation:** The test must be runnable in CI and the quest must also be completable manually in `bun run dev`.

## Implementation checklist

- [ ] Implement quest var sync in full state and delta packets.
- [ ] Create the quest journal UI panel.
- [ ] Populate the journal from quest var state.
- [ ] Add active and completed quest sections.
- [ ] Write the end-to-end quest completion test.
- [ ] Write test: journal shows the correct stage text for an active quest.
- [ ] Write test: journal shows the quest in completed section after completion.
- [ ] Write test: end-to-end test completes the quest and asserts final state.

## Acceptance criteria

- [ ] The quest journal UI shows active quests and their current stage/objectives.
- [ ] Completed quests move to the completed section.
- [ ] Journal text is sourced from the quest definition.
- [ ] An end-to-end test completes the quest via tick commands.
- [ ] The quest is manually completable in the dev client.
- [ ] The epic and all stories are moved to completed.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — manually complete the quest

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E46/` only after all criteria pass.
- [ ] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.
