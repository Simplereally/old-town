---
doc_type: authority
canonical_path: docs/map/npc-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/world/npc-cast.md`
- `docs/map/district-boundaries.md`
- `docs/map/shop-and-service-placement.md`
- `docs/map/station-placement.md`

# NPC Placement

Every starter NPC owns a system. No decorative-only NPCs exist in the first vertical slice. Each NPC must be within 3-5 tiles of their primary service object so players visually associate NPC, station, and district in one camera view.

## NPC Tile Table

| NPC | District | Tile x,y | Primary Service Object | Distance (tiles) |
|-----|----------|----------|------------------------|------------------|
| Mara Bellkeeper | Market Bell | (48, 50) | General Stall | 2 |
| Pippa Hearth | Market Bell | (46, 46) | Market Hearth | 2 |
| Tomas Tally | Counting House | (36, 50) | Ledger Desk | 2 |
| Osric Penny | Foundry Row | (60, 48) | Anvil | 2 |
| Letha Lath | Lath Yard | (48, 60) | Bow Bench | 2 |
| Nell Patch | Patch Lane | (48, 32) | Tanning Frame | 2 |
| Mother Tallow | Chalkhouse Court | (32, 64) | Bead Kiln | 2 |
| Warden Holt | Warden Steps | (64, 64) | Warden Board | 2 |
| Sister Writ | Shrine Hearth | (32, 48) | Shrine Hearth | 2 |
| Finch Quill | Oldroad Gate | (16, 48) | Map Table | 2 |
| Edda Tinfin | River Stoop | (64, 32) | Dock Post | 2 |
| Bramble Hook | River Stoop | (66, 30) | Fishing Rack | 3 |
| Marn Lock | Sootcellar | (32, 32) | Blacksealed Corner | 2 |
| Gravekeeper Soll | Gravegate | (64, 16) | Crypt Gate | 2 |

## Design Rule

Players should visually associate NPC, station, and district in one camera view. This means:

1. The NPC tile, their primary service object, and at least one adjacent interact tile must all be visible without panning the camera.
2. NPCs do not wander more than 4 tiles from their spawn tile.
3. NPCs never block entrances, station interact tiles, or main roads.
4. Every district with a shop has its shopkeeper within 3 tiles of the shop entrance.

## NPC Density Rule

- Market Bell has 2 NPCs to handle spawn orientation and the food loop.
- River Stoop has 2 NPCs to split fishing tools and cooking.
- Every other district has exactly 1 NPC in the starter region.
- No district has zero NPCs.

---

*Last updated: 2026-05-31*
