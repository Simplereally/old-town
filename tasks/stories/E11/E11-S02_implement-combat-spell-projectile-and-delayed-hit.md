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

- [ ] Create projectile packet/delta contract if not already sufficient.
- [ ] Spawn projectile visual event from caster tile to target tile/entity.
- [ ] Enqueue PendingHit with magic style and spell max hit.
- [ ] Apply magic attack/defence rolls and XP.
- [ ] Emit cast animation, spot graphic, hitsplat, and XP drop.
- [ ] Add tests for hit delay, target death before impact, and magic XP.

## Acceptance criteria

- [ ] Casting starter spell visibly fires projectile and applies delayed damage.
- [ ] Projectile is presentational; hit application is tick-scheduled server state.
- [ ] Magic attack uses combat engine, not separate ad hoc damage path.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run client:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E11/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
