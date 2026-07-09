# E52-S01 — Armour GLB asset generation pipeline

## Epic

E52 — Armour and NPC GLB Visual Pipeline

## Dependency chain

- Depends on: E49 complete
- Blocks: E52-S02

## Objective

Author/generate one low-poly GLB per armour family with baked vertex colours, produced by the same scripted Blender pipeline as weapons, landing in `assets/` and copied to the client public dir by a build script.

## Implementation guidance

- **Read the weapon pipeline first and clone its shape exactly:** `scripts/generate-weapon-models.sh` (how Blender is invoked, where the Python generator lives, naming/compression conventions) and `scripts/copy-weapon-models.ts` (source → `apps/client/public/models/weapons/` mapping). Produce the armour analogues: generator target `assets/armour/models/<family>.glb`, copy script target `apps/client/public/models/armour/`, npm scripts `armour:generate`, `armour:copy`, `armour:build` mirroring `weapons:*`.
- **Family list = whatever the procedural registry defines.** Enumerate from `apps/client/src/game/scene/models/armour-melee/register.ts` and `armour-ranged/register.ts` (slots like head/torso/legs/shield etc. per material line). The GLB family ids must match the procedural contentIds exactly (loader in S02 keys on them). Emit the definitive list into a checked-in manifest `assets/armour/models/manifest.json` (`{ families: string[] }`) that S02's loader and tests import — single source of truth, no drift.
- **Geometry requirements:** each piece modeled to fit the humanoid rig dimensions in `ActorRenderer.ts` (`LEG_H = 0.5`, `TORSO_H = 0.55`, arm/torso positions at lines ~154–160 and `_createHumanoid` ~line 1525) so runtime placement needs no per-family fudge transforms. Origin conventions: torso pieces origin at torso center; head pieces at head center; shield at grip point (it attaches to `handSocketL` per E49-S03). Document the origin convention in the generator source.
- **Vertex colours:** bake region colours into `COLOR_0` exactly as weapons do (inspect one weapon GLB's generator code for the mechanism). Tier tint is runtime — keep base colours near-white/grey where tint should apply.
- **Budget:** < 1500 tris per piece; the copy script should print tri counts and fail over budget (extend it — weapons copy script may already do validation; check `scripts/validate-item-assets.ts` for reusable validation).

## Required work

- [ ] Generator + copy scripts + `armour:*` npm scripts.
- [ ] All armour families generated, manifest committed, assets in `assets/armour/models/` and copied to `apps/client/public/models/armour/`.
- [ ] Tri-count/size validation in the copy step.
- [ ] A short `assets/armour/README.md`: how to regenerate, origin conventions, budget.

## Acceptance criteria

- [ ] `bun run armour:build` is idempotent and produces every family in the manifest.
- [ ] Manifest ids exactly match procedural armour contentIds (write a unit test that cross-checks the manifest against the registered procedural families).

## Validation commands

- `bun run armour:build`
- `bun run test && bun run typecheck && bun run lint`
