# E49-S03 — Shields and off-hand attachments on sockets

## Epic

E49 — Unified Weapon and Equipment Attachment Rig

## Dependency chain

- Depends on: E49-S02
- Blocks: E49-S04

## Objective

Migrate the remaining hand-adjacent attachments — shields (and any other armour piece currently glued to `meshes.group` at arm coordinates) — onto the socket rig so they follow the left arm.

## Required work

- [X] Audit every attachment site in `setArmourModel`: for each slot, decide **body-relative** (head/torso/legs — stays on `meshes.group` or the body part mesh, unchanged) vs **limb-relative** (shield → `handSocketL`; `hands` gloves → follow both arms, see below).
- [X] Shield: attach to `handSocketL` with a `GripSpec` added to `weapon-grips.ts` (category `"shield"` — extend the `GripCategory` union). Shields face outward: start with `rotation [0, Math.PI / 2, 0]` and tune by eye.
- [X] Gloves (`hands` slot): the current single mesh at `(0, ARM_Y, 0)` cannot follow two arms. Either (a) split into two meshes parented to each arm mesh (not the sockets — gloves cover the forearm), or (b) if the glove geometry is a single combined shape, leave on `meshes.group` and file the split as a follow-up note in the epic. Prefer (a) only if the geometry factory already produces per-hand geometry — check `armour-melee/register.ts` before deciding; do not author new geometry in this story.
- [X] Removal paths: same audit as E49-S02 — every place that removes armour meshes must remove from the actual parent (use `mesh.parent?.remove(mesh)` pattern rather than assuming `meshes.group`). Apply this pattern to weapon removal too if not already done.
- [X] Update `ActorRenderer.equipment.test.ts` / armour tests: shield parent is `handSocketL`; despawn fully detaches all armour and weapon meshes (assert `socket.children.length === 0` after despawn).
- [X] Manual check with `bun run dev`: equip shield + 1H weapon; walk, attack; confirm shield rides the left arm and weapon the right.

## Acceptance criteria

- [X] Shield is a child of `handSocketL` and follows left-arm animation.
- [X] No armour/weapon mesh is ever orphaned after despawn or re-equip (pool reuse shows no ghost equipment — this is the classic pooling bug; test it explicitly).
- [X] All removal code uses parent-relative removal.

## Validation commands

- `bun run test`
- `bun run typecheck`
- `bun run lint`

## Completion note

Gloves (`gauntletsGeometry`) are a single combined mesh with both hands at ±0.34 — left on `meshes.group` (option b). Per-hand glove split deferred to a follow-up (E52 or later).
