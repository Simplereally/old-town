# E63-S03 — Ambient barks

## Epic

E63 — Living World

## Dependency chain

- Depends on: E63-S02
- Blocks: E63-S04

## Objective

NPCs occasionally say flavor lines overhead — content-driven, phase-aware, deterministic,
and rate-controlled so the town murmurs rather than shouts.

## Implementation guidance

- **Content shape**: `barks: [{text, phases?, weight?}]` on the NPC schema (or a shared bark
  table referenced by id, if several NPCs share lines — look at how dialogue content is
  factored in `content/` and match its reuse idiom).
- **Roll mechanics**: piggyback the existing wander-roll pattern (`npc-system.ts:283–301` —
  same 1-in-N per-tick shape, shared rng): an idle, out-of-combat NPC with barks rolls ~1 in
  500 per tick (≈ one bark per 5 minutes), weighted pick among phase-eligible lines. CRITICAL
  rng discipline: the roll must draw a FIXED number of rng samples per eligible NPC per tick
  regardless of outcome (one gate sample; the pick sample only on success — this is
  state-dependent but deterministic, fine) — keep call order stable per the E56 contract.
- **Delivery**: barks ride the SAME channel as NPC overhead chat — find how NPC/dialogue text
  reaches `ChatOverheadLayer` (dialogue engine must emit overhead lines already — reuse that
  exact path; interest-filtered so only nearby players receive).
- **Suppression**: no bark while in dialogue with any player, in combat, or mid-schedule-walk
  (arriving NPCs barking mid-stride looks wrong — gate on "at anchor"); global town-wide cap
  (≤ 1 bark per tick across all NPCs — a cheap tie-break: lowest entity id wins, others skip
  their roll's success this tick) to prevent a plaza chorus.
- **Content pass**: barks for the scheduled NPCs from S02, phase-flavored (market cries by
  day, watchman lines at night) — source tone from `docs/world/npc-cast.md`.

## Required work

- [ ] Schema + roll + weighted pick + suppressions + global cap + delivery.
- [ ] Tests: determinism (two identical runs bark identically); phase eligibility; caps and
      suppressions; interest filtering (far player receives nothing).
- [ ] Content lines for the S02 cast, validated.

## Acceptance criteria

- [ ] Determinism test green (this story is the E56 discipline's first consumer in ambient
      content — get it right here and S04 inherits the pattern).
- [ ] In dev: audible-town feel check recorded in story note (shortened day, stand in square).

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
