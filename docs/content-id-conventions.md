# Content ID & Asset Reference Conventions

Old Town addresses every piece of content by a **stable, lowercase `snake_case` string
id** — never a legacy numeric id. Ids are authored by hand in JSON content, referenced
across the engine and protocol, and must stay stable across releases.

Canonical implementation: `packages/shared/src/content/content-ids.ts`.

## Naming rule

All content ids must match:

```
^[a-z][a-z0-9_]*$        // 1–64 characters, must start with a lowercase letter
```

| Category    | Brand type    | Constructor      | Examples                          |
| ----------- | ------------- | ---------------- | --------------------------------- |
| Item        | `ItemId`      | `itemId()`       | `penny_hatchet`, `raw_reedfish`   |
| NPC         | `NpcId`       | `npcId()`        | `town_guard`, `river_rat`         |
| Object      | `ObjectId`    | `objectId()`     | `oak_tree`, `copper_rock`         |
| Skill       | `SkillId`     | `skillId()`      | `woodcutting`, `attack`           |
| Spell       | `SpellId`     | `spellId()`      | `ember_flick`, `homeward_murmur`  |
| Quest       | `QuestId`     | `questId()`      | `smoke_over_old_town`             |
| Drop table  | `DropTableId` | `dropTableId()`  | `river_rat_drops`                 |
| Animation   | `AnimationId` | `animationId()`  | `chop_swing`, `human_walk`        |
| Material    | `MaterialId`  | `materialId()`   | `grass`, `cobblestone`            |
| Asset       | `AssetId`     | `assetId()`      | `tree_oak`, `icon_penny_hatchet`  |

Each constructor validates the string and brands it as an opaque type so ids of different
categories cannot be accidentally interchanged. `isContentId(value)` is the raw predicate.

## Stability rules

- Ids are **stable strings**, not numeric. Renaming an id is a breaking content change.
- Ids are case-sensitive and always lowercase.
- Prefer descriptive names (`copper_rock`) over abbreviations (`cu_rk`).

## Originality (POC_SPEC §23.3) — required

Old Town uses **original content only**. Do **not** use, copy, or imitate:

- OSRS / Jagex item, NPC, object, or animation ids or cache identifiers.
- OSRS asset names, icons, models, or map layouts/region ids.
- The 317/OSRS protocol opcodes or cache formats as a runtime dependency.
- Copied quest structures or dialogue.

Acceptable: original low-poly models, original silhouettes, original (or sufficiently
distinct) skill names, original maps, NPCs, and quests. When in doubt, invent a new name.
