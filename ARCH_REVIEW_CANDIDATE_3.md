# Architecture Review — Candidate 3: Server Thin Orchestrators

## Status

Implemented.

## Decision

Deleted the shallow server orchestrators:

- `apps/server/src/net/command-router.ts`
- `apps/server/src/net/command-router.test.ts`
- `apps/server/src/net/delta-broadcaster.ts`
- `apps/server/src/net/delta-broadcaster.test.ts`

The behaviour now lives where it is consumed:

- Command routing lives in `apps/server/src/sim/simulation-kernel.ts`.
- Delta broadcast orchestration lives in the `SnapshotDeltaBuild` phase in `apps/server/src/sim/simulation-kernel.ts`.
- The transport seam lives in `apps/server/src/net/delta-transport.ts`.

## Why

- **One adapter = hypothetical seam.** Both deleted modules were called from exactly one place: the simulation kernel.
- **Deletion test passed.** The deeper modules survived: `CommandBuffer`, `DeltaAccumulator`, `InterestManager`, and `DeltaTransport`.
- **Locality improved.** The kernel already owns tick phases, command consumption, session lifecycle, and delta transport attachment. The deleted modules made readers jump away for pass-through behaviour.
- **Network seam stayed in `net/`.** `DeltaTransport` is a transport interface, not a protocol type and not kernel-internal, so it now lives beside transport code.

## Implementation Summary

`simulation-kernel.ts` now:

- Resolves session ownership and routes commands directly to `CommandBuffer.accept`.
- Applies the per-target-tick spam cap directly in `routeCommand`.
- Stores spam counts as `Map<tick, Map<sessionId, count>>`, avoiding string key parsing and allowing direct tick cleanup.
- Consumes commands directly in the `InputClose` phase.
- Stores the attached `DeltaTransport` reference directly.
- Primes interest directly for connected sessions when a transport is live, or when a transport is attached after sessions already exist.
- Consumes and filters the `DeltaAccumulator` directly in the `SnapshotDeltaBuild` phase.
- Uses closure-local `runOneTick`/`runDueTicks` functions so `runDueTicks` is safe when destructured.

## Tests Preserved Or Added

- `simulation-kernel.test.ts`
  - Keeps command routing and unknown-session rejection coverage.
  - Adds spam-cap coverage, including acceptance on the next target tick.
  - Exercises destructured `runDueTicks` to prevent `this` binding regressions.
  - Keeps delta attach/detach and late-attach self-entity dedup coverage.

- `net/multiplayer-loop.integration.test.ts`
  - Preserves the valuable WebSocket two-client movement broadcast coverage from the deleted `delta-broadcaster.test.ts`.
  - Covers socket bootstrap, command movement, object recipe UI, and multi-client interest filtering through the real kernel plus WebSocket transport.

- `net/socket-command-movement.test.ts`
  - Uses `CommandBuffer` directly as its harness primitive.
  - Its scope is socket command parsing plus command buffering plus movement processing; kernel session validation is covered in `simulation-kernel.test.ts`.

- `systems/chat-system.test.ts`
  - Uses `DeltaAccumulator` and `InterestManager` directly instead of the deleted broadcaster helper.

## Test Boundary Notes

- `apps/server/src/sim/gameplay-loop.integration.test.ts` covers gameplay/content systems through the kernel: resources, combat, spells, drops, persistence.
- `apps/server/src/net/multiplayer-loop.integration.test.ts` covers WebSocket transport plus multi-client kernel behaviour: full state, command movement, broadcast, and interest filtering.

## Residual Notes

- `positionTile` now exists in the kernel and a test helper. This duplication is acceptable at current scale because the helper has different error behaviour in tests. If it appears in several more production modules, promote it to a server world/tile utility.
- Full workspace `typecheck` and `lint` remain red from unrelated active-worktree issues. Refactor isolation was validated with reference sweeps, focused tests, and Biome checks over the touched files.

## Recommendation Strength

`Strong` — the deletion reduced module count while keeping the real seams visible and preserving the only unique integration coverage.
