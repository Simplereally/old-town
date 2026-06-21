# E12-S01 — Implement player var and quest var storage

## Epic

E12 — Dialogue, Quest Vars, Quest Engine, and POC Quest

## Dependency chain

- Depends on: E11-S04
- Blocks: next story in `E12` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §10
- POC_SPEC.md §12
- POC_SPEC.md §18
- POC_SPEC.md §22
- POC_SPEC.md §27

## Objective

Create authoritative player variable storage with typed get/set, delta emission, and quest-stage helpers.

## Implementation checklist

- [X] Create VarComponent for number/boolean/string vars.
- [X] Implement getVar, setVar, incrementVar, compare requirements.
- [X] Emit VarbitDelta/VarDelta to client.
- [X] Add quest stage convenience helpers.
- [X] Add tests for typed values, missing defaults, requirement checks, and deltas.

## Acceptance criteria

- [X] Quest state is data-driven vars, not bespoke fields.
- [X] Vars can be persisted by later persistence epic.
- [X] Client reads quest UI state from deltas.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E12/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
