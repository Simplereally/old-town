# E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E46 (Smoke Over Old Town Quest), E45 (Core Gameplay Loop), E42 (Terrain and District Identity), E43 (Buildings, Collision, and World Topology)
- Unlocks: future polish and world-expansion epics

## Spec references

- `POC_SPEC.md` §7.1 (Visual style — low-poly, hand-painted, readable)
- `POC_SPEC.md` §7.3 (Renderer rules — cheap shadows, blob shadows first, outlines/selection rings)
- `POC_SPEC.md` §22 (UI system — XP drops, hitsplats, chat, right-click menu)
- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `docs/world/districts-and-routes.md` — district identity for audio themes
- `content/animations/` — animation definitions

## Epic goal

Once the gameplay loop works, the world needs to feel alive. This epic adds audio, lighting, shadows, and UI feedback so that Old Town reads as a cozy, slightly dangerous starter town rather than a silent green field. The forge should sound like a forge, the market should have footfall and distant chatter, and the player should see XP drops, hitsplats, and selection rings clearly.

This is a polish epic, but it is essential for the OSRS-like feel: the 600 ms tick, the chunky UI, the immediate feedback, and the district ambience are all part of the genre.

## Approach summary

1. **Ambient sound system.** Add an audio manager that plays district ambience loops (market bustle, forge clang, river water, shrine bells) based on the player's current district. Use simple 2D/3D positional audio for sources like the forge furnace and the Market Bell.
2. **UI and action sounds.** Add short OGG sounds for: click, menu open, item pickup, level-up, hitsplat, attack swing, woodcutting chop, mining crack, and door open. Keep them subtle and original.
3. **Lighting and shadows.** Add a soft directional sun light and ambient light. Use cheap blob shadows under actors and objects first. Add simple building shadows only if performance allows.
4. **Hitsplats and XP drops.** Render hitsplats above actors and XP drops above the player with the classic chunky font and motion. Ensure they are driven by server packets, not client guesses.
5. **Selection rings and click markers.** Add a yellow ring under the selected entity and a red/yellow click marker on the destination tile. These appear immediately on client input, before the server confirms.
6. **Day/night foundation.** Implement a simple day/night cycle that changes ambient light and sky color. Gameplay truth is not tied to time-of-day; this is purely presentation.
7. **Atmosphere validation.** Add a smoke test that ensures every district has an ambience sound and that the audio manager does not leak on region changes.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [ ] Move completed story files into `tasks/completed/stories/E47/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E47-S01` — [Ambient sound and district audio manager](stories/E47/E47-S01_ambient-sound-and-district-audio-manager.md)
- [ ] `E47-S02` — [UI and action sound effects](stories/E47/E47-S02_ui-and-action-sound-effects.md)
- [ ] `E47-S03` — [Lighting, shadows, and day/night foundation](stories/E47/E47-S03_lighting-shadows-and-day-night-foundation.md)
- [ ] `E47-S04` — [Hitsplats, XP drops, and selection rings](stories/E47/E47-S04_hitsplats-xp-drops-and-selection-rings.md)
- [ ] `E47-S05` — [Atmosphere validation and performance pass](stories/E47/E47-S05_atmosphere-validation-and-performance-pass.md)

## Epic acceptance criteria

- [ ] All listed story files are complete and moved to the completed folder.
- [ ] Every Old Town district has a distinct ambient sound that plays when the player is inside it.
- [ ] Common actions (click, move, attack, gather, level-up, item pickup) play original UI/action sounds.
- [ ] Blob shadows render under actors and objects without exceeding the draw-call budget.
- [ ] Hitsplats and XP drops are visible and driven by server packets.
- [ ] Selection rings and click markers appear immediately on client input.
- [ ] A simple day/night cycle changes light and sky color without affecting gameplay truth.
- [ ] All audio and visual assets are original; no OSRS/Jagex sounds or assets are used.
