---
doc_type: authority
canonical_path: docs/map/shop-and-service-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/world/shops-and-services.md`
- `docs/map/npc-placement.md`
- `docs/map/district-boundaries.md`
- `docs/economy/shop-system.md`

# Shop and Service Placement

Shop objects are physical anchors in the world. A player must walk to the shop object to open the shop interface. Entrance width controls how many players can enter at once and how the shop reads from the road.

## Shop and Service Table

| Shop/Service | District | Object Tile | Entrance Tiles | Entrance Width | Notes |
|--------------|----------|-------------|----------------|----------------|-------|
| Counting House | Counting House | (36, 50) | (36, 52) to (37, 52) | 2 | Bank chests inside. Ledger desk visible from entrance. |
| General Stall | Market Bell | (46, 46) | (46, 44) to (47, 44) | 2 | Open-air stall. No door collision. |
| Penny and Sons Forge | Foundry Row | (60, 48) | (60, 50) to (61, 50) | 2 | Forge glow visible from road. Anvil beside entrance. |
| Lath and Twine Bowyer | Lath Yard | (48, 60) | (48, 58) to (49, 58) | 2 | Bow rack frames the door. |
| Patch and Awl | Patch Lane | (48, 32) | (48, 34) to (49, 34) | 2 | Tanning frame visible from entrance. |
| Chalkhouse | Chalkhouse Court | (32, 64) | (32, 62) to (33, 62) | 2 | Kiln glow visible from road. |
| Warden Board | Warden Steps | (64, 64) | (64, 62) to (65, 62) | 2 | Contracts nailed to board face the entrance. |
| Shrine Hearth | Shrine Hearth | (32, 48) | (32, 46) to (33, 46) | 2 | Hearth flame visible from road. Candle ring around entrance. |
| River Stoop | River Stoop | (64, 32) | (64, 34) to (65, 34) | 2 | Dock posts frame the entrance. Ferry rope visible. |
| Sootcellar Hint Shop | Sootcellar | (32, 32) | (32, 34) to (33, 34) | 2 | Hidden corner. Entrance is a narrow stairwell. |

## Entrance Width Rules

1. **Minimum 2 tiles.** No shop entrance is 1 tile wide. Single-tile doors create player traffic jams.
2. **Main road shops: 2 tiles.** The starter shops are small. Two tiles is enough.
3. **Future shops: 2-4 tiles.** As the town grows, larger shops may have wider entrances.
4. **Entrance tiles must be walkable.** No collision flag, no object, no NPC may block the entrance tile.
5. **Entrance must face a road.** The player must approach the entrance from a road tile, not from a wall or alley dead end.

## Service Point Placement

| Service | Tile | District | Notes |
|---------|------|----------|-------|
| Coin Exchange | (36, 48) | Counting House | Just inside entrance. Visible from road. |
| Item Reclaim | (38, 50) | Counting House | Side room. Reclaim clerk beside chest. |
| Tanning Service | (48, 30) | Patch Lane | Tanning Frame doubles as service point. |
| Ferry Dock | (68, 32) | River Stoop | Post-POC travel unlock. Dock tile now is decorative. |
| Map Copying | (16, 48) | Oldroad Gate | Map Table doubles as cartography service. |

---

*Last updated: 2026-05-31*
