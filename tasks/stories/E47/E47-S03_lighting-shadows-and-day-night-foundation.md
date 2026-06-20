# E47-S03 — Lighting, shadows, and day/night foundation

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S01 (Ambient Sound), E42-S02 (Terrain Renderer), E33-S03 (Static Object Instancing)
- Blocks: E47-S04, E47-S05

## Spec references

- `POC_SPEC.md` §7.1 (Visual style — low-poly, hand-painted, readable)
- `POC_SPEC.md` §7.3 (Renderer rules — cheap shadows, blob shadows first)
- `POC_SPEC.md` §23.2 (Art constraints — no photoreal PBR)

## Objective

Add lighting, simple shadows, and a foundational day/night cycle. The goal is to make the world readable and atmospheric, not photorealistic. Blob shadows under actors and objects are the first shadow pass; directional sun light provides depth.

## Required architectural decisions

- **Lighting:** One directional sun light + ambient light. Use warm midday colors for the default. Shadows are soft and cheap.
- **Blob shadows:** Actors and objects get a simple circular shadow decal projected onto the ground plane. This is cheap and readable.
- **Day/night cycle:** A slow cycle (e.g., 20 real minutes per game day) changes the sun angle, ambient intensity, and sky color. The cycle is client-side presentation only; it does not affect gameplay truth.
- **No gameplay dependency:** Time-of-day does not affect spawn rates, shop hours, or quest availability for POC.
- **Performance:** Use a single shadow map with limited resolution. Avoid real-time shadows on many small objects.

## Implementation checklist

- [ ] Add a directional sun light and ambient light to the scene.
- [ ] Implement blob shadows for actors and objects.
- [ ] Add a simple day/night cycle controller that adjusts light and sky color.
- [ ] Add a debug toggle to freeze time-of-day.
- [ ] Write test: blob shadows are created for spawned actors.
- [ ] Write test: day/night cycle changes sun angle over time.
- [ ] Write test: performance budget for shadow draw calls is not exceeded.

## Acceptance criteria

- [ ] The scene has directional lighting and ambient light.
- [ ] Actors and objects cast cheap blob shadows.
- [ ] A day/night cycle changes light and sky color smoothly.
- [ ] The cycle is client-side only and does not affect gameplay.
- [ ] Performance budget is maintained.
- [ ] Visual style remains lo-fi.

## Validation commands

- [ ] `bun run test`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run dev` — observe shadows and cycle

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
