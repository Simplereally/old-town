# E47-S05 — Atmosphere validation and performance pass

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S02 (UI and Action Sounds), E47-S03 (Lighting and Shadows), E47-S04 (Hitsplats, XP Drops, Selection Rings)
- Blocks: none

## Spec references

- `POC_SPEC.md` §7.1 (Visual style)
- `POC_SPEC.md` §7.3 (Renderer rules — performance budgets)
- `POC_SPEC.md` §31-S04 (Performance Budgets and Diagnostics Contract)
- `POC_SPEC.md` §35-S06 (Heap and Draw-Call Gate)

## Objective

Run a final atmosphere validation and performance pass. Ensure all audio, lighting, and feedback systems work together, do not leak, and stay within the render budget. This is the final story of the starter-town experience.

## Required architectural decisions

- **Performance budget:**
  - Terrain: < 50 draw calls
  - Objects: < 200 draw calls
  - Actors: < 50 draw calls
  - UI: < 20 draw calls
  - Total: < 320 draw calls
  - Audio sources: < 16 active sources
- **Memory leak checks:** Region crossing must dispose old terrain, object, and actor meshes/pools. Audio sources must stop when crossing districts.
- **Validation tests:** Add automated tests that assert the draw-call budget after loading the starter region, after spawning 10 actors, and after a region crossing.
- **Visual regression:** Add a screenshot test for the Market Bell view.
- **Manual pass:** Walk the entire starter region, enter every district, open every UI panel, complete a combat, gather a resource, and verify no errors.

## Implementation checklist

- [ ] Add a draw-call counter to the renderer metrics HUD.
- [ ] Add automated tests for draw-call and audio source budgets.
- [ ] Add a region crossing test that asserts old resources are disposed.
- [ ] Add a visual regression screenshot for the Market Bell spawn.
- [ ] Run a manual atmosphere pass in `bun run dev`.
- [ ] Fix any audio leaks, shadow issues, or UI z-fighting.
- [ ] Update the E47 epic checklist and move all stories to completed.
- [ ] Write a short summary of the starter-town experience in the epic file.

## Acceptance criteria

- [ ] The renderer stays within the defined draw-call budget.
- [ ] Audio sources do not leak or accumulate on region changes.
- [ ] Visual regression screenshot passes for the Market Bell view.
- [ ] Manual atmosphere pass finds no critical issues.
- [ ] All E47 stories and the epic are moved to completed.
- [ ] The starter-town experience is playable and feels like an OSRS-style MMO.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — full manual atmosphere pass

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.
