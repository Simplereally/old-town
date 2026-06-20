# E48-S02 — Validated server packet decoder

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S01 (S2C packet Zod schemas)
- Blocks: E48-S04, E48-S07

## Spec references

- `POC_SPEC.md` §8.4 (Snapshot/delta spine — `ClientPacketApplier` applies all S2C packets)
- `packages/shared/src/protocol/packets.ts` — existing `decodeServerPacket` (unsafe `as` cast)
- `packages/shared/src/protocol/packet-schemas.ts` — schemas from E48-S01
- `packages/shared/src/protocol/parse-result.ts` — `ParseResult<T>` type

## Objective

Replace the unsafe `decodeServerPacket` function with a validated decoder that returns `ParseResult<ServerPacket>`. Update all call sites to handle the validation result. Keep the old `decodeServerPacket` available for trusted round-trip tests (server-side serialization tests), but mark it deprecated for client use.

## Required architectural decisions

- **Keep `decodeServerPacket` for trusted tests.** The existing `packets.test.ts` round-trip tests use `decodeServerPacket` to verify `encodeServerPacket` → `decodeServerPacket` symmetry. These tests operate on server-trusted data and should not change. Add a JSDoc comment noting it is for trusted data only.
- **New `parseServerPacket` from E48-S01.** The `parseServerPacket` function defined in `packet-schemas.ts` is the validated decoder. This story wires it into call sites.
- **Server-side `decodeServerPacket` stays.** The server never decodes server packets (it only encodes them). No server changes needed.
- **Client-side call sites.** The client currently does not call `decodeServerPacket` directly — `GameSocket` does its own `JSON.parse` + `as` cast. That integration is E48-S04. This story only updates the shared package API and tests.

## Implementation checklist

- [X] Add a deprecation JSDoc comment to `decodeServerPacket` in `packets.ts` noting it is for trusted round-trip tests only and that client code should use `parseServerPacket`.
- [X] Verify `parseServerPacket` and `parseTransportServerPacket` are exported from `@old-town/shared` (added in E48-S01 via `index.ts`).
- [X] Add a test in `packets.test.ts` (or `packet-schemas.test.ts`) that verifies `parseServerPacket` accepts the output of `encodeServerPacket` for a `FullStatePacket`.
- [X] Add a test that verifies `parseServerPacket` accepts the output of `encodeServerPacket` for a `TickDeltaPacket`.
- [X] Add a test that verifies `parseServerPacket` rejects a truncated JSON string (e.g. `{"type":"S2C_FULL_STATE","tick":1}`) with `{ ok: false }`.
- [X] Add a test that verifies `parseTransportServerPacket` accepts `encodeTransportPacket` output for `PongPacket`, `CommandRejectedPacket`, and `TransportErrorPacket`.

## Acceptance criteria

- [X] `decodeServerPacket` has a JSDoc comment marking it for trusted tests only.
- [X] `parseServerPacket` and `parseTransportServerPacket` are exported from `@old-town/shared`.
- [X] Round-trip tests prove `encodeServerPacket` → `parseServerPacket` succeeds for both packet types.
- [X] Round-trip tests prove `encodeTransportPacket` → `parseTransportServerPacket` succeeds for all transport packet types.
- [X] `parseServerPacket` rejects truncated/malformed packets.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes.
- [X] `bun x vitest run packages/shared/src/protocol/` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run packages/shared/src/protocol/`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
