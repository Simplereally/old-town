# E03-S06 — Implement delta accumulator shell

## Epic

E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E03-S05
- Blocks: next story in `E03` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Objective

Track entity changes during simulation phases and emit structured tick deltas for networking later.

## Implementation checklist

- [ ] Create DirtyState/DeltaAccumulator service.
- [ ] Track entity add/remove/update masks.
- [ ] Track inventory, skill, varbit, chat, hitsplat, XP, interface deltas.
- [ ] Reset accumulator only after deltas are consumed.
- [ ] Add tests for mask coalescing and add/remove precedence.

## Acceptance criteria

- [ ] Systems can mark authoritative changes without knowing network transport.
- [ ] Delta output uses shared protocol contracts.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E03/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
