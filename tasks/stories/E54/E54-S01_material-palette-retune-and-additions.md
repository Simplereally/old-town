# E54-S01 — Material palette retune and additions

## Epic

E54 — Terrain, Water, and Natural Features

## Dependency chain

- Depends on: none
- Blocks: E54-S02

## Objective

Implement `docs/world/terrain-material-palette.md` against
`content/materials/starter-materials.json`: retune 12 existing entries, add 10 new materials and
the listed `grass_to_*` transitions. Data-only story.

## Implementation guidance

- Schema: `packages/shared/src/content-schemas/material.ts` — `color`/`accentColor` are ints
  (existing file uses decimals like `5214010`); convert the doc's hexes
  (`#4F7A38` → `5208632`). Write a tiny conversion note in the JSON-adjacent README or just be
  careful; a unit test below guards it.
- `textureNoise` per the doc's `{scale, amplitude}` pairs; check `textureNoiseSchema` field
  names before writing (`material.ts` ~line 24).
- **Retunes keep ids and every non-visual field**; only `color`, `accentColor`, `roughness`,
  `textureNoise` change. `water` retune must not touch whatever animation params exist — read
  how `TerrainLayer`'s `waterMaterial` consumes the material def first; if water colour is
  hardcoded client-side (line ~58 suggests a `MeshBasicMaterial` literal), update that constant
  to the palette value instead and note it.
- Transitions: copy the structure of an existing `grass_to_*` entry exactly; midpoint colours.
- **Palette guard test** (new, `packages/shared` or wherever content tests live — find where
  `content:validate`-adjacent unit tests sit): parse the palette doc's tables (or duplicate
  them as a fixture) and assert the JSON matches — id present, colour equal, category valid.
  Fixture duplication is the drift alarm, same pattern as E53-S04.

## Required work

- [ ] JSON edits per the palette doc (12 retunes, 10 additions, 7 transitions).
- [ ] Water colour handled wherever it actually lives.
- [ ] Palette guard test.
- [ ] Eyeball pass: `bun run dev`, walk the existing town; nothing should look broken (zones
  won't exist yet — this story only changes swatches).

## Acceptance criteria

- [ ] `content:validate` green; guard test green; no material id removed or renamed.

## Validation commands

- `bun run content:validate`
- `bun run test && bun run typecheck && bun run lint`
