# E49-S04 — Shoulder-pivot arms and weapon-carrying animations

## Epic

E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: E49-S03
- Blocks: E49-S05

## Objective

Fix the arm pivot so arms rotate from the shoulder instead of teetering around their midpoint, and retune the pose animations so attack/cast swings look like actual swings that carry the weapon through an arc.

## Required work

- [X] Implement steps 1–6 (geometry translate, SHOULDER_Y placement, hand socket at -LEG_H, pool reset, animation retune, glove offset verify).
- [X] Update all tests asserting arm positions (`ActorRenderer.test.ts`, pooling tests) to `SHOULDER_Y` and the new socket local position.
- [X] Add a test: during an `attack` pose frame, the world position of `handSocketR` differs from its idle world position (proves the socket — and thus the weapon — travels with the swing). Use `socket.getWorldPosition(new Vector3())` after `updateMatrixWorld()`.
- [X] Manual QA in `bun run dev`: idle, walk, run, melee attack with 1H and 2H, bow attack, cast. The weapon must trace the arm arc with no detachment or popping when the pose changes or when the actor is pooled/reused.

## Acceptance criteria

- [X] Arms rotate about the shoulder in all poses; no midpoint teeter remains.
- [X] Weapons and shields visibly swing with attacks and pump with run.
- [X] Pool reuse produces identical rest pose (no drift after N acquire/release cycles — assert in a loop test).

## Validation commands

- `bun run test`
- `bun run typecheck`
- `bun run lint`
- `bun run stress:render:ci` (must not regress the render budget)
