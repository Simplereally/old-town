# E31 - Render Architecture Contracts

## Dependency chain

- Depends on: E30
- Unlocks: E32

## Spec references

- ENGINE_AND_RENDERING.md
- tasks/ENGINE_AND_RENDERING_TASK_GRAPH.md
- POC_SPEC.md §2 (Hard design rules)
- POC_SPEC.md §6 (Scene streaming)
- POC_SPEC.md §7 (Rendering model)
- POC_SPEC.md §8 (Networking model)
- POC_SPEC.md §23 (Asset pipeline)
- POC_SPEC.md §25.2 (Client systems)
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Gaffer snapshot interpolation: https://gafferongames.com/post/snapshot_interpolation/
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js BufferAttribute: https://threejs.org/docs/pages/BufferAttribute.html
- MDN transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Epic goal

Create the technical architecture documents and coding standards that govern the engine/rendering refactor. This epic does not refactor runtime behavior. It makes the required runtime shape explicit enough that E32-E35 can be implemented without product clarification.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E31/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E31-S01` - [Render ECS Architecture Decision](stories/E31/E31-S01_render-ecs-architecture-decision.md)
- [X] `E31-S02` - [Snapshot Interpolation Contract](stories/E31/E31-S02_snapshot-interpolation-contract.md)
- [X] `E31-S03` - [Asset Baking and Instancing Contract](stories/E31/E31-S03_asset-baking-and-instancing-contract.md)
- [X] `E31-S04` - [Performance Budgets and Diagnostics Contract](stories/E31/E31-S04_performance-budgets-and-diagnostics-contract.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The four required docs exist under `docs/technical/` and are indexed from `docs/00-index.md`.
- [X] The docs explicitly ban packet-arrival alpha, network-callback Three mutation, mandatory `SharedArrayBuffer`, production OffscreenCanvas renderer movement, production WebGPU migration, and default shader deformation for gameplay geometry.
- [X] The docs define exact module boundaries, file names, test names, data shapes, and validation gates for E32-E35.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
