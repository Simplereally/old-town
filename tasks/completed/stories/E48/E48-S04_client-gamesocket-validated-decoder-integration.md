# E48-S04 — Client GameSocket validated decoder integration

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S01 (S2C packet Zod schemas), E48-S02 (validated server packet decoder)
- Blocks: E48-S07

## Spec references

- `POC_SPEC.md` §8.4 (Snapshot/delta spine — `GameEngine` only routes socket packets)
- `apps/client/src/game/net/GameSocket.ts` — `_handleMessage` and bootstrap `onmessage` (lines 116-189)
- `packages/shared/src/protocol/packet-schemas.ts` — `parseTransportServerPacket` from E48-S01

## Objective

Replace the manual `typeof .type === "string"` checks and `as TransportServerPacket` casts in `GameSocket.ts` with calls to `parseTransportServerPacket`. Malformed packets should be dropped with a console error, not cast blindly.

## Required architectural decisions

- **Drop, don't crash.** When `parseTransportServerPacket` returns `{ ok: false }`, log the error to `console.error` and return. Do not close the socket — a single malformed packet should not disconnect the client. The server is trusted as the source, but network corruption or a version mismatch could produce a bad packet.
- **Bootstrap path.** The `connect()` method's `onmessage` handler (lines 116-161) currently does its own `JSON.parse` + shape check + `as TransportServerPacket` cast. Replace this with `parseTransportServerPacket`. If parsing fails during bootstrap, call `fail()` with a descriptive error (the connection is not yet established, so a malformed packet is fatal).
- **Steady-state path.** The `_handleMessage` method (lines 165-189) currently does `JSON.parse` + shape check + `as TransportServerPacket` + `as TickDeltaPacket` / `as { clientTimeMs: ... }` / `as { reason: string }` casts. Replace with `parseTransportServerPacket`. After successful parse, the discriminated union narrows the type automatically — no further casts needed.
- **Remove the `as` casts.** After `parseTransportServerPacket` succeeds, `packet` is typed as `TransportServerPacket`. The `if (packet.type === ServerPacketType.TickDelta)` check narrows it to `TickDeltaPacket` automatically. The `packet.type === TransportServerMessageType.Pong` check narrows to `PongPacket`. No `as` casts needed.
- **Keep `JSON.parse` in a try/catch.** `parseTransportServerPacket` takes `unknown`, so `JSON.parse` must still be called first and its throw caught. The flow is: `JSON.parse(event.data)` → `parseTransportServerPacket(raw)`.

## Implementation checklist

- [X] Import `parseTransportServerPacket` from `@old-town/shared` in `GameSocket.ts`.
- [X] Update the bootstrap `onmessage` handler:
  - [X] Replace the manual `typeof raw.type !== "string"` check and `as TransportServerPacket` cast with `parseTransportServerPacket(raw)`.
  - [X] If `!result.ok`, call `fail(new Error("Invalid bootstrap packet: " + result.error))` and `socket.close()`.
  - [X] If `result.ok`, use `result.value` as the typed packet. The `if (packet.type === ServerPacketType.FullState)` check narrows automatically.
- [X] Update `_handleMessage`:
  - [X] Replace the manual shape check and `as TransportServerPacket` cast with `parseTransportServerPacket(raw)`.
  - [X] If `!result.ok`, `console.error("Invalid server packet:", result.error)` and `return`.
  - [X] If `result.ok`, use `result.value`. Remove the `as TickDeltaPacket`, `as { clientTimeMs: ... }`, and `as { reason: string }` casts — the discriminated union narrows automatically.
- [X] Remove any now-unused imports (e.g. if `TransportServerPacket` type import is no longer needed directly).
- [X] Update `GameSocket` tests:
  - [X] Verify a valid `TickDeltaPacket` is parsed and `onTickDelta` is called.
  - [X] Verify a valid `PongPacket` is parsed and `onPong` is called.
  - [X] Verify a valid `CommandRejectedPacket` is parsed and `onCommandRejected` is called.
  - [X] Verify a malformed packet (bad JSON) is dropped without crashing.
  - [X] Verify a packet with unknown `type` is dropped without crashing.
- [X] Run existing `GameSocket` tests and fix any that break.

## Acceptance criteria

- [X] No `as TransportServerPacket`, `as TickDeltaPacket`, `as { clientTimeMs: ... }`, or `as { reason: string }` casts remain in `GameSocket.ts`.
- [X] `parseTransportServerPacket` is used in both the bootstrap and steady-state message handlers.
- [X] Malformed packets during bootstrap cause a connection failure with a descriptive error.
- [X] Malformed packets during steady state are logged and dropped; the socket stays open.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes.
- [X] `bun x vitest run apps/client/src/game/net/` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run apps/client/src/game/net/`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
