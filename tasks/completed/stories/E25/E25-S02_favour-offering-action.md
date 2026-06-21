# E25-S02 — Favour Offering Action

## Epic

E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E25-S01
- Blocks: E25-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 8)
- docs/content/action-wiring-audit.md (action IDs: `pray`, `offer`)
- docs/favour/favour-system.md

## Objective

Implement the Favour offering action. When a player prays at a shrine or hearth, consume an offering item and grant Favour XP.

## Implementation checklist

- [X] Write a failing test for favour offering in `apps/server/src/systems/__tests__/favour.test.ts`.
- [X] Create `favour-system.ts` in `apps/server/src/systems/`.
- [X] Implement `pray` action handler: validate shrine/hearth object, validate offering item in inventory.
- [X] Consume offering item and award Favour XP based on offering value.
- [X] Update Favour level if XP threshold crossed.
- [X] Send Favour update packet to client.
- [X] Write a passing test for pray at shrine.
- [X] Write a passing test for offering consumption.
- [X] Write a passing test for Favour XP award.
- [X] Write a passing test for Favour level up.

## Acceptance criteria

- [X] Pray action at shrine/hearth consumes offering and awards Favour XP.
- [X] Favour level updates correctly.
- [X] Favour update is sent to client.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
