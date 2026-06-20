# E45-S05 — XP drops, level-ups, and skill panel wiring

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S04 (Combat Loop), E08-S05 (Character Skills and Derived Stats), E28-S03 (XP Drop Visualization), E12-S01 (Player Var and Quest Var Storage)
- Blocks: E46-S01

## Spec references

- `POC_SPEC.md` §15.2 (XP curve)
- `POC_SPEC.md` §15.3 (Skill definition)
- `POC_SPEC.md` §22 (UI system — skills panel, XP drops)
- `content/skills/` — skill definitions
- `content/animations/` — level-up animation

## Objective

Wire the skill and XP systems so that every action produces a visible XP drop, level-ups trigger feedback, and the skill panel shows current levels and XP. This is the glue that makes the first-hour loop feel like progression.

## Required architectural decisions

- **XP delta packet:** The server sends `S2C_XP_DROP` with skill ID, amount, and current total XP. The client renders the XP drop above the player and updates the skill panel.
- **Level-up detection:** On each XP gain, the server checks if the new total crosses a level threshold. If so, it sends a level-up packet and plays the level-up animation/overhead.
- **Skill panel:** The client skill panel shows all skills, current level, XP to next level, and total XP. It updates from skill deltas.
- **Derived stats:** When combat skills level up, derived stats (max HP, combat level) are recalculated. Equipment requirements may now be met.
- **Var storage:** Skill levels and XP are stored in the player var system (E12-S01) for persistence.

## Implementation checklist

- [ ] Implement `S2C_XP_DROP` packet and client rendering.
- [ ] Implement level-up detection and packet.
- [ ] Wire the skill panel UI to skill deltas.
- [ ] Add level-up animation/overhead text rendering.
- [ ] Implement derived stat recalculation on level-up.
- [ ] Write test: gaining Woodcutting XP sends the correct XP drop packet.
- [ ] Write test: crossing a level threshold sends a level-up packet.
- [ ] Write test: the skill panel shows updated levels after a level-up.
- [ ] Write test: derived stats update when relevant skills level up.

## Acceptance criteria

- [ ] Every skill XP gain produces a visible XP drop.
- [ ] Level-ups are detected and broadcast with level-up feedback.
- [ ] The skill panel shows current levels and XP.
- [ ] Derived stats are recalculated on level-up.
- [ ] XP and level data are stored in player vars.
- [ ] All feedback is driven by server packets, not client prediction.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — gain XP and level up

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [ ] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.
