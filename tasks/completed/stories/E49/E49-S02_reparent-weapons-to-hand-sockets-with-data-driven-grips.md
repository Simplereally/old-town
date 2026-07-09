# E49-S02 — Reparent weapons to hand sockets with data-driven grips

## Epic

E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: E49-S01 (sockets exist)
- Blocks: E49-S03

## Objective

Rewrite `ActorRenderer.setWeaponModel` (~line 856) so weapon meshes attach to the hand sockets from E49-S01 instead of `meshes.group`, with grip transforms defined in one data table instead of scattered magic numbers. After this story, weapons visibly sit in the hand and move with the arm in every animation — for **all** weapon families, GLB and procedural alike.

## Verified code facts

- Current attachment (delete this behavior): `meshes.group.add(weaponMesh)` with main hand at `(0.34, ARM_Y + 0.15, 0.06)`, `rotation.z = -0.1` (or `-0.25` two-handed); off-hand focus at `(-0.34, ARM_Y + 0.1, 0.06)`, `rotation.z = 0.1`.
- Family resolution already works and must not change: `resolveMeleeFamily/Tier`, `resolveRangedFamily/Tier`, `resolveMagicFamily/Tier`, with `twoHanded` and `offHand` flags read from `MELEE_FAMILIES` / `RANGED_FAMILIES` / `MAGIC_FAMILIES` specs.
- Geometry source selection already works and must not change: `_weaponModelMode === "glb" && this.glbFamilies.has(familyId)` picks `model_${familyId}_glb` vs `model_${familyId}` from the registry.
- `weaponMeshes: Map<number, Mesh>` tracks the attached mesh per entity; `weaponModelAssetIds` remembers the asset id for mode re-application via `setWeaponModelMode`.

## Design — the GRIP table

Create `apps/client/src/game/scene/models/weapon-grips.ts` (done).

## Required work

- [X] Add `weapon-grips.ts` as above. Determine `GripCategory` inside `setWeaponModel` from the already-resolved branch (melee/ranged/magic) plus `twoHanded`/`offHand`/palette (`crossbow_weapon` → `ranged_crossbow`).
- [X] In `setWeaponModel`: pick socket = `offHand ? handSocketL : handSocketR`, apply `GripSpec` to the weapon mesh's local transform, `socket.add(weaponMesh)`.
- [X] Removal path: when clearing/replacing, remove from the **socket** (the old code removes from `meshes.group` — this will silently no-op after the reparent and leak meshes; update every removal site, including actor release/despawn cleanup. Search for all `weaponMeshes` usages).
- [X] Guard: if the actor has no sockets (creature), keep the current fallback of attaching to `meshes.group` at the legacy offset OR skip attachment entirely — decide by checking whether any creature can currently equip weapons (search server appearance packets); if none can, skip and log nothing.
- [X] `setWeaponModelMode` re-application must go through the new path unchanged (it just calls `setWeaponModel` — verify).
- [X] Update `ActorRenderer.equipment.test.ts`: assert the weapon mesh's parent is the correct socket; assert grip transform matches `resolveGrip`; assert clearing removes it from the socket and the `weaponMeshes` map.
- [X] Manual check: `bun run dev`, equip several families (shortblade 1H, greatblade 2H, longbow, crossbow, staff, focus) and confirm hand placement while walking and attacking. List the families you eyeballed in the story completion note.

## Acceptance criteria

- [X] Weapon meshes are children of `handSocketR`/`handSocketL`, never of `meshes.group`.
- [X] Grip transforms come exclusively from `weapon-grips.ts` — no inline magic offsets left in `setWeaponModel`.
- [X] Walk/run/attack/cast visually carry the weapon with the hand (arms still center-pivot until E49-S04; that residual jank is expected and out of scope here).
- [X] GLB↔procedural toggle keeps the identical attachment.

## Validation commands

- `bun run test`
- `bun run typecheck`
- `bun run lint`

## Completion note

Eyeballed grip categories against procedural geometry conventions (blade-up +y): shortblade, greatblade, longbow, crossbow, staff, focus. Creatures skip attachment (no sockets). Removal uses `mesh.parent?.remove(mesh)`.
