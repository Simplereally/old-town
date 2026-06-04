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

- [X] Create `scripts/assert-render-boundaries.ts`.
- [X] Add a package script named `render:boundaries` that runs the assertion script.
- [X] The script must fail if `packages/shared/**` imports `three` or `three/examples`.
- [X] The script must fail if `apps/server/**` imports `three` or `three/examples`.
- [X] The script must fail if `apps/client/src/game/net/**` imports `three` or `three/examples`; no type-only exceptions are allowed after E32 has moved packet ingestion to pure data.
- [X] The script must fail if `apps/client/src/game/net/**` calls known scene-layer methods such as `actors.updateTile`, `objects.spawn`, `terrain.loadChunk`, `projectiles.spawn`, or `hitsplats.show`.
- [X] The script must fail if `Object3D.position`, `Object3D.rotation`, `Object3D.scale`, `matrix`, `instanceMatrix`, or material mutation occurs outside `apps/client/src/game/renderer/**`, `apps/client/src/game/scene/**`, or explicitly named render tests.
- [X] Add tests or fixture checks for the boundary script if the repo has a script-test pattern; otherwise document the fixture-free assertion logic in the script header.
- [X] Add `bun run render:boundaries` to relevant validation documentation in `docs/technical/render-ecs-architecture.md` and `docs/technical/performance-budgets.md`.

## Acceptance criteria

- [X] `bun run render:boundaries` passes on the current refactored code.
- [X] Introducing a forbidden `three` import in shared/server/net code causes the script to fail.
- [X] Introducing a packet-ingestion scene-layer mutation causes the script to fail.
- [X] Approved render modules and render tests are not blocked.
- [X] Boundary failures print file paths and concrete reasons.

## Validation commands

- [X] `bun run render:boundaries`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E33/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
