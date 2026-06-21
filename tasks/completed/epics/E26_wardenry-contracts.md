# E26 — Wardenry Contracts

## Dependency chain

- Depends on: E20, E21
- Unlocks: E30

## Spec references

- docs/content/runtime-gap-list.md (P1 gap 9)
- docs/content/action-wiring-audit.md (action IDs: `read`, `accept` on Warden board)
- docs/wardenry/contract-system.md

## Epic goal

Implement the Wardenry contract runtime: contract acceptance, objective tracking, and reward distribution. This epic closes the gap where the Warden board has a `read` option but no contract schema or runtime state machine exists.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E26/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E26-S01` — [Contract Runtime State Machine](completed/stories/E26/E26-S01_contract-runtime-state-machine.md)
- [X] `E26-S02` — [Contract Objective Tracking and Completion](completed/stories/E26/E26-S02_contract-objective-tracking-and-completion.md)
- [X] `E26-S03` — [Contract Reward Distribution](completed/stories/E26/E26-S03_contract-reward-distribution.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [ ] No later epic has been implemented in a way that bypasses this epic's contracts.
