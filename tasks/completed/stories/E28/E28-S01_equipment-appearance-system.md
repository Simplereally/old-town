# E28-S01 — Equipment Appearance System

## Epic

E28 — Client UI and Visual Polish

## Dependency chain

- Depends on: E08-S03, E23-S03
- Blocks: E28-S02, E28-S03

## Spec references

- docs/content/runtime-gap-list.md (P2 gap 24)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement the equipment appearance system. Map equipped items to player appearance (model, texture, color) and send appearance updates to clients.

## Implementation checklist

- [X] Write a failing test for appearance system in `apps/server/src/systems/__tests__/appearance.test.ts`.
- [X] Create `appearance-system.ts` in `apps/server/src/systems/`.
- [X] Define equipment-to-appearance mapping: slot → model/texture/color overrides.
- [X] Implement appearance update: when equipment changes, recalculate appearance.
- [X] Send appearance update packet to all interested clients.
- [X] Update `ClientPacketApplier.ts` to handle appearance updates.
- [X] Write a passing test for appearance mapping.
- [X] Write a passing test for appearance update on equip.
- [X] Write a passing test for appearance update on unequip.
- [X] Write a passing test for appearance packet broadcast.

## Acceptance criteria

- [X] Equipment appearance mapping exists.
- [X] Appearance updates on equipment change.
- [X] Appearance packet is broadcast to interested clients.
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
- [X] Move this story file to `tasks/completed/stories/E28/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
