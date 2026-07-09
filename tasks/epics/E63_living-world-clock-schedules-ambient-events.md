# E63 — Living World: Clock, Schedules, Ambient Behavior, and World Events

## Dependency chain

- Depends on: soft — E47-S03 (client day/night lighting: the server clock this epic builds is
  what that story's client phase should eventually bind to; server side stands alone), E58-S03
  (system announce channel for events; a plain chat broadcast is the fallback), E56 (world
  events must stay replay-deterministic — if E56 landed, its goldens constrain this epic; if
  not, follow the same rng discipline anyway)
- Unlocks: the town reads as alive; retention texture between content drops

## Spec references

- `apps/server/src/systems/npc-system.ts:283–301` — the ONLY ambient behavior today: idle
  out-of-combat NPCs roll 10-in-1000 per tick for a wander destination within `wanderRadius`.
  Local pathing + chase/return already work (line 119 comment) — schedules steer targets, they
  don't need new movement machinery.
- `apps/server/src/systems/activity-system.ts` + `charter-system.ts` + `favour-system.ts` —
  existing systems world events can compose with (read each before designing event effects).
- `apps/server/src/dialogue/` — dialogue engine; barks are its tiny cousin (overhead lines,
  no interaction).
- `docs/world/npc-cast.md`, `docs/world/districts-and-routes.md`,
  `docs/world/shops-and-services.md` — design authority for who goes where, when.
- `apps/server/src/systems/door-system.ts` — shop open/close hooks.
- 🔒 Content-driven: schedules, barks, and events are JSON. 🔒 Determinism: every roll through
  the shared sim rng; wall-clock time NEVER drives world state — the world clock derives from
  tick count only.

## Epic goal

A server-authoritative world clock (day phases derived purely from tick count), content-driven
NPC schedules (NPCs move between anchor points by phase; shops open and close), ambient barks
(overhead flavor lines on deterministic rolls), and a small world-event framework with two
shipped events (a traveling merchant arrival; a town-crier announcement moment). The town
should look different at night and no two walks through it should feel identical — while
staying 100% deterministic and replayable.

## Scope guardrails

- No pathfinding upgrades: schedule anchors must be reachable with existing local pathing
  (content authors pick sane anchors; a validate-time reachability check is in scope, new
  nav tech is not).
- Events are ambient/economic flavor, not raid content: no new combat mechanics, no
  player-facing event UI beyond chat/announce + what's visibly happening in the world.
- The client learns about time-of-day the same way it learns everything: a packet. E47-S03's
  visual treatment consumes it; this epic does not do client lighting work.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E63/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E63-S01` — [World clock and day-phase protocol](../stories/E63/E63-S01_world-clock-and-day-phase-protocol.md)
- [ ] `E63-S02` — [NPC schedules and shop hours](../stories/E63/E63-S02_npc-schedules-and-shop-hours.md)
- [ ] `E63-S03` — [Ambient barks](../stories/E63/E63-S03_ambient-barks.md)
- [ ] `E63-S04` — [World-event framework and two shipped events](../stories/E63/E63-S04_world-event-framework-and-two-events.md)

## Epic acceptance criteria

- [ ] The world clock is a pure function of tick; two replays of the same journal see
      identical phases, schedules, barks, and events (E56-compatible by construction).
- [ ] At least three starter-town NPCs demonstrably relocate between day and night anchors;
      at least one shop closes at night (door shut, shopkeeper gone, interaction refused with
      a reason line).
- [ ] Standing in town square for 5 minutes, a player sees at least one bark and the clock
      packet reaches the client on phase change (verified in dev with a shortened day).
- [ ] The traveling-merchant event runs end-to-end on its schedule: announce → arrival →
      trades for a window → departure; fully deterministic in tests.
