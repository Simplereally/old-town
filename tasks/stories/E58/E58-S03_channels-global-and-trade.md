# E58-S03 — Channels: global and trade, with moderation reuse

## Epic

E58 — Social Fabric

## Dependency chain

- Depends on: E58-S02
- Blocks: E58-S04

## Objective

Two world-wide channels — `global` and `trade` — as a thin routing layer over the existing
chat machinery, with per-channel rate limits and ignore enforcement.

## Implementation guidance

- Extend the chat intent with an optional `channel: "local"|"global"|"trade"` (default
  `"local"` — wire-compatible with old clients; verify how the current chat intent is shaped
  first). Local chat keeps its proximity semantics (whatever `ChatSystem`/overhead does today
  — read it; likely radius-filtered via interest); channels broadcast to ALL sessions minus
  ignorers of the sender.
- Per-channel rate buckets in `ChatSystem` (global: 1 per 5 ticks; trade: 1 per 10 ticks;
  local unchanged) — same `ChatRateLimiter` class, one instance per channel.
- S2C chat packet grows a `channel` field (registered, defaulted for compatibility). Overhead
  bubbles (`ChatOverheadLayer`) render ONLY local — channels are chat-box-only.
- Broadcast fan-out cost: message → N sessions is fine at current scale, but build it as one
  shared payload object reused per recipient (no per-recipient serialization — the transport
  serializes once if possible; check `DeltaTransport.send`'s shape and note what's feasible,
  full fix belongs to E61).
- Server announce: a `system` sender variant on the global channel (used by E60 admin announce
  and E63 world events — define the packet shape now, one consumer lands later).

## Required work

- [ ] Intent/packet channel field + routing + per-channel limits + ignore filtering + system
      announce variant; tests for each (rate buckets independent — flooding trade doesn't
      throttle local).
- [ ] Profanity filter applies to all channels (already in ChatSystem — assert with tests).

## Acceptance criteria

- [ ] Three sessions: global message reaches all; trade message reaches all; ignorer receives
      neither from the ignored; local unchanged.
- [ ] Old-shape chat intents (no channel field) still parse as local.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
