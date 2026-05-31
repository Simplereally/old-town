---
doc_type: authority
canonical_path: docs/creatures/drop-table-system.md
parent_index: docs/creatures/00-index.md
root_index: docs/00-index.md
---

Parent: [`Creatures Index`](00-index.md)

Authority references:
- `POC_SPEC.md`
- `docs/creatures/creature-system.md`
- `docs/content/seed-drops-and-contracts-manifest.md`
- `docs/content/validation-and-drift-control.md`

# Drop Table System

Drop tables should feed the economy. Avoid creatures that drop only coins and junk.

## Canonical Fields

| Field | Meaning |
|-------|---------|
| drop_table_id | Stable drop table ID |
| creature_id | Creature using the table |
| roll_count | Number of rolled entries |
| always_drops | Identity drops such as bones, tails, hides, proof items |
| common_table | Basic skill-feed drops |
| uncommon_table | Trade-creating drops |
| rare_table | Memorable screenshot drops |
| unique_table | Narrow unique rewards |
| currency_table | Coin drops |
| contract_override_drops | Drops that appear only during assigned contracts |

## Rules

1. Always drops are identity drops.
2. Common drops feed basic skills.
3. Uncommon drops create trade.
4. Rare drops create memorable screenshots.
5. Unique drops should be narrow, not universally best.
6. Contract drops only appear when assigned by Wardenry.
7. No creature should drop finished high-tier gear early.
8. Humanoids may drop crude equipment; beasts drop materials.
9. Ground item ownership belongs to killer or party for a tick-defined window.
10. All drops must map to skills, quests, contracts, shops, or trophies.

