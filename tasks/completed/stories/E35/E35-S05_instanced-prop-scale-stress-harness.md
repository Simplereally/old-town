# E35-S05 - Instanced Prop Scale Stress Harness

## Epic

E35 - Rendering Diagnostics and Stress Gates

## Dependency chain

- Depends on: E35-S04
- Blocks: E35-S06

## Spec references

- docs/technical/asset-baking-and-instancing.md
- docs/technical/performance-budgets.md
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html

## Objective

Add deterministic stress coverage for thousands of instanced props and bucket updates, including a CI-friendly 10k path and an optional/manual 30k browser path.

## Implementation checklist

- [X] Write tests in `apps/client/src/game/renderer/stress/instanced-props.stress.test.ts`.
- [X] Create `apps/client/src/game/renderer/stress/InstancedPropHarness.ts`.
- [X] Generate at least 10k deterministic prop instances across multiple archetype/material/region/layer bucket keys.
- [X] Exercise spawn, transform update, color/seed update, release, re-acquire, and bucket flush.
- [X] Assert bucket count matches unique keys.
- [X] Assert each dirty bucket sets `needsUpdate` at most once per frame.
- [X] Assert update ranges and bounds-dirty flags are set/cleared according to `InstanceBucket` policy.
- [X] Assert stats report visible props, active slots, bucket count, dirty bucket count, and flush duration.
- [X] Add `stress:render:props-browser` package script or a documented dev route that creates the 30k prop browser scenario; if the script cannot run headlessly, it must print the local URL and exact manual pass/fail metrics.
- [X] Document expected POC and stress draw-call targets in the test or route header.

## Acceptance criteria

- [X] 10k prop CI stress path passes without requiring real packet/network input.
- [X] Bucket keys group instances exactly by archetype/material/region/layer.
- [X] Batched flush semantics are proven by tests.
- [X] Bounds and update range behavior is covered.
- [X] 30k manual/browser scenario is available through a script or route with exact pass/fail metrics.

## Validation commands

- [X] `bun run test -- apps/client/src/game/renderer/stress/instanced-props.stress.test.ts`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run render:boundaries`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
