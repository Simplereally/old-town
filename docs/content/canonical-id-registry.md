---
doc_type: authority
canonical_path: docs/content/canonical-id-registry.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/content-translation-system.md`
- `docs/content/seed-*.md`
- `docs/spatial/naming-atlas.md`

# Canonical ID Registry

> **Stable ID naming rules for all runtime content.** IDs are the glue between docs, JSON, and code. Once an ID ships in content, it must never change.

## Core Rule

**Lowercase snake_case only.** All runtime content IDs use lowercase letters and underscores. This matches the engine schema (`^[a-z][a-z0-9_]*$`). No hyphens, no camelCase, no mixed styles.

| Allowed | Banned |
|---------|--------|
| `pennywrought_shortblade` | `pennywrought-shortblade` |
| `bellbread` | `bellBread` |
| `small_bones` | `small-bones` |
| `mara_bellkeeper` | `mara-bellkeeper` |
| `market_bell` | `marketBell` |

## Naming Conventions by Content Kind

### Items

Descriptive plus functional. The name should tell a player what it is.

| Pattern | Example |
|---------|---------|
| `{tier}_{family}` | `pennywrought_shortblade`, `pig_iron_handaxe` |
| `{descriptor}_{type}` | `bellbread`, `cleanblood_salve`, `arms_tincture` |
| `{material}_{type}` | `penny_copper_ore`, `oldroad_oak_log`, `ditch_shrimp` |
| `{quest}_{item}` | `smoke_over_old_town_baker_key`, `rat_tail` |

### NPCs

Name plus role. Use the NPC's given name and a short role descriptor.

| Pattern | Example |
|---------|---------|
| `{name}_{role}` | `mara_bellkeeper`, `tomas_tally`, `warden_holt` |

### Objects

Place plus function. The ID should locate the object in the world.

| Pattern | Example |
|---------|---------|
| `{place}_{function}` | `market_bell`, `counting_house_door`, `foundry_furnace` |
| `{district}_{station}` | `lath_bow_bench`, `patch_tanning_frame` |

### Resource Nodes

Place plus resource plus type.

| Pattern | Example |
|---------|---------|
| `{place}_{resource}_{type}` | `penny_copper_deposit`, `tinstone_deposit`, `oldroad_oak_tree` |

### Processing Recipes

Verb plus output.

| Pattern | Example |
|---------|---------|
| `{verb}_{output}` | `smelt_pennywrought_ingot`, `cook_bellbread` |

### Quests

snake_case title.

| Pattern | Example |
|---------|---------|
| `{snake_title}` | `smoke_over_old_town`, `rats_under_tallys` |

### Dialogue

NPC plus context.

| Pattern | Example |
|---------|---------|
| `{npc}_{context}` | `mara_bellkeeper_arrival`, `tomas_tally_rats_under_tallys` |

### Materials

Resource name. Materials are a subset of items with simpler IDs.

| Pattern | Example |
|---------|---------|
| `{resource_name}` | `penny_copper`, `tinstone`, `oldroad_oak` |

### Skills

Single word.

| Pattern | Example |
|---------|---------|
| `{skill_name}` | `mining`, `smithing`, `arms` |

### Spells

School plus descriptor.

| Pattern | Example |
|---------|---------|
| `{school}_{descriptor}` | `chalkmarked_bolt`, `favour_cordial` |

## Banned ID Patterns

The following patterns are forbidden in all content IDs:

| Banned Pattern | Example of Ban | Why |
|----------------|----------------|-----|
| Hyphens | `penny-copper` | Use underscores only |
| camelCase | `pennyCopper` | Use lowercase only |
| PascalCase | `PennyCopper` | Use lowercase only |
| Numbers only | `123`, `item_001` | IDs must be readable |
| Generic prefixes | `item_`, `npc_`, `obj_` | The ID should describe the thing, not its kind |
| Mixed case styles | `penny_copper_ore` | One style only: snake_case |
| RS-coded names | `bronze_sword`, `iron_dagger`, `health_potion` | Use Old Town names |
| Fantasy generics | `mithril`, `adamantite`, `runite`, `dragon` | Use Old Town names |

## Migration Note

Design docs originally recommended kebab-case for readability. The runtime schema enforces snake_case (`^[a-z][a-z0-9_]*$`). When creating content JSON:

1. Convert all kebab-case IDs from design docs to snake_case.
2. Use the snake_case ID in the content JSON.
3. Keep the kebab-case name in the display name and docs.

**Rule:** Runtime content must use snake_case. Design docs may use kebab-case for readability but must be translated to snake_case for JSON.

## See also

- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/seed-*.md`](00-index.md) — Seed manifests with example IDs
- [`docs/spatial/naming-atlas.md`](../spatial/naming-atlas.md) — Cultural naming rules
- [`docs/resources/resource-taxonomy.md`](../resources/resource-taxonomy.md) — Canonical resource names

---

*Last updated: 2026-05-31*
