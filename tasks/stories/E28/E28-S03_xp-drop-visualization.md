# E28-S03 — XP Drop Visualization

## Epic

E28 — Client UI and Visual Polish

## Dependency chain

- Depends on: E28-S02
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement XP drop visualization. Show floating XP numbers when skills gain XP.

## Implementation checklist

- [ ] Write a failing test for XP drop visualization.
- [ ] Define XP drop packet: `XpDrop` (skillId, amount).
- [ ] Handle XP drop packet in `ClientPacketApplier.ts`.
- [ ] Create client XP drop component: floating text with skill color.
- [ ] Animate XP drops: float up, fade out over 1-2 seconds.
- [ ] Write a passing test for XP drop packet.
- [ ] Write a passing test for XP drop rendering.
- [ ] Write a passing test for XP drop animation.
- [ ] Write a passing test for multiple simultaneous XP drops.

## Acceptance criteria

- [ ] XP drop packet is defined and handled.
- [ ] XP drops render as floating text.
- [ ] Animation works correctly.
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
