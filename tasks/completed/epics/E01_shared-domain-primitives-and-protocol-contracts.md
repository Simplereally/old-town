# E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E00
- Unlocks: E02

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Epic goal

Create the shared type system that prevents drift between server truth and client presentation: integer coordinates, ticks, IDs, directions, commands, update masks, deltas, and validation schemas.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E01/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E01-S01` — [Define integer world primitives](../completed/stories/E01/E01-S01_define-integer-world-primitives.md)
- [X] `E01-S02` — [Define constants and deterministic math utilities](../completed/stories/E01/E01-S02_define-constants-and-deterministic-math-utilities.md)
- [X] `E01-S03` — [Define client-to-server command contracts](../completed/stories/E01/E01-S03_define-client-to-server-command-contracts.md)
- [X] `E01-S04` — [Define server-to-client delta protocol](../completed/stories/E01/E01-S04_define-server-to-client-delta-protocol.md)
- [X] `E01-S05` — [Define entity update masks](../completed/stories/E01/E01-S05_define-entity-update-masks.md)
- [X] `E01-S06` — [Define content ID and asset reference conventions](../completed/stories/E01/E01-S06_define-content-id-and-asset-reference-conventions.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
