# E20-S02 — Create Contract Content and Validation

## Epic

E20 — Identity and Contract Schema Gaps

## Dependency chain

- Depends on: E20-S01
- Blocks: none

## Spec references

- POC_SPEC.md §8
- POC_SPEC.md §10
- docs/creatures/wardenry-contracts.md
- docs/creatures/wardenry-favour.md

## Objective

Create 6 starter Wardenry contracts, validate cross-references, update the `warden_holt` NPC, and ensure all contract content passes validation.

## Implementation checklist

- [X] Create `content/contracts/` directory with 6 starter contract definitions:
  - `slay_goblins.json` (bounty, target: goblin, count: 10)
  - `clear_wolves.json` (extermination, target: wolf, count: 5)
  - `collect_herbs.json` (collection, target: herb patches, count: 20)
  - `hunt_bears.json` (bounty, target: bear, count: 3)
  - `defend_caravan.json` (escort, target: caravan route, count: 1)
  - `exterminate_rats.json` (extermination, target: rat, count: 15)
- [X] Add `contractId` references to `warden_holt` NPC dialogue in `content/dialogues/`.
- [X] Add cross-reference validation for contract `targetCreatureIds` references.
- [X] Add cross-reference validation for contract `rewardItems` references.
- [X] Write a passing integration test for contract content validation.
- [X] Run `bun run content:validate` and fix any errors.

## Acceptance criteria

- [X] 6 starter contracts exist and validate.
- [X] `warden_holt` NPC dialogue references contracts.
- [X] Cross-reference validation catches invalid references.
- [X] `bun run content:validate` passes with zero errors.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E20/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
