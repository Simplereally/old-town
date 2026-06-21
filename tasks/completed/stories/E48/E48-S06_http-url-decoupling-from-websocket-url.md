# E48-S06 — HTTP URL decoupling from WebSocket URL

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S05 (content registry validation — `ContentClient.load` signature change)
- Blocks: E48-S07

## Spec references

- `apps/client/src/game/net/GameSocket.ts` — `serverUrl` getter (line 49-51)
- `apps/client/src/game/ui/ContentClient.ts` — `load(serverUrl)` with `ws://` → `http://` replacement (line 37-41)
- `apps/client/src/game/ui/IconAtlas.ts` — `load(serverUrl)` with same replacement (line 60-61)
- `apps/client/src/game/scene/IconTextureFactory.ts` — `load(serverUrl)` with same replacement (line 36-37)
- `apps/client/src/game/GameEngine.ts` — all three `.load(this.socket.serverUrl)` call sites (lines 295, 302, 306)
- `TYPE_AUDIT_REPORT.md` Lane 5 finding #27

## Objective

Eliminate the hidden coupling between the WebSocket URL and HTTP fetch URLs. Three consumers independently do `serverUrl.replace("ws://", "http://").replace("wss://", "https://")`. Add an `httpUrl` getter to `GameSocket` that performs this conversion once, and update all consumers to accept an HTTP base URL directly.

## Required architectural decisions

- **`GameSocket.httpUrl` getter.** Add a getter that converts `this.url` from `ws://`/`wss://` to `http://`/`https://` once. If the URL does not start with `ws://` or `wss://`, return it as-is (it may already be an HTTP URL in test configurations).
- **Consumer API change.** `ContentClient.load()`, `IconAtlas.load()`, and `IconTextureFactory.load()` all change their parameter from `serverUrl: string` to `httpBaseUrl: string`. The parameter is already a string; only the semantics change. The callers pass `this.socket.httpUrl` instead of `this.socket.serverUrl`.
- **Keep `GameSocket.serverUrl`.** The `serverUrl` getter stays for any consumer that needs the raw WebSocket URL (e.g. for display or reconnection). Only the HTTP-fetching consumers switch to `httpUrl`.
- **No URL construction inside consumers.** Each consumer's `load()` method should use the passed URL directly as the base for `new URL(path, httpBaseUrl)` without any further string replacement.

## Implementation checklist

- [X] Add `get httpUrl(): string` to `GameSocket`:
  ```ts
  get httpUrl(): string {
    if (this.url.startsWith("ws://")) return this.url.replace("ws://", "http://");
    if (this.url.startsWith("wss://")) return this.url.replace("wss://", "https://");
    return this.url;
  }
  ```
- [X] Update `ContentClient.load()`:
  - [X] Rename parameter from `serverUrl` to `httpBaseUrl`.
  - [X] Remove the `.replace("ws://", "http://").replace("wss://", "https://")` line.
  - [X] Use `new URL("/api/content", httpBaseUrl)` directly.
- [X] Update `IconAtlas.load()`:
  - [X] Rename parameter from `serverUrl` to `httpBaseUrl`.
  - [X] Remove the `.replace(...)` line.
  - [X] Use `new URL("/assets/items/atlases/atlas-index.json", httpBaseUrl)` directly.
- [X] Update `IconTextureFactory.load()`:
  - [X] Rename parameter from `serverUrl` to `httpBaseUrl`.
  - [X] Remove the `.replace(...)` line.
  - [X] Use `new URL("/assets/items/atlases/atlas-index.json", httpBaseUrl)` directly.
- [X] Update `GameEngine.ts` call sites:
  - [X] Change `this.content.load(this.socket.serverUrl)` to `this.content.load(this.socket.httpUrl)`.
  - [X] Change `this.icons.load(this.socket.serverUrl)` to `this.icons.load(this.socket.httpUrl)`.
  - [X] Change `this.iconTextures.load(this.socket.serverUrl)` to `this.iconTextures.load(this.socket.httpUrl)`.
- [X] Update tests:
  - [X] Update `ContentClient` tests to pass an `http://` URL instead of `ws://`.
  - [X] Update `IconAtlas` tests to pass an `http://` URL.
  - [X] Update `IconTextureFactory` tests to pass an `http://` URL.
  - [X] Add a `GameSocket` test verifying `httpUrl` converts `ws://` → `http://` and `wss://` → `https://`.
  - [X] Add a `GameSocket` test verifying `httpUrl` returns the URL as-is if it does not start with `ws://` or `wss://`.
- [X] Update `TYPE_AUDIT_REPORT.md` Lane 5 finding #27 status from OPEN to FIXED.

## Acceptance criteria

- [X] `GameSocket.httpUrl` getter exists and converts WebSocket URLs to HTTP URLs.
- [X] No `.replace("ws://", "http://")` or `.replace("wss://", "https://")` calls remain in `ContentClient`, `IconAtlas`, or `IconTextureFactory`.
- [X] `GameEngine` passes `this.socket.httpUrl` to all three `load()` methods.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes.
- [X] `bun x vitest run apps/client/` passes.

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun x vitest run apps/client/`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
