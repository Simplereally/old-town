# E58-S01 — Social protocol, storage, and the relationship service

## Epic

E58 — Social Fabric

## Dependency chain

- Depends on: none (E51 soft — see epic note)
- Blocks: E58-S02

## Objective

One authoritative module for social edges (friends/ignores), their persistence, and the C2S/S2C
contract — before any feature consumes it.

## Implementation guidance

- **Shared protocol**: `SocialIntent` union — `{kind:"add_friend"|"remove_friend"|
  "add_ignore"|"remove_ignore", name}` and `{kind:"private_message", name, text}` (PM intent
  defined here, consumed in S02); S2C `SocialStatePacket` (full friends+ignores with online
  flags — sent on login and on edge changes) and `PresencePacket` (`{name, online}` deltas).
  Mirror existing intent/packet registration; E48 wire validation for S2C.
- **Storage**: extend the character snapshot with `social: {friends: string[], ignores:
  string[]}` storing characterIds (NOT names). Bump `CHARACTER_SNAPSHOT_VERSION`; if E62's
  migration chain exists add hop vN→vN+1 defaulting `social` to empty; otherwise follow the
  repo's current manual-bump practice and note it. Cap: 200 friends, 100 ignores (validate).
- **`SocialGraph` service** (`apps/server/src/social/social-graph.ts`): in-memory projection
  built at session bootstrap from snapshots, mutated by intents, marked dirty through the
  existing delta→save-queue observer path (study how other component mutations reach
  `createPersistenceDirtyObserver`, `simulation-kernel.ts:240–249` — social must ride the same
  train, not invent a parallel save path). API: `isIgnoring(a,b)`, `friendsOf(id)`,
  `addFriend/removeFriend/addIgnore/removeIgnore` with validation (name resolution via the
  session manager's name↔characterId mapping — find where display names live; likely the
  appearance/name component + dev-session).
- **Name resolution rule**: adding a friend who is OFFLINE must work (OSRS does). That requires
  a name→characterId lookup beyond live sessions — check what the persistence adapter can
  enumerate; if nothing exists, add `findCharacterIdByName` to the adapter interface (all four
  kinds; postgres gets an index) — this is the story's main engineering decision, document it.

## Required work

- [ ] Protocol + schemas + registration + tests.
- [ ] Snapshot field + version bump + (migration hop | manual-bump note) + round-trip tests.
- [ ] `SocialGraph` + adapter lookup + dirty-save wiring + unit tests (add/remove/cap/dup/
      unknown-name/self-add all covered; ignore is one-directional; friend is one-directional
      — no consent handshake, OSRS-style).

## Acceptance criteria

- [ ] Edges persist across reconnect; ignoring is queryable in O(1) from any system.
- [ ] Zero name-string storage in snapshots (ids only), display names resolved at packet-build
      time.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
