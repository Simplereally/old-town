---
name: old-town-asset-craft
description: Authoring high-quality lo-fi 3D assets (GLB models, vertex colours, terrain materials/textures) for Old Town. Use whenever creating or modifying anything under assets/, a Blender generator script, a GltfLoader, terrain materials, or when a task says "model", "GLB", "palette", "texture", or "asset". Encodes the repo's pipeline contract, art direction, budgets, and validation gates so assets come out consistent and correct the first time.
---

# Old Town Asset Craft

Every visual asset in this repo flows through one doctrine. Follow it exactly; deviations are
how the world stops looking coherent.

## The pipeline contract (never violate)

Every asset class uses the same four-stage shape. Weapons are the reference implementation —
when in doubt, read them, don't guess:

1. **Generate** — a headless Blender Python script in `scripts/` (`generate-weapon-models.py`
   is the exemplar) writes GLBs into `assets/<class>/models/` plus a `manifest.json` listing
   every id. The manifest is the single source of truth; loaders and tests import it.
2. **Copy** — a `scripts/copy-<class>-models.ts` script copies into
   `apps/client/public/models/<class>/`, validating manifest ↔ files ↔ budgets and failing
   loudly on drift.
3. **Load** — a `<Class>GltfLoader.ts` in `apps/client/src/game/scene/` (clone
   `WeaponGltfLoader.ts`) async-loads each GLB, extracts the **first mesh's**
   `BufferGeometry` only, and registers it via `RenderResourceRegistry.replaceGeometryFactory`
   under the procedural key + `_glb` suffix. One bad file degrades one asset, never the set.
4. **Fallback** — procedural geometry always remains registered and renders until (and if)
   the GLB arrives. The glb/procedural choice is a `RenderSettings` toggle; it may swap
   geometry and material only — never attachment, footprint, collision, or gameplay.

Corollaries:
- GLBs carry **geometry + `COLOR_0` vertex colours only**. No embedded materials, textures,
  animations, or multi-node scene graphs. Runtime material is a `vertexColors` Lambert
  (helpers in `scene/models/glb-materials.ts`); tier/tint variation is runtime colour math,
  never per-tier geometry.
- One GLB per family/archetype. If you're about to generate per-tier or per-variant files,
  you've misread the design — stop.

## Art direction (the taste layer)

- **Era:** 2006/2007 OSRS-adjacent lo-fi. Chunky, readable, sincere. No curve finer than
  8 segments, no bevels smaller than the camera can resolve, no greeble that only exists
  up close.
- **Silhouette first.** Every asset must be identifiable at isometric gameplay distance from
  its outline plus ONE signature feature (a bell, a chimney, stilts, a jettied storey). Run
  this test before caring about any detail: if you must lean in to know what it is, redesign
  the silhouette, don't add detail.
- **Palette discipline.** All colours come from the committed palettes — buildings/props:
  `docs/world/starter-buildings-visual-spec.md`; ground: `docs/world/terrain-material-palette.md`;
  weapons/armour tiers: the existing tier tint system. Never introduce an unlisted hex; if a
  new asset genuinely needs a new colour, add it to the palette doc in the same change with a
  one-line justification. Muted and slightly desaturated always beats saturated — light in
  this world is overcast.
- **Colour zoning over detail.** Districts, tiers, and factions read through dominant colour
  (roof colour per district, tint per tier), not through geometry. When two assets confuse,
  fix the colour zoning first.
- **Ugly-on-purpose beats bland.** A crooked chimney, one lighter deck plank, a broken wall
  course — one deliberate imperfection per asset makes lo-fi feel handmade instead of
  procedural. Exactly one; two is noise.

## Hard technical rules

- **Scale:** 1 tile = 1.0 unit, everywhere.
- **Origin:** ground contact at y=0 (Three.js), centered on the footprint. South-facing
  front (−z) in model space; placement rotation happens in map data.
- **Axis mapping:** verify the Blender→Three.js axis convention against the weapon
  generator's export settings and one loaded asset BEFORE generating anything new. Write
  the verified mapping as a comment atop your generator. Never assume.
- **Tri budgets:** weapons/props ≤ 400, house-scale buildings ≤ 900, landmarks ≤ 2000,
  creatures ≤ 3000. Enforce **in the generator** with an assertion that fails the build —
  budgets that live in review comments don't hold.
- **Walkable volumes:** if an asset spans passable tiles (arches, stilt stalls, docks),
  assert programmatically in the generator that the passage volume is geometry-free. The
  collision system is tile bitmasks; the model must agree with the mask or players clip.
- **Determinism:** generators are pure functions of their source. Same input, byte-identical
  output. Seed all noise. A regen with no design change must be a no-op diff.
- **Structure generators as data + builders:** a palette dict, a spec dict per asset
  (footprint/height/budget), and small composable builder functions (`box`, `gable_roof`,
  `cylinder8`, `stilts`...). An asset function longer than ~40 lines is a smell — extract a
  builder.

## Terrain specifics

- Material JSON schema: `packages/shared/src/content-schemas/material.ts` — colours are
  decimal ints (convert hex carefully; guard with a fixture test), `textureNoise {scale,
  amplitude}`, `category` from the schema enum.
- Ground texture is multiply-only greyscale grain centered on 0.5 — the palette colour stays
  authoritative (multiply range ~0.85–1.15). Textures add grain, never hue.
- Every material bordering grass in layouts needs a `grass_to_<id>` transition entry
  (midpoint colour, `category: "transition"`).
- Maps are GENERATED (`scripts/generate-old-town-map.ts`). Never hand-edit
  `content/maps/*.json`; ground zoning is authored as design-space declarations.

## Validation gates (run all before calling an asset done)

1. `bun run <class>:build` — generate + copy + budget/manifest validation green.
2. The class's contract test (manifest ↔ content defs ↔ spec-doc fixture ↔ files) green.
3. `bun run stress:render:ci` — render budget holds.
4. Eyeball in the running client (`bun run dev`) at gameplay zoom: silhouette test, palette
   coherence with neighbours, no z-fighting, fallback path still works (temporarily remove
   the GLB from public/ and confirm graceful degradation).
5. Record in the story note which assets you visually reviewed. "Generated and tests pass"
   without an eyeball pass is not done.

## Field notes from building the 22 building GLBs (learned by doing, not theory)

These came out of actually authoring `scripts/generate-building-models.py` and reviewing
renders. They will save you the same iterations:

- **Verified axis mapping:** `export_yup=True` maps Blender `(x, y, z)` → glTF `(x, z, −y)`.
  So model Z-up with the door facing **+Y in Blender** and it faces −Z (south) in Three.js.
  Parsed from a real exported GLB: POSITION min-y ≈ 0 (ground), footprint on x/z. Trust this;
  don't re-derive it.
- **Render previews headless and LOOK at them.** Workbench engine + `shading.color_type =
  "VERTEX"` + an ortho camera at `rotation_euler = (60°, 0, 135°)` (positioned at
  `target + (0.6d, 0.6d, 0.5d)`) gives an isometric front-right view showing the door face.
  Montage the PNGs into a grid and review the whole set at once — 4 of my 22 first-pass
  models had visible defects that no assertion caught.
- **The defects were all spatial-reasoning slips, so check for exactly these:** (1) rotation
  about the wrong axis — a wall X-brace needs `rot` about **Y** to stay in the wall plane;
  rotating about X swings it out like an antenna; (2) tilted roofs floating above wall tops —
  compute the low edge: `center_z − sin(pitch)·half_depth` must meet the wall; (3) poles
  poking through the canopy they support — compute the canopy plane height at each pole's
  (x, y), don't eyeball; (4) a full-coverage accent slab (moss) re-reading as a roof —
  accents are patches, never full faces.
- **bpy patterns that work (mirror `generate-weapon-models.py`):** primitives via `bpy.ops`,
  `transform_apply` immediately, paint a `"Color"` FLOAT_COLOR POINT attribute per part,
  `join()` all parts, `shade_flat()`, export GLB with `export_materials="NONE"`. Roof shapes
  are cheapest as top-vertex surgery on a cube: collapse the top face to a line (gable), shrink
  it toward center (hip), or to a point (pyramid) — no extra primitives needed.
- **Base-at-z helpers beat center-at-z.** Buildings stack (plinth → wall → roof); a `box()`
  whose z argument is the BASE eliminates a whole class of half-height arithmetic errors.
- **Assert taste-adjacent invariants in code:** tri budget per class, `Color` attribute
  present, and walkable-volume clearance (gatehouse passage: no vertex inside the passage
  box) — the generator fails the build, not a reviewer.
- **Budgets are not the constraint you think:** box-massing archetypes land at 72–276 tris
  against 400–2000 budgets. Spend tris on the signature feature (bell, kiln dome, portcullis),
  never on wall detail.
- **Per-part seeded `_jitter` (~0.01) on stone only.** It sells "hand-carved" at zero tri
  cost; jittering timber/canvas just looks like bad modeling.

## When adding a NEW asset class

Copy the doctrine, in this order: spec doc in `docs/world/` (designs + palette FIRST — get the
design reviewed before Blender) → content defs + procedural fallback → generator + manifest +
copy → loader + settings toggle → contract tests + perf gate. The design doc leading is what
keeps quality high: taste decisions happen in prose where they're cheap, not in bpy code where
they're buried.
