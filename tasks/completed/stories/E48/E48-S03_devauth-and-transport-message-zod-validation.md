# E48-S03 — DevAuth and transport message Zod validation

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S01 (S2C packet Zod schemas)
- Blocks: E48-S04, E48-S07

## Spec references

- `packages/shared/src/protocol/transport.ts` — `decodeTransportMessage`, `DevAuthMessage`, `TransportClientMessage`
- `packages/shared/src/protocol/command-schemas.ts` — existing `clientCommandSchema` (Zod discriminated union for C2S)
- `apps/server/src/net/websocket-transport.ts` — `parseDevAuth` hand-written type guard (lines 65-75)

## Objective

Replace the unsafe `decodeTransportMessage` (`JSON.parse(raw) as TransportClientMessage`) with a Zod-validated decoder. Replace the hand-written `parseDevAuth` type guard in `websocket-transport.ts` with Zod validation. This closes the last unvalidated C2S path: the `DevAuthMessage` handshake.

## Required architectural decisions

- **Transport client message union.** `TransportClientMessage = DevAuthMessage | ClientCommand`. The `clientCommandSchema` already exists as a `z.discriminatedUnion("type", ...)`. The `DevAuthMessage` has `type: "C2S_DEV_AUTH"`, which does not overlap with any `ClientCommandType` discriminator. Combine them into a single `z.discriminatedUnion("type", [devAuthMessageSchema, ...clientCommandSchema.options])` or use `z.union([devAuthMessageSchema, clientCommandSchema])`. Prefer `discriminatedUnion` if the discriminator values are disjoint (they are).
- **`parseDevAuth` replacement.** The server's `websocket-transport.ts` currently has a hand-written `parseDevAuth(raw: unknown): DevAuthMessage | undefined`. Replace it with `devAuthMessageSchema.safeParse(raw)`. Return `undefined` on failure to preserve the existing control flow (auth failure → close socket).
- **Keep `decodeTransportMessage` for reference.** Mark it deprecated, like `decodeServerPacket` in E48-S02. The server's `websocket-transport.ts` will switch to the new validated decoder.

## Implementation checklist

- [X] Define `devAuthMessageSchema` in `transport.ts` (or `packet-schemas.ts` if it already imports transport types). The schema:
  ```ts
  const devAuthMessageSchema = z.object({
    type: z.literal(TransportClientMessageType.DevAuth),
    protocolVersion: z.number().int(),
    characterId: z.string().optional(),
  }).strict();
  ```
- [X] Define `transportClientMessageSchema = z.discriminatedUnion("type", [devAuthMessageSchema, ...clientCommandSchema.options])` or `z.union([devAuthMessageSchema, clientCommandSchema])`.
- [X] Add `parseTransportMessage(raw: unknown): ParseResult<TransportClientMessage>` using `safeParse`.
- [X] Export `devAuthMessageSchema`, `transportClientMessageSchema`, and `parseTransportMessage` from `@old-town/shared`.
- [X] Add deprecation JSDoc to `decodeTransportMessage`.
- [X] Update `apps/server/src/net/websocket-transport.ts`:
  - [X] Replace `decodeTransportMessage(data.toString())` with `parseTransportMessage(JSON.parse(data.toString()))`. Handle `JSON.parse` failure separately (already done via try/catch). Handle `parseTransportMessage` failure by sending `malformed_json` error.
  - [X] Replace `parseDevAuth(message)` with `devAuthMessageSchema.safeParse(message)`. If `!success`, treat as auth failure (same as current `parseDevAuth` returning `undefined`).
  - [X] Remove the hand-written `parseDevAuth` function.
- [X] Update `apps/server/src/net/websocket-transport.ts` imports to include `parseTransportMessage`, `devAuthMessageSchema` from `@old-town/shared`.
- [X] Write tests:
  - [X] `parseTransportMessage` accepts a valid `DevAuthMessage`.
  - [X] `parseTransportMessage` accepts a valid `ClientCommand` (e.g. `PingCommand`).
  - [X] `parseTransportMessage` rejects malformed input.
  - [X] `devAuthMessageSchema.safeParse` rejects missing `protocolVersion`.
  - [X] `devAuthMessageSchema.safeParse` rejects extra fields (strict).
- [X] Update existing `websocket-transport` tests if any break due to the decoder change.

## Acceptance criteria

- [X] `decodeTransportMessage` is deprecated; `parseTransportMessage` is the validated replacement.
- [X] `parseDevAuth` hand-written function is removed from `websocket-transport.ts`.
- [X] `DevAuthMessage` is validated by Zod.
- [X] The server still rejects malformed JSON, auth failures, and protocol mismatches correctly.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes.
- [X] `bun x vitest run apps/server/src/net/` passes.
- [X] `bun x vitest run packages/shared/src/protocol/` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run apps/server/src/net/`
- [X] `bun x vitest run packages/shared/src/protocol/`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
