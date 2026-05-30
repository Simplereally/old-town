# E06-S01 — Create Vite Three.js client shell

## Epic

E06 — Three.js Client Renderer and Scene Streaming

## Dependency chain

- Depends on: E05-S06
- Blocks: next story in `E06` unless this is the final story for the epic.

## Spec references

- POC_SPEC.md §2
- POC_SPEC.md §6
- POC_SPEC.md §7
- POC_SPEC.md §23
- POC_SPEC.md §25
- POC_SPEC.md §26

## Objective

Create the browser client app with canvas, render loop, resize handling, asset bootstrap, and connection status shell.

## Implementation checklist

- [ ] Configure apps/client Vite TypeScript app.
- [ ] Create root canvas and Three.js renderer.
- [ ] Create render loop independent from server tick loop.
- [ ] Add resize and device pixel ratio handling with sane caps.
- [ ] Display connection/tick/debug status overlay.

## Acceptance criteria

- [ ] Client opens without server crash.
- [ ] Canvas renders a basic scene.
- [ ] Renderer has no authority over gameplay state.

## Validation commands

- [ ] `bun run client:dev`
- [ ] `bun run typecheck`

## Agent completion protocol

- [ ] Re-read the objective and acceptance criteria before final validation.
- [ ] Run every validation command listed above.
- [ ] Mark every completed checkbox in this file as `[X]`.
- [ ] Move this story file to `tasks/completed/stories/E06/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
