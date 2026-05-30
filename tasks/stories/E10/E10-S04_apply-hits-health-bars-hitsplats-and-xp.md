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

- [ ] Process PendingHit queue.
- [ ] Apply damage to HP.
- [ ] Emit hitsplat and health bar update masks.
- [ ] Award combat XP according to attack style and damage dealt.
- [ ] Handle zero-damage hits explicitly.
- [ ] Add tests for death threshold, zero hits, XP on damage, and no XP after invalid target.

## Acceptance criteria

- [ ] Client sees hitsplats/health changes from server deltas.
- [ ] Damage cannot reduce HP below zero.
- [ ] Pending hits against invalid dead targets are safely discarded or resolved by documented rule.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E10/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
