---
doc_type: authority
canonical_path: docs/spatial/landmarks-and-silhouettes.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/old-town-starter-region.md`
- `docs/map/district-boundaries.md`
- `docs/world/starter-town.md`
- `docs/spatial/terrain-grammar.md`

# Landmarks and Silhouettes

Every district in Old Town has a landmark silhouette. The silhouette is the object or structure that makes the district recognisable from a distance, in low light, or when the player is lost. Landmarks anchor memory and make navigation intuitive.

## Core Rule

**If a screenshot shows only silhouette and ground colour, the district should still be recognisable.**

The player should never need to read text or open a map to know where they are. The silhouette and the ground under their feet should be enough.

## District Silhouettes

| District | Landmark | Description |
|----------|----------|-------------|
| **Market Bell** | Timber bell frame and rope | Tall wooden frame with hanging bell. Visible from 8 tiles. The hub anchor. |
| **Counting House** | Square stone bank with ledger sign | Domed roof, coin weathervane, ledger sign above door. Reads as money and storage. |
| **Foundry Row** | Chimney and bellows furnace | Brick chimney with smoke plume, furnace glow at base. Reads as fire and metal. |
| **Lath Yard** | Bow rack and stacked timber | Tall rack with unstrung bows, timber piles beside. Reads as wood and craft. |
| **Patch Lane** | Tanning frame and hide rack | Wooden frame with stretched hide, rack with cured pelts. Reads as leather and stitch. |
| **Chalkhouse Court** | Bead strings and chalk circles | Kiln glow, bead loom frame, chalk circles on ground. Reads as fire and bead. |
| **Warden Steps** | Notice board and shield post | Board with nailed contracts, shield on post. Reads as law and task. |
| **Shrine Hearth** | Candle wall and low flame | Wall of lit candles, central hearth flame. Reads as sacred and cleanse. |
| **River Stoop** | Dock posts and fish crates | Wooden posts in water, stacked crates, ferry rope. Reads as river and trade. |
| **Oldroad Gate** | Old road arch and signpost | Stone arch with cart tracks, signpost with directions. Reads as travel and beyond. |
| **Gravegate** | Crooked grave arch | Iron gate with grave mounds behind, crooked stone arch. Reads as death and threshold. |
| **Sootcellar** | Soot-marked hatch | Dark hatch with soot stains, descending steps. Reads as under and secret. |
| **North Quarry Road** | Broken crane / ore cart | Rusted crane arm, tipped ore cart, pickaxe scars on rock face. Reads as dig and risk. |

## Silhouette Design Rules

1. **One landmark per district.** Multiple landmarks dilute recognition. One strong silhouette is better than three weak ones.
2. **Landmarks are tall or bright.** The bell frame is tall. The furnace is bright. The candle wall is both. Silhouettes must stand out against the lo-fi background.
3. **Landmarks are at district centre or approach.** The player should see the landmark as they enter the district, not hidden behind buildings.
4. **Landmarks are interactable or have function.** The bell can be rung. The notice board has contracts. The hearth has offerings. Landmarks are not just scenery.
5. **Landmarks ground the district name.** "Market Bell" is named after its landmark. "Warden Steps" is named after the steps leading to the notice board. The name and the silhouette reinforce each other.

## Ground Colour + Silhouette Pairs

| District | Ground Type | Silhouette | Recognition Test |
|----------|-------------|------------|------------------|
| Market Bell | Bellstone plaza | Bell frame | Pale stone + tall timber = Market Bell |
| Foundry Row | Soot cobble | Chimney | Dark stone + smoke stack = Foundry Row |
| Patch Lane | Patch grass | Tanning frame | Green grass + hide rack = Patch Lane |
| Gravegate | Grave soil | Crooked arch | Dark earth + iron gate = Gravegate |
| River Stoop | River mud | Dock posts | Wet earth + wooden posts = River Stoop |
| Sootcellar | Cellar floor | Soot hatch | Damp stone + dark steps = Sootcellar |

## See also

- [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md) — District overview and hub layout
- [`docs/map/district-boundaries.md`](../map/district-boundaries.md) — Exact bounding boxes
- [`docs/spatial/terrain-grammar.md`](terrain-grammar.md) — Ground types and transitions

---

*Last updated: 2026-05-31*
