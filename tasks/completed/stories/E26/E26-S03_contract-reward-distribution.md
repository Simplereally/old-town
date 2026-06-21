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

- [X] Write a failing test for contract rewards in `apps/server/src/systems/__tests__/contract-rewards.test.ts`.
- [X] Extend `contract-system.ts` with reward application.
- [X] Implement reward types: XP, items, reputation, currency, favour, unlocks.
- [X] Ensure reward application is atomic.
- [X] Send contract completion packet to client.
- [X] Update Wardenry reputation and standing.
- [X] Write a passing test for full reward application.
- [X] Write a passing test for reputation update.
- [X] Write a passing test for item reward.
- [X] Write a passing test for contract completion packet.

## Acceptance criteria

- [X] Contract rewards are applied atomically on completion.
- [X] Reputation and standing are updated.
- [X] Completion packet is sent to client.
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
- [ ] Move this story file to `tasks/completed/stories/E26/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
