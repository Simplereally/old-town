---
doc_type: manifest
canonical_path: docs/content/seed-quests-and-dialogue-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/quests/starter-quest-arc.md`
- `docs/quests/quest-system.md`
- `docs/quests/npc-voice-bible.md`
- `docs/quests/dialogue-style-guide.md`
- `docs/content/seed-npcs-and-creatures-manifest.md`

# Seed Quests and Dialogue Manifest

> **Starter quests and dialogue packs.** Every quest and dialogue pack listed here must have entries in `content/quests/` and `content/dialogue/`.

## Quests

| quest_id | display_name | giver_npc_id | start_tile_or_area | required_items | required_skills | quest_vars | stages | reward_items | reward_xp | unlock_effects | dialogue_ids | quest_object_ids | reclaim_rules | docs_source |
|----------|--------------|--------------|--------------------|----------------|-----------------|------------|--------|--------------|-----------|----------------|--------------|------------------|---------------|-------------|
| `smoke-over-old-town` | Smoke Over Old Town | `pippa-hearth` | Market Bell (44, 52) | — | — | `kiln_inspected`, `vent_checked`, `receipt_found` | 5 | `sooted-receipt` x1, `bellbread` x5 | 50 cooking, 25 hearthcraft | Unlocks Pippa as cook tutor | `pippa-hearth-smoke-over-old-town` | `old-kiln`, `smoke-vent`, `sooted-receipt` | Reclaim on death | [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md) |
| `rats-under-tallys` | Rats Under Tally's | `warden-holt` | Warden Steps (64, 64) | — | — | `rats_killed`, `tails_turned_in`, `ledger_read` | 4 | `rat-tail` x5, `coins` x20 | 50 wardenry, 25 favour | Unlocks Warden contracts | `tomas-tally-rats-under-tallys` | `rat-chewed-ledger` | Reclaim on death | [`docs/quests/rats-under-tallys.md`](../quests/rats-under-tallys.md) |
| `a-penny-for-the-forge` | A Penny for the Forge | `osric-penny` | Foundry Row (60, 48) | `penny-copper-ore` x4, `tinstone` x4 | mining 1, smithing 1 | `ore_mined`, `ingot_smelted`, `item_forged` | 5 | `pennywrought-shortblade` x1 | 75 mining, 75 smithing | Unlocks Osric as smith tutor | `osric-penny-forge-intro` | `broken-anvil-plate` | Reclaim on death | [`docs/quests/a-penny-for-the-forge.md`](../quests/a-penny-for-the-forge.md) |
| `string-enough-to-sing` | String Enough to Sing | `letha-lath` | Lath Yard (48, 60) | `oldroad-oak-log` x4 | woodcutting 1, bowcraft 1 | `wood_cut`, `stave_made`, `bow_strung` | 5 | `lathwood-shortbow` x1 | 75 woodcutting, 75 bowcraft | Unlocks Letha as bowyer tutor | `letha-lath-bowcraft-intro` | `split-bow-stave` | Reclaim on death | [`docs/quests/string-enough-to-sing.md`](../quests/string-enough-to-sing.md) |
| `the-beadwifes-errand` | The Beadwife's Errand | `mother-tallow` | Chalkhouse Court (32, 64) | `bead-clay` x2, `glass-sand` x1 | beadwork 1, magic 1 | `clay_gathered`, `blank_shaped`, `bead_fired` | 5 | `chalkmarked-bead` x3 | 75 beadwork, 50 magic | Unlocks Mother Tallow as beadwife tutor | `mother-tallow-beadwife-intro` | `listening-clay-node` | Reclaim on death | [`docs/quests/the-beadwifes-errand.md`](../quests/the-beadwifes-errand.md) |
| `gravegate-flowers` | Gravegate Flowers | `gravekeeper-soll` | Gravegate (64, 16) | `grave-flower` x5 | gardening 1, favour 1 | `flowers_gathered`, `wrong_flower_dug`, `shrine_offering_made` | 5 | `grave-flower-bundle` x1, `shrine-candle` x3 | 50 gardening, 50 favour | Unlocks Gravegate as Favour site | `gravekeeper-soll-gravegate-flowers` | `wrongly-planted-flower` | Reclaim on death | [`docs/quests/gravegate-flowers.md`](../quests/gravegate-flowers.md) |
| `the-missing-bell-clapper` | The Missing Bell-Clapper | `mara-bellkeeper` | Market Bell (48, 48) | — | sleight 1, cartography 1 | `clue_chain_started`, `map_received`, `false_bottom_found`, `paperwork_checked` | 6 | `bell-token-proof` x1, `chalk-compass` x1 | 50 sleight, 50 cartography | Unlocks cross-town clue chains | `mara-bellkeeper-arrival`, `marn-lock-bell-clapper`, `finch-quill-cartography-intro` | `bell-clapper-hook` | Reclaim on death | [`docs/quests/the-missing-bell-clapper.md`](../quests/the-missing-bell-clapper.md) |

## Dialogue Packs

| dialogue_id | npc_id | quest_context | stages | docs_source |
|-------------|--------|---------------|--------|-------------|
| `mara-bellkeeper-arrival` | `mara-bellkeeper` | Welcome, town rumours, basic orientation | 3 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `pippa-hearth-smoke-over-old-town` | `pippa-hearth` | Smoke Over Old Town quest | 5 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `tomas-tally-rats-under-tallys` | `tomas-tally` | Rats Under Tally's quest | 4 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `osric-penny-forge-intro` | `osric-penny` | A Penny for the Forge quest | 5 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `letha-lath-bowcraft-intro` | `letha-lath` | String Enough to Sing quest | 5 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `mother-tallow-beadwife-intro` | `mother-tallow` | The Beadwife's Errand quest | 5 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `gravekeeper-soll-gravegate-flowers` | `gravekeeper-soll` | Gravegate Flowers quest | 5 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `marn-lock-bell-clapper` | `marn-lock` | The Missing Bell-Clapper quest | 4 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `finch-quill-cartography-intro` | `finch-quill` | The Missing Bell-Clapper quest, route unlocks | 3 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |
| `warden-holt-contracts` | `warden-holt` | Wardenry contract board, combat intro | 4 | [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) |

## Design Notes

- Every quest needs at least three of: named NPC, item handoff, location change, skill interaction, world object interaction, choice, memorable examine line, future unlock, revisit reason.
- Dialogue nodes should be short enough to read while playing. Split system explanations into choices.
- Quest items use the `quest` category and are not tradeable.
- Reclaim rules define what happens to quest items on player death. Default is reclaim at the death respawn point.

## See also

- [`docs/quests/starter-quest-arc.md`](../quests/starter-quest-arc.md) — Quest arc
- [`docs/quests/quest-system.md`](../quests/quest-system.md) — Quest fields
- [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) — NPC voice
- [`docs/quests/dialogue-style-guide.md`](../quests/dialogue-style-guide.md) — Dialogue rules
- [`docs/content/seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) — NPC IDs
- [`docs/content/seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) — Quest objects

---

*Last updated: 2026-05-31*
