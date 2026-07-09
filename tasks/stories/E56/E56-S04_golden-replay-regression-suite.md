# E56-S04 — Golden replay regression suite in CI

## Epic

E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: E56-S03
- Blocks: E56-S05

## Objective

Turn replay identity into a standing regression net: canonical journaled sessions, committed
with expected hashes, replayed in CI. Any PR that changes simulation behavior must regenerate
goldens EXPLICITLY — silent gameplay drift becomes impossible.

## Required work

- [ ] Author `scripts/record-golden.ts`: boots a kernel, drives a **scripted bot** (not a
      human) through the canonical scenario via `routeCommand` — walk to a tree, chop, walk to
      furnace, smelt, attack a cellar rat to the death, loot, bank deposit, cast one spell,
      eat, chat — across ~500 ticks; writes `fixtures/replays/core-loop.jsonl` + fixtures +
      `core-loop.hashes.json`.
- [ ] Second golden: `multiplayer.jsonl` — 3 bots interacting in shared space (co-located
      chopping, one fight, ground-item ownership timing) to pin cross-entity ordering.
- [ ] Test `apps/server/src/sim/golden-replay.test.ts` (heavy lane per E50 conventions if E50
      landed; fast lane if it runs < 5 s): replays each golden, asserts every checkpoint hash.
- [ ] Failure UX: on mismatch the test prints the divergent tick, that tick's journaled
      commands, and the regeneration command
      (`bun scripts/record-golden.ts --update core-loop`) — copy the snapshot-test "update on
      purpose" ergonomics.
- [ ] Document in `docs/engine/determinism.md`: when a PR SHOULD regenerate (intended balance/
      behavior change — reviewer sees hash diff as explicit signal) vs when a mismatch is a bug.
- [ ] Content coupling: goldens embed the content fingerprint; content changes that alter the
      scenario (e.g., tree moved) also require regeneration — the error message must
      distinguish content-fingerprint mismatch from state-hash divergence.

## Acceptance criteria

- [ ] Both goldens replay green in CI; a deliberate one-line damage-formula tweak fails the
      suite with an actionable message naming the divergent tick.
- [ ] Regeneration is one command and produces a reviewable hash-file diff.

## Validation commands

- `bun run test` (or `bun run test:heavy` post-E50)
- `bun run typecheck && bun run lint`
