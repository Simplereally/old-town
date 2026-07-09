# E49-S01 — Hand sockets on the humanoid rig

## Epic

E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: none (first story)
- Blocks: E49-S02

## Objective

Add named `THREE.Group` hand sockets to the humanoid rig in `ActorRenderer` so later stories can parent weapons/shields to the animated arms. No visual change in this story — sockets are empty.

## Verified code facts (do not re-derive)

- Humanoids are built in `ActorRenderer._createHumanoid` (`apps/client/src/game/scene/ActorRenderer.ts`, ~line 1525). Arms: `leftArm` at `(-0.34, ARM_Y, 0)`, `rightArm` at `(0.34, ARM_Y, 0)`, both `Mesh(this.armGeometry, ...)` and pushed into `parts` as indices 3 and 4 (`parts = [head, leftLeg, rightLeg, leftArm, rightArm]`).
- Arm geometry is `taperedBox(0.16, LEG_H, 0.22, 1.25)` — height `LEG_H = 0.5`, centered on the mesh origin. So in arm-local space the hand point is `(0, -0.25, 0)`.
- Humanoids are pooled: pool reset (~line 1650–1670) resets each part's position/rotation. Creatures (non-humanoid) have `parts.length === 0` paths — sockets are humanoid-only.

## Required work

- [X] In `_createHumanoid`, after creating the arm meshes, create two `Group`s:
  - `const handSocketR = new Group(); handSocketR.name = "handSocketR"; handSocketR.position.set(0, -LEG_H / 2, 0); rightArm.add(handSocketR);`
  - Mirror for `handSocketL` on `leftArm`.
- [X] Store socket references on the per-actor mesh record (the same structure that holds `group`, `body`, `parts` — find its type/interface and add `handSocketR?: Group; handSocketL?: Group`). Do **not** rely on `getObjectByName` at runtime (per-frame lookups are O(n) traversals).
- [X] Pool safety: verify the pool reset path does not strip children of arm meshes. If release code does anything like `arm.clear()`, exclude sockets. Sockets must survive acquire→release→acquire cycles with their local transform intact; add the reset of socket transforms (`position.set(0, -LEG_H/2, 0)`, `rotation.set(0,0,0)`) to the same block that resets arm transforms (~line 1650).
- [X] Add a test-visible accessor, e.g. `getHandSocket(entityId: number, hand: "main" | "off"): Group | undefined` ("main" = right, "off" = left). Follow the style of existing helpers like `hasWeaponMesh` (~line 959).
- [X] Tests (extend `ActorRenderer.test.ts` or a new `ActorRenderer.sockets.test.ts`, following the existing fake-registry test setup in `ActorRenderer.equipment.test.ts`):
  - Spawning a humanoid actor creates both sockets as children of the correct arm mesh at local `(0, -0.25, 0)`.
  - Releasing the actor to the pool and spawning a new one reuses/recreates sockets correctly (transform reset).
  - Creature (non-humanoid) actors have no sockets and `getHandSocket` returns `undefined` without throwing.

## Acceptance criteria

- [X] Both sockets exist on every humanoid, parented to arm meshes, at the hand point.
- [X] Pool round-trips leave socket transforms pristine.
- [X] No behavior/visual change for existing rendering (all existing ActorRenderer tests still pass).

## Validation commands

- `bun run test --filter @old-town/client` (or `bun run test` at root)
- `bun run typecheck`
- `bun run lint`
