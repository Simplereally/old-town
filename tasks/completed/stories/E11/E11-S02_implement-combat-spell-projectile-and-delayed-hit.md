# E11-S02 — Implement combat spell projectile and delayed hit

## Epic

E11 — Magic, Projectiles, Line of Sight, and Teleports

## Dependency chain

- Depends on: E11-S01
- Blocks: next story in `E11` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §5
- POC_SPEC.md §10
- POC_SPEC.md §13
- POC_SPEC.md §17
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Make the starter attack spell spawn a projectile/graphic and resolve a delayed magic hit.

## Implementation checklist

- [X] Create projectile packet/delta contract if not already sufficient.
- [X] Spawn projectile visual event from caster tile to target tile/entity.
- [X] Enqueue PendingHit with magic style and spell max hit.
- [X] Apply magic attack/defence rolls and XP.
- [X] Emit cast animation, spot graphic, hitsplat, and XP drop.
- [X] Add tests for hit delay, target death before impact, and magic XP.

## Acceptance criteria

- [X] Casting starter spell visibly fires projectile and applies delayed damage.
- [X] Projectile is presentational; hit application is tick-scheduled server state.
- [X] Magic attack uses combat engine, not separate ad hoc damage path.

## Validation commands

- [X] `bun run test`
- [X] `bun run client:dev`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
