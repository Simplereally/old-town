# Executive verdict



Keep these ideas:



* 600ms server-authoritative tick.

* Render loop decoupled from simulation.

* Snapshot interpolation.

* worker-based asset baking.

* transferable `ArrayBuffer`s.

* typed-array state for hot paths.

* instancing for repeated props/entities.

* object pools for projectiles, hitsplats, decals, ground markers.

* strict “authoritative state vs render state” separation.



Change these ideas:



* Do **not** derive render `alpha` from packet arrival time.

* Do **not** make `SharedArrayBuffer` mandatory at this stage.

* Do **not** put all ECS state into one giant float stride.

* Do **not** mutate Three object transforms everywhere.

* Do **not** use GPU shader procedural deformation as the default for all assets.

* Do **not** target “0 B/s allocations” literally. Target **zero app-level hot-loop allocations** and flat heap under stress.

* Do **not** implement WebGPU now. Treat it as a future renderer backend, not the current production path.



## The biggest architectural correction



Your current loop treats server packets as if they arrive exactly every 600ms. They will not.



The client needs a **snapshot interpolation buffer**, not just “last tick time + alpha.” Gaffer’s snapshot interpolation model is the right mental frame: buffer snapshots briefly, then render a slightly delayed simulation time so there is usually both an older and newer snapshot to interpolate between; this trades a small amount of latency for smoothness under jitter/loss. ([Gaffer On Games][2])



For Old Town, use:



```txt

server tick: authoritative 600ms cadence

network receive: irregular, jittery, sometimes late

render clock: requestAnimationFrame at 60/75/120/144Hz

presentation time: estimated_server_time - interpolation_delay

```



Recommended default:



```txt

remote entity interpolation delay: 1 tick initially, maybe 600ms

minimum interpolation buffer: 2 snapshots

late packet policy: ignore older sequence/tick snapshots

short gap policy: hold/interpolate toward latest

long gap policy: freeze remote entity, then snap/teleport with visual cue

local player: show click/path feedback immediately, but position remains server-authoritative

```



`requestAnimationFrame` generally tracks display refresh rate, including 75/120/144Hz, and MDN explicitly warns to use the callback timestamp for frame progress so animations do not run too fast on high-refresh screens. ([MDN Web Docs][3]) That means the render frame loop should be timestamp-driven, but the simulation target should be server-tick-driven.



## Revised clock model



Use **three clocks**, not two:



| Clock                  | Owner            | Purpose                          |

| ---------------------- | ---------------- | -------------------------------- |

| Server tick clock      | server           | authoritative game state         |

| Snapshot/playout clock | client net layer | smooths irregular packet arrival |

| Render frame clock     | browser RAF      | draws interpolated presentation  |



Pipeline:



```txt

WebSocket packet

→ decode into immutable snapshot/delta

→ insert into snapshot ring by server_tick

→ update authoritative ECS state only at accepted tick boundaries

→ render systems query presentation state at render_server_time

→ Three scene receives interpolated transforms only from render systems

```



Do not run “tick systems” because enough real time elapsed locally. Run them because you have accepted the next server tick/delta. Local catch-up loops are good for offline simulation, but dangerous for an MMO client if they imply authority.



## Fix the fixed-timestep pattern



The standard fixed timestep pattern is still relevant for local client-only systems: particles, camera smoothing, debug visualizers, local animation clocks. Gaffer’s fixed timestep article is still the canonical warning: variable delta can make simulations behave differently across frame rates, and catch-up loops can spiral if each simulated step costs more time than it represents. ([Gaffer On Games][4])



For Old Town:



```txt

authoritative gameplay: server tick snapshots only

presentation interpolation: every frame

client-only FX: fixed small timestep or frame dt, but never authoritative

path/click UI: immediate, client-side

camera: frame-rate independent smoothing

```



Clamp catch-up. Never allow infinite `while elapsed >= tick` loops in a browser tab after sleep/backgrounding.



## Asset generation: better model



The proposed worker pipeline is good, but make it **asset-class dependent**:



| Asset type               | Recommended path                                            |

| ------------------------ | ----------------------------------------------------------- |

| terrain chunk mesh       | worker bake → transferable buffers → main-thread GPU upload |

| static props/trees/rocks | instanced archetypes, not per-object meshes                 |

| repeated items/drops     | `InstancedMesh` or sprite/quad atlas                        |

| characters/NPCs          | small number of skinned/animated archetypes, pooled         |

| hitsplats/projectiles    | pooled billboards/lines/instanced quads                     |

| far decorations          | chunk-local impostors or merged static geometry             |

| UI overlays              | DOM/canvas/SDF text, not Three meshes unless necessary      |



Three’s own `InstancedMesh` docs say it is for rendering many objects with the same geometry/material but different transforms, reducing draw calls and improving rendering performance.  Its `instanceMatrix` and `instanceColor` require `needsUpdate = true` after modifying instance data. 



That means the engine should have an **Instance Registry**:



```txt

InstanceBucketKey = archetype_id + material_id + region_id + layer

```



Each bucket owns:



```txt

InstancedMesh

capacity

active_count

free_list

instance_id_to_slot

slot_to_entity_id

instance_matrix_array

instance_color_or_seed_array

dirty_start / dirty_end

```



Batch update once per frame, not once per instance.



## Important Three.js correction



This code from the supplied architecture is not good:



```ts

const dummy = new THREE.Object3D();

...

this.instancedMesh.setMatrixAt(id, dummy.matrix);

this.instancedMesh.instanceMatrix.needsUpdate = true;

```



Problems:



* It allocates `Object3D` if called per spawn.

* It calls `needsUpdate` per instance instead of once after a batch.

* It does not manage `mesh.count`.

* It does not manage dirty ranges.

* It may require bounding sphere/box recompute after bulk placement for culling/raycasting. Three docs note instanced bounding boxes are not automatically computed and may need recompute after transform changes. 



Better:



```txt

preallocate Matrix4 / Quaternion / Vector3 scratch objects once

or write directly into instanceMatrix.array

mark update once after all changed slots

use mesh.count = active_count

segment buckets by chunk for culling

```



Three `BufferAttribute` supports `updateRanges`, `needsUpdate`, and `usage`; its docs note `needsUpdate` resends changed data to the GPU, `updateRanges` can restrict updated components, and `usage` must be set before first use because it cannot be changed after initial use.  Use that.



## Workers and memory transfer



Worker baking should use transferables first. MDN confirms transferable objects move ownership between contexts; `ArrayBuffer` transfer detaches the sender’s buffer and attaches it to the receiver, avoiding a deep copy. ([MDN Web Docs][5]) That is the right default for chunk mesh buffers.



Use `SharedArrayBuffer` only as an advanced path. MDN is clear that shared memory requires secure context and cross-origin isolation; without that, SAB is hidden or unavailable, and you need COOP/COEP style deployment headers. ([MDN Web Docs][6]) This affects Vite dev server, production hosting, asset CDNs, iframes, analytics, and any third-party scripts. Treat SAB as **Phase 2**, not Phase 1.



Recommended memory pipeline:



```txt

Phase 1:

worker pool + transferable ArrayBuffers + main-thread GPU upload budget



Phase 2:

SharedArrayBuffer rings for high-volume network decode / asset queues

only after COOP/COEP headers are solved and benchmarks prove postMessage is the bottleneck



Phase 3:

OffscreenCanvas/WebGL worker renderer experiment

only if main thread UI contention becomes real

```



OffscreenCanvas is available in workers and lets rendering run in a worker context, but it adds integration complexity with Three, input, UI overlays, resize, context loss, and dev tooling. ([MDN Web Docs][7]) It is a good experiment later, not required for the current Old Town slice.



## WebGL performance rules that matter most



MDN’s WebGL best-practices page strongly supports several changes:



* batch draw calls,

* prefer doing work in the vertex shader where visually acceptable,

* avoid blocking API calls like `getError`, `getParameter`, `readPixels` on the main thread in production,

* be conscious of VRAM budgets,

* use parallel shader compile when available,

* treat `texImage` / `texSubImage` uploads as potential pipeline flush sources. ([MDN Web Docs][8])



Old Town-specific rules:



```txt

1 chunk terrain draw per material layer, not per tile

1 instanced draw per prop archetype/material/chunk

1 instanced draw for ground items per atlas/material

1 pooled draw path for projectiles/hitsplats

no per-frame shader compilation

no runtime material churn

no texture upload during combat

no getParameter/readPixels in active gameplay

```



## ECS: typed arrays, but do not over-flatten



The “one giant stride” ECS is too simplistic.



This is better:



```txt

Authoritative ECS:

- stable entity ids

- sparse sets / archetype tables

- SoA typed arrays per hot component

- object maps only for cold metadata



Render ECS/cache:

- render_entity_id

- entity_id

- prev_tile_x/y/plane

- curr_tile_x/y/plane

- next_tile_x/y/plane if available

- render_x/y/z

- heading

- anim_state

- render_handle

```



Do not store `THREE.Mesh` in the core gameplay ECS. Store a render handle:



```txt

render_handle = { bucket_id, slot_index, archetype_id }

```



Three objects belong to the presentation layer. Gameplay state should be serializable, testable, and server-aligned.



## Movement interpolation: make it OSRS-like, not generic smooth



OSRS movement is tick-authored. The visual should be charmingly stepped, not modern MMO floaty. Use:



```txt

server path state:

from_tile

to_tile

start_tick

arrival_tick

direction

movement_type walk/run/teleport/knockback

```



Render policy:



```txt

walk: interpolate tile center to tile center over 1 tick

run: consume 2 tiles per tick if server supports it

turning: snap heading at tick or half-tick

teleport: no interpolation, flash/fade/snap

combat lunge: visual-only, returns to authoritative tile

projectile: frame-smoothed but tick-timed impact

```



For entities with velocity-like motion, consider Hermite interpolation later. Gaffer’s snapshot interpolation article explains that linear interpolation can produce visible velocity discontinuities, while Hermite interpolation uses velocity information to smooth motion at the same packet rate. ([Gaffer On Games][2]) For Old Town tile walking, linear is fine initially; for projectiles and knockbacks, Hermite can help.



## Animation: do not overcomplicate with shader skinning yet



Quantized animation is a good aesthetic goal, but the pasted shader idea is too hand-wavy. Three’s `AnimationMixer` is fine for low NPC counts, but not for thousands. The scalable path is:



| Entity type             | Animation approach                           |

| ----------------------- | -------------------------------------------- |

| local player            | normal/quantized mixer acceptable            |

| nearby named NPCs       | mixer or small pooled mixers                 |

| crowds/monsters         | atlas/sprite/instanced pose index            |

| low-poly prop animation | shader uniform phase or simple CPU transform |

| combat projectiles      | pooled procedural motion                     |



If you want quantized animation:



```txt

global tick_phase = floor(render_time / substep)

animations sample at 4 substeps per 600ms tick

animation events still fire only from server tick or authoritative event packet

```



Do it in CPU first. Shader skinning quantization can come later if profiler says CPU mixers are a bottleneck.



## Procedural GPU deformation: use selectively



The supplied shader-driven procedural geometry idea is attractive, but dangerous if applied broadly.



Good uses:



* tiny visual variation on grass/rocks/trees,

* HSL tint per instance,

* faceted low-poly jitter,

* wind sway,

* cheap prop deformation.



Bad uses:



* terrain collision shape,

* interactable object clickboxes,

* anything requiring exact cross-client gameplay geometry,

* anything that makes low-fi sprites/meshes look noisy.



Keep gameplay geometry deterministic and CPU/server known. Let GPU variation be **visual-only**.



## Region/chunk lifecycle



Old Town runtime now has four 64×64 map regions. The renderer should operate around that granularity, but asset streaming should use a smaller visible-cell layer if needed.



Chunk state machine:



```txt

unseen

metadata_loaded

bake_requested

baking_worker

baked_waiting_gpu_upload

gpu_resident

visible

hidden_resident

evict_pending

disposed

```



Important budgets:



```txt

worker CPU budget: background, multi-job queue

main-thread GPU upload budget: e.g. max 1-2ms/frame

mesh/material creation: loading screen or amortized

texture upload: never during combat if avoidable

chunk eviction: LRU by distance + memory pressure

```



Do not hot-swap huge geometry immediately when a tick packet arrives. Queue it.



## Networking: binary eventually, but protocol first



For a ticked MMO:



```txt

packet includes:

server_tick

snapshot_sequence

server_sent_time or tick epoch

entity delta count

changed component masks

entity id

quantized fields

```



Client-side:



```txt

drop old snapshots

store future snapshots

interpolate at presentation_tick

do not mutate visible state directly from network callback

```



Do not obsess over SAB before the packet format is efficient. A structured JSON payload decoded every 600ms can be fine for the POC. Binary delta packets matter when the interest set grows.



## Diagnostics: make it measurable



Replace the unrealistic table with measurable budgets:



| Metric                      |          POC target |              Stress target |

| --------------------------- | ------------------: | -------------------------: |

| frame p95                   |             <16.6ms |  <8.3ms if targeting 120Hz |

| frame p99                   |               <33ms |                    <16.6ms |

| main-thread app allocations | no sustained growth |    no hot-loop allocations |

| draw calls visible town     |          <150 first |              <75 optimized |

| chunk GPU upload            |   <2ms/frame budget |                 <1ms/frame |

| visible instanced props     |                 5k+ |                       30k+ |

| visible entities            |                 200 | 1k simulated/render-cached |

| snapshot ingest             |                <1ms |           <2ms under burst |

| heap after 10 min idle      |                flat |                       flat |

| context menu / picking      |      no frame spike |             no frame spike |



Use `renderer.info.render.calls`, Chrome Performance panel, heap allocation sampling, and GPU timing extensions where available. MDN documents `EXT_disjoint_timer_query` for asynchronous GPU timing queries, but treat GPU timing as optional because extension availability varies. ([MDN Web Docs][9])



## Bugs / red flags in the pasted code



These matter.



1. `new Float32Array(64 * 64 * 6) * 3` is invalid logic. You multiply the length, not the typed array.



2. `frameDelta = elapsed / 1000` is not frame delta. `elapsed` there is “time since last fixed tick boundary,” not time since previous RAF. Use `now - previousFrameNow`.



3. The local `while elapsed >= 600` loop should not invent authoritative server ticks on the client.



4. `new THREE.Object3D()` inside `setInstance` allocates in the hot path.



5. `@inline` is not TypeScript.



6. `SharedArrayBuffer` will not work unless the app is cross-origin isolated.



7. The ring buffer is incomplete: no message length framing, wrap handling, payload alignment, overflow policy, or backpressure.



8. `clearTicks()` hiding all projectiles every tick is wrong for projectiles that last multiple ticks.



9. `ShaderMaterial({ lights: true })` with manual light chunks is fragile. Prefer `MeshLambertMaterial`/`MeshToonMaterial` with `onBeforeCompile` for stylistic modifications until a full shader library is warranted.



10. “0 B/s during active gameplay” is not a practical browser metric. Aim for zero app hot-loop allocations and flat long-run heap.



## Recommended architecture for the agent



Build in this order:



### Phase A: Presentation clock and snapshot buffer



* server snapshot ring by `server_tick`,

* render playout clock,

* interpolation delay,

* entity render cache,

* teleports/snap exceptions,

* no direct Three mutation outside render systems.



### Phase B: Render resource registry



* mesh/material/texture archetype registry,

* instanced buckets,

* object pools,

* no per-spawn geometry/material creation,

* chunk-local culling.



### Phase C: Worker asset baker



* worker pool,

* transferables,

* chunk job queue,

* main-thread GPU upload budget,

* LRU residency.



### Phase D: Diagnostics harness



* fake 600ms snapshots with jitter,

* fake region crossing,

* 1k/5k/30k entity/prop stress scenes,

* heap allocation watch,

* draw-call budget assertions,

* renderer info HUD.



### Phase E: Optional SAB / OffscreenCanvas experiments



* only after profiler proves need,

* only after cross-origin isolation headers are solved,

* keep fallback path.



## Agent-ready instruction



Use this as the next technical brief:



```txt

Rework the Three/ECS engine plan around a snapshot interpolation architecture, not packet-arrival alpha.



Hard rules:

- Server tick remains authoritative at 600ms.

- Network callbacks must never mutate Three objects directly.

- Render systems are the only systems allowed to write Object3D transforms.

- Packet arrival time is not tick time.

- Use a snapshot ring keyed by server_tick.

- Render at estimated_server_time - interpolation_delay.

- Keep gameplay ECS and render cache separate.

- Use SoA typed arrays for hot render/simulation fields, but do not force all components into one monolithic float stride.

- Three objects live in render registries, not gameplay components.

- Use InstancedMesh buckets per archetype/material/chunk for repeated props/items.

- Batch instanceMatrix updates once per frame.

- Worker asset baking uses transferable ArrayBuffers first.

- SharedArrayBuffer is optional Phase 2 only after COOP/COEP deployment is solved.

- OffscreenCanvas is optional Phase 3 only.

- No per-frame or per-tick allocation in hot systems.

- No runtime geometry/material creation during combat.

- Add diagnostics before optimizing blindly.



Deliver:

1. docs/technical/render-ecs-architecture.md

2. docs/technical/snapshot-interpolation.md

3. docs/technical/asset-baking-and-instancing.md

4. docs/technical/performance-budgets.md

5. implementation skeletons only where needed:

   - SnapshotBuffer

   - RenderClock

   - RenderTransformCache

   - InstanceBucket

   - ObjectPool

   - ChunkBakeQueue

6. tests/stress harness:

   - 600ms snapshots with jitter

   - region-crossing chunk load

   - 1k entities

   - 10k instanced props

   - heap stays flat under 5 min simulation



Do not implement SharedArrayBuffer yet.

Do not implement OffscreenCanvas yet.

Do not migrate to WebGPU.

Do not make shader-procedural deformation the default for gameplay geometry.

```



The refined thesis: **Old Town should feel OSRS-ticked, but the browser should never feel 600ms-ticked.** The server owns truth. The client owns presentation. The asset pipeline quietly stays ahead of the player. The renderer draws stable instanced buckets. Everything else is just keeping those boundaries pure.



[1]: https://oldschool.runescape.wiki/w/Game_tick "RuneScape clock - OSRS Wiki"

[2]: https://gafferongames.com/post/snapshot_interpolation/ "Snapshot Interpolation | Gaffer On Games"

[3]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame "Window: requestAnimationFrame() method - Web APIs | MDN"

[4]: https://gafferongames.com/post/fix_your_timestep/ "Fix Your Timestep! | Gaffer On Games"

[5]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects "Transferable objects - Web APIs | MDN"

[6]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer "SharedArrayBuffer - JavaScript | MDN"

[7]: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas "OffscreenCanvas - Web APIs | MDN"

[8]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices "WebGL best practices - Web APIs | MDN"

[9]: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query "EXT_disjoint_timer_query extension - Web APIs | MDN"
