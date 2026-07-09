# E63-S01 — World clock and day-phase protocol

## Epic

E63 — Living World

## Dependency chain

- Depends on: none
- Blocks: E63-S02

## Objective

One authoritative clock: game time as a pure function of tick count, exposed to systems and
streamed to clients.

## Implementation guidance

- **Model**: `worldClock(tick) → {day, phase, phaseProgress}` in
  `packages/shared/src/world-clock.ts` (shared: the client will render from the same math
  between packets). Day length in ticks is a shared constant — pick so a full day ≈ 45 real
  minutes at 600 ms/tick (=4500 ticks; document the choice); phases: `dawn|day|dusk|night`
  with content-relevant boundaries (night ~30%). `OLD_TOWN_DAY_TICKS` env/kernel option
  override for dev/testing (shortened days).
- **Kernel integration**: no new state — the clock is derived. Add `clock` to the system
  contexts that need it (mirror how `tick`/`serverTime` already thread through
  `wireTickPhases` contexts). CRITICAL: `startTick` matters — if the kernel can boot at a
  nonzero tick (check persistence of tick count across restarts — does the kernel resume tick
  numbers or restart at 0? read the boot path and DOCUMENT the answer; if ticks restart at 0,
  the world clock resets per boot, which is acceptable for now but must be written down and
  revisited when persistence of world time matters).
- **Protocol**: `WorldClockPacket {day, phase, dayTicks, tickInDay}` sent on connect and on
  phase change only (clients interpolate between packets from the shared math + their tick
  estimate). Register per E48 wire validation. Find how connect-time one-shot packets flow
  (the login bootstrap sequence) and mirror.
- **E47 hand-off**: a marked note in the client packet-applier where E47-S03's atmosphere
  controller should subscribe (don't build the visuals).

## Required work

- [ ] Shared clock math + constants + override option + unit tests (phase boundaries exact,
      progress monotonic, override respected).
- [ ] Context threading + connect/phase-change packet emission + wire registration + tests
      (emission exactly on boundaries, no per-tick spam).
- [ ] Boot-tick answer documented in the module docstring.

## Acceptance criteria

- [ ] Zero wall-clock reads (the E56 fence scan stays clean).
- [ ] A dev server with `OLD_TOWN_DAY_TICKS=200` cycles phases visibly in `/statsz` (expose
      current phase there — one line in E60's stats if landed, else skip).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
