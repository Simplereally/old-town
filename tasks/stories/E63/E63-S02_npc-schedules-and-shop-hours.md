# E63-S02 — NPC schedules and shop hours

## Epic

E63 — Living World

## Dependency chain

- Depends on: E63-S01
- Blocks: E63-S03

## Objective

NPCs keep hours: content-declared anchors per day phase, walked to via existing movement;
shops close at night.

## Implementation guidance

- **Content shape**: extend the NPC content schema with optional
  `schedule: [{phase, anchor: {x, z, plane}, behavior?: "wander"|"stand"}]` — on phase
  change, a scheduled NPC gets its wander-home/anchor point retargeted to the new anchor and
  paths there with the EXISTING wander/return machinery (`npc-system.ts` already re-paths
  toward targets every tick — read the chase/return target mechanism and reuse; the schedule
  just moves the home point). `wanderRadius` applies around the current anchor.
- **Transition behavior**: NPCs WALK to the new anchor (no teleporting in view). Edge case —
  an NPC in combat on phase change: defer the retarget until combat ends (the existing
  return-to-home logic after combat should then head to the NEW anchor naturally — verify).
- **Shop hours**: shopkeeper NPCs' schedules move them off-counter at night; the shop
  interaction must ALSO refuse when closed (server-side check against the clock — find where
  shop open/interaction is validated; add `hours: {open: phase[], ...}` to shop content or
  derive from the keeper's schedule — PICK ONE, prefer deriving to avoid double bookkeeping,
  document). Closed refusal = a system line ("The shop is closed until morning."). Doors:
  where a shop building has a door entity, schedule can close it (door-system.ts — check
  whether doors support a locked state; if not, refusal-at-interaction is enough, note it).
- **Validate-time checks**: schedule anchors must be walkable + within the NPC's region
  (reachability sanity via the collision data available to the validator — investigate what
  `content:validate` can see; at minimum assert the tile is not fully blocked).
- **Cast pass**: schedule 3–5 starter-town NPCs per `docs/world/npc-cast.md` (the doc names
  personalities — pick ones whose day/night split is legible: e.g. a market keeper who goes
  home, a guard rotation, a night-owl by the tavern if one exists — follow the doc, don't
  invent lore).

## Required work

- [ ] Schema + retarget-on-phase-change + combat deferral + tests (phase flip moves the home
      anchor; NPC arrives and wanders there; combat defers).
- [ ] Shop-hours enforcement + refusal line + tests; door integration or documented refusal-
      only decision.
- [ ] Content: 3–5 scheduled NPCs + shop hours for at least one shop; validator checks.
- [ ] Determinism: phase-change retargeting draws NOTHING from rng beyond the existing wander
      rolls (review criterion).

## Acceptance criteria

- [ ] Epic criterion #2 demonstrated in dev with a shortened day and recorded in the story
      note.
- [ ] Unscheduled NPCs behave byte-identically to before (regression: existing npc-system
      tests untouched and green).

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
