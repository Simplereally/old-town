# E52-S02 — ArmourGltfLoader and runtime override

## Epic

E52 — Armour and NPC GLB Visual Pipeline

## Dependency chain

- Depends on: E52-S01
- Blocks: E52-S03

## Objective

Load the armour GLBs at runtime and swap them over the procedural armour geometry, exactly as `WeaponGltfLoader` does for weapons — including live re-application to already-equipped actors.

## Implementation guidance

- **Clone `WeaponGltfLoader.ts` structurally** into `apps/client/src/game/scene/ArmourGltfLoader.ts`: `MODEL_BASE = "/models/armour/"`; family list imported from the S01 manifest; per-family async load; extract first mesh `BufferGeometry`; register via `registry.replaceGeometryFactory` under `model_<family>_glb`-style ids matching the procedural id scheme used by armour (verify the actual armour geometry key scheme in `armour-melee/register.ts` — armour keys may differ from weapon `model_<family>`; use whatever the armour registry uses, suffixed `_glb`).
- **Materials:** register `_glb` variants of armour tier materials using the same vertex-colour Lambert approach — reuse/extend `apps/client/src/game/scene/models/glb-materials.ts` rather than duplicating material construction.
- **ActorRenderer integration:** `setArmourModel` grows the same mode logic `setWeaponModel` has: `useGlb = this._armourModelMode === "glb" && this.glbArmourFamilies.has(family)`. Add `setArmourModelMode(mode)` that re-applies armour for all active actors — mirror `setWeaponModelMode` (~line 945), including remembering last-applied armour asset ids per entity/slot (add `armourModelAssetIds` mirroring `weaponModelAssetIds`).
- **Hot-swap:** whatever mechanism makes weapons upgrade from procedural→GLB when loading finishes (find the caller of `WeaponGltfLoader` load completion in `GameEngine.ts` / renderer bootstrap) — hook armour into the same completion path.
- **Failure tolerance:** a missing/corrupt GLB for one family must fall back to procedural for that family only, warn once, and not affect others (this is the weapon loader's contract — preserve it).

## Required work

- [ ] `ArmourGltfLoader.ts` + material registration + bootstrap wiring.
- [ ] `setArmourModel` mode support + `setArmourModelMode` + re-application state.
- [ ] Tests mirroring the weapon loader's tests (find them: `rg -ln "WeaponGltfLoader" apps/client/src --glob '*.test.ts'`): family registration, fallback on load failure, mode toggle re-applies to live actors, attachment parent unchanged by mode (socket/part per E49 — assert explicitly).
- [ ] Manual QA: `bun run dev`, equip full armour set, toggle glb/procedural live, walk/attack — no popping except the geometry swap itself, no detached pieces.

## Acceptance criteria

- [ ] Armour renders from GLBs in glb mode with correct tier tint; per-family fallback works.
- [ ] Mode toggle re-dresses every active actor immediately.
- [ ] Attachment topology (E49) is provably independent of geometry mode.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
