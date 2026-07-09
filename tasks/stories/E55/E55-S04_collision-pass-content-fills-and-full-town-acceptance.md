# E55-S04 — Collision pass, content fills, and full-town acceptance

## Epic

E55 — District Layout and Placement Overhaul

## Dependency chain

- Depends on: E55-S03
- Blocks: none (last story)

## Objective

Close the epic: remaining small content defs, a systematic collision pass, and an end-to-end
acceptance sweep of the whole 128×128 town.

## Required work

- [ ] **Content fills** (any not already authored by S02/S03; schema-valid, laconic examine
  text): `grave_mound`, `well`, `dock`, `garden_plot` object defs (no options beyond examine
  for now — "draw water"/foraging hooks are future epics; do not add dead options). Verify
  `river_fishing_spot` needs no object def (it's a resource node — check how fishing nodes
  render before assuming).
- [ ] **Collision pass** (all generator-driven — the auto-rules from E54-S03 should cover
  most; this is the audit):
  - Every building footprint blocks per its def; doors/open fronts/arch passages walkable.
  - Water impassable except bridge; cliff edges block on the high side; ramps walkable.
  - Probe suspicious spots with the world-editor collision tools; every fix goes into
    generator rules or def footprints, never manual tile patches.
- [ ] **Systematic reachability test** (server-side): load all four regions, pathfind from the
  spawn tile to every NPC-adjacent tile, every station-adjacent tile, and every resource-node
  adjacent tile. Assert 100% reachable. This test is the town's permanent structural
  invariant — keep it in the fast lane if it runs quickly, heavy lane otherwise.
- [ ] **Count truth:** final `region-loader.test.ts` expectations; also assert non-zero water,
  bridge, and height>0 tile counts per the relevant regions so terrain can't silently vanish.
- [ ] **In-game acceptance walkthrough** (`bun run dev`): the full E45 hour-one loop in the new
  town — spawn at Market Bell, bank at Counting House, chop in Lath Yard grove, mine on the
  terraces, smelt+smith at the forge, fish and cook at River Stoop, kill a cellar rat, walk
  the bridge, visit the crypt, read the warden board. Fix what breaks; screenshot each
  district for the story note.
- [ ] **Doc sync:** update `docs/world/starter-town.md` (and `districts-and-routes.md` if
  positions shifted during reconciliation) to match built reality — per the AGENTS.md
  maintenance rule, rewrite stale sections in place.

## Acceptance criteria

- [ ] Reachability test green and committed.
- [ ] E45's epic acceptance criteria remain satisfiable in the new town (spot-check its checklist).
- [ ] All epic-level E55 acceptance criteria check out; world docs match reality.

## Validation commands

- `bun scripts/generate-old-town-map.ts && bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`
- `bun run stress:render:ci`
