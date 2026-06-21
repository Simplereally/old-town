# E46-S03 — Gather, kill, and light objectives

## Epic

E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E46-S02 (Baker Dialogue and Quest Start), E45-S02 (Woodcutting and Mining), E45-S04 (Combat Loop), E25-S01 (Object Non-Skilling Interaction Router)
- Blocks: E46-S04, E46-S05

## Spec references

- `POC_SPEC.md` §18.3 (Quest definition — stages, triggers)
- `POC_SPEC.md` §18.5 (POC quest)
- `POC_SPEC.md` §15.6 (Gathering loop)
- `POC_SPEC.md` §13.7 (Combat loop)
- `content/quests/smoke-over-old-town.json`

## Objective

Implement the three objective triggers for the quest: gather 3 dry logs, kill 2 cellar rats, and light the bakery oven. Each objective must advance the quest stage when completed.

## Required architectural decisions

- **Inventory count trigger:** When the player's inventory count of `dry_log` reaches 3, the quest stage advances from 2 to 3. The trigger checks on every inventory change.
- **Kill count trigger:** When the player kills a `cellar_rat` (gets the kill credit), increment `quest.smoke_over_old_town.rats_killed`. When it reaches 2, advance to stage 4.
- **Object interaction trigger:** When the player uses `dry_log` on the `market_kitchen_hearth` (or selects "Light" with logs in inventory), advance to stage 5.
- **Trigger evaluation:** Triggers are evaluated after the relevant tick phase (inventory changes, combat deaths, object interactions). The quest engine checks all active triggers each tick.
- **Stage safety:** A trigger cannot advance a stage backwards or skip stages.

## Implementation checklist

- [ ] Implement the inventory count trigger for `dry_log`.
- [ ] Implement the kill count trigger for `cellar_rat`.
- [ ] Implement the object interaction trigger for `market_kitchen_hearth` with `dry_log`.
- [ ] Wire the quest trigger evaluation into the tick loop after the relevant phases.
- [ ] Add quest var updates to the tick delta.
- [ ] Write test: gathering 3 logs advances the quest stage.
- [ ] Write test: killing 2 cellar rats advances the quest stage.
- [ ] Write test: lighting the oven with logs advances the quest stage.

## Acceptance criteria

- [ ] Gathering 3 dry logs advances the quest to the next stage.
- [ ] Killing 2 cellar rats advances the quest to the next stage.
- [ ] Lighting the oven advances the quest to the completion stage.
- [ ] Triggers are evaluated server-side and cannot be skipped or faked by the client.
- [ ] Quest var updates are included in tick deltas.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — complete each quest objective

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E46/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
