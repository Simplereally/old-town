---
doc_type: authority
canonical_path: docs/trails/step-types.md
parent_index: docs/trails/00-index.md
root_index: docs/00-index.md
---

Parent: [`Trails Index`](00-index.md)

Authority references:
- `docs/trails/trail-system.md`
- `docs/trails/trail-tiers.md`
- `docs/skills/utility-skills.md`
- `docs/favour/shrines-and-rites.md`
- `docs/wardenry/contracts-and-task-generation.md`

# Step Types

Old Town has 16 canonical step types. Each step type uses an existing world system. No step invents new content.

## Step Type Summary

| Step Type | Meaning | Skill or System | Risk |
|-----------|---------|-----------------|------|
| Riddle Step | Text hint points to a location, NPC, or object | Reading, world knowledge | None |
| Phrase Step | Say or select a phrase near an NPC or object | NPC dialogue | None |
| Sketch Step | Crude map drawing of a local landmark | Cartography | None |
| Survey Step | Use Cartography at a landmark | Cartography | None |
| Dig Step | Use trowel, spade, or tool at a tile or landmark | Spade item | Low |
| Gesture Step | Perform an emote or ritual action | Emote system | None |
| Dress Step | Wear specific Trail Gear or cosmetics | Item ownership | None |
| Item Step | Bring, show, or use an item | Inventory | None |
| Station Step | Cook, smelt, fire, string, repair, or bless something | Production skill | None |
| Skill Step | Pass a skill-level action check | Skill level | None |
| Sleight Step | Pick, search, or inspect false panels | Sleight | Medium |
| Shrine Step | Light candle, offer bones, cleanse, or name the dead | Favour | None |
| Warden Step | Complete or show proof of a contract | Wardenry | None |
| Boss Step | Kill or inspect boss lair result | Combat | High |
| Ambush Step | Spawn Trail enemy | Combat | High |
| Lockbox Step | Small puzzle or object sequence | Puzzle | None |

## Tier Availability

Not all step types appear at all tiers.

| Step Type | Scrap | Chalk | Writ | Grave | Crown | Starfall |
|-----------|-------|-------|------|-------|-------|----------|
| Riddle | yes | yes | yes | yes | yes | yes |
| Phrase | yes | yes | yes | yes | yes | yes |
| Sketch | yes | yes | yes | yes | yes | yes |
| Survey | no | yes | yes | yes | yes | yes |
| Dig | yes | yes | yes | yes | yes | yes |
| Gesture | yes | yes | yes | yes | yes | yes |
| Dress | no | yes | yes | yes | yes | yes |
| Item | yes | yes | yes | yes | yes | yes |
| Station | no | yes | yes | yes | yes | yes |
| Skill | no | yes | yes | yes | yes | yes |
| Sleight | no | no | yes | yes | yes | yes |
| Shrine | no | no | yes | yes | yes | yes |
| Warden | no | no | yes | yes | yes | yes |
| Boss | no | no | no | yes | yes | yes |
| Ambush | no | no | yes | yes | yes | yes |
| Lockbox | no | no | no | yes | yes | yes |

## Step Format

Each step object has these fields:

- step_type — one of the 16 canonical types
- step_index — position in the Trail sequence (0-based)
- clue_text — the text shown to the player (for riddle, phrase, sketch, etc.)
- target_location — district, landmark, or tile identifier
- target_npc — optional NPC identifier
- target_object — optional object identifier
- required_item — optional item identifier
- required_skill — optional skill ID and minimum level
- required_quest — optional quest ID
- ambush_enemy — optional enemy identifier (for ambush steps)
- station_id — optional station identifier (for station steps)

## Step Rules

1. **Steps are sequential.** A player must complete step 0 before seeing step 1.
2. **Steps are revealed one at a time.** The player only sees the current step. Future steps are hidden.
3. **Steps can be abandoned.** A player can abandon a Trail at any time. The Trail item is destroyed.
4. **Steps cannot be skipped.** There is no skipping mechanism. A player must solve each step.
5. **Steps use existing content.** No step references content that does not exist.
6. **Steps are readable.** A player should understand what to do without external reference.

---

*Last updated: 2026-06-01*
