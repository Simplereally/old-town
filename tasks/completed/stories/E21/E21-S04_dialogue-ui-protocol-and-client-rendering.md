# E21-S04 — Dialogue UI Protocol and Client Rendering

## Epic

E21 — NPC Dialogue and Quest Engine

## Dependency chain

- Depends on: E21-S03
- Blocks: (none)

## Spec references

- docs/content/runtime-gap-list.md (P0 gap 1)
- docs/content/action-wiring-audit.md
- POC_SPEC.md §12 (Dialogue & Quests)
- POC_SPEC.md §14 (UI & HUD)

## Objective

Implement the dialogue UI protocol and client rendering. Send dialogue packets from server to client and render dialogue boxes, options, and NPC name in the client UI.

## Implementation checklist

- [X] Define dialogue protocol packets in `packages/shared/src/protocol/`:
  - `DialogueOpen` (npcId, npcName, text, options)
  - `DialogueOption` (optionIndex, optionText)
  - `DialogueClose`
- [X] Write a failing test for dialogue packet serialization.
- [X] Implement dialogue packet handlers in `ClientPacketApplier.ts`.
- [X] Create client dialogue UI component that renders text and clickable options.
- [X] Wire dialogue option selection back to server as a command.
- [X] Write a passing test for dialogue packet roundtrip.
- [X] Write a passing test for dialogue UI rendering.
- [X] Write a passing test for dialogue option selection command.
- [X] Write a passing test for dialogue close on end node.

## Acceptance criteria

- [X] Dialogue packets are defined and serialized correctly.
- [X] Client renders dialogue text, NPC name, and options.
- [X] Option selection sends a command back to the server.
- [X] Dialogue closes correctly on end node or player action.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E21/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
