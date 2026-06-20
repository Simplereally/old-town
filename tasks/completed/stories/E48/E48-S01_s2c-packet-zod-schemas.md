# E48-S01 — S2C packet Zod schemas

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E01-S04 (server-to-client delta protocol), E01-S05 (entity update masks)
- Blocks: E48-S02, E48-S03, E48-S04, E48-S05, E48-S07

## Spec references

- `POC_SPEC.md` §8.1 (Server → client message types)
- `POC_SPEC.md` §8.3 (Delta packet shape)
- `packages/shared/src/protocol/packets.ts` — all S2C type definitions
- `packages/shared/src/protocol/entity-update.ts` — embedded entity data structures
- `packages/shared/src/protocol/schema-primitives.ts` — reusable Zod fragments (`tileCoordSchema`, `entityIdSchema`, `planeSchema`)
- `packages/shared/src/protocol/command-schemas.ts` — existing C2S Zod pattern to follow

## Objective

Define Zod schemas for every server → client packet type and all embedded data structures. These schemas will be consumed by the validated decoders in subsequent stories. No runtime behavior changes in this story — only new schema definitions and tests.

## Required architectural decisions

- **Schema file location.** Create `packages/shared/src/protocol/packet-schemas.ts` for all S2C schemas. This mirrors the existing `command-schemas.ts` for C2S. Keep `schema-primitives.ts` as the shared fragment library.
- **Strict mode.** All object schemas use `.strict()` to reject extra fields, matching the C2S command schema convention. This catches protocol drift early.
- **Discriminated unions.** `ServerPacket` is a `z.discriminatedUnion("type", ...)` over `FullStatePacket` and `TickDeltaPacket`. `TransportServerPacket` extends this with `PongPacket`, `CommandRejectedPacket`, and `TransportErrorPacket`.
- **Optional fields.** Match the existing TypeScript interfaces exactly — every `readonly` optional field becomes `.optional()` in Zod. Do not add constraints that the types don't express.
- **EntityUpdatePayload.** This is a partial object governed by a bitmask. The schema validates the *shape* of each field if present, but does not cross-check against the mask (that is the job of `assertValidEntityUpdate`, which already exists).
- **Debug data.** `DebugTickData` contains many optional arrays of plain objects. Validate the shape but keep it permissive — debug data is non-critical and should not crash the client if the server adds a new debug field. Use `.passthrough()` on the debug schema only.
- **Reuse.** Import and reuse `tileCoordSchema`, `entityIdSchema`, `planeSchema` from `schema-primitives.ts`. Import `contentIdSchema` from `content-schemas/common.ts` where content IDs appear (e.g. `defId`, `skillId`, `spellId`).
- **Direction enum.** Import the `Direction` enum from `math/direction` and build a `z.nativeEnum(Direction)` schema.
- **EntityKind enum.** Use `z.enum(["player", "npc", "object", "ground_item", "grave", "projectile"])` matching the `EntityKind` type.
- **HitsplatType enum.** Use `z.enum(["damage", "block", "heal", "poison"])`.
- **MoveSpeed enum.** Use `z.enum(["stationary", "walk", "run"])`.

## Implementation checklist

- [X] Create `packages/shared/src/protocol/packet-schemas.ts`.
- [X] Define Zod schemas for all embedded types in `entity-update.ts`:
  - `hitsplatSchema`, `healthBarSchema`, `animationPlaySchema`, `graphicPlaySchema`, `statusEffectUpdateSchema`, `appearanceUpdateSchema`, `equipmentUpdateSchema`, `entityUpdatePayloadSchema`, `entityUpdatePacketSchema`, `entitySpawnPacketSchema`.
- [X] Define Zod schemas for all embedded types in `packets.ts`:
  - `inventorySlotChangeSchema`, `inventoryDeltaSchema`, `skillDeltaSchema`, `varDeltaSchema`, `chatPacketSchema`, `hitsplatPacketSchema`, `xpDropPacketSchema`, `projectilePacketSchema`, `deathNoticePacketSchema`, `respawnNoticePacketSchema`, `contractCompletePacketSchema`, `contractProgressPacketSchema`, `soundPacketSchema`, `dialogueOptionPacketSchema`, `dialogueViewPacketSchema`, `shopStockPacketSchema`, `shopViewPacketSchema`, `activityViewPacketSchema`, `recipeListEntrySchema`, `recipeListPacketSchema`, `recipeResultPacketSchema`, `interfaceOpenPacketSchema`, `interfaceClosePacketSchema`, `regionTileDataSchema`, `chunkDataSchema`, `regionLoadPacketSchema`, `regionUnloadPacketSchema`, `worldConstantsPacketSchema`.
- [X] Define Zod schemas for debug types:
  - `debugPathDataSchema`, `debugTickDataSchema` (use `.passthrough()` on this one only).
- [X] Define top-level packet schemas:
  - `fullStatePacketSchema`, `tickDeltaPacketSchema`.
- [X] Define the discriminated union:
  - `serverPacketSchema = z.discriminatedUnion("type", [fullStatePacketSchema, tickDeltaPacketSchema])`.
- [X] Define transport-level schemas:
  - `pongPacketSchema`, `commandRejectedPacketSchema`, `transportErrorPacketSchema`.
  - `transportServerPacketSchema = z.discriminatedUnion("type", [fullStatePacketSchema, tickDeltaPacketSchema, pongPacketSchema, commandRejectedPacketSchema, transportErrorPacketSchema])`.
- [X] Export `parseServerPacket(raw: unknown): ParseResult<ServerPacket>` and `parseTransportServerPacket(raw: unknown): ParseResult<TransportServerPacket>` using `safeParse` + the `as unknown as T` brand pattern from `command-schemas.ts`.
- [X] Export all schemas from `packet-schemas.ts`.
- [X] Add `export * from "./protocol/packet-schemas"` to `packages/shared/src/index.ts`.
- [X] Write tests in `packages/shared/src/protocol/packet-schemas.test.ts`:
  - [X] Valid `FullStatePacket` with all optional fields populated parses successfully.
  - [X] Valid `TickDeltaPacket` with all optional fields populated parses successfully.
  - [X] Minimal `FullStatePacket` (only required fields) parses successfully.
  - [X] Minimal `TickDeltaPacket` (only required fields) parses successfully.
  - [X] Unknown `type` discriminator is rejected.
  - [X] Extra fields on a strict schema are rejected (e.g. `fullStatePacketSchema` with a `hack: true` field).
  - [X] Invalid `EntityKind` is rejected.
  - [X] Invalid `HitsplatType` is rejected.
  - [X] Invalid `plane` value (e.g. 5) is rejected in embedded tile coords.
  - [X] `parseServerPacket` returns `{ ok: false, error }` for malformed input.
  - [X] `parseTransportServerPacket` accepts `PongPacket`, `CommandRejectedPacket`, `TransportErrorPacket`.
  - [X] `DebugTickData` with extra fields parses successfully (passthrough).

## Acceptance criteria

- [X] Every type exported from `packets.ts` has a corresponding Zod schema in `packet-schemas.ts`.
- [X] `parseServerPacket` and `parseTransportServerPacket` are exported and return `ParseResult<T>`.
- [X] All schemas use `.strict()` except `debugTickDataSchema` which uses `.passthrough()`.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes (no new warnings).
- [X] `bun x vitest run packages/shared/src/protocol/packet-schemas.test.ts` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run packages/shared/src/protocol/packet-schemas.test.ts`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
