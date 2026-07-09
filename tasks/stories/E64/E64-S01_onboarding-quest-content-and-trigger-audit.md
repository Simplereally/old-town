# E64-S01 — Onboarding quest content and trigger coverage audit

## Epic

E64 — First Session: Guided Onboarding

## Dependency chain

- Depends on: none
- Blocks: E64-S02

## Objective

The quest itself, in content — and first, the audit that tells us whether the quest engine
can actually see every action the quest must react to.

## Implementation guidance

- **Audit FIRST**: list the step-advance signals the quest needs — talked-to-NPC, arrived-at-
  area, chopped-a-log (skilling success), smelted/crafted item, item-in-inventory, banked
  item, killed-NPC. For each, find the varbit/trigger mechanism the quest engine supports
  (read `quest-engine.ts` trigger kinds + how E46's quest content declares them + how systems
  SET varbits today — search `setVarbit`-ish calls in the skilling/combat/bank systems). The
  audit output is a table in the story note: signal → existing mechanism | GAP. Expect gaps
  (e.g. "first time banking" may not set anything). Each gap becomes a small, GENERIC trigger
  hook in the owning system (e.g. skilling success can set a content-declared varbit —
  pattern: content says "this action sets varbit X", engine stays generic) — never a
  hardcoded "if onboarding quest" branch.
- **Quest content**: `content/quests/<id>.json` following E46's quest shape exactly. Steps
  per `docs/world/starter-town.md` first-session goals (READ IT and follow its loop rather
  than the sketch here): greet guide → walk to the grove (arrive-area) → chop N logs →
  smelt/craft per the starter economy loop (`docs/world/starter-economy-loops.md`) → bank the
  product → one cellar-rat-tier kill → return to guide → reward. Reward: modest and per
  starter-economy doc (coins + a basic tool upgrade — check what the docs bless; don't
  invent).
- **Decline path**: a varbit marking guidance-declined; the quest moves to a terminal state
  the engine already supports (check: abandoned vs completed states — use what exists).

## Required work

- [ ] Trigger audit table + the generic hooks for every gap (each with its own test in the
      owning system's suite).
- [ ] Quest JSON + content validation + quest-engine integration test: scripted session
      performs each action → steps advance in order; out-of-order actions don't skip steps
      (or do, if the engine supports parallel objectives — match engine semantics, document).
- [ ] Decline path content + test (decline → terminal, no further step processing).

## Acceptance criteria

- [ ] Full quest completes in an integration test driven only by normal intents.
- [ ] Zero quest-specific branches in engine code (review criterion — `rg` the quest id
      through `apps/`: content and tests only).

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
