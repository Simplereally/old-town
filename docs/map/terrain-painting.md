# Terrain Painting Conventions

## District painting

Each district in the Old Town starter region is painted by assigning an `underlayId` to every tile inside the district boundary. The renderer does not know district names — it only renders material IDs.

### District definitions

Districts are defined in `scripts/generate-old-town-map.ts` as `districtDefs` entries, each specifying:

- `id` — district trigger box identifier
- `x`, `y`, `width`, `height` — rectangle in design-space coordinates (0–95)
- `material` — the primary `underlayId` for the district interior
- `border` — the transition material ID for the 1-tile inset border

### Painting order

1. **District fills** — each district rect is filled with its primary material via `fillRect`.
2. **Transition borders** — a 1-tile inset border ring is painted around each district via `fillBorder`, using the district's transition material. This creates a smooth visual transition between the district and surrounding grass.
3. **Roads** — main roads are painted last, overriding any transition tiles they cross.

**Contained districts must be listed after containing districts** so their fills are not overwritten. For example, `counting_house` (8×8 inside `shrine_hearth` 16×16) is listed after `shrine_hearth`.

### Transition materials

Transition materials are defined in `content/materials/starter-materials.json` with `category: "transition"`. Each transition material's color is a 50/50 blend of grass and the district's primary material color, creating a visual bridge between the district and the surrounding terrain.

Transition material IDs follow the pattern `grass_to_{material}`, e.g. `grass_to_bellstone`, `grass_to_soot_cobble`.

### Roads

Major routes between districts use `packed_road` as an overlay on top of the district base material. Roads are painted after district fills and transitions so they override the transition border tiles.

## Validation

- `bun run content:validate` — verifies all `underlayId` references in map overrides resolve to materials in the registry.
- `packages/shared/src/content-schemas/district-painting-s03.test.ts` — verifies each district trigger box contains at least one tile with the expected material, and that transition materials appear in the generated maps.
