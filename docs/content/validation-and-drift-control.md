---
doc_type: authority
canonical_path: docs/content/validation-and-drift-control.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/canonical-id-registry.md`
- `docs/content/starter-content-manifest.md`
- `POC_SPEC.md`

# Validation and Drift Control

> **14 validation checks and drift prevention rules.** These checks ensure that content manifests stay consistent with design docs and runtime JSON.

## The 14 Validation Checks

### 1. Canonical ID Registry Check

**Rule:** Every content ID referenced by another manifest appears in the canonical registry.

**How to check:** Search all `docs/content/seed-*.md` files for IDs. Verify each ID matches a pattern in [`canonical-id-registry.md`](canonical-id-registry.md).

**Failure:** A recipe references `penny_copper_ore` (underscore) instead of `penny-copper-ore` (kebab-case).

### 2. Starter NPC Role Check

**Rule:** Every starter NPC has either dialogue, service, combat, or quest role.

**How to check:** Verify every NPC in [`seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) has at least one of: `dialogue_id`, `shop_or_service_id`, `drop_table_id`, or quest reference.

**Failure:** An NPC has no dialogue, no shop, no combat role, and no quest link.

### 3. Starter Object Placement Check

**Rule:** Every starter object has placement and options.

**How to check:** Verify every object in [`seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) has `placement_source` and `options` fields.

**Failure:** An object has no tile placement or no interactable options.

### 4. Resource Node Output Check

**Rule:** Every resource node output item exists.

**How to check:** For every node in [`seed-resource-nodes-manifest.md`](seed-resource-nodes-manifest.md), verify `output_item_id` appears in [`seed-items-manifest.md`](seed-items-manifest.md) or [`seed-materials-manifest.md`](seed-materials-manifest.md).

**Failure:** A node outputs `riverwillow-log` but no such item is defined.

### 5. Recipe Input/Output Check

**Rule:** Every recipe input and output item exists.

**How to check:** For every recipe in [`seed-recipes-manifest.md`](seed-recipes-manifest.md), verify all `input_items` and `output_items` appear in [`seed-items-manifest.md`](seed-items-manifest.md) or [`seed-materials-manifest.md`](seed-materials-manifest.md).

**Failure:** A recipe consumes `flour` but `flour` is not in the item manifest.

### 6. Drop Table Output Check

**Rule:** Every drop table output item exists.

**How to check:** For every drop table in [`seed-drops-and-contracts-manifest.md`](seed-drops-and-contracts-manifest.md), verify all `drops` item IDs appear in [`seed-items-manifest.md`](seed-items-manifest.md).

**Failure:** A drop table references `soot-fur` but no such item is defined.

### 7. Quest Reward Item Check

**Rule:** Every quest reward item exists.

**How to check:** For every quest in [`seed-quests-and-dialogue-manifest.md`](seed-quests-and-dialogue-manifest.md), verify all `reward_items` appear in [`seed-items-manifest.md`](seed-items-manifest.md).

**Failure:** A quest rewards `ledger-seven` but `ledger-seven` is not in the item manifest.

### 8. Map Placement Reference Check

**Rule:** Every map placement references an existing object, NPC, or resource node.

**How to check:** For every placement in [`seed-map-and-spawns-manifest.md`](seed-map-and-spawns-manifest.md), verify the referenced ID appears in the relevant seed manifest.

**Failure:** A map placement references `unknown-npc-123` which does not exist.

### 9. Banned Name Check

**Rule:** No banned resource, place, or fantasy names appear outside banned-name docs.

**How to check:** Search all `docs/content/seed-*.md` files for banned names from [`docs/resources/resource-taxonomy.md`](../resources/resource-taxonomy.md) and [`docs/spatial/naming-atlas.md`](../spatial/naming-atlas.md).

**Failure:** A manifest uses `mithril` or `dragon` as an item ID.

### 10. Unsupported Directory Check

**Rule:** No unsupported content directory is created.

**How to check:** Verify `content/` subdirectories match the 13 supported kinds in [`content-kind-contracts.md`](content-kind-contracts.md).

**Failure:** A story creates `content/shops/` or `content/ledger/` without schema support.

### 11. JSON Validation Check

**Rule:** All generated JSON passes `bun run content:validate`.

**How to check:** Run `bun run content:validate` after every content story.

**Failure:** A JSON file fails schema validation with a Zod error.

### 12. Cross-Reference Path Check

**Rule:** All docs use canonical paths for cross-tree references.

**How to check:** Verify every markdown link in `docs/content/*.md` uses a relative path that resolves.

**Failure:** A doc links to `docs/old/path.md` which has been moved.

### 13. Starter Loop Completeness Check

**Rule:** Starter loops have all required content entries.

**How to check:** For each of the 6 loops in [`docs/map/first-30-minute-paths.md`](../map/first-30-minute-paths.md), verify all referenced items, recipes, NPCs, objects, and nodes exist in seed manifests.

**Failure:** Loop B (Full Penny) needs `foundry-furnace` but the object manifest does not list it.

### 14. Manifest Source Doc Check

**Rule:** Every content manifest row includes source docs.

**How to check:** Verify every table row in `docs/content/seed-*.md` has a `docs_source` column or inline reference.

**Failure:** A skill in [`seed-skills-manifest.md`](seed-skills-manifest.md) has no `docs_source` field.

## Drift Prevention

### Rules for Maintaining Consistency

1. **One source of truth per ID.** The canonical ID registry governs naming. The seed manifests govern existence. The design docs govern behaviour. Never let two docs disagree on the same ID.
2. **Update manifests when design docs change.** If a quest is renamed, update [`seed-quests-and-dialogue-manifest.md`](seed-quests-and-dialogue-manifest.md). If an item is removed, update all manifests that reference it.
3. **Run validation checks before marking a story complete.** Every content story must pass all 14 checks before the story checkboxes are marked done.
4. **No orphaned IDs.** If an ID is removed from a manifest, search the entire repo for references and update or remove them.
5. **Schema gaps are documented, not hidden.** If a system lacks a schema, it must appear in [`schema-gap-analysis.md`](schema-gap-analysis.md) with a POC priority.
6. **Cross-reference links must resolve.** Broken links are treated as validation failures.
7. **Kebab-case is enforced.** Any underscore or camelCase ID found in a manifest is a validation failure.

## Validation Commands

Run these commands in order before marking any content story complete:

```sh
bun run test          # All test suites must pass
bun run lint          # No lint errors
bun run typecheck     # No type errors
bun run content:validate  # All JSON passes schema validation
```

**Rule:** A story is not complete until all four commands pass with zero errors.

## See also

- [`docs/content/canonical-id-registry.md`](canonical-id-registry.md) — ID rules
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC requirements
- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/00-index.md`](00-index.md) — Content directory index
- [`POC_SPEC.md`](../../POC_SPEC.md) — Engine spec

---

*Last updated: 2026-05-31*
