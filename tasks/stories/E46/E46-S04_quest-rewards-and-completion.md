# E46-S04 — Quest rewards and completion

## Epic

E46 — Smoke Over Old Town Quest End-to-End

## Dependency chain

- Depends on: E46-S03 (Gather, Kill, and Light Objectives), E21-S03 (Quest Completion and Reward Application), E12-S04 (Quest Rewards and Completion Safety)
- Blocks: E46-S05

## Spec references

- `POC_SPEC.md` §18.3 (Quest definition — rewards)
- `POC_SPEC.md` §18.5 (POC quest rewards)
- `POC_SPEC.md` §20.2 (Persistence rules — quest completion)
- `content/quests/smoke-over-old-town.json`

## Objective

Implement the quest completion logic and reward application for "Smoke Over Old Town". When the player lights the oven, the quest completes, rewards are granted, and the bakery range is unlocked.

## Required architectural decisions

- **Completion trigger:** The object interaction trigger in E46-S03 advances the stage to 5. The quest engine immediately applies the rewards if the stage is the final stage and not already completed.
- **Reward application:**
  - Add `bread` × 5 to inventory
  - Add `coins` × 50 to inventory
  - Add 100 Cooking XP
  - Add 1 Quest Point
  - Set `unlock.bakery_range` to true
- **Idempotency:** Quest completion can only happen once per character. The engine checks the quest completed flag before applying rewards.
- **Broadcast:** Send quest completion packet, inventory delta, XP drop, and var update in the same tick delta.
- **Persistence:** Mark quest completion as a persistent dirty state.

## Implementation checklist

- [ ] Implement quest reward application in the quest engine.
- [ ] Add reward types: item, currency, skill XP, quest points, unlock var.
- [ ] Add the quest completion flag to player vars.
- [ ] Implement idempotency check so rewards are not duplicated.
- [ ] Broadcast completion and rewards in the tick delta.
- [ ] Write test: completing the quest gives all rewards.
- [ ] Write test: completing the quest again does not give duplicate rewards.
- [ ] Write test: the bakery range unlock var is set.

## Acceptance criteria

- [ ] Lighting the oven completes the quest and grants rewards.
- [ ] Rewards include bread, coins, Cooking XP, Quest Point, and bakery range unlock.
- [ ] Quest completion is idempotent and cannot be repeated.
- [ ] All reward changes are broadcast and persisted.
- [ ] No hardcoded reward logic in the engine.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — complete the quest and verify rewards

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E46/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
