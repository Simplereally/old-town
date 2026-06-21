# E42-S01 — Ground material registry and tile material mapping

## Epic

E42 — Old Town Terrain and District Identity

## Dependency chain

- Depends on: E34-S06 (Asset Failure and Context Recovery), E33-S01 (Render Resource Registry), E17-S03 (Validate Map Environment Content)
- Blocks: E42-S02, E42-S03, E42-S04, E42-S05

## Spec references

- `POC_SPEC.md` §5.1 (Tile data — `underlayId`, `overlayId`)
- `POC_SPEC.md` §19.2 (Runtime registries — MapRegistry, material registry concept)
- `docs/world/districts-and-routes.md` — district visual identity
- `scripts/generate-old-town-map.ts` — terrain overrides list
- `content/maps/old-town-0-0-0.json` — runtime region tile data

## Objective

Create the ground material registry that maps every `underlayId` and `overlayId` used in the Old Town map to a renderable material definition. This story produces no renderer yet; it establishes the data contract so the terrain renderer can resolve tile materials without hardcoding colors.

## Required architectural decisions

- **Registry location:** `packages/shared/src/content-schemas/ground-material.ts` defines `GroundMaterialDefSchema` and `GroundMaterialRegistry`.
- **Material definition fields:** `id`, `name`, `color` (hex), `accentColor` (hex), `textureNoise?` (simple noise params), `isWater`, `isBridge`, `roughness`, `category` (plaza, road, floor, water, soil, etc.).
- **Content file:** `content/materials/ground-materials.json` holds all definitions. The content loader validates it on server boot.
- **No external textures in POC:** materials are flat/toon colors with optional simple vertex noise. Textures can be added later without changing the registry contract.
- **Tile mapping:** a tile references `underlayId` (required) and optional `overlayId`. The renderer blends the underlay as base and overlay as detail. For POC, overlay is just a second color pass on the same tile geometry.
- **Validation:** `tools/content-validator/` must assert every `underlayId`/`overlayId` in `content/maps/*.json` exists in the ground material registry.

## Implementation checklist

- [X] Create `packages/shared/src/content-schemas/ground-material.ts` with Zod schema and types.
- [X] Create `content/materials/ground-materials.json` with all materials referenced by `scripts/generate-old-town-map.ts`:
  - `bellstone_plaza`, `wood_floor`, `soot_cobble`, `chalk_flagstone`, `patch_grass`, `stone_floor`, `river_mud`, `oldroad_slabs`, `grave_soil`, `dark_cellar_floor`, `quarry_grit`, and a default `grass`.
- [X] Add the material registry to the content loader and validate on boot.
- [X] Extend `tools/content-validator/` to flag missing materials.
- [X] Write test: every material in the registry parses and has required colors.
- [X] Write test: every `underlayId`/`overlayId` in `content/maps/*.json` is defined.
- [X] Write test: validator fails on a map with a bogus material ID.

## Acceptance criteria

- [X] `GroundMaterialDefSchema` exists and is exported from `@old-town/shared`.
- [X] `content/materials/ground-materials.json` defines all starter-region materials.
- [X] Server boot validates the registry and fails on missing/bad definitions.
- [X] `bun run content:validate` fails if a map references an undefined material.
- [X] No material colors or names are copied from OSRS.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E42/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
