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

- [ ] Write a failing test for bank system in `apps/server/src/systems/__tests__/bank.test.ts`.
- [ ] Create `bank-system.ts` in `apps/server/src/systems/`.
- [ ] Define `bank` ECS component: array of `{ itemId, quantity, slot }` with capacity limit.
- [ ] Implement deposit logic: validate item in player inventory, remove from inventory, add to bank.
- [ ] Implement withdraw logic: validate item in bank, remove from bank, add to inventory (check space).
- [ ] Implement bank UI protocol packets: `BankOpen`, `BankUpdate`, `BankClose`.
- [ ] Write a passing test for deposit.
- [ ] Write a passing test for withdraw.
- [ ] Write a passing test for bank capacity limit.
- [ ] Write a passing test for bank packet serialization.

## Acceptance criteria

- [ ] Bank component exists with capacity limit.
- [ ] Deposit and withdraw work correctly with inventory sync.
- [ ] Bank UI packets are sent to client.
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
- [ ] Move this story file to `tasks/completed/stories/E22/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
