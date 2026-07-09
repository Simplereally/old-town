# E53-S04 — Building pipeline tests and performance gate

## Epic

E53 — Unique Building GLB Pipeline

## Dependency chain

- Depends on: E53-S03
- Blocks: none (last story)

## Objective

Contract tests and a perf gate that keep the building pipeline healthy as archetypes are added.

## Required work

- [ ] **Contract test** (`ObjectRenderer.buildings.test.ts`): for every id in
  `assets/buildings/models/manifest.json` — (a) an object def exists in
  `content/objects/buildings.json` with a footprint matching
  `docs/world/starter-buildings-visual-spec.md` (encode the spec's footprint table as a
  fixture in the test — yes, duplicated on purpose: the test IS the drift alarm between doc,
  defs, and manifest); (b) `resolveArchetype(id) === id`; (c) procedural `buildGeometry`
  returns non-empty geometry.
- [ ] **Asset validation script** `scripts/validate-building-assets.ts` (mirror
  `validate-item-assets.ts`): every manifest archetype has a GLB on disk, tri count within
  budget class, `COLOR_0` attribute present, bounding box within footprint+height tolerance
  (±10%) of the spec fixture. npm script `buildings:validate`; wire into `buildings:build`.
- [ ] **Perf:** extend the render stress scene (`scripts/stress-render-props.ts` /
  `stress:render:ci` — read how props are added) to include a representative building mix
  (~40 buildings across the archetypes). Record before/after stats in the story note;
  `stress:render:ci` must stay green. If instancing groups by archetype, 22 archetypes ≈ 22
  draw calls worst case — acceptable; flag anything beyond that.
- [ ] **World-editor smoke:** confirm the world editor renders the new archetypes
  (`bun run world-editor:dev`) — if it has its own renderer path that bypasses
  `ObjectRenderer`, add the minimal fallback mapping there and note it.

## Acceptance criteria

- [ ] Doc ↔ defs ↔ manifest ↔ assets cannot drift silently (tests + validator prove each edge).
- [ ] `bun run buildings:validate` green; `bun run stress:render:ci` green with buildings included.

## Validation commands

- `bun run buildings:build && bun run buildings:validate`
- `bun run test && bun run typecheck && bun run lint`
- `bun run stress:render:ci`
