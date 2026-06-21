# E47-S03 — Lighting, shadows, and day/night foundation

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S01, E42-S02, E33-S03
- Blocks: E47-S04, E47-S05

## Spec references

- `POC_SPEC.md` §7.1 (Visual style)
- `POC_SPEC.md` §7.3 (Renderer rules — cheap shadows, blob shadows first)
- `POC_SPEC.md` §23.2 (Art constraints)
- `apps/client/src/game/renderer/ThreeRenderer.ts`
- `apps/client/src/game/GameEngine.ts`
- `apps/client/src/game/ui/DebugOverlay.ts`

## Objective

Add atmosphere control, blob shadows, and a day/night presentation foundation by reusing the renderer lighting and fog that already exist.

## What already exists — verify, do not rebuild

- `ThreeRenderer` already creates a `HemisphereLight`.
- `ThreeRenderer` already creates a warm `DirectionalLight`.
- `ThreeRenderer` already configures scene fog.
- Renderer shadow maps are currently disabled.
- Renderer/debug counters already expose draw-call and resource metrics.

## Required architectural decisions

- Reuse or expose the existing hemisphere light, directional light, clear color, and fog. Do not add duplicate default lights.
- Drive the visual day/night phase from server/render time so clients share the same presentation phase.
- Update clear color, fog, hemisphere light, and directional light together; changing the sky while fog stays fixed is not acceptable.
- Add cheap flat blob shadows under actors and selected static objects.
- Keep full real-time shadow maps out of this story unless separately measured and justified.
- Add a debug control to freeze or inspect time-of-day through existing debug UI.
- Time-of-day is presentation-only and must not affect server truth.

## Implementation checklist

- [ ] Audit `ThreeRenderer` and expose/update existing lights/fog instead of adding duplicates.
- [ ] Add an `AtmosphereController` or equivalent small controller.
- [ ] Drive the day/night phase from server/render time.
- [ ] Update clear color, fog, hemisphere light, and directional light as a coherent set.
- [ ] Implement blob shadows for actors.
- [ ] Implement blob shadows for static objects where object placement/instancing makes it cheap.
- [ ] Add debug freeze/inspect controls for time-of-day.
- [ ] Add tests for atmosphere phase calculations.
- [ ] Add tests proving light/fog values change coherently over the cycle.
- [ ] Add tests proving blob shadows are created/disposed with actors or objects.
- [ ] Add a renderer-budget assertion using existing debug counters where feasible.

## Acceptance criteria

- [ ] No duplicate default light setup is introduced.
- [ ] Day/night presentation changes sky, fog, hemisphere light, and sun light smoothly.
- [ ] Blob shadows are readable, cheap, and disposed with their owners.
- [ ] Full real-time shadow maps remain disabled unless measured and explicitly justified.
- [ ] The cycle is presentation-only and does not affect gameplay truth.
- [ ] Visual style remains lo-fi and readable at night/dusk.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — observe shadows and the atmosphere cycle

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
