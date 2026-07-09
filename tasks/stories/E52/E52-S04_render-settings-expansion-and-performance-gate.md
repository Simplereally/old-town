# E52-S04 — Render settings expansion and performance gate

## Epic

E52 — Armour and NPC GLB Visual Pipeline

## Dependency chain

- Depends on: E52-S03
- Blocks: none (last story)

## Objective

Expose independent model-source toggles in the settings UI, persist them, and gate the whole epic behind the render performance budget.

## Implementation guidance

- **Settings schema:** extend `apps/client/src/game/ui/RenderSettings.ts`: `{ weaponModels, armourModels, creatureModels }`, all `"glb" | "procedural"`, defaults `"glb"`. Bump `RENDER_SETTINGS_VERSION` to 2 with a v1 migration (v1 objects only carry `weaponModels`; fill the rest with defaults). Keep the existing localStorage key.
- **UI:** find where the existing weapon-models toggle is rendered (search `weaponModels` in `apps/client/src/game/ui/`) and add the two new toggles beside it, wired to `setArmourModelMode` / creature mode setter from S02/S03. Follow the existing control's DOM/test pattern.
- **Perf gate:** run `bun run stress:render` before/after with glb modes on and record draw calls / frame stats in the story completion note. `bun run stress:render:ci` must pass. If GLB mode regresses the budget, the fix is asset-side (reduce tris / merge geometry), not budget-side — do not raise the budget.
- **Memory hygiene:** toggling modes repeatedly must not leak GPU resources — geometry/material lifecycles go through `RenderResourceRegistry` acquire/release. Add a churn test: toggle all three modes 10× with armed, armoured actors and creatures active; assert registry reference counts return to baseline (use whatever count accessors the registry exposes; add a test-only accessor if none exists).

## Required work

- [ ] Settings schema v2 + migration + tests (v1 payload upgrades cleanly).
- [ ] Three independent toggles in the settings panel with UIManager tests.
- [ ] Registry churn test.
- [ ] Perf numbers recorded; `stress:render:ci` green.
- [ ] Update `AGENTS.md` architecture notes: one paragraph on the GLB override pattern (loaders, `_glb` contentIds, manifests, fallback rules) so future content epics follow it.

## Acceptance criteria

- [ ] Weapon/armour/creature model sources toggle independently, persist, and apply live.
- [ ] No GPU resource leaks under toggle churn (test-proven).
- [ ] Render budget unchanged and green.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- `bun run stress:render:ci`
