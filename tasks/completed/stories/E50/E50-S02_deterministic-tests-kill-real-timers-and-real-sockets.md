# E50-S02 — Deterministic tests: kill real timers and real sockets

## Epic

E50 — Test Suite Performance and Quality Gates

## Dependency chain

- Depends on: E50-S01 (baseline + bucket list)
- Blocks: E50-S03

## Objective

Convert every bucket-A (real-time wait) and convertible bucket-B (real I/O) test from E50-S01's report to deterministic equivalents. This is where most wall-time disappears, and it also kills flakes.

## Ground rules (align with engine invariants)

- The server is tick-driven (600 ms). Systems are already testable by invoking the tick function directly — most existing system tests (e.g. `apps/server/src/systems/*.test.ts`) do this. Any test that waits real milliseconds for a tick to fire is wrong by construction: refactor it to call the tick/step function N times.
- Where the code under test schedules with `setTimeout`/`setInterval` internally (e.g. transport layers), use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)`. Always pair with `vi.useRealTimers()` in `afterEach`.
- For WebSocket tests: prefer an in-memory transport pair over binding real ports. Look at what `apps/server/src/net/websocket-transport.test.ts` and `dev-session.test.ts` currently do; if they bind real sockets, introduce a shared in-memory `FakeSocket` test util in `apps/server/src/net/__tests__/` (or reuse one if it exists — search first: `rg -ln "FakeSocket|MockSocket|fake.*transport" apps/server`). Genuine end-to-end socket coverage stays, but only in the heavy lane (E50-S03), and only a minimal smoke, not the main behavioral matrix.
- **Never weaken an assertion to make a test fast.** If a behavior genuinely needs wall-clock (rare), it belongs in the heavy lane.

## Required work

- [X] Work through bucket A from `docs/testing/test-perf-baseline.md`, largest first. For each file, record before/after duration in the doc.
- [X] Convert convertible bucket-B files to in-memory transports; move the irreducible real-socket smoke tests aside (tag them — E50-S03 will formalize the lane; for now add `// @heavy` header comment and a `describe` name prefix `heavy:` so S03 can find them mechanically).
- [X] Add a lint-style guard test `scripts/assert-no-sleeps.ts` (wire as `bun run test:no-sleeps`): rg-scan `apps/**/*.test.ts` for `await new Promise` + numeric `setTimeout` sleeps and real `Bun.sleep`/`sleep(` calls; fail listing offenders; maintain an explicit allowlist array for the few heavy-lane files. This prevents regression by future agents.
- [X] Update `docs/testing/test-perf-baseline.md` with an "after S02" column.

## Acceptance criteria

- [X] No fast-lane test sleeps real time > 50 ms (guard script proves it).
- [X] Total suite wall time measurably reduced; numbers recorded.
- [X] Zero assertions weakened or tests deleted (diff review criterion — moves and mechanical conversions only).

## Validation commands

- `bun run test`
- `bun run test:no-sleeps`
- `bun run typecheck`
- `bun run lint`

## Completion note

- Wall 64.33s → 56.07s after determinism conversions.
- `bun run test:no-sleeps` allowlists only the two real-socket files.
- Shared util: `apps/server/src/net/__tests__/fake-socket.ts`.
