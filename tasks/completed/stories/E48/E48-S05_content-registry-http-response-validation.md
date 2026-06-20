# E48-S05 — Content registry HTTP response validation

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S01 (S2C packet Zod schemas — for shared schema fragments)
- Blocks: E48-S07

## Spec references

- `apps/client/src/game/ui/ContentClient.ts` — `load()` method (lines 37-53)
- `apps/server/src/server.ts` — `serializeContentForClient` (lines 240-252)
- `packages/shared/src/content-schemas/` — existing Zod schemas for `ItemDef`, `NpcDef`, `ObjectDef`, `SkillDef`, `SpellDef`, `QuestDef`, `DialogueDef`, `MaterialDef`
- `packages/shared/src/protocol/parse-result.ts` — `ParseResult<T>` type

## Objective

Define a Zod schema for the content registry HTTP response and validate it in `ContentClient.load()` before storing. The server serializes from validated registries, but the HTTP transport is untrusted — a proxy, cache corruption, or server bug could deliver malformed JSON.

## Required architectural decisions

- **Reuse content schemas.** The content schemas in `packages/shared/src/content-schemas/` already define Zod schemas for each registry value type (`itemSchema`, `npcSchema`, `objectSchema`, etc.). Reuse them. The registry response is a `Record<string, T>` for each registry, so the response schema is `z.object({ item: z.record(contentIdSchema, itemSchema), ... })`.
- **Strict mode.** Use `.strict()` on the top-level response object so a new registry key from the server is caught (the client should be updated to handle it, not silently ignore it).
- **Performance.** Content registries can be large (hundreds of items). Zod validation on the full payload is acceptable at load time (one-time cost). If profiling shows it is too slow, a per-registry lazy validation strategy can be added later — but start with full validation.
- **Error handling.** If validation fails, throw an `Error` with the Zod error message. `GameEngine` already catches `ContentClient.load()` failures in a `.catch()` block (line 299) and logs a warning. The client continues without content (UI falls back to placeholders).
- **`contract` registry.** The server's `serializeContentForClient` includes a `contract` registry that `ContentClientRegistries` does not declare. Decide: either add `contract` to `ContentClientRegistries` and the schema, or use `.passthrough()` on the top-level object. Prefer adding `contract` to the interface for completeness — the client may need it for contract UI panels.

## Implementation checklist

- [X] Audit `packages/shared/src/content-schemas/` for existing schemas: `itemSchema`, `npcSchema`, `objectSchema`, `skillSchema`, `spellSchema`, `questSchema`, `dialogueSchema`, `materialSchema`, `contractSchema`. Note which exist and which need to be referenced.
- [X] Add `contract` to the `ContentClientRegistries` interface in `ContentClient.ts` if it exists on the server but not the client interface.
- [X] Create `contentClientRegistriesSchema` in a new file `packages/shared/src/protocol/content-client-registries.ts`. The schema:
  ```ts
  const contentClientRegistriesSchema = z.object({
    item: z.record(contentIdSchema, itemSchema),
    npc: z.record(contentIdSchema, npcSchema),
    object: z.record(contentIdSchema, objectSchema),
    skill: z.record(contentIdSchema, skillSchema),
    spell: z.record(contentIdSchema, spellSchema),
    quest: z.record(contentIdSchema, questSchema),
    dialogue: z.record(contentIdSchema, dialogueSchema),
    material: z.record(contentIdSchema, materialSchema),
    contract: z.record(contentIdSchema, contractSchema),
  }).strict();
  ```
- [X] Export `contentClientRegistriesSchema` and a `parseContentClientRegistries(raw: unknown): ParseResult<ContentClientRegistries>` function from `@old-town/shared`.
- [X] Update `ContentClient.load()`:
  - [X] Replace the `typeof raw !== "object"` check and `as ContentClientRegistries` cast with `parseContentClientRegistries(raw)`.
  - [X] If `!result.ok`, throw `new Error("Invalid content response: " + result.error)`.
  - [X] If `result.ok`, store `result.value`.
- [X] Write tests:
  - [X] Valid content response with all registries populated parses successfully.
  - [X] Missing registry key is rejected (strict).
  - [X] Extra registry key is rejected (strict).
  - [X] Invalid item definition (e.g. bad content id format) is rejected.
  - [X] `ContentClient.load()` throws on invalid response.
  - [X] `ContentClient.load()` succeeds on valid response and `ready` becomes `true`.

## Acceptance criteria

- [X] `ContentClient.load()` validates the HTTP response with Zod before storing.
- [X] No `as ContentClientRegistries` cast remains in `ContentClient.ts`.
- [X] `ContentClientRegistries` includes `contract` if the server sends it.
- [X] `contentClientRegistriesSchema` is exported from `@old-town/shared`.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes.
- [X] `bun x vitest run apps/client/src/game/ui/` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run apps/client/src/game/ui/`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
