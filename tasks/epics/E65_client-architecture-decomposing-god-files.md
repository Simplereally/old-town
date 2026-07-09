# E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: E49 complete (HARD — do not decompose ActorRenderer while the unified
  weapon/equipment rig is landing in it; sequence strictly after). E57/E58 soft (their UI
  panels land in UIManager first under old conventions — this epic migrates them with the
  rest; landing E65 earlier just moves their work here).
- Unlocks: parallel client feature work without merge trauma; testable rendering subsystems;
  every future UI epic gets cheaper

## Spec references

- `apps/client/src/game/scene/ActorRenderer.ts` — 1774 lines: actor mesh pooling + animation
  + equipment attachment + armour visuals + material caching in one class
- `apps/client/src/game/ui/UIManager.ts` — 1472 lines: every panel (inventory, bank, shop,
  skills, quest, chat, context menu, …) in one class
- `apps/client/src/game/GameEngine.ts` — 1224 lines: mostly CLEAN orchestration wiring ~30
  subsystems — the target shape, not a problem; it shrinks naturally as extractions give it
  real modules to wire
- The E32 net refactor — `apps/client/src/game/net/ClientPacketApplier.ts` (pure ingestor +
  presentation events) — the repo's OWN precedent for "pure core, thin shell"; read its
  before/after (git history) and its tests as the style guide
- `scripts/assert-render-boundaries.ts` — an architecture guard script ALREADY EXISTS; read
  what it enforces and extend it to lock in this epic's new boundaries
- 🔒 Integer world, float renderer: decomposition must sharpen this boundary (game-truth in,
  presentation out), never blur it

## Epic goal

Break the two god files into cohesive, independently-testable modules — ActorRenderer into
pooling / animation / equipment-attachment / materials concerns, UIManager into a panel
registry with one module per panel — strictly behavior-preserving, in reviewable slices, with
the existing test suites as the safety net and the boundary guard script extended to make
regression structurally impossible. GameEngine gets a light wiring cleanup only.

## Design invariants (bind every story)

- **Behavior-preserving means it**: no visual changes, no API changes observable from
  GameEngine beyond renamed imports, no test deletions — existing tests migrate with their
  code and stay green at every slice boundary. Each slice is a separately-green commit.
- Extract along CONCERN seams, not line counts: a module owns state that changes for one
  reason. If an extraction needs 10 callbacks back into the host, the seam is wrong — find
  the real one.
- New modules get focused unit tests as they extract (the extraction dividend — pay it
  immediately, not "later").
- No new abstractions beyond what the seams need: no event buses, no DI frameworks, no
  observers that don't already exist. The E32 pattern (pure module + thin shell) is the
  ceiling of cleverness.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E65/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E65-S01` — [Seam map and boundary contract for both god files](../stories/E65/E65-S01_seam-map-and-boundary-contract.md)
- [ ] `E65-S02` — [ActorRenderer decomposition: materials and armour visuals](../stories/E65/E65-S02_actorrenderer-materials-and-armour.md)
- [ ] `E65-S03` — [ActorRenderer decomposition: pooling and animation/equipment](../stories/E65/E65-S03_actorrenderer-pooling-and-animation.md)
- [ ] `E65-S04` — [UIManager decomposition: panel registry and per-panel modules](../stories/E65/E65-S04_uimanager-panel-registry.md)
- [ ] `E65-S05` — [Boundary guards, GameEngine wiring pass, and the regression sweep](../stories/E65/E65-S05_boundary-guards-wiring-pass-regression-sweep.md)

## Epic acceptance criteria

- [ ] No client source file in `game/scene` or `game/ui` exceeds ~600 lines (soft target —
      a file may exceed it only with a justifying comment; the guard script warns).
- [ ] ActorRenderer's concerns live in separate modules, each with its own test file;
      UIManager is a registry + N panel modules, each independently jsdom-testable.
- [ ] Zero behavior change: full client suite green throughout; a manual visual pass
      (equipment, armour, animations, every panel) finds no differences.
- [ ] `scripts/assert-render-boundaries.ts` (extended) enforces the new module boundaries;
      violating imports fail it.
