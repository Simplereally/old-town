---
doc_type: authority
canonical_path: docs/map/station-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/tools-and-intermediates/stations.md`
- `docs/map/district-boundaries.md`
- `docs/map/npc-placement.md`
- `docs/map/shop-and-service-placement.md`

# Station Placement

Stations are how towns matter. Advanced work requires a place in the world, not only the right inventory stack. Every station needs at least 2 adjacent interactable tiles so multiple players can use it without queueing on the same square.

## Station Table

| Station | District | Tile | Adjacent Interact Tiles | Skill |
|---------|----------|------|------------------------|-------|
| Anvil | Foundry Row | (62, 48) | (61, 48), (63, 48) | Smithing |
| Bellows Furnace | Foundry Row | (66, 48) | (65, 48), (67, 48) | Smithing / Hearthcraft |
| Bow Bench | Lath Yard | (48, 62) | (47, 62), (49, 62) | Bowcraft |
| Tanning Frame | Patch Lane | (48, 30) | (47, 30), (49, 30) | Tailoring |
| Dye Vat | Patch Lane | (44, 30) | (43, 30), (45, 30) | Tailoring / Gardening |
| Bead Kiln | Chalkhouse Court | (32, 66) | (31, 66), (33, 66) | Beadwork / Hearthcraft |
| Bead Loom | Chalkhouse Court | (36, 66) | (35, 66), (37, 66) | Beadwork |
| Kitchen Range | River Stoop | (64, 30) | (63, 30), (65, 30) | Cooking / Hearthcraft |
| Map Table | Oldroad Gate | (16, 48) | (15, 48), (17, 48) | Cartography |
| Warden Board | Warden Steps | (64, 66) | (63, 66), (65, 66) | Wardenry |
| Shrine Hearth | Shrine Hearth | (32, 44) | (31, 44), (33, 44) | Favour / Hearthcraft |

## Adjacent Interact Tile Rule

1. **At least 2 adjacent tiles per station.** These tiles must be walkable and must not be blocked by collision, objects, or NPCs.
2. **Adjacent tiles must face the station.** A player standing on an adjacent tile must be within 1 tile of the station object to interact.
3. **No shared adjacent tiles.** Two stations may not claim the same adjacent tile. If stations are clustered, each must have its own distinct interact tiles.
4. **Station clusters.** Stations of the same skill family should be within 6 tiles of each other so a player can walk between them in one camera view.

## Station Cluster Validation

| District | Stations | Cluster Span (tiles) |
|----------|----------|---------------------|
| Foundry Row | Anvil, Bellows Furnace | 4 |
| Lath Yard | Bow Bench | 1 |
| Patch Lane | Tanning Frame, Dye Vat | 4 |
| Chalkhouse Court | Bead Kiln, Bead Loom | 4 |
| River Stoop | Kitchen Range | 1 |
| Oldroad Gate | Map Table | 1 |
| Warden Steps | Warden Board | 1 |
| Shrine Hearth | Shrine Hearth | 1 |

---

*Last updated: 2026-05-31*
