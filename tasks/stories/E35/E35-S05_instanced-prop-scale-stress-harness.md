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

- [ ] Write tests in `apps/client/src/game/renderer/stress/instanced-props.stress.test.ts`.
- [ ] Create `apps/client/src/game/renderer/stress/InstancedPropHarness.ts`.
- [ ] Generate at least 10k deterministic prop instances across multiple archetype/material/region/layer bucket keys.
- [ ] Exercise spawn, transform update, color/seed update, release, re-acquire, and bucket flush.
- [ ] Assert bucket count matches unique keys.
- [ ] Assert each dirty bucket sets `needsUpdate` at most once per frame.
- [ ] Assert update ranges and bounds-dirty flags are set/cleared according to `InstanceBucket` policy.
- [ ] Assert stats report visible props, active slots, bucket count, dirty bucket count, and flush duration.
- [ ] Add `stress:render:props-browser` package script or a documented dev route that creates the 30k prop browser scenario; if the script cannot run headlessly, it must print the local URL and exact manual pass/fail metrics.
- [ ] Document expected POC and stress draw-call targets in the test or route header.

## Acceptance criteria

- [ ] 10k prop CI stress path passes without requiring real packet/network input.
- [ ] Bucket keys group instances exactly by archetype/material/region/layer.
- [ ] Batched flush semantics are proven by tests.
- [ ] Bounds and update range behavior is covered.
- [ ] 30k manual/browser scenario is available through a script or route with exact pass/fail metrics.

## Validation commands

- [ ] `bun run test -- apps/client/src/game/renderer/stress/instanced-props.stress.test.ts`
- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run render:boundaries`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E35/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
