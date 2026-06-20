# E47-S02 — UI and action sound effects

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S01 (Ambient Sound Manager), E07-S02 (Entity Picking and Context Menu), E45-S04 (Combat Loop)
- Blocks: E47-S03, E47-S04, E47-S05

## Spec references

- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `POC_SPEC.md` §22 (UI system — right-click menu, feedback)
- `POC_SPEC.md` §2.4 (Client feel must be immediate)
- `content/audio/ui-sounds.json` (to create)

## Objective

Add short, original sound effects for common UI actions and player actions. These provide immediate feedback and make the game feel responsive. Sounds must be subtle and not repetitive.

## Required architectural decisions

- **UI sounds:**
  - `ui_click` — tile click
  - `ui_menu_open` — right-click menu / panel open
  - `ui_select` — menu option selected
  - `ui_error` — invalid action
  - `ui_levelup` — level up
- **Action sounds:**
  - `action_attack` — melee swing
  - `action_chop` — woodcutting
  - `action_mine` — mining
  - `action_cook` — cooking
  - `action_pickup` — item picked up
  - `action_door` — door open/close
- **Audio content:** Store sound definitions in `content/audio/action-sounds.json` and `content/audio/ui-sounds.json`. Files are OGG/WebM in `assets/audio/`.
- **Playback:** The client plays sounds immediately on input or on receiving the relevant server packet. Combat sounds are triggered by the animation packet, not by the client guessing.
- **No spam:** Action sounds are rate-limited or tied to animations so rapid actions do not stack audio.

## Implementation checklist

- [ ] Create sound definitions in `content/audio/` for UI and action sounds.
- [ ] Add placeholder audio files in `assets/audio/` (or generate simple synthetic sounds).
- [ ] Implement sound playback triggers in the client input, UI, and packet applier.
- [ ] Tie combat sounds to attack animation packets.
- [ ] Tie gathering sounds to successful gather events.
- [ ] Write test: a click plays the click sound.
- [ ] Write test: a successful attack plays the attack sound.
- [ ] Write test: a level-up plays the level-up sound.

## Acceptance criteria

- [ ] UI actions have audible feedback.
- [ ] Combat, gathering, and processing actions have audible feedback.
- [ ] Sounds are triggered by server packets or immediate input, not by client prediction.
- [ ] No audio spam or overlapping loops.
- [ ] All audio assets are original.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run content:validate`
- [ ] `bun run dev` — perform actions and verify sounds

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
