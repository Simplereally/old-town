# E63-S04 — World-event framework and two shipped events

## Epic

E63 — Living World

## Dependency chain

- Depends on: E63-S03
- Blocks: none (last story)

## Objective

A small, deterministic scheduler for multi-tick world happenings, proven by two real events:
a traveling merchant and a town-crier moment.

## Implementation guidance

- **Framework** (`apps/server/src/systems/world-event-system.ts`): events are content-declared
  (`content/events/*.json`): `{id, trigger: {kind:"clock", every: {days, phase}} |
  {kind:"chance", perTickIn, phases}, duration, script: [step...]}` where steps are a SMALL
  fixed vocabulary — `announce {text, channel}`, `spawn_npc {npcId, at, despawnOnEnd}`,
  `open_shop {shopId}` / stock override, `set_varbit`-style world flags if a world-var
  mechanism exists (check `apps/server/src/vars/` — it does exist as a directory; read it and
  reuse rather than inventing world flags). NO arbitrary scripting — every step kind is
  engine-implemented and individually tested; new event ideas that need new step kinds add
  them explicitly.
- **Scheduling determinism**: clock triggers are pure tick math; chance triggers draw from
  the shared rng with the fixed-samples discipline. Active-event state lives in components/
  world vars (replay-safe), NOT in system-local mutable state that a restart would lose —
  decide and document what happens to an in-flight event on server restart (acceptable v1:
  events die on restart since world time resets per S01's boot answer; document together).
- **Merchant event**: every N days at dawn, announce ("A traveling merchant has arrived at
  the square!" — E58 system channel if landed, else local-area announce via existing chat),
  spawn a merchant NPC (charter/shop machinery for its inventory — `charter-system.ts` may
  already model exactly this; READ IT FIRST, this event might be mostly wiring), trades for
  the day phase, departure announce + despawn. Stock: a small rotating list (deterministic
  rotation by day number).
- **Town-crier event**: dusk daily, the crier walks to the square anchor (S02 schedule) and
  barks a themed proclamation (S03 machinery with a guaranteed rather than chance roll —
  add a `bark_now` step kind). Cheap by design: proves the framework composes with S02+S03.

## Required work

- [ ] Framework + step vocabulary + content schema + validation + per-step tests.
- [ ] Both events as content + integration tests (fast-forwarded clock: full lifecycle
      deterministic; two-run identity).
- [ ] Restart semantics documented; E56 golden extended with an event window if E56 landed
      (else marked TODO there).
- [ ] `docs/engine/world-events.md`: step vocabulary reference + how to author an event.

## Acceptance criteria

- [ ] Epic criterion #4 (merchant end-to-end) green in tests and observed in dev with a
      shortened day.
- [ ] Adding a third trivial event (test fixture) requires ZERO engine changes (review
      criterion: content-only).

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
