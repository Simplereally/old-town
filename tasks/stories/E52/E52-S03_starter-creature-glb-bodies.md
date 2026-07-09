# E52-S03 — Starter creature GLB bodies

## Epic

E52 — Armour and NPC GLB Visual Pipeline

## Dependency chain

- Depends on: E52-S02
- Blocks: E52-S04

## Objective

Give the starter-region creatures authored GLB bodies (minimum: `cellar_rat`, `mud_goblin`; stretch: the other starter NPC bodies) while keeping the existing procedural creature path as fallback and keeping all pose animations working.

## Implementation guidance

- **How creatures render today:** `ActorRenderer` builds creatures from procedural geometry (non-humanoid path — `parts.length === 0`, body-only, animations scale/rotate `meshes.body` and `meshes.group`; see the `idle` breathing and `die` collapse cases ~line 1690+). Find where the creature body geometry is chosen per NPC (search how appearance/`bodyId` maps to geometry — `rg -n "bodyId" apps/client/src/game` and `appearance-system` server-side).
- **Pipeline:** extend the S01 generator/copy scripts (or add `creatures:*` siblings) targeting `assets/creatures/models/<bodyId>.glb` → `/models/creatures/`. Same vertex-colour rules; creature colours are mostly baked (no tier tint) — material can be plain `vertexColors: true` Lambert; add a helper in `glb-materials.ts`.
- **Loader:** `CreatureGltfLoader` cloning the S02 loader; override key = the creature body geometry contentId + `_glb`, manifest-driven like armour.
- **Animation compatibility is the trap:** existing creature animations mutate `meshes.body.scale/position` and `meshes.group`. GLB bodies must therefore load as a single `BufferGeometry` on the same `meshes.body` mesh slot (NOT a multi-node scene graph), with origin at the ground center (feet at y=0) so `die` collapse and `idle` breathing keep working untouched. Enforce ground-origin in the generator; reject multi-mesh GLBs in the loader (take first mesh, warn if more).
- **Scale:** creatures must keep their current footprint (selection, health bar anchor, and hover highlight positions derive from mesh bounds or constants — check `HoverHighlighter.ts` / health bar Y offset logic and verify GLB bounds don't break them; if health bar Y is hardcoded per body, keep GLB heights matching procedural heights within ~10%).

## Required work

- [ ] Generator + copy + manifest for `cellar_rat` and `mud_goblin` GLBs (< 3000 tris each).
- [ ] `CreatureGltfLoader` + registry overrides + bootstrap wiring + per-family fallback.
- [ ] Tests: override registration, fallback, single-mesh enforcement, bounds sanity (GLB bounding box height within tolerance of procedural), animations still mutate the same mesh object after swap.
- [ ] Manual QA: fight a rat and a goblin — breathing, death collapse, hitsplats, health bar, hover highlight, click-to-attack picking all correct in both modes.

## Acceptance criteria

- [ ] Rat and goblin render as authored models with all combat feedback intact.
- [ ] Procedural fallback per creature preserved.
- [ ] Picking/selection unaffected (raycast hits the GLB mesh — verify the mesh keeps whatever layers/userData picking relies on).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
