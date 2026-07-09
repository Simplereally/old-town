# E58 — Social Fabric: Friends, Private Messages, Channels, Presence

## Dependency chain

- Depends on: E51 (accounts) — friends/ignore SHOULD bind to accounts; if E51 hasn't landed,
  bind to characterId with a compatibility note (E51's account layer maps characters 1:1 at
  first, so the migration is a rename). E62 soft (adds snapshot fields → one migration hop).
- Unlocks: retention. An MMO without "my friend is online" is a single-player game with lag.

## Spec references

- `apps/server/src/systems/chat-system.ts` — ChatSystem with rate limiter
  (`DEFAULT_RATE_LIMIT_TICKS`), profanity filter, max length; local chat only today
- `apps/server/src/net/dev-session.ts` — session ↔ characterId mapping;
  `simulation-kernel.ts` `connectSession`/`disconnectSession` (lines 658–738) — the presence
  signal source
- `packages/shared/src/persistence/character-snapshot.ts` — where friends/ignore persist
  (schema change → CHARACTER_SNAPSHOT_VERSION bump → E62 migration if landed, else the
  documented manual bump)
- `apps/client/src/game/ui/UIManager.ts` chat UI + `ChatOverheadLayer` — client rendering
- E48 S2C wire validation — register every new packet

## Epic goal

The minimum lovable social layer, OSRS-shaped: a friends list with live online status, an
ignore list enforced server-side across every social surface (chat, PMs, trade requests),
private messaging with proper "From/To" formatting, one global channel and one trade channel
with independent rate limits, and player presence events. All server-authoritative; the client
renders packets.

## Scope guardrails

- No clans/friend-chat-channels-as-chatrooms, no offline messages, no cross-world anything
  (single world). Keep the surface OSRS-2006 sized.
- Names: players are addressed by display name; resolve collisions by binding social edges to
  characterId (or accountId post-E51) under the hood — never by raw name matching in storage.

## Ordered stories

- [ ] `E58-S01` — [Social protocol, storage, and the relationship service](../stories/E58/E58-S01_social-protocol-storage-relationship-service.md)
- [ ] `E58-S02` — [Presence and private messages](../stories/E58/E58-S02_presence-and-private-messages.md)
- [ ] `E58-S03` — [Channels: global and trade, with moderation reuse](../stories/E58/E58-S03_channels-global-and-trade.md)
- [ ] `E58-S04` — [Client: chat tabs, friends panel, and social context-menu actions](../stories/E58/E58-S04_client-chat-tabs-friends-panel-context-actions.md)

## Epic acceptance criteria

- [ ] Add friend → see them online now and on future logins; ignore → their chat/PMs/trade
      requests cease to exist for you, enforced server-side.
- [ ] PMs deliver instantly with correct From/To rendering and honor ignore + rate limits.
- [ ] Global + trade channels work with per-channel rate limits; profanity filter applies
      everywhere; channel spam cannot crowd out local chat (independent limits).
- [ ] All social state survives logout/login (snapshot round-trip) and lives in ONE service
      module the rest of the server queries (no scattered friend checks).
