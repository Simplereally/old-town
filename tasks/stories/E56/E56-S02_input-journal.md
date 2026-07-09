# E56-S02 — Input journal: record every command, session event, and boot fingerprint

## Epic

E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: E56-S01
- Blocks: E56-S03

## Objective

Record everything replay needs, with zero measurable cost on the tick path.

## Design

New module `apps/server/src/sim/journal.ts`:

- **Header record** (once, at kernel creation): journal format version, RNG seed, `startTick`,
  `startServerTime`, content fingerprint (hash of the sorted registry ids+versions — build a
  cheap stable hash over `ContentRegistries`; do NOT hash file bytes, registries are the truth),
  region map fingerprint, engine git SHA if available (`process.env` injected, optional).
- **Input records**, one JSONL line each, in arrival order:
  - `{"t":"cmd","tick":<targetTick>,"eid":<ownerEntityId>,"cmd":<ClientCommand>}` — hook the
    single accept point: emit from inside `routeCommand` immediately after
    `commandBuffer.accept` returns ok (`simulation-kernel.ts:759`). Rejected commands are NOT
    journaled (they never affect state).
  - `{"t":"connect","tick":<currentTick>,"characterId":...,"eid":...,"snapshotHash":...}` —
    emitted after `devSessions.bootstrap` resolves; include a hash of the loaded character
    snapshot so replay can detect a different starting character. Spawned entity id must be
    recorded because entity-id assignment order is part of the deterministic state.
  - `{"t":"disconnect","tick":...,"eid":...}`.
- **Sink**: in-memory ring buffer (default last 200k records) always on; optional file sink via
  `OLD_TOWN_JOURNAL=/path/file.jsonl` env or kernel option. File writes are batched and flushed
  on an interval OFF the tick path (reuse the save-queue's pattern of deferred async work;
  never `await` in a phase). Ring buffer enables "dump the last 10 minutes" after an incident
  without pre-arranged recording.
- **Kernel API additions**: `journalDump(): readonly JournalRecord[]` and a
  `dumpJournalToFile(path)` — both on `SimulationKernel` so E60's admin surface can trigger a
  dump when an incident is reported.

## Required work

- [ ] `journal.ts` with header/record types (zod-schema'd in shared if replay will live outside
      the server package; keep in server otherwise — decide by where `scripts/replay.ts` can
      import from and note the decision).
- [ ] Hook the three emission points listed above — total code touched in the kernel should be
      ~10 lines; the journal object is created in `createSimulationDeps` and threaded through.
- [ ] Ring buffer + file sink with batched off-tick flush; flush on `flushPersistence()` too so
      graceful shutdown never truncates.
- [ ] Tests: records appear in order with correct ticks; rejected/spam-capped commands absent;
      ring buffer wraps correctly; file sink batches (fake timers); header written once.
- [ ] Micro-benchmark note: journal 10k commands in a tight loop, assert < 1µs/record appended
      to the ring (it is an array push of a small object — the test is a regression tripwire,
      record the number in the story note).

## Acceptance criteria

- [ ] A live dev session with `OLD_TOWN_JOURNAL` set produces a parseable JSONL file whose
      header + records fully describe the session.
- [ ] No tick-path awaits; no measurable tick-duration change with journaling on (compare
      `stats().lastTickDurationMs` across a 1000-tick scripted run with/without).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- `bun run sim:fences`
