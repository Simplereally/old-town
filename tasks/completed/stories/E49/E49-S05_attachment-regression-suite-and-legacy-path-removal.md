# E49-S05 — Attachment regression suite and legacy path removal

## Epic

E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: E49-S04
- Blocks: none (last story)

## Objective

Lock the rig in: delete every remnant of the fixed-offset attachment path, and add a regression suite that pins the attachment contract so future weapon/armour families cannot silently regress.

## Required work

- [X] Sweep `ActorRenderer.ts` for dead code: the old offset constants/comments ("attach to right arm (x=0.34)" etc.), any unused branches, and any `meshes.group.add(weaponMesh)`-style calls. `rg -n "ARM_Y \+ 0\.1|0\.34, ARM_Y" apps/client/src` must return only legitimate body-part placement (arms/armour torso), zero weapon/shield attachment sites.
- [X] Contract test file `apps/client/src/game/scene/ActorRenderer.attachment.test.ts`:
  - For **every** family id in `GLB_WEAPON_FAMILIES` (import from `WeaponGltfLoader.ts`): construct an asset id for one tier, call `setWeaponModel`, assert (a) a mesh was attached, (b) its parent is a hand socket, (c) its transform equals `resolveGrip(...)`. Run the loop in both `"glb"` and `"procedural"` modes (in tests GLB geometries won't be loaded, so `glbFamilies` will be empty and glb mode falls back to procedural geometry — assert the attachment path is still the socket either way; that fallback IS the contract).
  - Re-equip churn: equip → clear → equip a different family 20×, assert socket child count is always ≤ 1 and `weaponMeshes` map size is correct (leak check).
  - Pool churn: spawn/despawn an armed actor 20×, assert no orphaned weapon meshes remain in the scene graph (walk `scene.children` recursively counting meshes named "weapon").
- [X] Documentation: add a short "Equipment attachment" section to `AGENTS.md`'s architecture notes or a comment block atop `weapon-grips.ts` stating the rule: **all** hand-held equipment attaches via `handSocketR/L` + `GripSpec`; new families get a category default first, an override only if visibly wrong. Future agents must never attach equipment to `meshes.group`.
- [X] Run the full validation set and fix anything the sweep broke.

## Acceptance criteria

- [X] Zero fixed-offset attachment code remains.
- [X] Attachment contract test covers all 36 families × 2 modes and passes.
- [X] Leak/churn tests pass.
- [X] Documented rule exists for future agents.

## Validation commands

- `bun run test`
- `bun run typecheck`
- `bun run lint`
- `bun run render:boundaries`
