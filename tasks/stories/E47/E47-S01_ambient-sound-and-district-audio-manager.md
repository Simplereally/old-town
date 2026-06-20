# E47-S01 — Ambient sound and district audio manager

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E46-S05 (Quest Journal UI), E42-S03 (District Material Painting), E43-S06 (Starter Region Topology)
- Blocks: E47-S02, E47-S03, E47-S04, E47-S05

## Spec references

- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `POC_SPEC.md` §7.1 (Visual style — readable, restrained)
- `docs/world/districts-and-routes.md` — district identity
- `content/maps/old-town-0-0-0.json` — district triggers

## Objective

Add an ambient sound system that plays district-specific ambience based on the player's current location. The Market Bell should have a distant bell and market murmur, the Foundry Row should have forge sounds, the River Stoop should have water, and the Shrine Hearth should have quiet candle/wind ambience.

## Required architectural decisions

- **Audio manager:** A single `AudioManager` in the client that owns all ambient loops, 3D positional sources, and UI sounds.
- **District ambience mapping:** A content file `content/audio/district-ambience.json` maps district trigger IDs to ambience loops.
- **Cross-fade:** When the player crosses a district boundary, the old ambience fades out and the new ambience fades in over ~1 second. No jarring cuts.
- **Positional sources:** Forges, the Market Bell, and the river have 3D positional sound sources placed at object coordinates.
- **No OSRS audio:** All sounds must be original or licensed-free generated audio. Do not use OSRS music or sound effects.
- **Mute control:** Add a master mute and ambient volume slider to the UI.

## Implementation checklist

- [ ] Create `packages/shared/src/content-schemas/audio.ts` for audio content definitions.
- [ ] Create `content/audio/district-ambience.json` with ambience loops for each district.
- [ ] Create `content/audio/positional-sources.json` for forge, bell, and river sources.
- [ ] Implement `AudioManager` in the client with ambient and positional source support.
- [ ] Detect district changes from the player's tile position and trigger ambience cross-fades.
- [ ] Add volume/mute controls to the UI.
- [ ] Write test: entering a district starts the correct ambience loop.
- [ ] Write test: leaving a district fades out the old ambience.
- [ ] Write test: positional source volume changes with distance (POC: simple distance falloff).

## Acceptance criteria

- [ ] Each district has a distinct ambient sound.
- [ ] Ambience cross-fades smoothly on district change.
- [ ] Positional sources are audible near their objects.
- [ ] Volume and mute controls work.
- [ ] All audio assets are original or properly licensed; no OSRS audio.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — walk between districts and listen to ambience changes

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
