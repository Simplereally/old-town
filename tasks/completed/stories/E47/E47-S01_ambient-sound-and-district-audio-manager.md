# E47-S01 — Ambient sound and district audio manager

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S00 (Audio Content Pipeline), E42-S03 (District Material Painting), E43-S06 (Starter Region Topology)
- Blocks: E47-S02, E47-S03, E47-S05

## Spec references

- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `POC_SPEC.md` §7.1 (Visual style — readable, restrained)
- `docs/world/districts-and-routes.md` — district identity
- `content/maps/old-town-0-0-0.json` and neighbouring starter-region maps — source trigger/zone data
- `packages/shared/src/protocol/packets.ts` — region-load tile payloads
- `apps/server/src/world/runtime-region.ts` — runtime tile/trigger data
- `apps/server/src/net/region-payload.ts` — server-to-client region chunk serialization
- `apps/client/src/game/net/ClientPacketApplier.ts` — region packet application
- `apps/client/src/game/ui/UIManager.ts` — existing settings panel and persisted UI settings pattern

## Objective

Add ambient audio that changes with the player's current district or zone. This story must first give the client a real district-data path; the client cannot currently infer district ambience from map triggers because trigger/zone identity is not exposed in region packets.

## What already exists — verify, do not rebuild

- Starter maps contain trigger/zone-like areas such as Market Bell, Foundry Row, River Stoop, and Shrine Hearth.
- Server runtime tiles already carry zone identity after trigger-zone application.
- Region tile payloads currently serialize terrain/collision/material data, not zone IDs or raw triggers.
- `ContentClient` does not expose raw map files/triggers to the client.
- The client already has UI settings patterns through `UIManager`; reuse that area for audio controls.
- E47-S00 must expose audio definitions before this story adds ambience content.

## Required architectural decisions

- **Authoritative zone source:** Prefer adding optional `zoneId` to region tile data and filling it from server runtime tiles. Do not make the client parse raw map JSON unless a clear reason is documented.
- **Tile lookup:** The client must map the local player's tile to the loaded region/chunk tile and read its zone identity.
- **Ambience mapping:** Audio content maps district/zone IDs to ambience loop IDs, volume, fade timing, and optional fallback behaviour.
- **Cross-fade:** Changing zones fades old ambience out and new ambience in over a short configurable duration.
- **Positional sources:** Forges, Market Bell, river/water sources, and similar static sources are content-defined with tile coordinates and simple distance falloff.
- **Single manager:** One client `AudioManager` owns ambience, positional sources, UI/action one-shots, mute state, volume state, and disposal.
- **UI controls:** Add master mute, master volume, and ambient volume to the existing settings UI. Persist them with the existing settings/localStorage pattern.
- **Presentation only:** Ambience must not affect collision, quests, combat, skilling, NPC behaviour, or server simulation.

## Implementation checklist

- [X] Extend shared region tile data with optional `zoneId` or an equivalent compact district/zone field.
- [X] Populate that field in the server region payload from runtime tile zone data.
- [X] Update client region/chunk application so loaded tiles retain `zoneId`.
- [X] Add a client utility/service that resolves the local player's current tile to the current zone ID.
- [X] Add ambience and positional-source audio definitions using the E47-S00 audio registry.
- [X] Implement `AudioManager` ambience loop playback with cross-fade and disposal.
- [X] Implement simple positional source gain/falloff based on player tile distance.
- [X] Add master mute, master volume, and ambient volume controls to the existing settings UI.
- [X] Persist audio settings through the existing settings storage pattern.
- [X] Write test: loaded region tile with `zoneId` can be resolved from player tile position.
- [X] Write test: entering a zone starts the configured ambience loop.
- [X] Write test: leaving a zone fades/stops the previous ambience.
- [X] Write test: positional source gain changes with distance.
- [X] Write test: `AudioManager.dispose()` stops loops/sources and releases resources.

## Acceptance criteria

- [X] The client can determine current zone/district from loaded region data without reading raw map files.
- [X] Each starter-town district has an ambience mapping or explicit fallback.
- [X] Ambience cross-fades smoothly on zone change.
- [X] Positional sources are audible near their objects and quiet/faded when far away.
- [X] Master mute/volume and ambient volume work and persist.
- [X] Audio resources do not leak on district changes, region changes, or client shutdown.
- [X] All audio assets are original/generated/licensed; no OSRS/Jagex audio.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — walk between starter-town districts and verify ambience transitions

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
