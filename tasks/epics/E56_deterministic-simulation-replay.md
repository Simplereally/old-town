# E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: nothing
- Unlocks: order-of-magnitude cheaper debugging for every subsequent epic; golden-replay
  regression tests; E61's scale scenarios become reproducible; E63's world events stay testable

## Spec references

- `apps/server/src/sim/simulation-kernel.ts` — `createRng(0x1d70a0d)` (line 253); phase wiring
  (`wireTickPhases`, lines 345–581); command acceptance (`routeCommand` → `commandBuffer.accept`
  with `{ownerEntityId, connectionId, receivedTick, targetTick}`, lines 740–772)
- `apps/server/src/sim/command-buffer.ts`, `tick-loop.ts`, `action-queue.ts`
- `packages/shared` — `createRng` implementation (verify it is a pure counter-free PRNG whose
  sequence depends only on seed + call order)
- 🔒 AGENTS.md invariants: 600 ms tick, integer world, server authoritative — all three are WHY
  this epic is cheap here and impossible in most engines

## Epic goal

The simulation already has the three preconditions for perfect determinism: a single seeded
RNG, a fixed phase order, and a single choke point for all external input. This epic finishes
the job: audit and fence the remaining nondeterminism, journal every input, and build a replay
harness that can re-run any recorded session tick-for-tick to an identical world state — then
turn that into golden-replay regression tests and a time-travel debugging workflow. When a
player reports "my ingots vanished at ~14:03", you replay their session to the exact tick and
watch it happen.

## Why this is the #1 pick

Every other epic in this file will ship bugs. The difference between a 4-hour and a 4-minute
investigation is whether the failing tick can be re-executed under a debugger. This is the
highest-leverage engineering investment available to this codebase right now, and it is CHEAP —
the architecture already paid for it.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E56/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E56-S01` — [Determinism audit and nondeterminism fences](../stories/E56/E56-S01_determinism-audit-and-nondeterminism-fences.md)
- [ ] `E56-S02` — [Input journal: record every command, session event, and boot fingerprint](../stories/E56/E56-S02_input-journal.md)
- [ ] `E56-S03` — [Replay harness with state hashing and divergence bisect](../stories/E56/E56-S03_replay-harness-and-divergence-bisect.md)
- [ ] `E56-S04` — [Golden replay regression suite in CI](../stories/E56/E56-S04_golden-replay-regression-suite.md)
- [ ] `E56-S05` — [Time-travel inspection tooling and the RCA runbook](../stories/E56/E56-S05_time-travel-tooling-and-rca-runbook.md)

## Epic acceptance criteria

- [ ] Two runs of the same journal produce byte-identical world-state hashes at every
      checkpoint tick, on different machines.
- [ ] A recorded 500-tick play session (move/chop/smelt/fight/bank/chat) replays to an
      identical final hash in CI on every PR.
- [ ] `bun scripts/replay.ts <journal> --until <tick> --dump <entityId>` prints that entity's
      full component state at that tick.
- [ ] Journaling overhead in a live server is unmeasurable at 50 sessions (< 1 ms added to any
      tick; buffered writes happen off the tick path).
- [ ] A documented determinism contract exists and a guard script enforces it.
