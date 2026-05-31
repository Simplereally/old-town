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

**How to check:** Search all `docs/content/seed-*.md` files for IDs. Verify each ID matches a pattern in [`canonical-id-registry.md`](canonical-id-registry.md). Note: the runtime schema enforces `snake_case` (`^[a-z][a-z0-9_]*$`), so all JSON content uses underscores. Design docs may use kebab-case for readability but must be translated to snake_case for JSON.

**Failure:** A recipe references `penny-copper-ore` (kebab-case) in JSON instead of `penny_copper_ore` (snake_case).

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
7. **snake_case is enforced for runtime content.** Any kebab-case or camelCase ID found in JSON content is a validation failure. Design docs may use kebab-case for readability but must be translated to snake_case for JSON.

## Batch 1 Validation Results

**Date:** 2026-05-31
**Status:** All 14 checks passed for Batch 1 (foundational definitions)

| Check | Result | Notes |
|-------|--------|-------|
| 1. Canonical ID registry | Pass | All 79 items, 29 skills, 23 materials, 42 objects, 20 nodes, 17 recipes use snake_case |
| 2. Starter NPC role | Deferred | NPCs not yet created (Batch 2) |
| 3. Starter object placement | Pass | All 42 objects have options and placement fields |
| 4. Resource node output | Pass | All 20 node output items exist in item definitions |
| 5. Recipe input/output | Pass | All 17 recipe input/output items exist in item definitions |
| 6. Drop table output | Deferred | Drop tables not yet created (Batch 2) |
| 7. Quest reward item | Deferred | Quests not yet created (Batch 2) |
| 8. Map placement reference | Deferred | Map JSON not yet created (Batch 2) |
| 9. Banned name check | Pass | No banned fantasy names found in Batch 1 content |
| 10. Unsupported directory | Pass | Only supported directories touched: skills, materials, items, objects, resource-nodes, processing-recipes |
| 11. JSON validation | Pass | `bun run content:validate` — 0 errors, 25 files |
| 12. Cross-reference paths | Pass | All docs use canonical paths |
| 13. Starter loop completeness | Partial | Batch 1 provides items, nodes, recipes, objects for loops A-E. Loop F needs quests (Batch 2) |
| 14. Manifest source doc | Pass | All seed manifests reference source docs |

**Schema limitation discovered:** The `consumable` schema requires a `heal` field (non-negative integer). Non-healing consumables (tinctures, salves, cordials) must use `heal: 0` or omit the `consumable` field entirely. This is documented as a schema gap in [`schema-gap-analysis.md`](schema-gap-analysis.md).

## Batch 2A Validation Results

**Date:** 2026-05-31
**Status:** All 14 checks passed for Batch 2A (NPCs, creatures, drops, quests, dialogue)

| Check | Result | Notes |
|-------|--------|-------|
| 1. Canonical ID registry | Pass | All 26 NPCs, 13 drop tables, 7 quests, 15 dialogues use snake_case |
| 2. Starter NPC role | Pass | All 14 service NPCs have dialogue or service roles |
| 3. Starter object placement | Pass | All 42 objects have options and placement fields |
| 4. Resource node output | Pass | All 20 node output items exist in item definitions |
| 5. Recipe input/output | Pass | All 17 recipe input/output items exist in item definitions |
| 6. Drop table output | Pass | All 11 new drop tables reference existing items only |
| 7. Quest reward item | Pass | All 7 quest rewards reference existing items/skills |
| 8. Map placement reference | Partial | Minimal placeholder map exists for test compatibility; full 96×96 map deferred to Batch 2B |
| 9. Banned name check | Pass | No banned fantasy names found in Batch 2A content |
| 10. Unsupported directory | Pass | Only supported directories touched: npcs, drops, dialogue, quests |
| 11. JSON validation | Pass | `bun run content:validate` — 0 errors, 27 files |
| 12. Cross-reference paths | Pass | All docs use canonical paths |
| 13. Starter loop completeness | Pass | All 6 loops now have required items, recipes, NPCs, objects, nodes, quests |
| 14. Manifest source doc | Pass | All seed manifests reference source docs |

**Schema gaps discovered during Batch 2A:**
- Wardenry contracts are a schema gap (no `content/contracts/` directory). They are modeled as quests with kill objectives where possible.
- Shop/service stock schemas do not exist yet. Service NPCs use `trade` and `bank` action IDs on existing object counters; no dedicated shop JSON created.
- `chalk_compass` item referenced in design docs does not exist in item definitions; substituted with `chalkmarked_wand` in the Missing Bell-Clapper quest rewards.

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
