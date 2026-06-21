---
doc_type: authority
canonical_path: docs/content/content-kind-contracts.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/content-translation-system.md`
- `docs/content/seed-*.md`
- `POC_SPEC.md`

# Content Kind Contracts

> **Map each existing runtime content kind to its source docs.** This table is the contract between design and implementation. If a content kind is required for POC, its source docs must be complete before JSON generation begins.

## Runtime Content Kinds

| Runtime Kind | Directory | Source Docs | Required for POC? | Notes |
|--------------|-----------|-------------|-------------------|-------|
| **item** | `content/items/` | [`docs/items/00-index.md`](../items/00-index.md), [`docs/items/weapons/00-index.md`](../items/weapons/00-index.md), [`docs/items/armour/00-index.md`](../items/armour/00-index.md), [`docs/items/consumables/00-index.md`](../items/consumables/00-index.md), [`docs/items/resources/00-index.md`](../items/resources/00-index.md), [`docs/items/tools/00-index.md`](../items/tools/00-index.md), [`docs/items/quest/00-index.md`](../items/quest/00-index.md), [`docs/items/misc/00-index.md`](../items/misc/00-index.md), [`docs/items/accessories/00-index.md`](../items/accessories/00-index.md) | Yes | Largest content kind. All items must use kebab-case IDs. |
| **npc** | `content/npcs/` | [`docs/world/npc-cast.md`](../world/npc-cast.md), [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md), [`docs/map/npc-placement.md`](../map/npc-placement.md) | Yes | Service NPCs and creatures share the NPC directory with a `kind` field. |
| **object** | `content/objects/` | [`docs/map/station-placement.md`](../map/station-placement.md), [`docs/map/shop-and-service-placement.md`](../map/shop-and-service-placement.md), [`docs/map/quest-object-placement.md`](../map/quest-object-placement.md), [`docs/tools-and-intermediates/stations.md`](../tools-and-intermediates/stations.md) | Yes | Stations, landmarks, shops, and quest objects. |
| **processingRecipe** | `content/processing-recipes/` | [`docs/recipes/recipe-system.md`](../recipes/recipe-system.md), [`docs/recipes/recipe-chains.md`](../recipes/recipe-chains.md), [`docs/recipes/cooking-recipes.md`](../recipes/cooking-recipes.md), [`docs/recipes/smithing-recipes.md`](../recipes/smithing-recipes.md), [`docs/recipes/bowcraft-recipes.md`](../recipes/bowcraft-recipes.md), [`docs/recipes/beadwork-recipes.md`](../recipes/beadwork-recipes.md) | Yes | Recipes need items, tools, and stations to exist first. |
| **skill** | `content/skills/` | [`docs/skills/skill-system.md`](../skills/skill-system.md), [`docs/skills/combat-skills.md`](../skills/combat-skills.md), [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md), [`docs/skills/production-skills.md`](../skills/production-skills.md), [`docs/skills/utility-skills.md`](../skills/utility-skills.md), [`docs/skills/skill-interlocks.md`](../skills/skill-interlocks.md) | Yes | Skills are the foundation. Build them first. |
| **resourceNode** | `content/resource-nodes/` | [`docs/resources/00-index.md`](../resources/00-index.md), [`docs/resources/ores-and-stone.md`](../resources/ores-and-stone.md), [`docs/resources/woods-and-timber.md`](../resources/woods-and-timber.md), [`docs/resources/fish-and-cooking.md`](../resources/fish-and-cooking.md), [`docs/resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md), [`docs/resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md), [`docs/map/resource-node-placement.md`](../map/resource-node-placement.md) | Yes | Nodes need items to define outputs. |
| **spell** | `content/spells/` | [`docs/favour/favour-system.md`](../favour/favour-system.md), [`docs/favour/boons-and-oaths.md`](../favour/boons-and-oaths.md) | No | Spells are post-POC. Document as schema gap if needed early. |
| **quest** | `content/quests/` | [`docs/quests/quest-system.md`](../quests/quest-system.md), [`docs/quests/starter-quest-arc.md`](../quests/starter-quest-arc.md), [`docs/quests/smoke-over-old-town.md`](../quests/smoke-over-old-town.md), [`docs/quests/rats-under-tallys.md`](../quests/rats-under-tallys.md), [`docs/quests/a-penny-for-the-forge.md`](../quests/a-penny-for-the-forge.md), [`docs/quests/string-enough-to-sing.md`](../quests/string-enough-to-sing.md), [`docs/quests/the-beadwifes-errand.md`](../quests/the-beadwifes-errand.md), [`docs/quests/gravegate-flowers.md`](../quests/gravegate-flowers.md), [`docs/quests/the-missing-bell-clapper.md`](../quests/the-missing-bell-clapper.md) | Yes | Quests need NPCs, items, objects, and dialogue. |
| **dialogue** | `content/dialogue/` | [`docs/quests/dialogue-style-guide.md`](../quests/dialogue-style-guide.md), [`docs/quests/npc-voice-bible.md`](../quests/npc-voice-bible.md) | Yes | Dialogue packs are tied to NPCs and quests. |
| **dropTable** | `content/drops/` | [`docs/creatures/drop-table-system.md`](../creatures/drop-table-system.md), [`docs/creatures/starter-drop-tables.md`](../creatures/starter-drop-tables.md) | Yes | Drop tables need items to define drops. |
| **regionMap** | `content/maps/` | [`docs/map/old-town-starter-region.md`](../map/old-town-starter-region.md), [`docs/map/district-boundaries.md`](../map/district-boundaries.md), [`docs/map/map-placement-system.md`](../map/map-placement-system.md) | Yes | The starter region map is POC-critical. |
| **material** | `content/materials/` | [`docs/resources/00-index.md`](../resources/00-index.md), [`docs/resources/resource-taxonomy.md`](../resources/resource-taxonomy.md) | Yes | Materials are a subset of items with a dedicated registry. |
| **animation** | `content/animations/` | [`docs/combat/signature-mechanics.md`](../combat/signature-mechanics.md), [`docs/combat/mechanics-implementation.md`](../combat/mechanics-implementation.md) | No | Animations are post-POC unless needed for combat feel. |

## POC-Required Summary

| Required? | Count | Kinds |
|-----------|-------|-------|
| Yes | 11 | item, npc, object, processingRecipe, skill, resourceNode, quest, dialogue, dropTable, regionMap, material |
| No | 2 | spell, animation |

## See also

- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/schema-gap-analysis.md`](schema-gap-analysis.md) — Unsupported systems
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC content set
- [`docs/content/seed-*.md`](00-index.md) — Seed manifests
- [`POC_SPEC.md`](../../POC_SPEC.md) — Engine spec

---

*Last updated: 2026-05-31*
