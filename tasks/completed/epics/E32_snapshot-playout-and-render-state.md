# E32 - Snapshot Playout and Render State

## Dependency chain

- Depends on: E31
- Unlocks: E33

## Spec references

- ENGINE_AND_RENDERING.md (Phase A)
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- docs/technical/render-ecs-architecture.md
- docs/technical/snapshot-interpolation.md
- POC_SPEC.md §2.1, §2.2, §2.3, §2.4
- POC_SPEC.md §7.4
- POC_SPEC.md §8.3, §8.4, §8.5
- POC_SPEC.md §11.4
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Gaffer snapshot interpolation: https://gafferongames.com/post/snapshot_interpolation/

## Epic goal

Replace packet-arrival rendering with a snapshot playout architecture. The client must ingest server packets into pure state, buffer accepted snapshots by server tick, render a delayed presentation time, and allow only render systems to write Three transforms.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E32/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E32-S01` - [Snapshot Buffer](stories/E32/E32-S01_snapshot-buffer.md)
- [X] `E32-S02` - [Render Clock](stories/E32/E32-S02_render-clock.md)
- [X] `E32-S03` - [Render Transform Cache](stories/E32/E32-S03_render-transform-cache.md)
- [X] `E32-S04` - [Pure Packet Ingestion](completed/stories/E32/E32-S04_pure-packet-ingestion.md)
- [X] `E32-S05` - [Presentation Movement Policies](completed/stories/E32/E32-S05_presentation-movement-policies.md)
- [X] `E32-S06` - [Render Frame Integration](completed/stories/E32/E32-S06_render-frame-integration.md)

## Epic acceptance criteria

- [X] Network callbacks do not mutate Three objects, scene layers, geometry buffers, materials, or renderer state.
- [X] `SnapshotBuffer` drops old ticks, stores future ticks, exposes interpolation pairs, and reports hold/freeze/snap states.
- [X] `RenderClock` samples `estimated_server_time - interpolation_delay` from RAF timestamps and does not run authoritative local tick loops.
- [X] Actor/projectile/hitsplat presentation reads `RenderTransformCache` or presentation events rather than packet arrival time.
- [X] Local click/path feedback is immediate but cannot change authoritative position.
- [X] Tests cover jittered 600ms snapshots, out-of-order packets, late packets, missing interpolation successors, teleports, and local-player feedback.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
