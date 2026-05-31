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

**Kebab-case only.** All content IDs use lowercase letters and hyphens. No underscores, no camelCase, no mixed styles.

| Allowed | Banned |
|---------|--------|
| `pennywrought-shortblade` | `pennywrought_shortblade` |
| `bellbread` | `bellBread` |
| `small-bones` | `small_bones` |
| `mara-bellkeeper` | `mara_bellkeeper` |
| `market-bell` | `marketBell` |

## Naming Conventions by Content Kind

### Items

Descriptive plus functional. The name should tell a player what it is.

| Pattern | Example |
|---------|---------|
| `{tier}-{family}` | `pennywrought-shortblade`, `pig-iron-handaxe` |
| `{descriptor}-{type}` | `bellbread`, `cleanblood-salve`, `arms-tincture` |
| `{material}-{type}` | `penny-copper-ore`, `oldroad-oak-log`, `ditch-shrimp` |
| `{quest}-{item}` | `smoke-over-old-town-baker-key`, `rat-tail` |

### NPCs

Name plus role. Use the NPC's given name and a short role descriptor.

| Pattern | Example |
|---------|---------|
| `{name}-{role}` | `mara-bellkeeper`, `tomas-tally`, `warden-holt` |

### Objects

Place plus function. The ID should locate the object in the world.

| Pattern | Example |
|---------|---------|
| `{place}-{function}` | `market-bell`, `counting-house-door`, `foundry-furnace` |
| `{district}-{station}` | `lath-bow-bench`, `patch-tanning-frame` |

### Resource Nodes

Place plus resource plus type.

| Pattern | Example |
|---------|---------|
| `{place}-{resource}-{type}` | `penny-copper-deposit`, `tinstone-deposit`, `oldroad-oak-tree` |

### Processing Recipes

Verb plus output.

| Pattern | Example |
|---------|---------|
| `{verb}-{output}` | `smelt-pennywrought-ingot`, `cook-bellbread`, `forge-pennywrought-shortblade` |

### Quests

Kebab-case title.

| Pattern | Example |
|---------|---------|
| `{kebab-title}` | `smoke-over-old-town`, `rats-under-tallys`, `a-penny-for-the-forge` |

### Dialogue

NPC plus context.

| Pattern | Example |
|---------|---------|
| `{npc}-{context}` | `mara-bellkeeper-arrival`, `tomas-tally-rats-under-tallys` |

### Materials

Resource name. Materials are a subset of items with simpler IDs.

| Pattern | Example |
|---------|---------|
| `{resource-name}` | `penny-copper`, `tinstone`, `oldroad-oak` |

### Skills

Single word.

| Pattern | Example |
|---------|---------|
| `{skill-name}` | `mining`, `smithing`, `arms`, `favour` |

### Spells

School plus descriptor.

| Pattern | Example |
|---------|---------|
| `{school}-{descriptor}` | `chalkmarked-bolt`, `favour-cordial` |

## Banned ID Patterns

The following patterns are forbidden in all content IDs:

| Banned Pattern | Example of Ban | Why |
|----------------|----------------|-----|
| Underscores | `penny_copper` | Use hyphens only |
| camelCase | `pennyCopper` | Use hyphens only |
| PascalCase | `PennyCopper` | Use lowercase only |
| Numbers only | `123`, `item-001` | IDs must be readable |
| Generic prefixes | `item-`, `npc-`, `obj-` | The ID should describe the thing, not its kind |
| Mixed case styles | `penny-copper_ore` | One style only: kebab-case |
| RS-coded names | `bronze-sword`, `iron-dagger`, `health-potion` | Use Old Town names |
| Fantasy generics | `mithril`, `adamantite`, `runite`, `dragon` | Use Old Town names |

## Migration Note

Some existing docs and code may use underscores from early drafts. When migrating:

1. Update the doc or code to kebab-case.
2. Update any cross-references in other docs.
3. If the ID has already shipped in content JSON, create an alias or accept the legacy ID until a content wipe.

**Rule:** New content must use kebab-case. Legacy content should be migrated when touched.

## See also

- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/seed-*.md`](00-index.md) — Seed manifests with example IDs
- [`docs/spatial/naming-atlas.md`](../spatial/naming-atlas.md) — Cultural naming rules
- [`docs/resources/resource-taxonomy.md`](../resources/resource-taxonomy.md) — Canonical resource names

---

*Last updated: 2026-05-31*
