# E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E04
- Unlocks: E06

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Epic goal

Connect browsers to the authoritative world using intent commands and tick deltas, with session bootstrap, scene interest filtering, multi-player visibility, chat transport, and reconnect-safe state snapshots.

## Completion checklist

- [X] Read `POC_SPEC.md` sections referenced above.
- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E05/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E05-S01` — [Create WebSocket transport shell](../completed/stories/E05/E05-S01_create-websocket-transport-shell.md)
- [X] `E05-S02` — [Implement dev character session bootstrap](../completed/stories/E05/E05-S02_implement-dev-character-session-bootstrap.md)
- [X] `E05-S03` — [Implement interest manager](../completed/stories/E05/E05-S03_implement-interest-manager.md)
- [X] `E05-S04` — [Wire command transport into simulation command buffer](../completed/stories/E05/E05-S04_wire-command-transport-into-simulation-command-buffer.md)
- [X] `E05-S05` — [Broadcast tick deltas to clients](../completed/stories/E05/E05-S05_broadcast-tick-deltas-to-clients.md)
- [X] `E05-S06` — [Implement chat transport and overhead text packets](../completed/stories/E05/E05-S06_implement-chat-transport-and-overhead-text-packets.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
