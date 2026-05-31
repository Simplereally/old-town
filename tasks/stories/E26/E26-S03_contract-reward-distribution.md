# E26-S03 — Contract Reward Distribution

## Epic

E26 — Wardenry Contracts

## Dependency chain

- Depends on: E26-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 9)
- docs/content/action-wiring-audit.md
- docs/wardenry/contract-system.md

## Objective

Implement contract reward distribution. When a contract is completed, apply rewards (XP, items, reputation, currency) and update the contract state.

## Implementation checklist

- [ ] Write a failing test for contract rewards in `apps/server/src/systems/__tests__/contract-rewards.test.ts`.
- [ ] Extend `contract-system.ts` with reward application.
- [ ] Implement reward types: XP, items, reputation, currency, favour, unlocks.
- [ ] Ensure reward application is atomic.
- [ ] Send contract completion packet to client.
- [ ] Update Wardenry reputation and standing.
- [ ] Write a passing test for full reward application.
- [ ] Write a passing test for reputation update.
- [ ] Write a passing test for item reward.
- [ ] Write a passing test for contract completion packet.

## Acceptance criteria

- [ ] Contract rewards are applied atomically on completion.
- [ ] Reputation and standing are updated.
- [ ] Completion packet is sent to client.
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
- [ ] Move this story file to `tasks/completed/stories/E26/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
