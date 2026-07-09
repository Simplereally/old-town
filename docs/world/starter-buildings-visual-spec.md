# Starter Buildings — Visual Spec (design authority for E53)

Authoritative design for every unique building GLB in the starter world. The Blender generator
(`scripts/generate-building-models.py`, E53-S02) implements this file literally; the layout epic
(E55) places these footprints. If a value here conflicts with an older doc, this file wins for
building visuals; `docs/world/districts-and-routes.md` still wins for *where* districts sit.

## Global conventions

- **Scale:** 1 tile = 1.0 unit. Footprints are exact tile rectangles; walls sit inset 0.05 from
  the footprint edge so adjacent-tile collision matches the visual wall.
- **Origin:** center of the footprint rectangle at ground level (y=0 in Three.js after export).
  Doors always face **south (−z in Three.js)** in model space; map placement uses object
  `rotation` to orient per site.
- **Style:** OSRS-2006 lo-fi — chunky silhouettes, no curves finer than 8 segments, no floating
  greeble. Every building must read at isometric camera distance from its **roofline and one
  signature feature** (bell, chimney, stilts, gate…). If the silhouette needs a label to
  identify, redesign it.
- **Tri budgets:** house-scale ≤ 900 tris, landmark-scale ≤ 2000 tris, props ≤ 400 tris.
- **Vertex colours:** baked `COLOR_0` per region below. No textures, no materials in the GLB —
  the runtime applies one vertex-colour Lambert (same contract as weapons).
- **Roof rule:** every district has one dominant roof colour (below) so districts read as
  colour-zones from the zoomed-out camera.

## Global colour palette (bake exactly these)

| Region key | Hex | Use |
|---|---|---|
| `stone_wall` | `#8A8578` | default masonry |
| `stone_dark` | `#6E6A5E` | plinths, quoins, shadow courses |
| `chalk_wash` | `#D9D2C0` | Chalkhouse Court walls |
| `timber_frame` | `#7A5A3A` | exposed beams, posts |
| `timber_dark` | `#5A4028` | doors, shutters, docks |
| `wattle_infill` | `#C9BFA4` | wall panels between timber frames |
| `roof_thatch` | `#A08448` | homes, market (Market Bell district roof) |
| `roof_slate` | `#5C6470` | civic stone buildings (bank, shrine, gatehouse) |
| `roof_clay` | `#96604A` | craft district roofs (foundry, tannery, bowyer) |
| `metal_iron` | `#4A4E55` | gates, bands, anvil |
| `metal_bronze` | `#8C6B3F` | the bell, kiln fittings |
| `soot_black` | `#3A3733` | chimney tops, forge interiors, cellar |
| `canvas_awning` | `#C7B98F` | stall awnings |
| `accent_moss` | `#6F7D4A` | ruin/graveyard mossing |
| `glow_ember` | `#D97A3A` | forge/kiln/hearth interior glow faces (emissive-looking via bright bake) |

## Archetypes

Footprint = tiles (W×L). H = ridge/top height in units.

### Landmarks

1. **`market_bell_tower`** — 3×3, H 7.5. Square stone tower, three battered tiers, open bronze
   bell (`metal_bronze`) hung in the top arch on all four faces, `roof_slate` pyramidal cap.
   Signature: the bell visible through the arches. ≤2000 tris.
2. **`counting_house`** — 4×3, H 4.5. Heavy `stone_wall` block with `stone_dark` quoins, iron
   double door (`metal_iron`), two barred slit windows, `roof_slate` hip roof with a shallow
   pitch. Reads: fortress, not shop. Signature: iron door + window bars.
3. **`gatehouse`** — 5×3, H 6. Two square towers flanking a 1-tile-wide gate arch, timber
   portcullis (`timber_dark` + `metal_iron` bands) modeled half-raised, crenellated tops,
   `roof_slate` tower caps. Walkable passage: the arch tile must be geometry-free from y 0–2.5.
4. **`shrine_hall`** — 3×4, H 5. Narrow stone hall, steep `roof_slate` gable, round window
   (8-seg) on the south gable, interior hearth glow (`glow_ember`) visible through the open
   door, three candle niches per long wall as shallow insets.
5. **`graveyard_crypt`** — 3×3 (plus 1×3 stair apron), H 3. Half-sunken `stone_dark` mass with
   `accent_moss` top, iron gate recessed in a lintel arch, descending steps toward the door.
   Signature: it sits *lower* than grade — pair with a raised mound in terrain (E54).

### Craft district

6. **`foundry_forge`** — 4×4, H 5.5. Open-fronted (south face open, two `timber_frame` posts),
   `stone_wall` shell, fat square chimney offset rear-left rising 1.5 above the `roof_clay`
   ridge with a `soot_black` top course, `glow_ember` interior back wall. Signature: chimney.
7. **`anvil_shed`** — 2×2, H 2.5. Timber lean-to: two posts + mono-pitch `roof_clay`, fully
   open on two sides, `metal_iron` anvil on a `timber_dark` stump inside (anvil is part of the
   model; the *station object* still gets placed on its tile for interaction).
8. **`bowyer_workshop`** — 3×3, H 4. Timber-framed (`timber_frame` + `wattle_infill`),
   shingled `roof_clay` gable, a rack of three bow staves leaning on the east wall (flat
   quads), wide workshop door.
9. **`tannery`** — 4×2, H 3. Long low timber building, `roof_clay` mono-pitch, two external
   drying frames (2-post rectangles with a stretched-hide quad, `wattle_infill` colour) on the
   north side. Smell implied, not modeled.
10. **`chalkhouse`** — 3×3, H 4.5. `chalk_wash` walls with `timber_dark` corner posts, beehive
    kiln bulge (8-seg dome) fused to the east wall with `metal_bronze` door and `soot_black`
    vent, `roof_thatch` gable.
11. **`bead_loom_hall`** — 5×2, H 3.5. Long `chalk_wash` hall, five square loom windows along
    the south wall (through-holes with `timber_frame` frames), `roof_thatch`.

### River & market

12. **`river_fishmonger`** — 2×2, H 3. Timber stall on 4 stilts (deck at 0.6), `canvas_awning`
    mono-pitch on two poles, counter plank on the south face. Legs read above water when
    placed on bank/water edge tiles.
13. **`kitchen_hearth`** — 3×2, H 3.5. Stone kitchen, `roof_thatch`, wide serving hatch in the
    south wall, squat chimney with `soot_black` top, `glow_ember` hatch interior.
14. **`market_stall`** — 2×2, H 2.6. Open frame: 4 posts, `canvas_awning` pitched cover,
    `timber_dark` counter. Generic — placed 3–4× around Market Bell with rotations.
15. **`warden_post`** — 2×2, H 3.2. Stone base course + timber upper, `roof_slate` pyramid, an
    external notice board (flat quad, `timber_dark` frame) on the south face.

### Homes & props

16. **`generic_house_a`** — 3×3, H 4. Timber frame + `wattle_infill`, `roof_thatch` gable
    north-south ridge, door south, one shuttered window per side.
17. **`generic_house_b`** — 3×2, H 3.6. Stone lower half, timber upper, `roof_thatch` gable
    east-west ridge (silhouette contrast with A), lean-to woodstore on one gable.
18. **`generic_house_c`** — 2×2, H 4.2. Tall narrow two-storey, `wattle_infill` with
    `timber_frame` X-brace on the south face, `roof_thatch`, jettied upper floor overhanging
    0.15. The three homes must be silhouette-distinct at a glance: wide/low/tall.
19. **`cellar_ruin`** — 3×3, H 1.8. Broken `stone_wall` perimeter at varying course heights
    (0.4–1.8), `accent_moss` on top faces, interior open, `timber_dark` cellar hatch flush
    with the ground inside. No roof.
20. **`well`** — 1×1, H 2.2. `stone_dark` cylinder (8-seg), two posts, `roof_thatch` mini
    gable, `metal_iron` crank + bucket quad. ≤400 tris.
21. **`garden_plot`** — 2×1, H 0.4. `timber_dark` raised frame, `soil`-coloured (#5D4A33) fill,
    3 rows of green sprout quads. ≤200 tris.
22. **`dock`** — 3×1, H 0.7. `timber_dark` deck on stilts, two mooring posts, one plank
    intentionally lighter (`timber_frame`) for wear. Extends over water tiles.

## Manifest

`assets/buildings/models/manifest.json` lists exactly the 22 ids above; loaders and tests import
it. Adding a building = adding it here + this doc first.
