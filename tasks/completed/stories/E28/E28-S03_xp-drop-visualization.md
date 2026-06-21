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

- [X] Write a failing test for XP drop visualization.
- [X] Define XP drop packet: `XpDrop` (skillId, amount).
- [X] Handle XP drop packet in `ClientPacketApplier.ts`.
- [X] Create client XP drop component: floating text with skill color.
- [X] Animate XP drops: float up, fade out over 1-2 seconds.
- [X] Write a passing test for XP drop packet.
- [X] Write a passing test for XP drop rendering.
- [X] Write a passing test for XP drop animation.
- [X] Write a passing test for multiple simultaneous XP drops.

## Acceptance criteria

- [X] XP drop packet is defined and handled.
- [X] XP drops render as floating text.
- [X] Animation works correctly.
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
