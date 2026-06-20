# E47-S04 — Hitsplats, XP drops, and selection rings

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S03 (Lighting and Shadows), E45-S05 (XP Drops and Level-Ups), E45-S04 (Combat Loop), E07-S01 (Tile Picking and Move Command UX)
- Blocks: E47-S05

## Spec references

- `POC_SPEC.md` §8.2 (Update masks — HITSPLAT, GRAPHIC)
- `POC_SPEC.md` §8.3 (Delta packet — hitsplats, skillDelta)
- `POC_SPEC.md` §22 (UI system — hitsplats, XP drops, right-click menu)
- `POC_SPEC.md` §2.4 (Client feel must be immediate — click markers, destination tile highlight)

## Objective

Polish the immediate feedback visuals: hitsplats above actors, XP drops above the player, yellow selection rings under entities, and click markers on the destination tile. These are small details that make the game feel like an OSRS-style MMO.

## Required architectural decisions

- **Hitsplats:** Rendered as text sprites above the actor. Color-coded: red for damage, blue for XP, green for healing (future). Positioned with a small upward drift and fade-out.
- **XP drops:** Rendered as text sprites above the player, showing the skill icon and XP amount. They stack if multiple XP drops happen in quick succession.
- **Selection rings:** A flat yellow ring under the selected entity. It updates immediately when the player clicks an entity.
- **Click marker:** A temporary marker on the clicked tile. It appears immediately on client input and is removed when the player reaches the tile or the path is cleared.
- **Server-driven:** Hitsplats and XP drops come from server packets. Selection rings and click markers are client-only immediate feedback.
- **Chunky font:** Use a pixelated or bold font consistent with the lo-fi UI.

## Implementation checklist

- [ ] Implement hitsplat rendering from `S2C_TICK_DELTA` hitsplat packets.
- [ ] Implement XP drop rendering from `S2C_XP_DROP` packets.
- [ ] Add selection ring rendering under the current target/selected entity.
- [ ] Add click marker rendering on the destination tile.
- [ ] Add font and color styling to match the lo-fi UI.
- [ ] Write test: a hitsplat packet creates a visible hitsplat.
- [ ] Write test: an XP drop packet creates a visible XP drop.
- [ ] Write test: clicking an entity immediately updates the selection ring.

## Acceptance criteria

- [ ] Hitsplats appear above actors when damage is dealt.
- [ ] XP drops appear above the player when XP is gained.
- [ ] A selection ring shows under the selected entity.
- [ ] A click marker appears on the destination tile immediately.
- [ ] All feedback is readable and matches the lo-fi style.
- [ ] Hitsplats and XP drops are server-driven; selection/click markers are client-only.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — attack a creature, gain XP, and click around

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
