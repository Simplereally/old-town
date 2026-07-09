# Building GLB assets

Authored by `scripts/generate-building-models.py` (headless Blender) from the design authority
`docs/world/starter-buildings-visual-spec.md`. Do not hand-edit GLBs; change the generator (and
the spec doc first, if the design changes), then regenerate.

## Regenerate

```sh
bun run buildings:generate            # all 22 archetypes + manifest.json
bun run buildings:generate -- well    # one archetype
bun run buildings:copy                # validate against manifest + copy to client public dir
bun run buildings:build               # generate + copy
```

Preview renders (isometric, vertex-coloured) for visual review:

```sh
bun run buildings:generate -- --previews /tmp/building-previews
```

## Conventions (enforced by the generator)

- 1 tile = 1.0 unit; origin at footprint center; ground at y=0 (Three.js); door faces
  −Z in Three.js (+Y in Blender; `export_yup=True` maps Blender (x,y,z) → glTF (x,z,−y)).
- Vertex colours in `COLOR_0` from the spec palette only; no materials/textures in the GLB.
- Tri budgets asserted at build: prop ≤ 400, house ≤ 900, landmark ≤ 2000.
- `gatehouse` passage volume (|x| < 0.5, y span, 0 < z < 2.5) is asserted geometry-free.
- `manifest.json` is the single source of truth for the archetype set; the copy step fails on
  any drift between manifest and files.
