# E65-S05 — Boundary guards, GameEngine wiring pass, and the regression sweep

## Epic

E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: E65-S04
- Blocks: none (last story)

## Objective

Lock the new architecture in: extend the existing guard script, do the light GameEngine
cleanup the extractions enabled, and run the full-feature regression sweep.

## Required work

- [ ] **Extend `scripts/assert-render-boundaries.ts`** (read what it enforces today first;
      extend in its idiom): panels may not import panels; scene modules respect the S01
      dependency direction; the ~600-line soft cap warning for `game/scene` + `game/ui`
      files (warn-with-justification-comment, not hard fail — the escape hatch is a
      `// boundary-exempt: <reason>` line the script recognizes). Wire into the standard
      validation set if it isn't already (check how it runs in CI today).
- [ ] **GameEngine wiring pass**: with real modules to wire, collapse any now-redundant
      glue; group subsystem construction into a few cohesive factory functions if (and only
      if) it reads better — GameEngine is explicitly NOT being decomposed; target is
      readability of the wiring, expected shrink to ~1000 lines, no structural ambition.
- [ ] **Regression sweep**: full client suite + typecheck + lint; the stress tests'
      before/after table (S03's numbers, finalized); a manual full-feature pass in
      `bun run dev` — every panel, equipment/armour/animation, chat, banking, shop, quest UI,
      context menus — against a written checklist committed as
      `docs/engine/client-regression-checklist.md` (this checklist outlives the epic; future
      client refactors reuse it).
- [ ] Update `docs/engine/client-decomposition.md` from "plan" to "as-built" (the deltas
      between S01's map and what shipped, with reasons — the honest record future extractors
      will want).

## Acceptance criteria

- [ ] Guard script red on a deliberate violation (panel-imports-panel scratch test) and
      green on the shipped tree.
- [ ] Checklist pass recorded; suite green; stress within noise; docs as-built.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
- `bun scripts/assert-render-boundaries.ts` (or its wired npm script — cite the actual
  invocation in the story note)
