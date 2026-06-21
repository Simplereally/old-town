# ADR-001: Closed SimulationKernel API

## Status

Accepted

## Context

The SimulationKernel is the public boundary of the server simulation. After E03/E05 implementation, several design questions emerged about what should be exposed, how tests should observe state, and what lifecycle the kernel owns.

## Decision

1. **No `shutdown()` on the kernel.** The kernel does not own the HTTP server, WebSocket server, or timer. These are created and torn down by `server.ts`. The kernel is a pure simulation object; its only lifecycle is creation and garbage collection.

2. **No `internals()` escape hatch.** Tests observe the kernel through its public interface only: `connectSession`, `disconnectSession`, `routeCommand`, `runOneTick`, `runDueTicks`, `attachDeltaTransport`, `detachDeltaTransport`, and `stats`. No backdoor access to the ECS world, tick loop, or command buffer.

3. **TickLoop is a deterministic phase runner, not a disposable resource.** `TickLoop` has no `clear()`, `stop()`, or `dispose()` methods. It runs registered phases in a strict order via `runOneTick()` (single tick) or `runDueTicks(nowMs)` (multiple ticks). Cleanup is handled by destroying the kernel or letting the process exit.

4. **Delta transport is attached before sessions connect in production.** `attachDeltaTransport` accepts a `DeltaTransport` and immediately primes any already-connected sessions. Tests may connect before attach, but the kernel handles this by calling `primeSessionOnAttach` for each existing session.

5. **Stats are boring and operational.** The `stats()` return value includes only: `currentTick`, `currentServerTime`, `aliveEntityCount`, `pendingCommandCount`, `connectedSessionCount`, `regionCount`, `tileCount`. No timing metrics, no histograms, no debug introspection.

6. **`aliveEntityCount` counts all live ECS entities.** This includes player characters, NPCs, objects, ground items, and any other entity created by the world loader or systems. Tests must baseline against the pre-connect count rather than assuming zero.

7. **`connectedSessionCount` uses a `Set<string>` of session IDs.** This correctly deduplicates when `DevSessionManager.bootstrap()` reuses the same entity for the same session ID. The count is the size of the set, not an incrementing counter.

8. **`routeCommand` receives `ClientCommand` (already parsed), not `unknown` wire input.** The transport layer (WebSocket, dev session, etc.) owns parsing and validation. The kernel only accepts well-formed commands.

## Consequences

- Tests are slightly more verbose (must capture baselines), but they cannot accidentally depend on internal state that changes during refactoring.
- The kernel API surface is small and stable. Future changes to ECS internals, tick scheduling, or delta broadcasting do not leak into tests.
- `server.ts` retains full control of the server lifecycle, making graceful shutdown and port management straightforward.
- The `TickLoop` remains a simple, deterministic function with no side effects beyond state mutation.

## Related

- `POC_SPEC.md` §9 (Server tick loop)
- `POC_SPEC.md` §25 (Minimal POC architecture)
- `apps/server/src/sim/simulation-kernel.ts`
- `apps/server/src/sim/simulation-kernel.test.ts`
