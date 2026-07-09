# E45-S05 — XP drops, level-ups, and skill panel wiring

## Epic

E45 — Old Town Core Gameplay Loop

## Dependency chain

- Depends on: E45-S04 (Combat Loop), E08-S05 (Character Skills and Derived Stats), E28-S03 (XP Drop Visualization), E12-S01 (Player Var and Quest Var Storage)
- Blocks: E45-S06

## Spec references

- `POC_SPEC.md` §15.2 (XP curve)
- `POC_SPEC.md` §15.3 (Skill definition)
- `POC_SPEC.md` §22 (UI system — skills panel, XP drops)
- `content/skills/` — skill definitions
- `content/animations/` — level-up animation

## Objective

Wire the skill and XP systems so that every action produces a visible XP drop, level-ups trigger feedback, and the skill panel shows current levels and XP. This is the glue that makes the first-hour loop feel like progression.

## What already exists (verify, do not rebuild)

- **XP drop packet:** `XpDropPacket` is already defined in `packages/shared/src/protocol/packets.ts:83` as `{ skillId: string, amount: number }` and is wired into the tick delta as `xpDrops: readonly XpDropPacket[]` (line 322). The server's `addXp` function in `skills/skill-state.ts` already calls `deltas.markXpDrop()` to emit XP drops. E28-S03 implemented the client-side XP drop visualization. Do **not** reimplement this.
- **Level-up detection:** The server's `addXp` function returns an `AddXpResult` that includes `levelUp: boolean` and `newLevel: number`. The `announceLevelUp` function in `skilling-system.ts:122` already sends a system chat message on level-up: `"Congratulations! You've advanced to level X <skill>."` This is the existing level-up feedback.
- **Skill deltas:** The `FullStatePacket` already includes `skills: readonly SkillDelta[]` with `skillId`, `level`, `xp`, and `effectiveLevel` per skill. The tick delta protocol includes skill deltas for incremental updates.
- **Combat style system:** `combat-system.ts:344-350` already implements combat style selection from the `combatant.combatStyle` component and weapon `allowedStyles`. XP distribution per style is already functional. Do **not** reimplement this.
- **Derived stats:** `maxHealthForHitpointsLevel` in `skills/skill-state.ts` and `computeCombatLevel` in `skills/combat-level.ts` already exist for derived stat calculation.

## Required work

This story is a **gap-filling and client-wiring** story. The server-side XP and level-up detection is built; the work is the level-up packet, client skill panel, and derived stat recalculation on level-up.

- [X] **Level-up packet (genuinely new):** While `announceLevelUp` sends a chat message, there is no dedicated `LevelUpPacket` in the protocol. Add a `LevelUpPacket` to `packages/shared/src/protocol/packets.ts` with `{ skillId: string, newLevel: number }` and wire it into the tick delta. Update `announceLevelUp` in `skilling-system.ts` to emit this packet in addition to the chat message. This gives the client a structured signal to play the level-up animation/overhead graphic.
- [X] **Client skill panel:** Wire the client skill panel UI to display all skills with current level, XP, and effective level. The panel updates from `SkillDelta` updates in the tick delta. Verify the panel is opened by default (per S01) and updates live as XP is gained.
- [X] **Client XP drop rendering:** Verify the existing E28-S03 XP drop visualization works end-to-end: server emits `xpDrops` in the delta, client renders the floating XP drop above the player.
- [X] **Client level-up rendering:** On receiving a `LevelUpPacket`, the client plays the level-up animation and shows overhead text (e.g., "Level Up!" or the skill icon). Verify `content/animations/` has a level-up animation definition; add one if missing.
- [X] **Derived stat recalculation:** When a combat skill levels up, verify that `maxHealth` (from hitpoints level) and `combatLevel` are recalculated and the updated values are sent in the next delta. The `combatant` component's `maxHealth` and `combatLevel` must update on level-up, not just on session bootstrap.
- [X] Write test: gaining Woodcutting XP sends the correct `XpDropPacket` (verify existing coverage).
- [X] Write test: crossing a level threshold sends a `LevelUpPacket` with the correct skill and new level.
- [X] Write test: the skill panel shows updated levels after a level-up (client test).
- [X] Write test: derived stats (`maxHealth`, `combatLevel`) update when relevant skills level up.

## Acceptance criteria

- [X] Every skill XP gain produces a visible XP drop (existing — verify).
- [X] Level-ups are detected and broadcast via a structured `LevelUpPacket` (new) plus the existing chat message.
- [X] The client skill panel shows all skills with current level, XP, and effective level, updating live.
- [X] Level-up animation/overhead text renders on the client when a `LevelUpPacket` is received.
- [X] Derived stats (`maxHealth`, `combatLevel`) are recalculated on level-up and sent in deltas.
- [X] All feedback is driven by server packets, not client prediction.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — gain XP and level up

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E45/` only after all criteria pass.
- [X] Update the parent epic checklist; keep the epic active until E45-S06 is complete.
