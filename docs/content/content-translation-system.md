---
doc_type: authority
canonical_path: docs/content/content-translation-system.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/content-kind-contracts.md`
- `docs/content/schema-gap-analysis.md`
- `POC_SPEC.md`

# Content Translation System

> **Core translation authority.** This document defines how design docs become runtime content JSON, what to do when no schema exists, and the order in which content kinds must be built.

## The 3-Output Principle

Every design doc in `docs/` must produce one of three things:

1. **Runtime content JSON.** A validated JSON file in a supported `content/` directory, loadable by the server on boot.
2. **Schema gap / future content kind.** A documented system that has no runtime schema yet. It stays in docs until a schema is added.
3. **Pure design authority.** A doc that governs rules, tone, or naming without directly producing JSON. Examples: `docs/spatial/naming-atlas.md`, `docs/quests/dialogue-style-guide.md`.

**Rule:** No doc may exist without a defined output category. If a doc does not fit any of the three, it must be rewritten or removed.

## Translation Workflow

```
Design doc → Content manifest → Schema validation → Content JSON → Runtime registry
```

| Step | Responsibility | Tool / Command |
|------|---------------|----------------|
| Design doc | World-building docs in `docs/` | Prose, tables, IDs |
| Content manifest | `docs/content/seed-*.md` files | Cross-referenced planning docs |
| Schema validation | `packages/shared/src/content-schemas/` | Zod schemas |
| Content JSON | `content/*/*.json` files | Validated definitions |
| Runtime registry | Server boot sequence | `bun run content:validate` |

## Vertical Slice Priority Order

Content kinds must be built in this order because later kinds depend on earlier ones.

| Priority | Content Kind | Directory | Why It Comes First |
|----------|--------------|-----------|-------------------|
| 1 | Skill | `content/skills/` | Everything else references skill levels |
| 2 | Material | `content/materials/` | Recipes and items reference materials |
| 3 | Item | `content/items/` | Recipes, drops, shops, and quests reference items |
| 4 | Object | `content/objects/` | Stations, landmarks, and quest anchors |
| 5 | Resource Node | `content/resource-nodes/` | Gathering loops need nodes and items |
| 6 | Processing Recipe | `content/processing-recipes/` | Production chains need items and stations |
| 7 | NPC | `content/npcs/` | Dialogue, shops, and quests reference NPCs |
| 8 | Drop Table | `content/drops/` | Creatures need drop tables |
| 9 | Creature | `content/npcs/` (creature kind) | Spawns need drop tables and movement |
| 10 | Quest | `content/quests/` | Quests need items, NPCs, objects, and dialogue |
| 11 | Dialogue | `content/dialogue/` | Dialogue needs NPCs and quest context |
| 12 | Region Map | `content/maps/` | Maps need objects, NPCs, nodes, and spawns |
| 13 | Animation | `content/animations/` | Visual definitions for actions and states |
| 14 | Spell | `content/spells/` | Spells need items, skills, and effects |

## Dependency Flow Diagram

```
Skills → Materials → Items → Objects → Resource Nodes → Recipes
  ↓         ↓         ↓        ↓           ↓              ↓
  └─────────┴─────────┴────────┴───────────┴──────────────┘
                           ↓
                    NPCs + Drop Tables + Creatures
                           ↓
              Quests + Dialogue + Region Map
                           ↓
                    Animations + Spells
```

**Rule:** You cannot build priority 6 (Recipes) before priority 3 (Items) because recipes consume and produce items. You cannot build priority 10 (Quests) before priority 7 (NPCs) because quests need giver NPCs.

## Schema Gap Handling

When a design system has no runtime schema:

1. Document it in [`schema-gap-analysis.md`](schema-gap-analysis.md).
2. Do not create unsupported JSON directories.
3. If the system is POC-critical, add a schema story before the content story.
4. If the system is post-POC, leave it as a documented gap.

## See also

- [`docs/content/content-kind-contracts.md`](content-kind-contracts.md) — Content kind mapping
- [`docs/content/schema-gap-analysis.md`](schema-gap-analysis.md) — Schema gap details
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC content set
- [`docs/content/validation-and-drift-control.md`](validation-and-drift-control.md) — Validation rules
- [`POC_SPEC.md`](../../POC_SPEC.md) — Engine spec

---

*Last updated: 2026-05-31*
