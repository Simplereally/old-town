---
doc_type: authority
canonical_path: docs/tools-and-intermediates/containers-and-pouches.md
parent_index: docs/tools-and-intermediates/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skill Utility Substrate Index`](00-index.md)

Authority references:
- `docs/items/misc/bead-pouches.md`
- `docs/items/00-index.md`
- `POC_SPEC.md`

# Containers and Pouches

Containers are progression items for a 28-slot inventory economy. They should improve long-session play without replacing bank, inventory, or server-side validation rules.

## Container Families

| Container | Skill Loop | Purpose |
|-----------|------------|---------|
| Threadbare Tool Roll | All skills | Holds starter tools |
| Ore Sack | Mining | Carries ores |
| Coal Basket | Smithing | Carries Blackcoal |
| Log Sling | Woodcutting | Carries logs |
| Tackle Box | Fishing | Holds bait, hooks, and lures |
| Fish Hamper | Fishing / Cooking | Holds raw fish |
| Trap Crate | Trapping | Holds traps and bait |
| Seed Satchel | Gardening | Holds seeds and spores |
| Herb Roll | Gardening / Apothecary | Holds herbs |
| Phial Rack | Apothecary | Holds phials and potions |
| Bead Pouch | Beadwork / Magic | Holds beads |
| Map Tube | Cartography | Holds maps and charts |
| Contract Book | Wardenry | Holds task contracts |
| False-Bottom Pouch | Sleight | Holds stolen or forged items |

## Design Rules

1. Containers are item definitions with explicit allowed contents.
2. Containers must not silently accept unrelated item families.
3. Containers may have capacity tiers, but the starter version should be modest.
4. Containers should support skilling loops, not combat power creep.
5. Container contents remain server-authoritative.
6. Tradeability, drop behavior, and destroy/reclaim behavior must be explicit.
7. Bead Pouch remains the pattern for future specialized pouches.

## Sticky Names

- Tool Roll
- Log Sling
- Seed Satchel
- Herb Roll
- Map Tube
- Contract Book
- False-Bottom Pouch

