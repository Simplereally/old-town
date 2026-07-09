# E56-S03 — Replay harness with state hashing and divergence bisect

## Epic

E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: E56-S02
- Blocks: E56-S04

## Objective

`bun scripts/replay.ts <journal.jsonl>` reconstructs the exact run: boots a kernel from the
header (seed, startTick, content check), replays connects/commands/disconnects at their
recorded ticks, and verifies state hashes.

## Design

- **World hash**: add `worldStateHash(world): string` (new `apps/server/src/sim/world-hash.ts`)
  — stable serialization: entities sorted by id, components sorted by name, keys sorted,
  Float-free (integer world — assert no floats sneak into hashed components; positions, ticks,
  quantities are ints by invariant), then a fast non-crypto hash (fnv1a is fine). EXCLUDE
  telemetry-ish components if any exist (none known — verify) and anything transport-scoped.
- **Checkpoint stream**: while journaling (S02 addendum), the live kernel optionally records
  `{"t":"hash","tick":N,"h":...}` every K ticks (default 50, env-tunable). Replay recomputes at
  the same ticks and compares. First mismatch = divergence window of K ticks.
- **Bisect mode**: `--bisect` re-replays the divergent window hashing EVERY tick to name the
  exact first divergent tick, then dumps a component-level diff between live-hash-metadata and
  replayed state. (Live side only has the hash, not the state — so the diff is
  replay-tick-N-1 vs replay-tick-N, which shows WHAT changed at the divergence tick; that plus
  the journaled commands for that tick is what a human needs.)
- **Session bootstrap in replay**: connects must NOT hit real persistence. Replay uses the
  memory adapter; the journaled `snapshotHash` is compared against the replayed character's
  snapshot at connect (characters must be seeded — `--fixtures <dir>` loads snapshot JSON
  fixtures captured alongside the journal; add `dumpJournalToFile` companion
  `dumpSessionFixtures` in S02's kernel API if missing — do it here if S02 didn't).
- **Clock**: replay calls `runOneTick()` in a loop — never `runDueTicks(now)`; wall time is
  irrelevant by design.

## Required work

- [ ] `world-hash.ts` + tests (hash stable across map insertion orders that represent the same
      state; changes when any component value changes).
- [ ] Checkpoint emission in the journal (flag-gated) + kernel option.
- [ ] `scripts/replay.ts` with `--until`, `--bisect`, `--fixtures`, `--checkpoint-every`;
      human-readable divergence report (tick, commands at that tick, component diff).
- [ ] Content fingerprint mismatch → hard error with a clear message (replaying against edited
      content is the #1 foot-gun; `--force-content` to override for exploratory use).
- [ ] Integration test: scripted 200-tick session journaled in-memory → replay → identical
      final hash. Mutation test: flip one rng call in a copy of a system (test-only harness or
      a rigged rng wrapper) → bisect names the right tick.

## Acceptance criteria

- [ ] End-to-end journal→replay identity proven in tests and by hand on a real `bun run dev`
      session.
- [ ] Divergence bisect names the exact tick and prints the state diff + that tick's inputs.
- [ ] Replaying 10k ticks completes in seconds (no transport, no persistence — record the
      measured rate in the story note).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- Manual: journal a dev session, `bun scripts/replay.ts /tmp/session.jsonl`
