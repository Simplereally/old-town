# E10-S04 — Apply hits, health bars, hitsplats, and XP

## Epic

E10 — NPC AI, Combat, Death, Drops, and Respawn

## Dependency chain

- Depends on: E10-S03
- Blocks: next story in `E10` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §14
- POC_SPEC.md §21
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Apply pending hits in the correct phase and emit combat feedback packets.

## Implementation checklist

- [X] Process PendingHit queue.
- [X] Apply damage to HP.
- [X] Emit hitsplat and health bar update masks.
- [X] Award combat XP according to attack style and damage dealt.
- [X] Handle zero-damage hits explicitly.
- [X] Add tests for death threshold, zero hits, XP on damage, and no XP after invalid target.

## Acceptance criteria

- [X] Client sees hitsplats/health changes from server deltas.
- [X] Damage cannot reduce HP below zero.
- [X] Pending hits against invalid dead targets are safely discarded or resolved by documented rule.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
