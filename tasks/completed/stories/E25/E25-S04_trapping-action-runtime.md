# E25-S04 — Trapping Action Runtime

## Epic

E25 — Object Interaction and Content Routing

## Dependency chain

- Depends on: E25-S03
- Blocks: E25-S05

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 11)
- docs/content/action-wiring-audit.md (action IDs: `tan`, `dye`, `fire`, `weave`, `mix`)
- POC_SPEC.md §9 (Skilling & Objects)

## Objective

Implement trapping action runtime: `tan`, `dye`, `fire`, `weave`, `mix` actions. These are not standard skilling actions and need custom handlers.

## Implementation checklist

- [X] Write a failing test for trapping in `apps/server/src/systems/__tests__/trapping.test.ts`.
- [X] Create `trapping-system.ts` in `apps/server/src/systems/`.
- [X] Implement `tan`: convert hide to leather using tanning rack.
- [X] Implement `dye`: apply dye to cloth using dye vat.
- [X] Implement `fire`: set trap using fire trap component.
- [X] Implement `weave`: weave cloth using loom.
- [X] Implement `mix`: mix reagents using mixing station.
- [X] Each action validates tools, materials, and awards relevant XP.
- [X] Write a passing test for `tan`.
- [X] Write a passing test for `dye`.
- [X] Write a passing test for `fire`.
- [X] Write a passing test for `weave`.
- [X] Write a passing test for `mix`.

## Acceptance criteria

- [X] All trapping actions (`tan`, `dye`, `fire`, `weave`, `mix`) are implemented.
- [X] Each action validates tools and materials.
- [X] Relevant XP is awarded.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
