# E22-S01 — Bank Storage System Runtime

## Epic

E22 — Economy Runtime

## Dependency chain

- Depends on: E16-S02
- Blocks: E22-S02, E22-S03

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 5)
- docs/content/action-wiring-audit.md (action IDs: `bank`, `deposit`, `withdraw`)
- docs/economy/banks-storage-and-reclaim.md

## Objective

Implement the bank storage system runtime: bank inventory component, deposit/withdraw logic, and bank UI protocol. This closes the gap where the `bank` action emits "not yet implemented."

## Implementation checklist

- [X] Write a failing test for bank system in `apps/server/src/systems/__tests__/bank.test.ts`.
- [X] Create `bank-system.ts` in `apps/server/src/systems/`.
- [X] Define `bank` ECS component: array of `{ itemId, quantity, slot }` with capacity limit.
- [X] Implement deposit logic: validate item in player inventory, remove from inventory, add to bank.
- [X] Implement withdraw logic: validate item in bank, remove from bank, add to inventory (check space).
- [X] Implement bank UI protocol packets: `BankOpen`, `BankUpdate`, `BankClose`.
- [X] Write a passing test for deposit.
- [X] Write a passing test for withdraw.
- [X] Write a passing test for bank capacity limit.
- [X] Write a passing test for bank packet serialization.

## Acceptance criteria

- [X] Bank component exists with capacity limit.
- [X] Deposit and withdraw work correctly with inventory sync.
- [X] Bank UI packets are sent to client.
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
- [X] Move this story file to `tasks/completed/stories/E22/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
