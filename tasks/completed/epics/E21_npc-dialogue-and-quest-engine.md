# E21 — NPC Dialogue and Quest Engine

## Dependency chain

- Depends on: E12, E20
- Unlocks: E26

## Spec references

- docs/content/runtime-gap-list.md (P0 gaps 1–2)
- docs/content/action-wiring-audit.md (action IDs: `talk`, `read`, `quest`)
- POC_SPEC.md §12 (Dialogue & Quests)

## Epic goal

Implement the runtime NPC dialogue engine and quest objective tracker so players can start, progress, and complete quests. This epic closes the gap where NPCs have dialogue JSON but no runtime routing, and quests have schema definitions but no state machine.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E21/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E21-S01` — [NPC Dialogue Runtime Routing](../stories/E21/E21-S01_npc-dialogue-runtime-routing.md)
- [X] `E21-S02` — [Quest State Machine and Progress Tracking](../stories/E21/E21-S02_quest-state-machine-and-progress-tracking.md)
- [X] `E21-S03` — [Quest Completion and Reward Application](../stories/E21/E21-S03_quest-completion-and-reward-application.md)
- [X] `E21-S04` — [Dialogue UI Protocol and Client Rendering](../stories/E21/E21-S04_dialogue-ui-protocol-and-client-rendering.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
