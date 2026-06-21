# ADR-004: Content Reference Graph

## Status

Accepted

## Context

`content-registry.ts` was doing three things in one module:

1. Schema validation (Zod parsing per file)
2. Registry building (indexing into per-kind Maps)
3. Cross-reference validation (checking every inter-definition link)

As Old Town content grows, cross-reference rules will expand: item → equipment slot, NPC → combat stats, quest → dialogue → node links, region map → placed objects → object definitions → resource nodes → skills → items. Keeping all of this in one file would make `content-registry.ts` a 500+ line monolith, and adding a new content kind would require touching the registry builder, the schema map, and the cross-reference switch.

## Decision

1. **Separate the Content Reference Graph.** Cross-reference validation moves to `packages/shared/src/content/content-references.ts`. The module exports one function: `validateContentGraph(registries, sources) → ContentIssue[]`.

2. **Keep `validateContent(...)` as the public entry point.** `content-registry.ts` still orchestrates schema validation → registry building → graph validation. Callers do not change.

3. **Explicit typed rules, no reflection.** `content-references.ts` iterates over each registry with `for (const [id, def] of registries.kind)` and checks specific fields. There is no generic `findAllReferences` helper that walks objects recursively.

4. **Preserve all existing behavior.** The extracted graph validator reproduces every cross-reference rule from the original `content-registry.ts`:
   - resourceNode → item (output), skill
   - spell → item (bead costs, alchemy, enchant)
   - npc → dropTable, dialogue
   - object → resourceNode, dialogue
   - dropTable → item (entries, alwaysDrops)
   - quest → item/skill/quest (requirements, effects), npc/item/object (objectives)
   - dialogue → internal node links, requirements, effects
   - regionMap → material, object, npc, item

5. **Source map for path attribution.** `validateContentGraph` receives `sources: ReadonlyMap<string, string>` (`${kind}:${id}` → file path) so every issue still carries the originating file path.

6. **No filesystem access in shared content code.** File loading stays in the caller (server boot loader, content-validator CLI).

## Consequences

- `content-registry.ts` shrinks from ~337 lines to ~146 lines. Its responsibility is now schema + registry building only.
- `content-references.ts` is ~190 lines of explicit cross-reference rules. Adding a new content kind only requires adding one loop to this file.
- `validateContentGraph` can be tested directly with synthetic registries, without loading JSON files.
- `content-references.test.ts` exists with focused tests for the graph validator (7 tests covering resource nodes, NPCs, dialogue, spells, quests, and valid passes).
- The term "Content Reference Graph" is a durable module concept for Old Town: a content-driven MMO needs explicit cross-reference validation between JSON definitions.

## Related

- `POC_SPEC.md` §25 (Minimal POC architecture)
- `packages/shared/src/content/content-registry.ts`
- `packages/shared/src/content/content-references.ts`
- `packages/shared/src/content/content-references.test.ts`
- `packages/shared/src/content/content-registry.test.ts`
