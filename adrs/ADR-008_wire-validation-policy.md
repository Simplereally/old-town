# ADR-008: Wire Validation Policy

## Status

Accepted

## Context

The codebase historically treated JSON arriving from the network as trusted. `decodeServerPacket` did `JSON.parse(raw) as ServerPacket`; `decodeTransportMessage` did the same for client-to-server transport messages; `ContentClient.load()` cast the HTTP response `as ContentClientRegistries`; `GameSocket._handleMessage` cast `raw as TransportServerPacket`. The server was the authoritative source of truth, so the assumption was that its output was always well-formed.

That assumption is unsafe in practice:

- **Network corruption** — a proxy, CDN, or cache can truncate or mutate a response.
- **Version mismatch** — a server running a newer protocol can emit fields the client does not expect, or omit fields the client requires.
- **Server bugs** — a serialization regression can ship a malformed payload to every connected client.
- **DevAuth handshake** — the server received an unvalidated `DevAuthMessage` via a hand-written `parseDevAuth` type guard that only checked two fields.

The project already used Zod extensively for content schema validation (`content-schemas/`) and for client-to-server command validation (`command-schemas.ts`). The S2C path was the last unvalidated boundary.

## Decision

**All JSON from the wire is `unknown` until validated with Zod.** This applies to both WebSocket messages and HTTP responses.

### Validation entry points

| Boundary | Direction | Decoder | Schema |
|---|---|---|---|
| Client command | C2S | `parseClientCommand` | `clientCommandSchema` (existing) |
| Transport message (DevAuth + command) | C2S | `parseTransportMessage` | `transportClientMessageSchema` (new in E48-S03) |
| Server packet (FullState / TickDelta) | S2C | `parseServerPacket` | `serverPacketSchema` (new in E48-S01) |
| Transport server packet (server + Pong/Rejected/Error) | S2C | `parseTransportServerPacket` | `transportServerPacketSchema` (new in E48-S01) |
| Content registries | HTTP | `contentClientRegistriesSchema.safeParse` | `contentClientRegistriesSchema` (new in E48-S05) |

### Policy rules

1. **`ParseResult<T>` return type.** All validated decoders return `{ ok: true, value: T } | { ok: false, error: string }`. No throws on validation failure.
2. **`.strict()` by default.** Schemas reject unknown fields to catch protocol drift. The sole exception is `debugTickDataSchema`, which uses `.passthrough()` so the server can add new debug fields without breaking older clients.
3. **Discriminated unions on `type`.** Top-level packet schemas use `z.discriminatedUnion("type", [...])` so the discriminator narrows the type automatically — no `as` casts needed after a successful parse.
4. **Drop, don't crash (steady state).** When `parseTransportServerPacket` fails in `GameSocket._handleMessage`, the error is logged and the packet is dropped. The socket stays open. A single malformed packet must not disconnect the client.
5. **Fail fast (bootstrap).** When `parseTransportServerPacket` fails during `GameSocket.connect()`, the connection is rejected with a descriptive error. A malformed bootstrap packet is fatal.
6. **`decodeServerPacket` and `decodeTransportMessage` are deprecated.** They remain for trusted round-trip tests only (e.g. `encodeServerPacket` → `decodeServerPacket` symmetry on server-constructed data). Client and server runtime code must use the validated decoders.
7. **Server is the source, not the transport.** The server remains the authoritative source of truth for game state. But the network transport is not trusted — validation protects against corruption, proxies, and version mismatches.

## Consequences

- Every S2C packet type has a corresponding Zod schema in `packages/shared/src/protocol/packet-schemas.ts`.
- `GameSocket.ts` has no `as TransportServerPacket`, `as TickDeltaPacket`, or `as { reason: string }` casts.
- `ContentClient.ts` has no `as ContentClientRegistries` cast.
- `websocket-transport.ts` has no hand-written `parseDevAuth` type guard.
- Malformed packets during bootstrap cause a connection failure; malformed packets during steady state are logged and dropped.
- Debug data schemas use `.passthrough()` for forward compatibility.
- `TYPE_AUDIT_REPORT.md` cross-cutting pattern 4 (JSON/network data type assertions) is fully resolved.

## Related

- `POC_SPEC.md` §8 (network protocol)
- ADR-006 (Server-to-Client Snapshot/Delta Spine) — amended to reference this ADR
- `packages/shared/src/protocol/packet-schemas.ts`
- `packages/shared/src/protocol/transport.ts`
- `packages/shared/src/protocol/content-client-registries.ts`
- `packages/shared/src/protocol/command-schemas.ts`
- `apps/client/src/game/net/GameSocket.ts`
- `apps/client/src/game/ui/ContentClient.ts`
- `apps/server/src/net/websocket-transport.ts`
