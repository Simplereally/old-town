# E59-S04 — Balance pass, content audit, and integration suite

## Epic

E59 — Run Energy, Item Weight, and the Stamina Economy

## Dependency chain

- Depends on: E59-S03
- Blocks: none (last story)

## Objective

Make the numbers feel right, make every item's weight sane, and pin the whole economy with an
integration suite.

## Required work

- [ ] **Weight audit**: sweep ALL item content JSON — every item gets an explicit weight
      (armour heavy, vials light, coins zero; use OSRS values as the reference table). Add a
      content-validation rule: new items MUST declare weight (schema: make it required, or a
      validator warning — decide based on how strict `content:validate` can be without
      breaking third-party content; document).
- [ ] **Balance table**: `docs/design/run-energy-balance.md` — chosen constants, the
      resulting feel in concrete terms (tiles-per-full-bar at 0/half/max weight, seconds to
      full regen), and the tuning levers. Assert the table's headline numbers in a test so
      the doc cannot drift from the constants.
- [ ] **Integration suite**: scripted session covering toggle → drain → potion → stamina buff
      → forced walk → regen; multi-entity check that NPCs are untouched (NPCs have no energy —
      assert the component never appears on them).
- [ ] **Golden replay**: if E56 landed, extend or add a golden covering a run/walk/potion
      sequence; else marked TODO in the E56 golden story.
- [ ] Manual QA in `bun run dev` recorded in the story note (feel check: does running matter
      now?).

## Acceptance criteria

- [ ] No item without a weight; validation enforces it for future content.
- [ ] Balance doc + pinning test agree; suite green.

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
