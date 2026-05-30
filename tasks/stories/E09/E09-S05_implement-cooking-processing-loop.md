# E09-S05 — Implement cooking processing loop

## Epic

E09 — Skilling and Resource Node Loops

## Dependency chain

- Depends on: E09-S04
- Blocks: next story in `E09` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §15
- POC_SPEC.md §27
- POC_SPEC.md §28

## Objective

Implement a simple object-driven processing skill action for cooking food at a range/oven.

## Implementation checklist

- [ ] Route Cook/Use item-on-object command to processing action.
- [ ] Validate raw item, object type, cooking level, and inventory.
- [ ] Consume input item and produce cooked or burnt output according to content rules.
- [ ] Award cooking XP on success.
- [ ] Support repeated processing until input missing or inventory invalid.
- [ ] Add tests for success, burn/failure, missing input, wrong station.

## Acceptance criteria

- [ ] Processing uses the same tick/action queue architecture.
- [ ] Quest oven can reuse the processing/object hook later.
- [ ] Inventory deltas are correct for input/output.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E09/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
