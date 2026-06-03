# E30-S01 — Ledger Deed System

## Epic

E30 — World Expansion Systems

## Dependency chain

- Depends on: E26-S03
- Blocks: E30-S02

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 16)
- docs/world/ledger-deeds.md

## Objective

Implement the Ledger deed system. Players can create, trade, and redeem deeds for property ownership.

## Implementation checklist

- [X] Write a failing test for ledger deeds in `apps/server/src/systems/__tests__/ledger.test.ts`.
- [X] Create `ledger-system.ts` in `apps/server/src/systems/`.
- [X] Define deed schema: `id`, `propertyId`, `ownerId`, `issuedTick`, `expiryTick`, `transferable`.
- [X] Implement deed creation: validate property, create deed item.
- [X] Implement deed transfer: trade deed item, update owner.
- [X] Implement deed redemption: consume deed, grant property rights.
- [X] Write a passing test for deed creation.
- [X] Write a passing test for deed transfer.
- [X] Write a passing test for deed redemption.
- [X] Write a passing test for deed expiry.

## Acceptance criteria

- [X] Deed schema exists and is validated.
- [X] Deed creation, transfer, and redemption work.
- [X] Deed expiry is handled.
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
- [X] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
