# E58-S02 — Presence and private messages

## Epic

E58 — Social Fabric

## Dependency chain

- Depends on: E58-S01
- Blocks: E58-S03

## Objective

Friends see each other come and go in real time; PMs deliver with ignore/rate/profanity
enforcement.

## Implementation guidance

- **Presence**: on `connectSession` success / `disconnectSession`, the kernel notifies the
  SocialGraph, which emits `PresencePacket`s to every ONLINE friend of the changing character
  (reverse index: who-has-friended-me — build it in the graph; it's the expensive direction,
  keep it incremental not recomputed). Deliver as targeted packets through the same per-entity
  delta targeting used by trade/dialogue state (find the mechanism once in E57-S02; reuse).
  Login also delivers the full `SocialStatePacket` with current online flags.
- **PMs**: route `private_message` intents through a new handler in the chat system (extend
  `ChatSystem` rather than a new system — profanity filter and per-entity rate limiting live
  there already; add an independent PM rate bucket, stricter than local: e.g. 1 per 2 ticks).
  Enforcement order: rate → target resolution (online?) → ignore check (target ignoring
  sender → silently succeed to the sender but drop, the OSRS behavior — do NOT leak ignore
  status) → profanity → deliver `{from, text}` to target + `{to, text}` echo to sender.
  Offline target → "That player is offline." system line to sender.
- **Determinism note**: presence events originate outside ticks (connect is async). Packets to
  friends must be enqueued into the delta stream, not sent inline from the async path — verify
  the targeting mechanism defers to the next SnapshotDeltaBuild; if connectSession currently
  touches deltas directly (`deltas.markEntityAdd`, `simulation-kernel.ts:698`) presence may
  ride the same precedent. Match it and note the choice (E56 journals connects, so replay
  stays coherent either way).

## Required work

- [ ] Reverse-friend index + presence fan-out + login snapshot delivery.
- [ ] PM pipeline in ChatSystem with the exact enforcement order above; tests for each layer
      (incl. the no-leak ignore semantics: sender sees normal echo).
- [ ] Integration test: A friends B; B logs in → A gets online presence; B PMs A; A ignores B;
      next PM drops silently; B logs out → A gets offline presence.

## Acceptance criteria

- [ ] Presence latency ≤ 1 tick from connect/disconnect; no fan-out to offline players.
- [ ] Ignore never observable to the ignored party.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
