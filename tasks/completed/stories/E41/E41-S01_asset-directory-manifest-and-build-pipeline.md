# E41-S01 — Asset directory, manifest schema, and build pipeline

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E39-S01 (Equipment Appearance System), E33-S01 (Render Resource Registry), E02-S04 (item definitions)
- Blocks: E41-S02, E41-S03, E41-S04, E41-S05, E41-S06, E41-S07, E41-S08, E41-S09

## Spec references

- `POC_SPEC.md` §16 (Items, inventory, equipment)
- `POC_SPEC.md` §23.3 (Originality — no OSRS/Jagex assets)
- `docs/items/00-index.md` — tier table, slot map, ID format
- `docs/technical/asset-baking-and-instancing.md` §2 (RenderResourceKey), §12 (material standards)
- `packages/shared/src/content-schemas/item.ts` — `icon` + `model` AssetId fields
- `packages/shared/src/content/content-ids.ts` — `AssetId` conventions

## Objective

Establish the on-disk asset directory, the asset manifest schema, the silhouette + tier-palette system, and the build pipeline that rasterizes SVG icons into a packed PNG sprite atlas and registers 3D model factories. This story produces no item art yet — it builds the factory that E41-S03 through E41-S08 fill.

## Required architectural decisions

- **Asset root:** `assets/items/` holds all original item art. Subfolders by class: `assets/items/icons/` (SVG sources), `assets/items/models/` (procedural model specs), `assets/items/palettes/` (tier palettes), `assets/items/silhouettes/` (family silhouettes). No OSRS assets. No external sprite packs.
- **Silhouette + palette composition.** An icon is `<family silhouette>` filled with `<tier palette>`. A family silhouette is one SVG document with named, recolorable regions (`blade`, `grip`, `accent`, `trim`). A tier palette maps those region names to hex colors. This is how ~1,400 icons stay consistent and diff-friendly.
- **Tier palettes are derived from `visualIdentity`.** Each of the 13 tiers (Cobbled → Starfall) has a canonical palette file. Melee, ranged, magic, and accessory tier ladders each get their own palette set where the tier language diverges (e.g. Lathwood, Bellhorn, Chalkmarked, Patchhide). See `docs/items/00-index.md` tier table and `docs/ranged-tiers.md` / `docs/magic-tiers.md` / `docs/ranged-armour-tiers.md` / accessory bands.
- **Icon cell size:** 36×36 source SVG viewBox, rasterized to 64×64 PNG for crispness, packed into a power-of-two atlas (max 2048×2048 per atlas, multiple atlases allowed). Atlas packing is deterministic (sorted by AssetId) so diffs are stable.
- **Asset manifest schema:** a Zod schema `assetManifestSchema` in `packages/shared/src/content-schemas/asset.ts` listing every `AssetId` with `kind` (`icon` | `model` | `billboard`), `source` (relative path), `atlas?`, `atlasCell?`, and `paletteRegions?`. The content validator cross-references item `icon`/`model` fields against this manifest.
- **3D model specs:** each family owns a `ModelSpec` (a JSON or TS factory descriptor) defining the procedural `BufferGeometry` and which palette region drives material color. Model factories are registered with `RenderResourceRegistry` at client load, keyed by `RenderResourceKey { type: 'prop'|'actor', contentId: modelId, materialId: tier }`.
- **Materials obey asset-baking contract §12.** One shared `MeshToonMaterial` or `MeshLambertMaterial` per tier, created at load time, never per frame. No custom `ShaderMaterial`.
- **Build pipeline script:** `scripts/build-item-assets.ts` (Bun) reads silhouettes + palettes, rasterizes SVG → PNG, packs atlases, emits `assets/items/atlases/*.png` + `assets/items/atlases/*.json` (atlas index), and validates the manifest. Runs via `bun run items:build-assets`.

## Implementation checklist

- [X] Create `assets/items/` directory tree: `icons/`, `models/`, `palettes/`, `silhouettes/`, `atlases/`.
- [X] Create `packages/shared/src/content-schemas/asset.ts` with `assetManifestSchema` (Zod) and `AssetManifest` type.
- [X] Define the 13-tier palette files for each tier ladder:
  - [X] Melee: `palettes/melee/{cobbled,pennywrought,pig_iron,bellmetal,blackbar,wardensteel,greenwold,graveiron,blueglass,carmine_steel,argent,crownsteel,starfall}.json`
  - [X] Ranged weapons: `palettes/ranged/{cobbled,lathwood,bogwood,bellhorn,blackstring,warden_yew,greenwold,gravebent,blueglass,carmine_ash,argentwood,crownhorn,starfall}.json`
  - [X] Magic: `palettes/magic/{cobbled,chalkmarked,tallowbound,bellwax,blacksalt,warden_script,greenwold,gravebound,blueglass,carmine_ink,argent_script,crownvellum,starfall}.json`
  - [X] Ranged armour: `palettes/ranged-armour/{cobbled,patchhide,boghide,bellhide,blackscale,wardenhide,greenwold,graveskin,blueglass_scale,carmine_hide,argentweave,crownhide,starfall_hide}.json`
  - [X] Accessories: `palettes/accessory/{cobbled,threadbare,waxed,bellstruck,blacksealed,warden_issued,greenwold,gravebound,blueglass,carmine,argent,crown,starfall}.json`
- [X] Define the SVG silhouette region contract: each silhouette SVG uses `data-region` attributes (`blade`, `head`, `grip`, `accent`, `trim`, `cloth`, `hide`, `metal`) that the rasterizer maps to palette colors.
- [X] Create `scripts/build-item-assets.ts`: parse manifest → compose silhouette + palette → rasterize SVG → pack atlas → emit PNG + atlas index JSON.
- [X] Add `items:build-assets` and `items:validate-assets` scripts to root `package.json`.
- [X] Create `assets/items/manifest.json` (seeded empty, populated by later stories).
- [X] Extend `tools/content-validator/` to cross-reference item `icon`/`model` AssetIds against the asset manifest; fail validation on dangling references.
- [X] Write test: every tier palette file parses and contains all required region colors.
- [X] Write test: asset manifest schema rejects missing `kind`/`source`.
- [X] Write test: content validator flags an item whose `icon` is not in the manifest.
- [X] Write test: atlas packer is deterministic (same input → same atlas index).

## Acceptance criteria

- [X] `assets/items/` directory tree exists with all palette subfolders.
- [X] `assetManifestSchema` exists and is exported from `@old-town/shared`.
- [X] All 13-tier palette files exist for melee, ranged, magic, ranged-armour, and accessory ladders and validate.
- [X] `bun run items:build-assets` runs and emits an (empty/seed) atlas index without error.
- [X] `bun run items:validate-assets` fails on dangling item `icon`/`model` references.
- [X] No OSRS/Jagex assets are present; all art is original SVG/PNG.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run items:build-assets`
- [X] `bun run items:validate-assets`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E41/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
