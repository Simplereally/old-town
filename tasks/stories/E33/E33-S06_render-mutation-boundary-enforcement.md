# E33-S06 - Render Mutation Boundary Enforcement

## Epic

E33 - Render Resource Registry, Instancing, and Pools

## Dependency chain

- Depends on: E33-S05
- Blocks: E34

## Spec references

- docs/technical/render-ecs-architecture.md
- docs/technical/performance-budgets.md

## Objective

Add automated boundary checks that prevent future code from importing Three or mutating renderer-owned objects outside approved render modules.

## Implementation checklist

- [ ] Create `scripts/assert-render-boundaries.ts`.
- [ ] Add a package script named `render:boundaries` that runs the assertion script.
- [ ] The script must fail if `packages/shared/**` imports `three` or `three/examples`.
- [ ] The script must fail if `apps/server/**` imports `three` or `three/examples`.
- [ ] The script must fail if `apps/client/src/game/net/**` imports `three` or `three/examples`; no type-only exceptions are allowed after E32 has moved packet ingestion to pure data.
- [ ] The script must fail if `apps/client/src/game/net/**` calls known scene-layer methods such as `actors.updateTile`, `objects.spawn`, `terrain.loadChunk`, `projectiles.spawn`, or `hitsplats.show`.
- [ ] The script must fail if `Object3D.position`, `Object3D.rotation`, `Object3D.scale`, `matrix`, `instanceMatrix`, or material mutation occurs outside `apps/client/src/game/renderer/**`, `apps/client/src/game/scene/**`, or explicitly named render tests.
- [ ] Add tests or fixture checks for the boundary script if the repo has a script-test pattern; otherwise document the fixture-free assertion logic in the script header.
- [ ] Add `bun run render:boundaries` to relevant validation documentation in `docs/technical/render-ecs-architecture.md` and `docs/technical/performance-budgets.md`.

## Acceptance criteria

- [ ] `bun run render:boundaries` passes on the current refactored code.
- [ ] Introducing a forbidden `three` import in shared/server/net code causes the script to fail.
- [ ] Introducing a packet-ingestion scene-layer mutation causes the script to fail.
- [ ] Approved render modules and render tests are not blocked.
- [ ] Boundary failures print file paths and concrete reasons.

## Validation commands

- [ ] `bun run render:boundaries`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
