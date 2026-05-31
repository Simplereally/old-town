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

- [X] Define bank UI protocol packets:
  - `BankOpen` (slots, capacity)
  - `BankUpdate` (slot, itemId, quantity)
  - `BankClose`
- [X] Define shop UI protocol packets:
  - `ShopOpen` (shopId, name, stock array)
  - `ShopUpdate` (itemId, quantity, price)
  - `ShopClose`
- [X] Write a failing test for economy packet serialization.
- [X] Implement bank and shop packet handlers in `ClientPacketApplier.ts`.
- [X] Create client bank UI panel: inventory grid, deposit/withdraw buttons.
- [X] Create client shop UI panel: stock list, buy/sell buttons, price display.
- [X] Write a passing test for bank packet roundtrip.
- [X] Write a passing test for shop packet roundtrip.
- [X] Write a passing test for bank UI rendering.
- [X] Write a passing test for shop UI rendering.

## Acceptance criteria

- [X] Bank and shop UI packets are defined and serialized correctly.
- [X] Client renders bank and shop interfaces correctly.
- [X] UI interactions send commands back to server.
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
