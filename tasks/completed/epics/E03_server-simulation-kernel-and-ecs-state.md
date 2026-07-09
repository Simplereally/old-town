# E03 — Server Simulation Kernel and ECS State

## Dependency chain

- Depends on: E02
- Unlocks: E04

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §8
- POC_SPEC.md §9
- POC_SPEC.md §10
- POC_SPEC.md §25

## Epic goal

Create the authoritative 600ms simulation loop, command buffer, entity/component state model, deterministic system phase order, action queue, and delta-production foundation.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E03/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E03-S01` — [Implement server process and runtime config](../stories/E03/E03-S01_implement-server-process-and-runtime-config.md)
- [X] `E03-S02` — [Implement ECS world state container](../stories/E03/E03-S02_implement-ecs-world-state-container.md)
- [X] `E03-S03` — [Implement 600ms tick loop and phase scheduler](../stories/E03/E03-S03_implement-600ms-tick-loop-and-phase-scheduler.md)
- [X] `E03-S04` — [Implement command buffer and validation pipeline](../stories/E03/E03-S04_implement-command-buffer-and-validation-pipeline.md)
- [X] `E03-S05` — [Implement action queue system](../stories/E03/E03-S05_implement-action-queue-system.md)
- [X] `E03-S06` — [Implement delta accumulator shell](../stories/E03/E03-S06_implement-delta-accumulator-shell.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
