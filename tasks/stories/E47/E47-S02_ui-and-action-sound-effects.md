# E47-S02 — UI and packet audio cues

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S00, E47-S01, E07-S02, E45-S04
- Blocks: E47-S03, E47-S04, E47-S05

## Objective

Connect the existing server audio packet path to the client audio manager, then add local UI cues through the same registry and volume controls.

## What already exists — verify, do not rebuild

- The shared protocol already has server audio cue packets.
- Tick deltas can carry cue packets.
- The client currently receives those packets but does not play them.
- E47-S00 provides the audio registry.
- E47-S01 provides `AudioManager`.

## Required architectural decisions

- Add one presentation event for audio playback.
- Convert incoming server cue packets into that presentation event.
- Route the event from `GameEngine` to `AudioManager`.
- UI cues may play immediately on local UI input.
- World cues must come from server packets or authoritative update events.
- Playback must respect mute, volume, and rate limiting.

## Implementation checklist

- [ ] Add an audio playback presentation event.
- [ ] Convert incoming server audio cue packets into that event.
- [ ] Route the event from `GameEngine` to `AudioManager`.
- [ ] Add UI cue definitions to the E47-S00 registry.
- [ ] Add definitions for existing server cue IDs.
- [ ] Wire UI click, menu, select, error, panel, and level-up cues where appropriate.
- [ ] Document the chosen path for any extra world cues.
- [ ] Add light cue de-dupe/rate limiting.
- [ ] Test: a server cue packet becomes a client presentation event.
- [ ] Test: the game engine routes the event to `AudioManager`.
- [ ] Test: a UI action calls `AudioManager` immediately.
- [ ] Test: repeated identical cues are rate-limited.

## Acceptance criteria

- [ ] Existing server cue packets are audible on the client.
- [ ] UI cues are immediate, subtle, and volume-controlled.
- [ ] World cues are authoritative, not local-only guesses.
- [ ] Cue IDs resolve through the audio registry.
- [ ] Repeated cues do not create uncontrolled overlap.
- [ ] Assets are original/generated/licensed.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — verify UI and packet audio cues

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
