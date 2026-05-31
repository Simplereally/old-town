# E22-S03 — Economy UI Protocol and Client Rendering

## Epic

E22 — Economy Runtime

## Dependency chain

- Depends on: E22-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P0 gaps 5, 7)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement the economy UI protocol and client rendering for bank and shop interfaces. Send bank and shop packets from server to client and render the UI panels.

## Implementation checklist

- [ ] Define bank UI protocol packets:
  - `BankOpen` (slots, capacity)
  - `BankUpdate` (slot, itemId, quantity)
  - `BankClose`
- [ ] Define shop UI protocol packets:
  - `ShopOpen` (shopId, name, stock array)
  - `ShopUpdate` (itemId, quantity, price)
  - `ShopClose`
- [ ] Write a failing test for economy packet serialization.
- [ ] Implement bank and shop packet handlers in `ClientPacketApplier.ts`.
- [ ] Create client bank UI panel: inventory grid, deposit/withdraw buttons.
- [ ] Create client shop UI panel: stock list, buy/sell buttons, price display.
- [ ] Write a passing test for bank packet roundtrip.
- [ ] Write a passing test for shop packet roundtrip.
- [ ] Write a passing test for bank UI rendering.
- [ ] Write a passing test for shop UI rendering.

## Acceptance criteria

- [ ] Bank and shop UI packets are defined and serialized correctly.
- [ ] Client renders bank and shop interfaces correctly.
- [ ] UI interactions send commands back to server.
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
