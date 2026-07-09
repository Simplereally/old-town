# E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E01 (Shared Domain Primitives and Protocol Contracts), E05 (Networking Transport), E07 (Client Input, Picking, UI Shell)
- Unlocks: future protocol hardening and content validation epics

## Spec references

- `POC_SPEC.md` §8 (Networking model — message types, delta packet, snapshot/delta spine)
- `POC_SPEC.md` §8.1 (Server → client message types)
- `POC_SPEC.md` §8.3 (Delta packet shape)
- `ADR-006` (S2C snapshot/delta spine — "server is trusted" decision to be amended)
- `packages/shared/src/protocol/command-schemas.ts` (existing C2S Zod validation pattern)
- `packages/shared/src/protocol/schema-primitives.ts` (reusable Zod fragments)
- `packages/shared/src/protocol/parse-result.ts` (ParseResult type)

## Epic goal

The client → server command path already validates every packet with Zod (`parseClientCommand`). The server → client path does not: `decodeServerPacket` and `decodeTransportMessage` use bare `JSON.parse(raw) as T` casts, and `ContentClient.load()` casts the HTTP response without validating the shape of each registry. The client also derives HTTP URLs from the WebSocket URL via string replacement in three separate consumers, creating a hidden coupling.

This epic closes those gaps by:
1. Defining Zod schemas for every S2C packet type and embedded data structure.
2. Replacing unsafe `as` casts with `ParseResult`-returning validated decoders.
3. Adding a Zod schema for the `DevAuthMessage` handshake.
4. Integrating validated decoders into the client `GameSocket` and `ContentClient`.
5. Decoupling HTTP URL derivation from the WebSocket URL.
6. Documenting the validation policy in an ADR.

## Approach summary

1. **S2C packet schemas.** Define Zod schemas for `FullStatePacket`, `TickDeltaPacket`, and all ~30 embedded types (entity spawn/update, inventory delta, chat, hitsplat, projectile, region load, interface open, recipe, debug, etc.). Reuse `schema-primitives.ts` fragments. Use `.strict()` on object schemas to reject extra fields. Use `z.discriminatedUnion("type", ...)` for the top-level `ServerPacket` and `TransportServerPacket` unions.

2. **Validated server packet decoder.** Add `parseServerPacket(raw: unknown): ParseResult<ServerPacket>` alongside the existing `decodeServerPacket` (which remains for trusted round-trip tests). Update the client to use the validated decoder.

3. **DevAuth and transport message validation.** Add a Zod schema for `DevAuthMessage`. Replace `decodeTransportMessage` with `parseTransportMessage(raw: unknown): ParseResult<TransportClientMessage>`. Replace the hand-written `parseDevAuth` in `websocket-transport.ts` with Zod validation.

4. **Client GameSocket integration.** Replace the manual shape checks and `as TransportServerPacket` casts in `GameSocket.ts` with calls to `parseServerPacket`. Drop malformed packets instead of crashing.

5. **Content registry validation.** Define a Zod schema for `ContentClientRegistries` and validate the HTTP response in `ContentClient.load()` before casting. The schema should validate each registry is a `Record<string, T>` with the correct value type.

6. **HTTP URL decoupling.** Add an `httpUrl` getter to `GameSocket` that converts the WebSocket URL to an HTTP URL once. Update `ContentClient.load()`, `IconAtlas.load()`, and `IconTextureFactory.load()` to accept an HTTP base URL directly. Update `GameEngine` to pass `this.socket.httpUrl`.

7. **ADR and final validation.** Write `ADR-008_wire-validation-policy.md` documenting that all JSON from the wire (WebSocket and HTTP) is `unknown` until validated with Zod. Amend ADR-006's "server is trusted" note to clarify that the server is trusted as the *source* but the network transport is not. Run the full test suite and update `TYPE_AUDIT_REPORT.md`.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E48/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E48-S01` — [S2C packet Zod schemas](../stories/E48/E48-S01_s2c-packet-zod-schemas.md)
- [X] `E48-S02` — [Validated server packet decoder](../stories/E48/E48-S02_validated-server-packet-decoder.md)
- [X] `E48-S03` — [DevAuth and transport message Zod validation](../stories/E48/E48-S03_devauth-and-transport-message-zod-validation.md)
- [X] `E48-S04` — [Client GameSocket validated decoder integration](../stories/E48/E48-S04_client-gamesocket-validated-decoder-integration.md)
- [X] `E48-S05` — [Content registry HTTP response validation](../stories/E48/E48-S05_content-registry-http-response-validation.md)
- [X] `E48-S06` — [HTTP URL decoupling from WebSocket URL](../stories/E48/E48-S06_http-url-decoupling-from-websocket-url.md)
- [X] `E48-S07` — [Wire validation policy ADR and final validation pass](../stories/E48/E48-S07_wire-validation-policy-adr-and-final-validation-pass.md)

## Epic acceptance criteria

- [X] Every S2C packet type has a corresponding Zod schema in `packages/shared`.
- [X] `decodeServerPacket` and `decodeTransportMessage` are replaced by `ParseResult`-returning validated decoders.
- [X] The client `GameSocket` drops malformed packets instead of crashing or casting.
- [X] `DevAuthMessage` is validated with Zod, not a hand-written type guard.
- [X] `ContentClient.load()` validates the HTTP response shape before storing registries.
- [X] No consumer performs `ws://` → `http://` string replacement; `GameSocket.httpUrl` is the single source.
- [X] `ADR-008` documents the wire validation policy.
- [X] `bun run typecheck`, `bun run lint`, and `bun run test` all pass.
