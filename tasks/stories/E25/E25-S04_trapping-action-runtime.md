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

- [ ] Write a failing test for trapping in `apps/server/src/systems/__tests__/trapping.test.ts`.
- [ ] Create `trapping-system.ts` in `apps/server/src/systems/`.
- [ ] Implement `tan`: convert hide to leather using tanning rack.
- [ ] Implement `dye`: apply dye to cloth using dye vat.
- [ ] Implement `fire`: set trap using fire trap component.
- [ ] Implement `weave`: weave cloth using loom.
- [ ] Implement `mix`: mix reagents using mixing station.
- [ ] Each action validates tools, materials, and awards relevant XP.
- [ ] Write a passing test for `tan`.
- [ ] Write a passing test for `dye`.
- [ ] Write a passing test for `fire`.
- [ ] Write a passing test for `weave`.
- [ ] Write a passing test for `mix`.

## Acceptance criteria

- [ ] All trapping actions (`tan`, `dye`, `fire`, `weave`, `mix`) are implemented.
- [ ] Each action validates tools and materials.
- [ ] Relevant XP is awarded.
- [ ] All tests pass.
- [ ] `bun run typecheck` passes.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E25/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
