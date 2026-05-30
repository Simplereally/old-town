# E05-S02 — Implement dev character session bootstrap

## Epic

E05 — Networking Transport, Sessions, Interest Management, and Multiplayer Sync

## Dependency chain

- Depends on: E05-S01
- Blocks: next story in `E05` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §6
- POC_SPEC.md §8
- POC_SPEC.md §20
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Create temporary accountless dev sessions that spawn controllable player entities for POC play.

## Implementation checklist

- [ ] Assign each connection a dev character ID.
- [ ] Spawn player in seed region with inventory/skills/equipment defaults.
- [ ] Send FullStatePacket on connect.
- [ ] Destroy or persist dev entity according to config on disconnect.
- [ ] Add tests for two independent sessions.

## Acceptance criteria

- [ ] Two browser tabs create two visible player entities.
- [ ] FullState includes local player ID, tick, world constants, visible region chunks, and entities.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run server:dev`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E05/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
