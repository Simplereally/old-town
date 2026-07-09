# E56-S01 — Determinism audit and nondeterminism fences

## Epic

E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: none
- Blocks: E56-S02

## Objective

Prove (or make true) the claim that world state after tick N is a pure function of
(seed, content, initial regions, journaled inputs). Find every nondeterministic input inside
the tick path and fence it out.

## Verified starting facts

- One RNG instance, fixed seed `0x1d70a0d`, is threaded into skilling/spell/combat/NPC contexts
  (`simulation-kernel.ts:253` and the context objects at 254–262, 396–412). Determinism
  therefore depends on **RNG call order** being identical run-to-run.
- `Date.now()` IS called inside `connectSession` for session leases (`simulation-kernel.ts:664`)
  — but connect happens outside tick phases; it must be shown (or made) irrelevant to world
  state. Lease decisions affect WHETHER a session connects, which the journal captures as a
  session event, so replay does not re-run leasing — document this boundary.
- JS `Map` iteration is insertion-ordered, so `world.componentEntries(...)` sweeps are
  deterministic **iff** entity creation order is deterministic (it is, given identical inputs).
- The async persistence pipeline (`CharacterSaveQueue`, `ItemAuditLog`) must be write-only from
  the sim's perspective: nothing it does may feed back into world state mid-run.

## Required work

- [ ] Sweep for nondeterminism sources inside anything reachable from a tick phase:
      `rg -n "Date\.now|Math\.random|performance\.now|crypto\.randomUUID" apps/server/src`
      — classify every hit as (a) outside tick path (OK, document), (b) telemetry-only (OK),
      or (c) inside tick path (FIX: route through the shared rng or the tick clock).
      Known-suspect areas to check by hand: item uid generation, grave/ground-item ids,
      idempotency keys built during economy commits, chat message ids.
- [ ] Verify `createRng` in `packages/shared` is a pure sequential PRNG (no global state, no
      time). Add a unit test pinning its first 16 outputs for the canonical seed — this makes
      accidental algorithm changes loud.
- [ ] Verify persistence write-only-ness: audit `saveQueue.flushDue` (called inside the
      QuestTriggersVarbits phase, `simulation-kernel.ts:547`) and `ItemAuditLog` for any path
      that mutates world/components. Document the one-way rule in a comment at the flush site.
- [ ] Write the determinism contract: `docs/engine/determinism.md` — what is fenced (wall
      clock, uuids, async results), the RNG-call-order rule (every rng consumer must draw a
      deterministic number of samples per tick given identical state), and the journal boundary
      (connect/disconnect are inputs, not simulation).
- [ ] Guard script `scripts/assert-determinism-fences.ts` (wire as `bun run sim:fences`):
      rg-based scan failing on new `Date.now|Math.random|randomUUID` inside
      `apps/server/src/systems|sim|world` minus an explicit allowlist with justifications.
- [ ] Smoke proof: a test that builds two kernels with identical options, feeds both the same
      50 scripted commands across 100 ticks via `routeCommand`, and asserts deep-equal
      positions, inventories, and XP for all entities. (Full hashing arrives in S03 — this is
      the cheap early tripwire.)

## Acceptance criteria

- [ ] Zero unfenced nondeterminism inside tick-reachable code; allowlist documented.
- [ ] Twin-kernel smoke test green.
- [ ] `docs/engine/determinism.md` committed; `bun run sim:fences` green and wired into the
      validation set.

## Validation commands

- `bun run sim:fences`
- `bun run test && bun run typecheck && bun run lint`
