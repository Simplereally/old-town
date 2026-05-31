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

- [ ] Write a failing test for appearance system in `apps/server/src/systems/__tests__/appearance.test.ts`.
- [ ] Create `appearance-system.ts` in `apps/server/src/systems/`.
- [ ] Define equipment-to-appearance mapping: slot → model/texture/color overrides.
- [ ] Implement appearance update: when equipment changes, recalculate appearance.
- [ ] Send appearance update packet to all interested clients.
- [ ] Update `ClientPacketApplier.ts` to handle appearance updates.
- [ ] Write a passing test for appearance mapping.
- [ ] Write a passing test for appearance update on equip.
- [ ] Write a passing test for appearance update on unequip.
- [ ] Write a passing test for appearance packet broadcast.

## Acceptance criteria

- [ ] Equipment appearance mapping exists.
- [ ] Appearance updates on equipment change.
- [ ] Appearance packet is broadcast to interested clients.
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
- [ ] Move this story file to `tasks/completed/stories/E28/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
