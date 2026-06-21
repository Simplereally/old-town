# E01-S03 — Define client-to-server command contracts

## Epic

E01 — Shared Domain Primitives and Protocol Contracts

## Dependency chain

- Depends on: E01-S02
- Blocks: next story in `E01` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §3
- POC_SPEC.md §4
- POC_SPEC.md §5
- POC_SPEC.md §8

## Objective

Create typed intent commands for movement, NPC interaction, object interaction, item action, spell cast, chat, UI action, and ping.

## Implementation checklist

- [X] Define command envelope with commandId, clientTickHint, and payload.
- [X] Define MoveIntent, ObjectIntent, NpcIntent, ItemIntent, SpellIntent, ChatIntent, UiActionIntent, PingIntent.
- [X] Add runtime validation schemas for every command.
- [X] Enforce that commands express intent only and never authoritative state mutation.
- [X] Add malformed-command tests.

## Acceptance criteria

- [X] A client command cannot directly set position, inventory, XP, HP, quest vars, or item spawns.
- [X] Schemas reject unknown command types and invalid tile/ID shapes.

## Validation commands

- [X] `bun run test`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E01/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
