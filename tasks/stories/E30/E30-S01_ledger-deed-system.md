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

- [ ] Write a failing test for ledger deeds in `apps/server/src/systems/__tests__/ledger.test.ts`.
- [ ] Create `ledger-system.ts` in `apps/server/src/systems/`.
- [ ] Define deed schema: `id`, `propertyId`, `ownerId`, `issuedTick`, `expiryTick`, `transferable`.
- [ ] Implement deed creation: validate property, create deed item.
- [ ] Implement deed transfer: trade deed item, update owner.
- [ ] Implement deed redemption: consume deed, grant property rights.
- [ ] Write a passing test for deed creation.
- [ ] Write a passing test for deed transfer.
- [ ] Write a passing test for deed redemption.
- [ ] Write a passing test for deed expiry.

## Acceptance criteria

- [ ] Deed schema exists and is validated.
- [ ] Deed creation, transfer, and redemption work.
- [ ] Deed expiry is handled.
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
- [ ] Move this story file to `tasks/completed/stories/E30/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
