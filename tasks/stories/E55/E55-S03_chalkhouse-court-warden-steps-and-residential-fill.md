# E55-S03 — Chalkhouse Court, Warden Steps, and residential fill

## Epic

E55 — District Layout and Placement Overhaul

## Dependency chain

- Depends on: E55-S02
- Blocks: E55-S04

## Objective

Complete the remaining districts (Chalkhouse Court on its plateau, Warden Steps) and stitch the
town together with residential fill, groves, and wild edges so no region reads as empty.

Follow the Method section of E55-S01 verbatim.

## District specifics

- **Chalkhouse Court** (E54 chalk plateau):
  - `chalkhouse` (kiln bulge facing the court) + `bead_loom_hall` framing a small
    `chalk_flagstone` court; bead kiln + loom stations per the beadwork system's existing
    station objects (find their ids — they exist from the processing loops).
  - Mother Tallow posted in the court. Bead-clay resource access per current content
    (preserve existing `bead_clay`-related node placements).
  - `chalk_scree` skirts; the plateau ramp is the only approach (E54).
- **Warden Steps:**
  - `warden_post` + warden board (existing `warden_board` object — keep id) at the junction
    where the doc places it; Warden Holt posted.
  - `town_guard` patrol NPCs ONLY if `docs/world/npc-cast.md` or the wardenry docs
    (`docs/wardenry/00-index.md`) sanction them — starter-town rule: no decorative-only NPCs.
    If guards have no system hook (patrol/contract), skip them and note why.
- **Residential fill:** 6–9 `generic_house_a/b/c` in the gaps between districts along
  Oldroad and the plaza approaches; varied rotations; small `garden_plot`/`well` accents
  where natural. Rule: houses never block a district desire line (post-placement pathfind
  checks from spawn to every station must not lengthen by more than ~15% vs pre-fill —
  eyeball via the world editor rather than automating if no path-length harness exists).
- **Wild edges:** `wild_grass` zoning + scattered trees/outcrops toward region borders so the
  map fades from town to wilds rather than stopping.

## Required work

- [ ] All remaining districts + fill authored; maps regenerated; preservation diff; counts updated in `region-loader.test.ts`.
- [ ] Full-cast check: assert (in the generator or a content test) that all 14 named NPCs from `npc-cast.md` are placed exactly once across the four regions — encode the 14 ids as a fixture.
- [ ] Every station object in content that belongs to a starter system has a placement (cross-reference stations ↔ districts; list any deliberate exceptions).

## Acceptance criteria

- [ ] No 20×20 design-space area inside the town boundary is empty of intent (buildings, zoning, resources, or wilds treatment) — pan the world editor over all four regions to check.
- [ ] 14/14 named NPCs placed (test-proven); zero decorative-only NPCs added.
- [ ] Plateau and warden junction match the districts doc.

## Validation commands

- `bun scripts/generate-old-town-map.ts && bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`
