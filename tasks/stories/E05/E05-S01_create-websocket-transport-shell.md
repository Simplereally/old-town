# E05-S01 — Create WebSocket transport shell

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E04-S05
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Expose a server WebSocket endpoint and client connection module without adding gameplay authority to the client.

## Implementation checklist

- [ ] Add server WebSocket route.
- [ ] Define connection lifecycle: open, authenticate-dev, full-state bootstrap, command receive, close.
- [ ] Add client GameSocket module.
- [ ] Implement ping/pong and protocol-version check.
- [ ] Add smoke tests or integration harness for connection open/close.

## Acceptance criteria

- [ ] Client can connect to server and receive protocol version.
- [ ] Server rejects incompatible protocol version.
- [ ] No gameplay command bypasses shared validation.

## Validation commands

- [ ] `bun run test`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
