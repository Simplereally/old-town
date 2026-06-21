# E26-S01 — Contract Runtime State Machine

## Epic

E26 — Wardenry Contracts

## Dependency chain

- Depends on: E20-S01, E21-S02
- Blocks: E26-S02, E26-S03

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 9)
- docs/content/action-wiring-audit.md (action IDs: `read`, `accept` on Warden board)
- docs/wardenry/contract-system.md

## Objective

Implement the Wardenry contract runtime state machine. When a player accepts a contract from a Warden board, create a contract instance and track its state.

## Implementation checklist

- [X] Write a failing test for contract state machine in `apps/server/src/systems/__tests__/contract.test.ts`.
- [X] Create `contract-system.ts` in `apps/server/src/systems/`.
- [X] Define `contract` ECS component: `contractId`, `status` (`available`, `accepted`, `completed`, `expired`), `objectives`, `startTick`, `expiryTick`.
- [X] Implement contract acceptance: validate requirements, create contract component, deduct cost if any.
- [X] Implement contract expiry: check expiry tick, mark expired if past.
- [X] Write a passing test for contract acceptance.
- [X] Write a passing test for contract state transitions.
- [X] Write a passing test for contract expiry.
- [X] Write a passing test for contract requirement validation.

## Acceptance criteria

- [X] Contract state machine handles `available` → `accepted` → `completed`/`expired`.
- [X] Contract acceptance validates requirements.
- [X] Contract expiry is checked on tick.
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
- [X] Move this story file to `tasks/completed/stories/E26/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
