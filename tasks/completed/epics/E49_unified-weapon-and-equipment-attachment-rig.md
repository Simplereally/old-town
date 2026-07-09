# E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: E41 (Item Asset Pipeline and Equipment Visuals) — completed
- Unlocks: E52 (Armour and NPC GLB Visual Pipeline)

## Spec references

- `apps/client/src/game/scene/ActorRenderer.ts` — all work happens here plus its tests
- `apps/client/src/game/scene/WeaponGltfLoader.ts` — GLB geometry source (do not change its loading contract)
- `apps/client/src/game/scene/ActorRenderer.equipment.test.ts` — existing equipment tests to extend
- `POC_SPEC.md` §2.3 (600 ms tick) — animation is presentational only; never let it drive gameplay

## Epic goal

Equipped weapons currently look unequipped: they float near the torso and do not move when arms swing during walk/run/attack/cast animations. This epic replaces the fixed-offset attachment with a **hand-socket rig** so every weapon, shield, and off-hand focus — procedural or GLB, current or future — is parented to the animated arm and automatically follows every animation, with zero per-weapon animation code.

## Root cause (verified in code — cite these exact locations)

1. **Weapons parent to the actor root, not the arm.** `ActorRenderer.setWeaponModel` (~line 856) does `meshes.group.add(weaponMesh)` with a fixed offset: main hand `(0.34, ARM_Y + 0.15, 0.06)`, off-hand `(-0.34, ARM_Y + 0.1, 0.06)`. `ARM_Y = LEG_H + TORSO_H * 0.55 = 0.8025` (line 159, with `LEG_H = 0.5`, `TORSO_H = 0.55`).
2. **The offset is wrong even statically.** The arm geometry is `taperedBox(0.16, LEG_H, 0.22, 1.25)` (line ~1295) — 0.5 tall, centered on the arm mesh origin at `(±0.34, ARM_Y, 0)`. The hand (arm bottom) is therefore at world y ≈ 0.5525, but weapons sit at y = 0.9525 — mid-torso, above the hand.
3. **Animations move arms, never weapons.** The pose switch (~line 1700) animates `meshes.parts[3]` (leftArm) and `meshes.parts[4]` (rightArm): walk sets `position.z = ∓swing`, run sets `rotation.z`, attack sets `rightArm.rotation.x`, cast sets `leftArm.rotation.x`. The weapon mesh, being a sibling on `meshes.group`, never moves.
4. **Arms pivot at their center, not the shoulder.** Arm meshes sit at `(±0.34, ARM_Y, 0)` with centered geometry, so `rotation.x/z` teeters the arm around its midpoint instead of swinging from the shoulder. This makes attack swings look wrong even before weapons are considered.
5. **Shields have the same bug.** `setArmourModel` (~line 972) attaches the shield to `meshes.group` at `(-0.34, ARM_Y, 0.1)` (line ~1046).

## Target architecture

- Each humanoid gets two `THREE.Group` sockets — `handSocketR`, `handSocketL` — added as **children of the arm meshes** in `_createHumanoid` (~line 1525), positioned at the arm's local hand point `(0, -LEG_H / 2, 0)` (arm geometry is 0.5 tall, centered).
- `setWeaponModel` / shield path attach meshes to sockets instead of `meshes.group`. Weapon-local grip transforms (position/rotation relative to the socket) come from a small data-driven `GRIP` table keyed by weapon-family category (melee 1H, melee 2H, ranged bow, crossbow, magic staff/rod, off-hand focus, shield) with optional per-family overrides.
- Arm pivots move to the shoulder so all existing pose code produces correct swings, by translating the arm geometry down half its height and raising the arm mesh origin to the shoulder point — with all animation offsets updated to match.
- Pooling stays correct: sockets are created once per pooled humanoid, weapon meshes are removed on release, and pool reset code (~line 1650) keeps working unchanged apart from the new pivot constants.

## Follow-up notes

- Gloves (`hands` slot) remain on `meshes.group` as a single combined geometry; per-arm glove split deferred (geometry factory does not produce per-hand meshes).

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Move completed story files into `tasks/completed/stories/E49/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E49-S01` — [Hand sockets on the humanoid rig](../stories/E49/E49-S01_hand-sockets-on-the-humanoid-rig.md)
- [X] `E49-S02` — [Reparent weapons to hand sockets with data-driven grips](../stories/E49/E49-S02_reparent-weapons-to-hand-sockets-with-data-driven-grips.md)
- [X] `E49-S03` — [Shields and off-hand attachments on sockets](../stories/E49/E49-S03_shields-and-off-hand-attachments-on-sockets.md)
- [X] `E49-S04` — [Shoulder-pivot arms and weapon-carrying animations](../stories/E49/E49-S04_shoulder-pivot-arms-and-weapon-carrying-animations.md)
- [X] `E49-S05` — [Attachment regression suite and legacy path removal](../stories/E49/E49-S05_attachment-regression-suite-and-legacy-path-removal.md)

## Epic acceptance criteria

- [X] A weapon equipped on any actor is visibly held in the hand (at the arm's lower end), not floating at the torso.
- [X] During walk, run, attack, and cast animations the weapon moves rigidly with the hand.
- [X] Both GLB and procedural weapon modes (toggle in `RenderSettings`) attach identically — the mode only swaps geometry/material, never the attachment path.
- [X] Shields and off-hand foci attach to the left-hand socket and follow the left arm.
- [X] All 36 weapon families in `WeaponGltfLoader.GLB_WEAPON_FAMILIES` render with a sensible grip via the category defaults; per-family overrides exist only where the default looks wrong.
- [X] No fixed-offset attachment code remains in `ActorRenderer`.
- [X] `bun run test`, `bun run typecheck`, `bun run lint` pass.
