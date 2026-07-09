# E53 — Unique Building GLB Pipeline

## Dependency chain

- Depends on: none hard (E52 shares the GLB pattern but is independent)
- Unlocks: E55 (District Layout Overhaul) — E55 places these buildings

## Spec references

- **Load the `old-town-asset-craft` skill (`.claude/skills/old-town-asset-craft/SKILL.md`) before starting any story in this epic** — it is the binding asset doctrine (pipeline contract, art direction, budgets, validation gates).
- **`docs/world/starter-buildings-visual-spec.md` — THE design authority for this epic.** All 22
  archetypes, footprints, heights, palette hexes, tri budgets, and modelling conventions are
  specified there. Do not invent designs; implement that file.
- `scripts/generate-weapon-models.py` + `scripts/generate-weapon-models.sh` + `scripts/copy-weapon-models.ts` — pipeline pattern to mirror
- `apps/client/src/game/scene/WeaponGltfLoader.ts` — loader pattern (async load, extract `BufferGeometry`, `registry.replaceGeometryFactory`, per-family fallback)
- `apps/client/src/game/scene/ObjectRenderer.ts` — `resolveArchetype` (line ~31, keyword matching), `buildGeometry` (line ~77), `_ensureArchetypeRegistered` (line ~591)
- `apps/client/src/game/ui/RenderSettings.ts` — settings toggle pattern
- `packages/shared/src/content-schemas/` — object def schema (find the objects schema file; footprint/collision fields)

## Epic goal

Every unique building in the starter world gets an authored GLB model with a procedural
fallback, loaded and rendered through the same proven override pattern as weapons. This epic
delivers the **pipeline and the content defs**; placing buildings in the world is E55.

## Corrections to the original plan (do not re-introduce)

- Content object defs and procedural fallbacks come FIRST (S01), so E55 layout work is never
  blocked on Blender. GLB generation (S02) can proceed in parallel after S01.
- The registry override key must follow the weapon convention (`replaceGeometryFactory` on the
  archetype's existing prop key with a `_glb` suffix or mode check — decide in S03 by reading
  how `_ensureArchetypeRegistered` resolves keys, and match `WeaponGltfLoader`'s exact
  mechanism rather than the plan's invented `building_glb_<archetype>` key).

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E53/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E53-S01` — [Building object defs and procedural fallback archetypes](../stories/E53/E53-S01_building-object-defs-and-procedural-fallback-archetypes.md)
- [X] `E53-S02` — [Blender building generator and copy script](../completed/stories/E53/E53-S02_blender-building-generator-and-copy-script.md) — **done 2026-07-04, delivered ahead of S01; all 22 GLBs authored, previewed, and copied. S01 must use the manifest's archetype ids verbatim.**
- [ ] `E53-S03` — [BuildingGltfLoader and ObjectRenderer GLB preference](../stories/E53/E53-S03_building-gltf-loader-and-objectrenderer-glb-preference.md)
- [ ] `E53-S04` — [Building pipeline tests and performance gate](../stories/E53/E53-S04_building-pipeline-tests-and-performance-gate.md)

## Epic acceptance criteria

- [ ] All 22 archetypes from the visual spec exist as content object defs with correct footprints/collision, procedural fallback geometry, and authored GLBs.
- [ ] GLBs override procedural at runtime behind a persisted settings toggle; per-archetype fallback on load failure.
- [ ] Gatehouse arch tile is walk-through (geometry-free at passage height) in both modes.
- [ ] `bun run stress:render:ci` budget holds with all buildings instanced in a stress scene.
- [ ] `bun run test && bun run typecheck && bun run lint && bun run content:validate` pass.
