# E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E46 (Smoke Over Old Town Quest), E45 (Core Gameplay Loop), E42 (Terrain and District Identity), E43 (Buildings, Collision, and World Topology)
- Unlocks: future polish and world-expansion epics

## Spec references

- `POC_SPEC.md` §7.1 (Visual style — low-poly, hand-painted, readable)
- `POC_SPEC.md` §7.3 (Renderer rules — cheap shadows, blob shadows first, outlines/selection rings)
- `POC_SPEC.md` §8.2 (Update masks — hitsplats/graphics)
- `POC_SPEC.md` §8.3 (Delta packet — hitsplats, skill deltas, sounds)
- `POC_SPEC.md` §22 (UI system — XP drops, hitsplats, chat, right-click menu)
- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `docs/world/districts-and-routes.md` — district identity for audio themes
- `content/maps/old-town-0-0-0.json` and neighbouring starter-region maps — runtime trigger/zone source data

## Repo-grounded context

E47 is a polish epic, but it must be implemented against the code that already exists. Do **not** rebuild working systems just because a previous story title sounds like first implementation.

What already exists and must be verified/reused:

- `apps/client/src/game/scene/HitsplatLayer.ts` exists and is already wired through `ClientPacketApplier` and `GameEngine`.
- `apps/client/src/game/scene/XpDropLayer.ts` exists and is already wired through XP presentation events.
- `apps/client/src/game/scene/ClickMarkerLayer.ts` exists and is already used for immediate tile-click feedback.
- `apps/client/src/game/scene/HoverHighlighter.ts` exists for hover-only white rings; the missing piece is a persistent selected/target ring.
- `apps/client/src/game/renderer/ThreeRenderer.ts` already creates a `HemisphereLight`, a warm `DirectionalLight`, and scene fog; E47-S03 must refactor/control these, not add duplicate lights blindly.
- `packages/shared/src/protocol/packets.ts` already defines `SoundPacket`, and the server already emits sound packets for some object interactions. The client currently receives but does not play them.
- The content validator currently rejects unknown top-level content directories. `content/audio/` is not valid until E47-S00 adds audio as a first-class content kind.
- Starter-region maps contain trigger/zone information server-side, but region packets currently do not expose zone identity to the client.

## Epic goal

Make Old Town feel alive without breaking the simple OSRS-like primitives: 600 ms server-authoritative ticks, integer-tile gameplay truth, restrained low-poly visuals, and immediate client-side feedback where safe.

The forge should sound like a forge, the market should murmur, the river should read as water, and combat/skilling/UI should have subtle original feedback. The client should use existing server packets and content registries rather than inventing parallel data paths.

## Approach summary

1. **Audio content pipeline first.** Add `audio` as a first-class content kind before creating `content/audio/*.json`; otherwise `bun run content:validate` will fail.
2. **District/zone data path.** Expose authoritative zone identity to the client, preferably as optional `zoneId` on region tile data rather than making the client parse raw map files.
3. **Ambient audio manager.** Add an `AudioManager` that consumes audio content, player tile/zone state, and positional source definitions for cross-faded ambience.
4. **Server sound packet playback.** Wire existing `SoundPacket` data through `ClientPacketApplier` into a `sounds.play` presentation event and then into `AudioManager`.
5. **Client-local UI sounds.** UI clicks/menu/select/error sounds may play immediately on input, but economy/gameplay action sounds must be driven by authoritative packets/events or authoritative animation updates.
6. **Atmosphere controller.** Reuse existing lights/fog and add a controller for sky/clear color, fog color, hemisphere light, directional light, and a client-side day/night phase derived from server/render time.
7. **Blob shadows.** Add cheap blob shadows under actors/objects without enabling expensive real-time shadow maps unless separately measured and justified.
8. **Feedback gap-fill.** Do not rebuild hitsplats, XP drops, or click markers. Add the missing persistent selected/target ring and polish existing layers only where the tests prove a gap.
9. **Validation grounded in current infra.** Use existing renderer/debug counters where possible. Do not require screenshot visual-regression tests unless the story also adds the test infrastructure.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Confirm all audio and visual assets are original/licensed for use; do not use OSRS/Jagex assets.
- [ ] Move completed story files into `tasks/completed/stories/E47/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E47-S00` — `tasks/stories/E47/E47-S00_audio-content-pipeline-and-client-exposure.md`
- [ ] `E47-S01` — `tasks/stories/E47/E47-S01_ambient-sound-and-district-audio-manager.md`
- [ ] `E47-S02` — `tasks/stories/E47/E47-S02_ui-and-action-sound-effects.md`
- [ ] `E47-S03` — `tasks/stories/E47/E47-S03_lighting-shadows-and-day-night-foundation.md`
- [ ] `E47-S04` — `tasks/stories/E47/E47-S04_hitsplats-xp-drops-and-selection-rings.md`
- [ ] `E47-S05` — `tasks/stories/E47/E47-S05_atmosphere-validation-and-performance-pass.md`

## Epic acceptance criteria

- [ ] `content/audio/` validates through the normal content pipeline and is serialized to the client.
- [ ] The client can determine the player's current audio zone/district from loaded region data.
- [ ] Every starter-town audio zone has an ambience definition or an explicit silent fallback.
- [ ] Existing server `SoundPacket`s produce audible client playback through one canonical `sounds.play` path.
- [ ] UI sounds are immediate, subtle, volume-controlled, and original.
- [ ] Blob shadows render under actors and selected static objects without exceeding measured renderer budgets.
- [ ] Hitsplats, XP drops, and click markers remain server/client wired through the existing layers; no duplicate layers are introduced.
- [ ] A persistent selection/target ring exists and is distinct from hover highlighting.
- [ ] Day/night presentation changes sky, fog, hemisphere light, and sun light without changing gameplay truth.
- [ ] Validation uses real repo infrastructure; any new screenshot/visual-regression requirement must include its own tooling story.
