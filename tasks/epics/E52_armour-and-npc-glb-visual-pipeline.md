# E52 — Armour and NPC GLB Visual Pipeline

## Dependency chain

- Depends on: E49 (Unified Weapon and Equipment Attachment Rig) — attachment must be socket-based before armour GLBs land
- Unlocks: consistent visual identity across all equipment and creatures

## Spec references

- `apps/client/src/game/scene/WeaponGltfLoader.ts` — the proven GLB loading pattern to replicate (loads `.glb` per family from `/models/weapons/`, extracts first mesh `BufferGeometry`, registers via `replaceGeometryFactory` on `RenderResourceRegistry`; baked `COLOR_0` vertex colours + runtime tier tint via `vertexColors` Lambert material — one geometry per family serves all 13 tiers)
- `scripts/generate-weapon-models.sh` + `scripts/copy-weapon-models.ts` + `bun run weapons:build` — the asset build pattern to replicate
- `apps/client/src/game/scene/models/glb-materials.ts` — GLB material helpers
- `apps/client/src/game/ui/RenderSettings.ts` — persisted `weaponModels: "glb" | "procedural"` toggle to extend
- `apps/client/src/game/scene/models/armour-melee/register.ts` (+ armour-ranged) — current procedural armour registration
- `assets/items/models/*.glb` — existing weapon source assets (36 families)

## Epic goal

The weapon GLB pipeline (E41 + current WIP) proved the pattern: Blender-authored, vertex-coloured, tier-tinted GLBs swapped in over procedural geometry behind a settings toggle. Armour and creatures still look like programmer-art primitives. This epic extends the identical pattern to armour families and starter-region creatures, so equipped gear is identifiable at a glance and the world stops reading as a prototype.

## Non-negotiable pattern rules (repeat in every story)

- One GLB per family, baked `COLOR_0` vertex colours; tier differentiation is runtime tint only. Never one GLB per tier.
- GLBs override procedural geometry via `replaceGeometryFactory` under a `_glb`-suffixed contentId; procedural remains the fallback and the test-mode geometry. The toggle only swaps geometry+material source, never attachment or gameplay.
- Loading is async and non-blocking: the game renders procedural first and hot-swaps when GLBs arrive (verify this is how `WeaponGltfLoader` behaves and match it).
- Budget: `bun run stress:render:ci` must not regress. GLBs are low-poly (target < 1500 tris per armour piece, < 3000 per creature).

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E52/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E52-S01` — [Armour GLB asset generation pipeline](../stories/E52/E52-S01_armour-glb-asset-generation-pipeline.md)
- [ ] `E52-S02` — [ArmourGltfLoader and runtime override](../stories/E52/E52-S02_armour-gltf-loader-and-runtime-override.md)
- [ ] `E52-S03` — [Starter creature GLB bodies](../stories/E52/E52-S03_starter-creature-glb-bodies.md)
- [ ] `E52-S04` — [Render settings expansion and performance gate](../stories/E52/E52-S04_render-settings-expansion-and-performance-gate.md)

## Epic acceptance criteria

- [ ] Every armour family renders from a GLB in glb mode, correctly attached (E49 sockets/parts) and tier-tinted, with procedural fallback intact.
- [ ] `cellar_rat` and `mud_goblin` (minimum) render as authored GLB creatures with existing animations still functioning.
- [ ] Settings panel toggles weapon/armour/creature model sources independently and persists.
- [ ] `bun run stress:render:ci` budget holds.
