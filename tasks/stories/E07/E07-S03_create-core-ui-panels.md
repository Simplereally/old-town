# E07-S03 — Create core UI panels

## Epic

E07 — Client Input, Picking, UI Shell, and Debug Tooling

## Dependency chain

- Depends on: E07-S02
- Blocks: next story in `E07` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §7
- POC_SPEC.md §8
- POC_SPEC.md §11
- POC_SPEC.md §12
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Build the first inventory, equipment, skills, spellbook, quest journal, and chat panels against protocol state.

## Implementation checklist

- [ ] Create layout shell around canvas.
- [ ] Render inventory slots from authoritative inventory state.
- [ ] Render equipment slots from authoritative equipment state.
- [ ] Render skills and XP from skill state.
- [ ] Render spellbook from content and player state.
- [ ] Render quest journal from quest vars.
- [ ] Render chat box from chat packets.

## Acceptance criteria

- [ ] UI never invents inventory/skill/quest state.
- [ ] Panels update when matching deltas arrive.
- [ ] No panel requires server reload to reflect state changes.

## Validation commands

- [ ] `bun run client:dev`
- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E07/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
