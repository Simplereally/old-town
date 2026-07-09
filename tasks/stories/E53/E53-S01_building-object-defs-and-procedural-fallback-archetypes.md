# E53-S01 — Building object defs and procedural fallback archetypes

## Epic

E53 — Unique Building GLB Pipeline

## Dependency chain

- Depends on: none
- Blocks: E53-S02, E53-S03, and E55 layout work

## Objective

Define all 22 building archetypes as content objects with correct footprints/collision, and give
each a crude-but-distinct procedural geometry in `ObjectRenderer` so the world renders (and E55
can lay out the town) before any Blender work exists.

## Source of truth

`docs/world/starter-buildings-visual-spec.md` — footprints (W×L tiles), heights, palette. Read it
in full; it is short and definitive.

## Implementation guidance

- **Object defs:** create `content/objects/buildings.json` with one def per archetype id
  (`market_bell_tower`, `counting_house`, `gatehouse`, `shrine_hall`, `graveyard_crypt`,
  `foundry_forge`, `anvil_shed`, `bowyer_workshop`, `tannery`, `chalkhouse`, `bead_loom_hall`,
  `river_fishmonger`, `kitchen_hearth`, `market_stall`, `warden_post`, `generic_house_a/b/c`,
  `cellar_ruin`, `well`, `garden_plot`, `dock`). First read the object schema
  (`rg -ln "objectDef|width|blocksMovement" packages/shared/src/content-schemas`) and an
  existing multi-tile object def (search `content/objects/` for one with width/length > 1) to
  copy the exact field set: footprint (width/length), `blocksMovement`,
  `blocksLineOfSight`, examine text, options.
- **Footprints** come from the visual spec verbatim. `gatehouse` needs its center passage tile
  walkable — check how the schema expresses per-tile footprint collision (if it can't, the
  gatehouse must be composed as two `gatehouse_tower` objects flanking a gap, plus a
  non-blocking `gatehouse_arch` decor object spanning above; decide after reading the schema
  and document the decision in the def's comment/examine).
- **Examine text:** one line each, in the game's laconic register (existing defs are the tone
  reference — read a few). E.g. well: "Someone's wished on every coin in it."
- **Procedural fallbacks in `ObjectRenderer.ts`:** extend `resolveArchetype` so each new id
  resolves to itself **before** any generic `building` keyword fallback (exact-match map ahead
  of keyword scan — read the current function, line ~31, and preserve its ordering semantics).
  Add `buildGeometry` cases: box-massing only — base box + roof prism at the spec's footprint
  and height, plus the one signature feature if it's a cheap primitive (tower tiers, chimney
  box, stilt legs). Use `BufferGeometryUtils.mergeGeometries` if that's what existing cases
  do (read a composite case first, e.g. whatever renders the current 3×3 building).
  10–60 tris each is plenty; these are fallbacks, not the product.
- **Materials:** reuse the existing prop material path; pick per-archetype tint approximating
  the spec's dominant wall colour (check how existing archetypes pick material contentIds).

## Required work

- [ ] `content/objects/buildings.json` — 22 defs, schema-valid, footprints per spec.
- [ ] `resolveArchetype` exact-match table + `buildGeometry` fallback cases for all 22.
- [ ] Tests in `ObjectRenderer.test.ts`: each new def id resolves to its own archetype (not
  generic `building`); geometry factory returns non-empty geometry for each; gatehouse
  passage decision covered.
- [ ] `bun run content:validate` green with the new defs (fix cross-reference requirements it
  surfaces — e.g. if defs must be referenced by a map to validate, check validator rules first).

## Acceptance criteria

- [ ] All 22 archetypes render as distinct procedural massing in the world editor (`bun run world-editor:dev`, place a few manually to verify).
- [ ] Footprint/collision fields match the visual spec exactly.
- [ ] No existing object's archetype resolution changed (test the current keyword set still resolves — snapshot the resolution of every def id in `content/objects/` before/after).

## Validation commands

- `bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`
