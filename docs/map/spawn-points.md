---
doc_type: authority
canonical_path: docs/map/spawn-points.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/map/old-town-starter-region.md`
- `docs/map/district-boundaries.md`
- `docs/world/starter-town.md`
- `docs/economy/banks-storage-and-reclaim.md`

# Spawn Points

## Player Spawn

| Spawn | Tile | District | Notes |
|-------|------|----------|-------|
| First login | (48, 48) | Market Bell | Directly under the bell tower, facing north toward Lath Yard |
| Respawn after death | (36, 48) | Counting House | Just inside the bank entrance, facing the ledger desk |

## First Session Spawn Rules

1. **New players always spawn at (48, 48).** No class selection, no custom spawn. Everyone starts under the bell.
2. **First 60 seconds of movement are safe.** No creature aggression, no PvP flags, no trap damage. This is a grace period, not a zone.
3. **After death, players respawn at (36, 48).** The Counting House is the death respawn for the entire starter region.
4. **No other spawn points exist in `old_town_core`.** Future regions may add regional respawns. The starter region keeps one death point to reinforce the bank's importance.

## Spawn Tile Collision

- Tile (48, 48) must be walkable. No object, NPC, or collision flag occupies it at server start.
- Tile (36, 48) must be walkable. It is the respawn tile inside the Counting House entrance.
- Both tiles must have at least 2 adjacent walkable tiles so the player does not spawn trapped.

## Spawn Camera Orientation

| Spawn | Facing | Reason |
|-------|--------|--------|
| (48, 48) | North | The bell tower is behind the player. Lath Yard and the north spoke are ahead. |
| (36, 48) | East | The ledger desk and bank chests are ahead. The Market Bell is to the right. |

---

*Last updated: 2026-05-31*
