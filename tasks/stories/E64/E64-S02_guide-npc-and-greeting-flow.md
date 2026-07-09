# E64-S02 — The guide NPC and greeting flow

## Epic

E64 — First Session: Guided Onboarding

## Dependency chain

- Depends on: E64-S01
- Blocks: E64-S03

## Objective

The human face of onboarding: a guide NPC near spawn with a dialogue tree that starts,
tracks, and (if declined) ends the quest — plus the "new player arrives" greeting moment.

## Implementation guidance

- **NPC**: add per `docs/world/npc-cast.md` conventions (or use a cast member the doc already
  places near spawn — check first). Placement near the spawn point per
  `docs/world/starter-town.md`; visuals through the existing NPC pipeline (E52 conventions if
  landed — a re-dressed existing model is fine; do not block on bespoke art).
- **Dialogue tree**: content in the dialogue engine's format (read `apps/server/src/dialogue/`
  content examples): greeting branches on quest varbit state — not-started (pitch +
  accept/decline), in-progress (stage-appropriate reminder per step — the tree reads the
  quest varbits; verify the dialogue engine supports varbit-conditional branches, E46/quest
  work likely built this — if truly absent, THIS is one of the epic's ≤ 2 engine additions),
  declined (a polite one-liner, re-offer option), completed (congratulations + a pointer
  toward the open world: name two next activities from the docs).
- **Greeting moment**: on FIRST-ever spawn (a varbit set at character creation — find where
  fresh characters initialize), the guide gets attention drawn to it: a system chat line
  ("You feel like you should speak to <Guide>...") — cheap and sufficient; anything fancier
  (walk-up, camera) is out of scope.
- **Relog correctness**: all branches keyed on persisted varbits — a mid-quest relog resumes
  the right dialogue.

## Required work

- [ ] NPC content + placement + dialogue tree covering all five states + greeting line hook.
- [ ] Tests: dialogue branch selection per varbit state (dialogue engine test idiom); accept
      starts the quest; decline sets the terminal path; relog resumes correctly.
- [ ] Manual dev pass: full conversation flow at each stage, recorded in story note.

## Acceptance criteria

- [ ] Every dialogue state reachable and correct; no dead branches (each branch covered by a
      test).
- [ ] A declined player is never re-prompted unless they re-initiate.

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
