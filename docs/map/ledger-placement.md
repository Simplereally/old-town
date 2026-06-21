---
doc_type: authority
canonical_path: docs/map/ledger-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/ledger/civic-ledger-system.md`
- `docs/ledger/nooks-and-stash-spots.md`
- `docs/map/district-boundaries.md`
- `docs/map/npc-placement.md`

# Ledger Placement

The Civic Ledger lives at the Counting House, but its physical anchors are scattered across every district. A ledger anchor is an object a player interacts with to record deeds, receive stamps, or unlock progress.

## Ledger Anchor Table

| Ledger Item | Location | District |
|-------------|----------|----------|
| Civic Ledger desk | (36, 50) | Counting House |
| District stamp board | (38, 50) | Counting House |
| Warden stamp | (64, 64) | Warden Steps |
| Quill stamp | (16, 48) | Oldroad Gate |
| Shrine stamp | (32, 48) | Shrine Hearth |
| Gravegate stamp | (64, 16) | Gravegate |
| First Crate Nook | (42, 42) | Market Bell |
| First Road Nook | (12, 48) | Oldroad Gate |
| First Grave Nook | (60, 12) | Gravegate |
| First Wall Nook | (44, 60) | Lath Yard |

## Ledger Keeper Co-location

| Keeper | Ledger Item | Same Tile? |
|--------|-------------|------------|
| Tomas Tally | Civic Ledger desk | Yes |
| Warden Holt | Warden stamp | Yes |
| Finch Quill | Quill stamp | Yes |
| Sister Writ | Shrine stamp | Yes |
| Gravekeeper Soll | Gravegate stamp | Yes |

Every keeper stands on or within 1 tile of their ledger anchor. This reinforces the association between NPC and system.

## First Nook Placement

First Nooks are pre-built tutorial nooks that teach the nook system without requiring materials. They are placed in safe, high-traffic locations.

| Nook | Tile | District | Why Here |
|------|------|----------|----------|
| First Crate Nook | (42, 42) | Market Bell | Behind the fish stall. Teaches food storage near spawn. |
| First Road Nook | (12, 48) | Oldroad Gate | Base of the Oldroad Oak. Teaches travel-item storage near the cartography loop. |
| First Grave Nook | (60, 12) | Gravegate | Crypt wall near Gravekeeper Soll. Teaches burial-item storage in the first danger zone. |
| First Wall Nook | (44, 60) | Lath Yard | Back wall of Lath and Twine Bowyer. Teaches map and survey storage near the bowcraft loop. |

## Nook Build Rules for Starter Region

1. First Nooks are pre-built. Players do not carry planks to construct them.
2. First Nooks are smaller than player-built nooks. They hold 4 items instead of 8.
3. First Nooks are safe storage. Unlike player-built nooks, items in First Nooks are protected on death.
4. First Nooks are single-use tutorials. After the player builds their first real nook, the First Nook becomes decorative.

---

*Last updated: 2026-05-31*
