# E47-S04 — Feedback polish and selection rings

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S03, E45-S05, E45-S04, E07-S01
- Blocks: E47-S05

## Objective

Gap-fill only. Existing client feedback layers already exist and must be verified, not rebuilt. Add the missing persistent selected-entity ring and regression tests.

## What already exists — verify, do not rebuild

- `apps/client/src/game/scene/HitsplatLayer.ts` already exists and is wired.
- `apps/client/src/game/scene/XpDropLayer.ts` already exists and is wired.
- `apps/client/src/game/scene/ClickMarkerLayer.ts` already exists and is used for tile-click feedback.
- `apps/client/src/game/scene/HoverHighlighter.ts` already exists for hover-only rings.
- `apps/client/src/game/GameEngine.ts` already owns and disposes the existing feedback layers.

## Required decisions

- Do not duplicate existing feedback layers.
- Add only the missing persistent selected-entity ring.
- Keep server-driven feedback server-driven.
- Keep click markers client-side.
- XP drops are separate from hitsplat styling; do not document XP as a hitsplat colour.

## Implementation checklist

- [X] Re-read the existing feedback layers before editing.
- [X] Verify existing feedback tests still pass.
- [X] Add a persistent selected-entity ring.
- [X] Wire entity selection to update the ring immediately.
- [X] Ensure hover and selected states remain visually distinct.
- [X] Optionally improve click marker removal on arrival/path clear.
- [X] Add regression tests for existing feedback layers.
- [X] Add test for selected-entity ring updates.

## Acceptance criteria

- [X] No duplicate feedback systems are introduced.
- [X] Existing packet-driven feedback still works.
- [X] Existing XP feedback still works.
- [X] Existing tile click marker still works.
- [X] Selected entity ring is visible and distinct from hover.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — click tiles/entities and verify feedback

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
