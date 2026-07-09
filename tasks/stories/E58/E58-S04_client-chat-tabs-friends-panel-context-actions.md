# E58-S04 — Client: chat tabs, friends panel, and social context-menu actions

## Epic

E58 — Social Fabric

## Dependency chain

- Depends on: E58-S03
- Blocks: none (last story)

## Objective

The client surface: tabbed chat, a friends/ignore panel with live presence, and player
context-menu integration.

## Implementation guidance

- **Chat tabs**: All / Local / Global / Trade / Private filters over one message store in
  `UIState` (messages tagged by channel/PM). Match the existing chat UI structure in UIManager
  — extend, don't rebuild. Unread badge per tab; PM tab flashes on receipt. PM reply
  ergonomics: clicking a PM line prefills `/msg <name> `; support `/msg` and `/r` (reply-to-
  last) as chat-input commands parsed client-side into `SocialIntent`s.
- **Friends panel**: a new side panel listing friends (green dot online, grey offline — pull
  the visual language from existing panels), add-by-name input, remove buttons; ignore list
  section below. Renders purely from `SocialStatePacket` + `PresencePacket` accumulation in
  UIState.
- **Context menu**: right-click player → `Message`, `Add Friend`/`Remove Friend`, `Ignore`,
  and (E57) `Trade with` — extend the same option-assembly point E57-S03 used.
- **Overhead**: unchanged (local only).

## Required work

- [ ] Tabs + store + badges + slash commands, with jsdom tests (message routing to tabs,
      unread counts, /r target tracking).
- [ ] Friends panel + presence rendering + add/remove/ignore flows + tests.
- [ ] Context-menu options + dispatch tests.
- [ ] Manual two-browser QA: full social loop (friend, presence flip, PM, ignore, global chat,
      trade channel) — record in story note.

## Acceptance criteria

- [ ] Every social action reachable in ≤ 2 clicks from the game view; chat tabs never lose
      messages (All shows everything).
- [ ] Client holds zero social truth — panels render only packet state (review criterion).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
