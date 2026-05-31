---
doc_type: manifest
canonical_path: docs/content/seed-drops-and-contracts-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/creatures/starter-drop-tables.md`
- `docs/creatures/wardenry-contracts.md`
- `docs/content/schema-gap-analysis.md`

# Seed Drops and Contracts Manifest

> **Drop tables and Wardenry contracts.** Drop tables are runtime content. Contracts may be schema gaps; if so, document them and do not create unsupported JSON.

## Drop Tables

### Cellar Rat Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `cellar-rat-drops` | `cellar-rat` | `rat-tail` x1 (common), `small-bones` x1 (common), `torn-cloth` x1 (common), `ditch-coin` x1 (uncommon), `ratcatcher-tail` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Soot Rat Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `soot-rat-drops` | `soot-rat` | `soot-fur` x1 (common), `small-bones` x1 (common), `blackcoal-ash` x1 (uncommon), `ditch-coin` x1 (common) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Mud Goblin Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `mud-goblin-drops` | `mud-goblin` | `pig-iron-scrap` x1 (common), `coins` x5-15 (common), `crude-cudgel` x1 (uncommon), `mud-charm` x1 (uncommon), `bent-nail-ring` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Bell Bat Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `bell-bat-drops` | `bell-bat` | `bellfeathers` x1-3 (common), `wing-hide` x1 (common), `bellfang` x1 (uncommon), `echo-dust` x1 (uncommon), `bell-bat-charm` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Bog Fox Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `bog-fox-drops` | `bog-fox` | `fox-hide` x1 (common), `sinew-cord` x1 (uncommon), `fox-tooth` x1 (uncommon), `bog-fox-tail` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Grave Mite Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `grave-mite-drops` | `grave-mite` | `bone-chips` x1-2 (common), `grave-dust` x1 (common), `rot-gland` x1 (uncommon), `grave-flower-seed` x1 (uncommon), `gravekeeper-tooth-fragment` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Grave Wisp Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `grave-wisp-drops` | `grave-wisp` | `faint-bead` x1 (common), `grave-ash` x1 (common), `wisp-orb` x1 (uncommon), `grave-wisp-charm` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Ash Drake Whelp Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `ash-drake-whelp-drops` | `ash-drake-whelp` | `warm-scale` x1 (common), `blackcoal-ash` x1 (common), `drake-tooth` x1 (uncommon), `ashwyrm-bone` x1 (uncommon), `tallow-drake-scale` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Blacksealed Cutpurse Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `blacksealed-cutpurse-drops` | `blacksealed-cutpurse` | `blank-writ` x1 (common), `wax-seal` x1 (common), `stolen-coin-pouch` x1 (uncommon), `lockpick` x1 (uncommon), `blacksealed-token` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### Road Crow Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `road-crow-drops` | `road-crow` | `bellfeathers` x1-2 (common), `crow-beak` x1 (uncommon), `crow-feather-charm` x1 (rare) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

### River Snapper Drops

| drop_table_id | creature_id | drops | docs_source |
|---------------|-------------|-------|-------------|
| `river-snapper-drops` | `river-snapper` | `snapper-meat` x1 (common), `shell-chip` x1 (common), `snapper-shell` x1 (uncommon) | [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) |

## Contracts

> **If contracts do not have a schema yet, document them as schema gaps and do not create unsupported JSON.** See [`schema-gap-analysis.md`](schema-gap-analysis.md) for Wardenry contract status.

| contract_id | display_name | giver_npc_id | target_creature_id | target_count | reward_items | reward_xp | reward_ledger_tier | docs_source |
|-------------|--------------|--------------|--------------------|--------------|--------------|-----------|--------------------|-------------|
| `rats-under-tallys-contract` | Rats Under Tally's | `warden-holt` | `cellar-rat` | 5 | `coins` x20, `rat-tail` x1 | 50 wardenry | Stamped | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `mud-on-the-north-road` | Mud on the North Road | `warden-holt` | `mud-goblin` | 3 | `coins` x50, `pig-iron-scrap` x1 | 100 wardenry | Stamped | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `bats-in-the-bell-rafters` | Bats in the Bell Rafters | `warden-holt` | `bell-bat` | 4 | `coins` x40, `bellfeathers` x5 | 80 wardenry | Stamped | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `foxes-in-patch-lane` | Foxes in Patch Lane | `warden-holt` | `bog-fox` | 2 | `coins` x60, `fox-hide` x1 | 120 wardenry | Stamped | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `mites-at-gravegate` | Mites at Gravegate | `warden-holt` | `grave-mite` | 5 | `coins` x30, `grave-dust` x3 | 70 wardenry | Stamped | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |
| `smoke-in-the-old-kiln` | Smoke in the Old Kiln | `warden-holt` | `ash-drake-whelp` | 1 | `coins` x100, `warm-scale` x1 | 200 wardenry | Chartered | [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) |

## Schema Gap Note

Wardenry contracts are currently a **schema gap** per [`schema-gap-analysis.md`](schema-gap-analysis.md). They can be modeled as quests with kill objectives, but a dedicated contract schema is preferred. Do not create `content/contracts/` until the schema is added.

## See also

- [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) — Drop details
- [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) — Contract details
- [`docs/content/schema-gap-analysis.md`](schema-gap-analysis.md) — Schema support status
- [`docs/content/seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) — Creature definitions

---

*Last updated: 2026-05-31*
