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

- [ ] Write a failing test for favour offering in `apps/server/src/systems/__tests__/favour.test.ts`.
- [ ] Create `favour-system.ts` in `apps/server/src/systems/`.
- [ ] Implement `pray` action handler: validate shrine/hearth object, validate offering item in inventory.
- [ ] Consume offering item and award Favour XP based on offering value.
- [ ] Update Favour level if XP threshold crossed.
- [ ] Send Favour update packet to client.
- [ ] Write a passing test for pray at shrine.
- [ ] Write a passing test for offering consumption.
- [ ] Write a passing test for Favour XP award.
- [ ] Write a passing test for Favour level up.

## Acceptance criteria

- [ ] Pray action at shrine/hearth consumes offering and awards Favour XP.
- [ ] Favour level updates correctly.
- [ ] Favour update is sent to client.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
