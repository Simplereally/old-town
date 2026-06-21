# Old Town — TypeScript Anti-Pattern Audit Report

> **Generated:** 2025-05-31  
> **Audited by:** 5 parallel subagents across 5 non-overlapping lanes  
> **Total files audited:** 113 `.ts` files across all lanes  
> **Severity scale:** CRITICAL (runtime risk / type safety bypass) → WARNING (maintainability / performance) → SUGGESTION (minor improvements)

---

## Table of Contents

1. [Lane 1: Shared Types, Content Schemas & Math](#lane-1-shared-types-content-schemas--math)
2. [Lane 2: Client Rendering — Scene & Renderer](#lane-2-client-rendering--scene--renderer)
3. [Lane 3: Server Net, Sim & Protocol](#lane-3-server-net-sim--protocol)
4. [Lane 4: Server ECS, Systems & World](#lane-4-server-ecs-systems--world)
5. [Lane 5: Client UI, Engine & Input](#lane-5-client-ui-engine--input)
6. [Cross-Cutting Duplicates](#cross-cutting-duplicates)

---

## Lane 1: Shared Types, Content Schemas & Math

**Directories:** `packages/shared/src/types/`, `packages/shared/src/content/`, `packages/shared/src/content-schemas/`, `packages/shared/src/math/`  
**Files audited:** 30

### CRITICAL
*None found.*

### WARNING

#### 1. `packages/shared/src/types/coords.ts` (line 116)
> **Status:** OPEN
**Anti-pattern:** Type assertion (`as Plane`) where a runtime type guard already exists.
**Why:** `unpackTile` extracts plane bits and casts to `Plane`. A corrupted packed integer (e.g., plane bits `0b0100`) would satisfy the cast but break the `Plane` contract at runtime.
**Fix:** Use the existing `isPlane` guard and throw on mismatch.

```typescript
export function unpackTile(packed: number): TileCoord {
  const plane = (packed >>> 28) & 0x3;
  const x = (packed >>> PACKED_TILE_AXIS_BITS) & PACKED_TILE_AXIS_MAX;
  const y = packed & PACKED_TILE_AXIS_MAX;
  if (!isPlane(plane)) {
    throw new RangeError(`unpackTile: extracted plane ${plane} is not a valid Plane`);
  }
  return { x, y, plane };
}
```

---

#### 2. `packages/shared/src/content/content-registry.ts` (lines 91–97)
> **Status:** OPEN
**Anti-pattern:** `idOfDef` accepts `unknown` and narrows with `as RegionMapDef` / `as { id: string }`.
**Why:** If the function is ever called with unvalidated data (refactoring, test helper, etc.), the cast silently lies to the type system. The caller already holds a Zod-validated, fully-typed `def`.
**Fix:** Replace the `unknown` parameter with overloaded signatures so TypeScript narrows without assertions.

```typescript
function idOfDef(kind: "regionMap", def: RegionMapDef): string;
function idOfDef(kind: Exclude<ContentKind, "regionMap">, def: { id: string }): string;
function idOfDef(kind: ContentKind, def: RegionMapDef | { id: string }): string {
  if (kind === "regionMap") {
    return `${def.region.rx}:${def.region.ry}:${def.region.plane}`;
  }
  return def.id;
}
```

---

#### 3. `packages/shared/src/content/content-registry.ts` (lines 321–334)
> **Status:** OPEN
**Anti-pattern:** Building the `registries` return object by repeatedly casting `Map<string, unknown>` to per-kind typed maps (`as Map<string, ItemDef>`, etc.).
**Why:** The `maps` store is typed as `Map<string, unknown>`, so every retrieval requires an unsafe `as` cast. This scatters assertions across the module and masks type mismatches if the store ever holds the wrong kind.
**Fix:** Centralize the cast in one generic helper.

```typescript
import type { z } from "zod";

function getMap<K extends ContentKind>(kind: K): Map<string, z.infer<(typeof contentSchemas)[K]>> {
  const map = maps.get(kind);
  if (!map) throw new Error(`Missing registry map for ${kind}`);
  return map as Map<string, z.infer<(typeof contentSchemas)[K]>>;
}

// Usage in cross-reference loops:
for (const [id, def] of getMap("resourceNode")) { ... }

// Usage for the return object:
const registries: ContentRegistries = {
  item: getMap("item"),
  npc: getMap("npc"),
  object: getMap("object"),
  skill: getMap("skill"),
  resourceNode: getMap("resourceNode"),
  spell: getMap("spell"),
  dropTable: getMap("dropTable"),
  quest: getMap("quest"),
  dialogue: getMap("dialogue"),
  regionMap: getMap("regionMap"),
  material: getMap("material"),
  animation: getMap("animation"),
};
```

---

#### 4. `packages/shared/src/math/rng.ts` (lines 38–43)
> **Status:** OPEN
**Anti-pattern:** `chanceOneIn` silently truncates non-integer `chance` via `Math.trunc`.
**Why:** The parameter type is `number`, not `integer`, and the validation only checks `< 1`. Passing `1.5` truncates to `1`, so `nextInt(1, 1)` always returns `1` and the function always returns `true` — a silent logic bug.
**Fix:** Validate that `chance` is a safe integer.

```typescript
function chanceOneIn(chance: number): boolean {
  if (!Number.isSafeInteger(chance) || chance < 1) {
    throw new RangeError(`chanceOneIn: chance (${chance}) must be a safe integer >= 1`);
  }
  return nextInt(1, chance) === 1;
}
```

---

### SUGGESTION

#### 5. `packages/shared/src/types/coords.ts` (lines 13–16)
> **Status:** OPEN
**Anti-pattern:** `TileCoord` uses plain `number` for `x` and `y`, allowing floats at compile time.
**Why:** Gameplay truth is integer tiles. A plain `number` accepts `1.5` without a type error, violating the "integer world" invariant.
**Fix:** Introduce a branded integer unit for tile coordinates.

```typescript
type TileUnit = number & { readonly __brand: "TileUnit" };

export interface TileCoord {
  readonly x: TileUnit;
  readonly y: TileUnit;
  readonly plane: Plane;
}
```

---

#### 6. `packages/shared/src/content-schemas/resource-node.ts` (line 27)
> **Status:** OPEN
**Anti-pattern:** Redundant `.refine` on a field already constrained by `positiveInt`.
**Why:** `requiredLevel` is declared as `positiveInt` (>= 1), then refined again with `n.requiredLevel >= 1`. The refine is dead code.
**Fix:** Remove the refine.

---

#### 7. `packages/shared/src/content-schemas/item.ts` (line 54)
> **Status:** OPEN
**Anti-pattern:** `weight` uses unconstrained `z.number().optional()`.
**Why:** Negative weight is nonsensical for an item and could cause logic bugs in encumbrance calculations.
**Fix:** Constrain to non-negative: `weight: z.number().nonnegative().optional(),`

---

#### 8. `packages/shared/src/math/rng.ts` (line 20)
> **Status:** OPEN
**Anti-pattern:** `createRng` accepts any `number` seed without validation.
**Why:** `NaN`, `Infinity`, or non-integer seeds are silently coerced by `>>> 0`.
**Fix:** Validate the seed.

```typescript
export function createRng(seed: number): Rng {
  if (!Number.isFinite(seed)) {
    throw new RangeError(`createRng: seed must be finite, received ${seed}`);
  }
  let state = seed >>> 0;
  // ...
}
```

---

#### 9. `packages/shared/src/math/rng.ts` (lines 30–36)
> **Status:** OPEN
**Anti-pattern:** `nextInt` uses `Math.floor(nextFloat() * span)`, introducing modulo bias.
**Why:** When `span` does not evenly divide `2^32`, lower values are slightly more likely. Over millions of rolls this skews loot tables and hit rolls.
**Fix:** Use rejection sampling to eliminate bias.

```typescript
function nextInt(minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) {
    throw new RangeError(`nextInt: max (${maxInclusive}) must be >= min (${minInclusive})`);
  }
  const span = maxInclusive - minInclusive + 1;
  const maxUniform = Math.floor(4_294_967_296 / span) * span;
  let uniform: number;
  do {
    uniform = (nextFloat() * 4_294_967_296) >>> 0;
  } while (uniform >= maxUniform);
  return minInclusive + (uniform % span);
}
```

---

#### 10. `packages/shared/src/math/direction.ts` (lines 7–16)
> **Status:** OPEN
**Anti-pattern:** Numeric `enum` for `Direction`.
**Why:** Numeric enums generate reverse mappings and extra runtime objects that complicate tree-shaking and increase bundle size.
**Fix:** Replace with a const assertion.

```typescript
export const Direction = {
  North: 0,
  NorthEast: 1,
  East: 2,
  SouthEast: 3,
  South: 4,
  SouthWest: 5,
  West: 6,
  NorthWest: 7,
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];
```

---

#### 11. `packages/shared/src/content/content-registry.ts` (line 111)
> **Status:** OPEN
**Anti-pattern:** Defensive `if (!registry) { continue; }` on a lookup that is guaranteed by the type system.
**Why:** `file.kind` is `ContentKind` and `maps` is initialized for every `ContentKind` on lines 104–106. The branch is dead code.
**Fix:** Remove the branch and use a non-null assertion, or switch `maps` to a typed record.

---

#### 12. `packages/shared/src/types/coords.ts` (lines 79, 84)
> **Status:** OPEN
**Anti-pattern:** `chunkId` and `regionId` brand string keys via `as ChunkId` / `as RegionId` without validation.
**Why:** They act as branded constructors but do not validate that components are integers, unlike `entityId` and `tick` which validate.
**Fix:** Add lightweight integer validation.

```typescript
export function chunkId(chunk: ChunkCoord): ChunkId {
  if (!Number.isInteger(chunk.cx) || !Number.isInteger(chunk.cy)) {
    throw new RangeError("chunkId requires integer coordinates");
  }
  return `${chunk.cx}:${chunk.cy}:${chunk.plane}` as ChunkId;
}
```

---

#### 13. `packages/shared/src/content-schemas/npc.ts` (line 16)
> **Status:** FIXED — `actionIdSchema` now imported and used directly.
**Anti-pattern:** Raw inline regex for `actionId` instead of reusing the canonical content-id pattern.
**Why:** The regex `/^[a-z][a-z0-9_]*$/` duplicates `CONTENT_ID_PATTERN` from `content-ids.ts`. If the naming rule ever changes, this schema will drift.
**Fix:** Import and reuse the canonical pattern.

```typescript
import { CONTENT_ID_PATTERN } from "../content/content-ids";
actionId: z.string().regex(CONTENT_ID_PATTERN),
```

---

#### 14. `packages/shared/src/content-schemas/index.ts` (lines 38–51)
> **Status:** OPEN
**Anti-pattern:** `contentSchemas` object is not runtime-frozen.
**Why:** `as const` prevents re-assignment of the binding but does not prevent mutating the object properties at runtime.
**Fix:** Wrap in `Object.freeze`.

```typescript
export const contentSchemas = Object.freeze({
  item: itemDefSchema,
  // ...
} as const);
```

---

## Lane 2: Client Rendering — Scene & Renderer

**Directories:** `apps/client/src/game/scene/`, `apps/client/src/game/renderer/`  
**Files audited:** 25

### CRITICAL

#### 1. `apps/client/src/game/scene/DebugLayer.ts:186` — `Line` cast to `Mesh` via `as unknown as`
> **Status:** OPEN
**Anti-pattern:** Dangerous type assertion that lies to the type system. `Line` is not a `Mesh`.
**Why:** Type safety is completely voided. `_removeTile` assumes `mesh.geometry.dispose()` works, which happens to be true for `Line`, but any future code adding `Mesh`-specific logic will crash at runtime.
**Fix:** Change the interface to accept the real union.

```typescript
interface DebugTile {
  readonly tile: TileCoord;
  readonly mesh: Mesh | Line;
  readonly type: "trueTile" | "path" | "collision" | "footprint" | "reach" | "loS";
}

// In markLoSRay, remove the cast
this.tiles.set(key, {
  tile: { x: 0, y: 0, plane: 0 },
  mesh: line,
  type: "loS",
});

// In _removeTile, guard geometry disposal
private _removeTile(key: string): void {
  const debugTile = this.tiles.get(key);
  if (!debugTile) return;
  this.group.remove(debugTile.mesh);
  if ("geometry" in debugTile.mesh && debugTile.mesh.geometry) {
    debugTile.mesh.geometry.dispose();
  }
  this.tiles.delete(key);
}
```

---

#### 2. `apps/client/src/game/scene/ObjectRenderer.ts:178` — Type assertion on `mesh.material` without array guard
> **Status:** OPEN
**Anti-pattern:** `(mesh.material as MeshLambertMaterial).dispose()` assumes material is never an array.
**Why:** Three.js types `Mesh.material` as `Material | Material[]`. If an array is ever assigned, the cast compiles but fails at runtime.
**Fix:**

```typescript
for (const mesh of meshes) {
  mesh.geometry.dispose();
  const mat = mesh.material;
  if (Array.isArray(mat)) {
    for (const m of mat) m.dispose();
  } else {
    mat.dispose();
  }
}
```

---

#### 3. `apps/client/src/game/scene/ActorRenderer.ts:95` — Type assertion on `meshes.body.material`
> **Status:** OPEN
**Anti-pattern:** Same as #2.
**Fix:**

```typescript
meshes.body.geometry.dispose();
const bodyMat = meshes.body.material;
if (Array.isArray(bodyMat)) {
  for (const m of bodyMat) m.dispose();
} else {
  bodyMat.dispose();
}
```

---

#### 4. `apps/client/src/game/scene/ActorRenderer.ts:98` — Type assertion on `meshes.marker.material`
> **Status:** OPEN
**Anti-pattern:** Same as #2 and #3.
**Fix:** Same pattern.

---

#### 5. `apps/client/src/game/scene/HitsplatLayer.ts:71` — Type assertion on pooled mesh material
> **Status:** FIXED — Added `Array.isArray` guard and `instanceof MeshBasicMaterial` check.
**Anti-pattern:** `(mesh.material as MeshBasicMaterial).opacity = 1;`
**Why:** `Mesh.material` is `Material | Material[]`. The cast bypasses type safety.
**Fix:**

```typescript
const mat = mesh.material;
if (!Array.isArray(mat) && mat instanceof MeshBasicMaterial) {
  mat.opacity = 1;
}
```

---

#### 6. `apps/client/src/game/scene/HitsplatLayer.ts:97` — Type assertion on hitsplat mesh material
> **Status:** OPEN
**Anti-pattern:** `const mat = hitsplat.mesh.material as MeshBasicMaterial;`
**Why:** Same as #5.
**Fix:**

```typescript
const mat = hitsplat.mesh.material;
if (!Array.isArray(mat) && mat instanceof MeshBasicMaterial) {
  mat.opacity = 1 - progress;
  mat.transparent = true;
}
```

---

#### 7. `apps/client/src/game/renderer/GridOverlay.ts:26-27` — Direct property access on `material` without array guard
> **Status:** OPEN
**Anti-pattern:** `this.grid.material.transparent = true;` and `this.grid.material.opacity = opacity;`
**Why:** `GridHelper` extends `Line`, whose `material` is typed as `Material | Material[]`.
**Fix:**

```typescript
const mat = this.grid.material;
if (!Array.isArray(mat)) {
  mat.transparent = true;
  mat.opacity = opacity;
}
```

---

#### 8. `apps/client/src/game/scene/GroundItemLayer.ts:65-68` — Missing scene removal in `dispose()`
> **Status:** FIXED — Added `this.scene.remove(this.group)` to `dispose()`.
**Anti-pattern:** `dispose()` clears items and disposes the pool but never removes `this.group` from the scene.
**Why:** Memory leak. The group and any orphaned children remain referenced by the Three.js scene graph.
**Fix:**

```typescript
dispose(): void {
  this.clear();
  this.meshPool.dispose();
  this.scene.remove(this.group);
}
```

---

#### 9. `apps/client/src/game/scene/ObjectRenderer.ts:172-189` — Instance `dispose()` mutates module-level shared state
> **Status:** OPEN
**Anti-pattern:** `dispose()` calls `objectTemplates.clear()` and disposes template geometries/materials stored in a module-level `Map`.
**Why:** `objectTemplates` is shared across all `ObjectRenderer` instances. Disposing one renderer destroys the templates for all others.
**Fix:** Move `objectTemplates` into the class as an instance property, or stop clearing shared module state in instance `dispose()`.

---

#### 10. `apps/client/src/game/renderer/MeshPool.ts:85` — Pool clones geometry and material per mesh
> **Status:** OPEN
**Anti-pattern:** `new Mesh(this.geometry.clone(), this.material.clone())` creates unique geometry and material instances for every pooled mesh.
**Why:** Defeats the primary purpose of pooling: memory deduplication. In a 3D MMO with many projectiles/hitsplats/ground items, this causes unnecessary GPU memory pressure.
**Fix:** Share geometry, clone material only if the consumer requires per-mesh material mutation.

```typescript
private _createMesh(): PooledMesh {
  const mesh = new Mesh(this.geometry, this.material.clone());
  mesh.visible = false;
  const entry: PooledMesh = { mesh, inUse: false };
  this.pool.push(entry);
  return entry;
}
```

---

#### 11. `apps/client/src/game/scene/ChatOverheadLayer.test.ts:102-105` — Mutates global `performance.now`
> **Status:** OPEN
**Anti-pattern:** `Object.defineProperty(performance, "now", { value: () => fakeTime, writable: true })`
**Why:** Pollutes global state across tests. If this test fails mid-run or forgets to restore, all subsequent time-dependent tests are corrupted.
**Fix:**

```typescript
const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => fakeTime);
// ... test ...
nowSpy.mockRestore();
```

---

#### 12. `apps/client/src/game/scene/ProjectileLayer.test.ts:45` — `as unknown as` to access private state
> **Status:** OPEN
**Anti-pattern:** `(layer as unknown as { projectiles: Map<...> }).projectiles.get("proj1")`
**Why:** Breaks encapsulation. Tests should verify behavior via public APIs, not by lying to the type system to reach private fields.
**Fix:** Use `vi.spyOn(performance, "now")` to fast-forward time, then call public `update()` and assert on observable behavior.

---

#### 13. `apps/client/src/game/scene/HitsplatLayer.test.ts:50` — `as unknown as` to access private state
> **Status:** OPEN
**Anti-pattern:** Same as #12.
**Fix:** Assert on public behavior. If opacity needs verification, expose a test-only getter or check the mesh material via the scene graph with proper type guards.

---

#### 14. `apps/client/src/game/scene/HitsplatLayer.ts:34,39,44,49` — Magic number `side: 2`
> **Status:** OPEN
**Anti-pattern:** `new MeshBasicMaterial({ color: 0xff0000, side: 2 })`
**Why:** `2` is `DoubleSide` in Three.js, but using a raw magic number is unmaintainable and breaks if Three.js enum values change.
**Fix:**

```typescript
import { DoubleSide } from "three";

this.damagePool = new MeshPool({
  geometry,
  material: new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide }),
  initialSize: 4,
});
```

---

### WARNING

#### 15. `apps/client/src/game/scene/TerrainLayer.ts:150-152` — Missing geometry disposal in `dispose()`
> **Status:** OPEN
**Anti-pattern:** `dispose()` only calls `clear()` but never disposes `this.chunkGeometry` or `this.waterGeometry`.
**Why:** Memory leak. The `BoxGeometry` and `PlaneGeometry` instances created in the constructor remain in GPU memory after the layer is destroyed.
**Fix:**

```typescript
dispose(): void {
  this.clear();
  this.chunkGeometry.dispose();
  this.waterGeometry.dispose();
}
```

---

#### 16. `apps/client/src/game/scene/TerrainLayer.ts:14` — Module-level mutable `materialCache`
> **Status:** OPEN
**Anti-pattern:** `const materialCache = new Map<string, MeshLambertMaterial>();` at module scope.
**Why:** Shared mutable state across all `TerrainLayer` instances. One layer's `dispose()` or material mutation affects all others.
**Fix:** Move `materialCache` into the class as an instance property.

---

#### 17. `apps/client/src/game/scene/TerrainLayer.ts:17` — Module-level mutable `waterMaterial`
> **Status:** OPEN
**Anti-pattern:** `const waterMaterial = new MeshBasicMaterial(...)` at module scope.
**Why:** Same as #16. Shared material mutated by all instances.
**Fix:** Move into the class constructor as an instance property.

---

#### 18. `apps/client/src/game/scene/ObjectRenderer.ts:27` — Module-level mutable `objectTemplates`
> **Status:** OPEN
**Anti-pattern:** `const objectTemplates = new Map<string, ObjectTemplate>();` at module scope.
**Why:** Same as #16 and #17. Shared state with disposal hazards.
**Fix:** Make it a static or instance property of `ObjectRenderer`.

---

#### 19. `apps/client/src/game/scene/ActorRenderer.ts:191` — `getActorStates()` exposes internal mutable Map
> **Status:** OPEN
**Anti-pattern:** `return this.actors;` returns the live internal `Map`.
**Why:** Callers can mutate actor state directly (`.delete()`, `.set()`, `.clear()`), bypassing the renderer's lifecycle logic.
**Fix:**

```typescript
getActorStates(): ReadonlyMap<number, ActorState> {
  return this.actors;
}
```

---

#### 20. `apps/client/src/game/renderer/MeshPool.ts:45` — O(n) linear search in `release()`
> **Status:** OPEN
**Anti-pattern:** `const entry = this.pool.find((p) => p.mesh === mesh);`
**Why:** For large pools (e.g., 64+ projectiles), release becomes O(n) per call.
**Fix:** Maintain a `Map<Mesh, PooledMesh>` for O(1) lookup.

```typescript
private readonly meshToEntry = new Map<Mesh, PooledMesh>();

private _createMesh(): PooledMesh {
  const mesh = new Mesh(this.geometry, this.material.clone());
  mesh.visible = false;
  const entry: PooledMesh = { mesh, inUse: false };
  this.pool.push(entry);
  this.meshToEntry.set(mesh, entry);
  return entry;
}

release(mesh: Mesh): void {
  const entry = this.meshToEntry.get(mesh);
  if (!entry || !entry.inUse) return;
  // ...
}
```

---

#### 21. `apps/client/src/game/scene/DebugLayer.ts:153` — O(n) scan in `markReachTiles`
> **Status:** OPEN
**Anti-pattern:** Iterates over all debug tiles to find existing reach tiles.
**Why:** If hundreds of debug tiles exist, clearing and redrawing reach tiles is unnecessarily expensive.
**Fix:** Track reach keys in a separate `Set<string>`.

---

#### 22. `apps/client/src/game/scene/ChatOverheadLayer.test.ts:20,22,26` — `as unknown as` chains in mock setup
> **Status:** OPEN
**Anti-pattern:** `canvas.getContext = vi.fn(...) as unknown as typeof canvas.getContext;`
**Why:** Unnecessary type assertion chain. Vitest provides typed `vi.fn()` generics.
**Fix:**

```typescript
canvas.getContext = vi.fn<typeof canvas.getContext>((type) => {
  if (type === "2d") return mockCtx as unknown as CanvasRenderingContext2D;
  return null;
});
```

---

#### 23. `apps/client/src/game/scene/ObjectRenderer.test.ts:81,86,93,94` — Type assertions in tests
> **Status:** OPEN
**Anti-pattern:** `const mesh = group?.children[0] as import("three").Mesh | undefined;`
**Why:** Bypasses type safety. If the child is not a `Mesh`, the test crashes instead of failing gracefully.
**Fix:**

```typescript
const mesh = group?.children[0];
if (!(mesh instanceof Mesh)) {
  throw new Error("Expected child to be a Mesh");
}
```

---

#### 24. `apps/client/src/game/scene/TerrainLayer.ts:30-34` — Unreachable defensive throw
> **Status:** OPEN
**Anti-pattern:** After `materialCache.set(materialId, mat)`, checks `if (cached === undefined) throw ...`.
**Why:** The throw is logically unreachable for a standard `Map`.
**Fix:** Restructure to avoid the double lookup.

```typescript
function getMaterial(materialId: string): MeshLambertMaterial {
  let cached = materialCache.get(materialId);
  if (!cached) {
    const color = materialIdToColor(materialId);
    cached = new MeshLambertMaterial({ color });
    materialCache.set(materialId, cached);
  }
  return cached;
}
```

---

#### 25. `apps/client/src/game/scene/ActorRenderer.ts:240` — `rotationMap` recreated every call
> **Status:** FIXED — Hoisted `rotationMap` to module-level constant.
**Anti-pattern:** `const rotationMap: Record<Direction, number> = { ... };` inside `_directionToRotation`.
**Why:** Allocates a new object and 8 number entries on every actor interpolation frame. In a busy scene with 100 actors, that's 800 object allocations per frame.
**Fix:** Hoist to module level.

```typescript
const ROTATION_MAP: Record<Direction, number> = {
  [Direction.North]: Math.PI,
  [Direction.NorthEast]: Math.PI * 0.75,
  [Direction.East]: Math.PI * 0.5,
  [Direction.SouthEast]: Math.PI * 0.25,
  [Direction.South]: 0,
  [Direction.SouthWest]: -Math.PI * 0.25,
  [Direction.West]: -Math.PI * 0.5,
  [Direction.NorthWest]: -Math.PI * 0.75,
};

private _directionToRotation(direction: Direction): number {
  return ROTATION_MAP[direction];
}
```

---

#### 26. `apps/client/src/game/renderer/ThreeRenderer.ts:35` — Mutable constant `_pixelRatioCap`
> **Status:** OPEN
**Anti-pattern:** `private _pixelRatioCap = 2;` is never reassigned.
**Fix:** `private readonly _pixelRatioCap = 2;`

---

#### 27. `apps/client/src/game/renderer/ThreeRenderer.ts:103` — Mutable constant `_resizeDebounceMs`
> **Status:** OPEN
**Anti-pattern:** `private _resizeDebounceMs = 100;` is never reassigned.
**Fix:** `private readonly _resizeDebounceMs = 100;`

---

#### 28. `apps/client/src/game/scene/ProjectileLayer.ts:66-78` — Map mutation during iteration
> **Status:** FIXED — Collect IDs into `toRemove` array, remove after loop.
**Anti-pattern:** `this.remove(proj.id)` called inside `for (const proj of this.projectiles.values())`.
**Fix:** Collect IDs first, then remove.

```typescript
update(): void {
  const now = performance.now();
  const toRemove: string[] = [];
  for (const proj of this.projectiles.values()) {
    const progress = Math.min((now - proj.startTime) / GAME_TICK_MS, 1);
    const startWorld = this._tileToWorld(proj.startTile);
    const endWorld = this._tileToWorld(proj.endTile);
    proj.mesh.position.lerpVectors(startWorld, endWorld, progress);
    proj.mesh.position.y = 1.5 + Math.sin(progress * Math.PI) * 2;
    if (progress >= 1) {
      toRemove.push(proj.id);
    }
  }
  for (const id of toRemove) {
    this.remove(id);
  }
}
```

---

#### 29. `apps/client/src/game/scene/HitsplatLayer.ts:83-105` — Map mutation during iteration
> **Status:** OPEN
**Anti-pattern:** Same as #28.
**Fix:** Collect IDs to remove after the loop.

---

#### 30. `apps/client/src/game/scene/TerrainLayer.ts:112-118` — Map mutation during iteration
> **Status:** OPEN
**Anti-pattern:** `this.unloadChunk(key)` (which calls `this.chunks.delete(key)`) inside `for (const [key, chunk] of this.chunks)`.
**Fix:**

```typescript
unloadRegion(regionId: string): void {
  const keys: string[] = [];
  for (const [key, chunk] of this.chunks) {
    if (chunk.regionId === regionId) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    this.unloadChunk(key);
  }
}
```

---

#### 31. `apps/client/src/game/scene/DebugLayer.ts:318-324` — `drawLine` leaks untracked geometry
> **Status:** FIXED — Added `_untrackedLines` array; `clear()` now removes and disposes them.
**Anti-pattern:** `drawLine` adds a `Line` to `this.group` but does not register it in `this.tiles`.
**Why:** `clear()` only removes tiles tracked in `this.tiles`. Lines drawn via `drawLine` are orphaned until `dispose()` is called.
**Fix:** Track drawn lines in a separate array.

```typescript
private readonly _untrackedLines: Line[] = [];

drawLine(start: Vector3, end: Vector3, color = 0xffff00): Line {
  const material = new LineBasicMaterial({ color });
  const geometry = new BufferGeometry().setFromPoints([start, end]);
  const line = new Line(geometry, material);
  this.group.add(line);
  this._untrackedLines.push(line);
  return line;
}

clear(): void {
  for (const key of this.tiles.keys()) {
    this._removeTile(key);
  }
  for (const line of this._untrackedLines) {
    this.group.remove(line);
    line.geometry.dispose();
    const mat = line.material;
    if (Array.isArray(mat)) {
      for (const m of mat) m.dispose();
    } else {
      mat.dispose();
    }
  }
  this._untrackedLines.length = 0;
}
```

---

### SUGGESTION

#### 32. `apps/client/src/game/scene/ObjectRenderer.ts:198-204` — `getRaycastTargets()` allocates new array every call
> **Status:** OPEN
**Fix:** Return a read-only view.

```typescript
getRaycastTargets(): readonly Mesh[] {
  return Array.from(this.objects.values(), (obj) => obj.mesh);
}
```

---

#### 33. `apps/client/src/game/scene/ActorRenderer.ts:199-205` — `getRaycastTargets()` allocates new array every call
> **Status:** OPEN
**Fix:** Same pattern as #32.

---

#### 34. `apps/client/src/game/scene/GroundItemLayer.ts:74-80` — `getRaycastTargets()` allocates new array every call
> **Status:** OPEN
**Fix:** Same pattern as #32.

---

#### 35. `apps/client/src/game/scene/DebugLayer.ts:231-289` — Large switch statements for primitive toggles
> **Status:** OPEN
**Fix:** Use a `Map` or `Record`.

```typescript
private readonly _showFlags: Record<DebugPrimitive, boolean> = {
  trueTile: true,
  path: true,
  collision: false,
  footprint: false,
  loS: false,
  reach: false,
  actionQueue: false,
  combatCooldown: false,
  npcLeash: false,
  varbits: false,
};

setShowPrimitive(primitive: DebugPrimitive, value: boolean): void {
  this._showFlags[primitive] = value;
}

getShowPrimitive(primitive: DebugPrimitive): boolean {
  return this._showFlags[primitive];
}
```

---

#### 36. `apps/client/src/game/scene/TerrainLayer.ts:128` — Inline indexed access type
> **Status:** OPEN
**Anti-pattern:** `tile: ChunkData["tiles"][number]`
**Fix:**

```typescript
type TileData = ChunkData["tiles"][number];

private createTileMesh(tile: TileData): Mesh {
  // ...
}
```

---

#### 37. `apps/client/src/game/scene/ActorRenderer.ts:250` — Unreachable fallback `?? 0`
> **Status:** OPEN
**Anti-pattern:** `return rotationMap[direction] ?? 0;`
**Why:** `Record<Direction, number>` guarantees every `Direction` enum value is present.
**Fix:** `return rotationMap[direction];`

---

#### 38. `apps/client/src/game/scene/ObjectRenderer.ts:94-101` — `defIdToType` uses loose `includes` matching
> **Status:** OPEN
**Anti-pattern:** `if (defId.includes("tree")) return "tree";`
**Why:** False positives (e.g., `"treehouse"` matches `"tree"`). Return type is loose `string` instead of a union.
**Fix:**

```typescript
type ObjectType = "tree" | "rock" | "building" | "door" | "resource" | "default";

function defIdToType(defId: string): ObjectType {
  if (defId.startsWith("tree")) return "tree";
  if (defId.startsWith("rock")) return "rock";
  if (defId.startsWith("building")) return "building";
  if (defId.startsWith("door")) return "door";
  if (defId.startsWith("ore") || defId.startsWith("node")) return "resource";
  return "default";
}
```

---

#### 39. `apps/client/src/game/scene/ChatOverheadLayer.ts:100-103` — `clear()` uses `Array.from` unnecessarily
> **Status:** OPEN
**Fix:**

```typescript
clear(): void {
  const ids = [...this.bubbles.keys()];
  for (const id of ids) {
    this.remove(id);
  }
}
```

---

## Lane 3: Server Net, Sim & Protocol

**Directories:** `apps/server/src/net/`, `apps/server/src/sim/`, `packages/shared/src/protocol/`  
**Files audited:** 30

### CRITICAL

#### 1. `packages/shared/src/protocol/transport.ts:55-56` — `decodeTransportMessage` casts untrusted JSON directly to typed message
> **Status:** FIXED — `decodeTransportMessage` is deprecated (E48-S03). `parseTransportMessage` validates with `transportClientMessageSchema` (Zod discriminated union) and returns `ParseResult<TransportClientMessage>`.
**Anti-pattern:** `return JSON.parse(raw) as TransportClientMessage;`
**Why:** Any malicious client can send arbitrary JSON and it is immediately treated as a valid protocol message. The cast bypasses all type safety on the wire boundary.
**Fix:**

```typescript
export function decodeTransportMessage(raw: string): unknown {
  return JSON.parse(raw);
}
```
Validate with `parseClientCommand` or a Zod schema before narrowing to `TransportClientMessage`.

---

#### 2. `packages/shared/src/protocol/packets.ts:202-203` — `decodeServerPacket` casts untrusted JSON directly to `ServerPacket`
> **Status:** FIXED — `decodeServerPacket` is deprecated (E48-S02). `parseServerPacket` validates with `serverPacketSchema` (Zod discriminated union) and returns `ParseResult<ServerPacket>`.
**Anti-pattern:** `return JSON.parse(raw) as ServerPacket;`
**Why:** Even if the server is "trusted," this function could be called with malformed data, proxy responses, or test fixtures.
**Fix:**

```typescript
export function decodeServerPacket(raw: string): unknown {
  return JSON.parse(raw);
}
```
Add a Zod validation step before asserting the shape.

---

#### 3. `packages/shared/src/protocol/command-schemas.ts:103` — Zod validation result cast bypasses TypeScript
> **Status:** OPEN
**Anti-pattern:** `return { ok: true, value: result.data as unknown as ClientCommand };`
**Why:** The `as unknown as ClientCommand` severs the compile-time link between the Zod schema and the TypeScript interface.
**Fix:** Define `ClientCommand` from the schema:

```typescript
export type ClientCommand = z.infer<typeof clientCommandSchema>;
```
Then remove the cast entirely:

```typescript
return { ok: true, value: result.data };
```

---

#### 4. `apps/server/src/net/websocket-transport.ts:51-58` — `parseDevAuth` uses multiple `as` casts on unknown input
> **Status:** FIXED — `parseDevAuth` removed (E48-S03). `parseTransportMessage` validates the full `TransportClientMessage` union, which includes `devAuthMessageSchema`. No hand-written type guard remains.
**Anti-pattern:** `(raw as { type?: unknown }).type`, `return raw as DevAuthMessage`
**Why:** Manual property probing followed by a broad cast is fragile.
**Fix:** Use a Zod schema:

```typescript
const devAuthSchema = z.object({
  type: z.literal(TransportClientMessageType.DevAuth),
  protocolVersion: z.number(),
  characterId: z.string().optional(),
}).strict();

function parseDevAuth(raw: unknown): DevAuthMessage | undefined {
  const result = devAuthSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}
```

---

#### 5. `apps/server/src/sim/command-buffer.ts:139` + `151-157` — `seenCommandIds` never cleaned up; unbounded memory growth
> **Status:** FIXED — Pruning added to `consumeTick`.
**Anti-pattern:** `private readonly seenCommandIds = new Map<string, Set<number>>();` with no eviction.
**Why:** For every `(connectionId, entityId)` pair, every command ID ever sent is retained forever. In a long-lived MMO connection this is a guaranteed memory leak.
**Fix:** Prune stale entries in `consumeTick` (or add a TTL).

```typescript
// In consumeTick, or add a dedicated prune method:
for (const [key, seen] of this.seenCommandIds) {
  if (seen.size > 10_000) {
    this.seenCommandIds.delete(key);
  }
}
```

---

#### 6. `apps/server/src/net/interest-manager.ts:143` + `145-185` — `stateByPlayer` has no removal path; leaks disconnected players
> **Status:** FIXED — `removePlayer` method added.
**Anti-pattern:** `private readonly stateByPlayer = new Map<EntityId, InterestState>()` with no `remove` method.
**Why:** When a player disconnects, `DevSessionManager.remove` destroys the entity but never cleans up the interest manager.
**Fix:** Add an explicit cleanup method.

```typescript
removePlayer(player: EntityId): void {
  this.stateByPlayer.delete(player);
}
```

---

#### 7. `apps/server/src/net/interest-manager.ts:67-85` + `235-242` — `packetWith` leaks non-entity deltas to every player
> **Status:** OPEN
**Anti-pattern:** `return { ...packet, entityAdds: changes.entityAdds, ... };`
**Why:** By spreading the full `TickDeltaPacket` and only overriding entity/region/chat fields, **inventory deltas, skill deltas, varbit deltas, hitsplats, XP drops, sounds, interface opens, and debug data** are forwarded unfiltered to every connected client.
**Fix:** Do not spread the raw packet. Build a fresh, explicitly filtered packet.

```typescript
return {
  type: ServerPacketType.TickDelta,
  tick: delta.tick,
  serverTime: delta.serverTime,
  entityAdds,
  entityRemoves: Array.from(entityRemoves).sort(entityOrder),
  entityUpdates,
  ...(chat.length > 0 ? { chat } : {}),
  ...(transition.regionLoads.length > 0 ? { regionLoads: transition.regionLoads } : {}),
  ...(transition.regionUnloads.length > 0 ? { regionUnloads: transition.regionUnloads } : {}),
};
```

---

#### 8. `apps/server/src/sim/delta-accumulator.ts:86-99` + `101-107` — `DeltaAccumulator` design cannot support multiple players
> **Status:** OPEN
**Anti-pattern:** Single `inventoryDelta` container; `skillDeltas` and `varbitDeltas` keyed by content id without player scope.
**Why:** `markInventoryDelta` throws if a second container is added. `markSkillDelta` overwrites by `skillId`, so if two players gain woodcutting XP, only the last write survives.
**Fix:** Track per-player/container and per-player/skill state.

```typescript
private readonly inventoryDeltas = new Map<string, InventoryDeltaBuilder>();
private readonly skillDeltas = new Map<EntityId, Map<string, SkillDelta>>();
private readonly varbitDeltas = new Map<EntityId, Map<string, VarbitDelta>>();
```

---

### WARNING

#### 9. `apps/server/src/net/dev-session.ts:148`, `apps/server/src/net/interest-manager.ts:64`, `apps/server/src/sim/command-buffer.ts:179`, `apps/server/src/sim/delta-accumulator.ts:41-43` — `EntityId` cast to `number` for sorting
> **Status:** OPEN
**Anti-pattern:** `(a as number) - (b as number)`
**Why:** Scattered type assertions assume `EntityId` is a branded number. If the branding changes, these break silently.
**Fix:** Centralize in shared types.

```typescript
// packages/shared/src/types/ids.ts
export function compareEntityId(a: EntityId, b: EntityId): number {
  return (a as number) - (b as number);
}
```

---

#### 10. `apps/server/src/net/dev-session.ts:159`, `apps/server/src/net/delta-broadcaster.ts:23`, `apps/server/src/net/interest-manager.ts:60,117,135` — Unnecessary `plane` type assertions
> **Status:** OPEN
**Anti-pattern:** `plane: position.plane as TileCoord["plane"]`, `plane: planeRaw as RegionCoord["plane"]`
**Why:** These suggest the underlying store or parser returns `number` where a narrower literal union is expected.
**Fix:** Update the position store and region parsers to emit `TileCoord["plane"]` (i.e. `0 | 1 | 2 | 3`) directly.

---

#### 11. `apps/server/src/sim/command-buffer.ts:38-52` — `BufferedIntent` uses unmaintainable conditional type inference
> **Status:** OPEN
**Anti-pattern:** Nested `infer T` / ternary type gymnastics to derive a union.
**Why:** The type is nearly impossible to verify by inspection and will break in confusing ways when a new command is added.
**Fix:** Explicitly declare the union.

```typescript
export type BufferedIntent =
  | { readonly kind: typeof IntentKind.Move; readonly ownerEntityId: EntityId; readonly connectionId: string; readonly commandId: number; readonly receivedTick: number; readonly targetTick: number; readonly payload: MoveIntent }
  | { readonly kind: typeof IntentKind.Object; /* ... */ readonly payload: ObjectIntent }
  // ... etc for each kind
```

---

#### 12. `apps/server/src/sim/tick-loop.ts:127-134` — `runDueTicks` has no catch-up limit
> **Status:** FIXED — `maxCatchUp = 5` cap added.
**Anti-pattern:** `while (this.serverTime + GAME_TICK_MS <= nowMs) { this.runOneTick(); }`
**Why:** If the system clock jumps forward, the loop runs an unbounded number of ticks in a single call, causing a spiral of death.
**Fix:** Cap the catch-up.

```typescript
runDueTicks(nowMs: number): number {
  let ran = 0;
  const maxCatchUp = 5;
  while (this.serverTime + GAME_TICK_MS <= nowMs && ran < maxCatchUp) {
    this.runOneTick();
    ran += 1;
  }
  return ran;
}
```

---

#### 13. `apps/server/src/net/websocket-transport.ts:157-159` — WebSocket `error` handler does not clean up the session
> **Status:** FIXED — `socket.terminate()` added to error handler.
**Anti-pattern:** `socket.on("error", (error) => { options.logger.warn(...); });`
**Why:** If a socket errors and the `close` event never fires, the session and socket references leak.
**Fix:** Force termination.

```typescript
socket.on("error", (error) => {
  options.logger.warn("ws", "Socket error", { message: error.message });
  socket.terminate();
});
```

---

#### 14. `apps/server/src/net/delta-broadcaster.test.ts:78`, `194`, `198` — Type assertions in tests
> **Status:** STALE — `delta-broadcaster.test.ts` no longer exists.
**Anti-pattern:** `undefined as DeltaBroadcaster | undefined`, `as { readonly selfEntityId: ... }`, `as Promise<TickDeltaPacket>`
**Why:** Tests should validate shapes at runtime, not assert them.
**Fix:** Use proper variable typing.

```typescript
let broadcaster: DeltaBroadcaster | undefined;
```

---

#### 15. `apps/server/src/net/interest-manager.ts:46-48` — `diffSets` sorts before filtering
> **Status:** OPEN
**Anti-pattern:** `sortedIds(next).filter((value) => !previous.has(value));`
**Why:** Sorting is O(n log n). Set difference is O(n) if you iterate and filter first, then sort only the result.
**Fix:**

```typescript
function diffSets<T extends string>(next: ReadonlySet<T>, previous: ReadonlySet<T>): readonly T[] {
  return Array.from(next)
    .filter((value) => !previous.has(value))
    .sort((a, b) => a.localeCompare(b));
}
```

---

#### 16. `apps/server/src/net/interest-manager.ts:126-128` — `intersectingRegions` parses chunkId strings to recover coordinates
> **Status:** OPEN
**Anti-pattern:** `String(chunk).split(":").map((part) => Number.parseInt(part, 10));`
**Why:** This is O(m) string work per chunk and duplicates the logic of `chunkId()` construction.
**Fix:** Store chunk coordinates as a typed object or tuple alongside the string id, or provide a `parseChunkId(id: ChunkId): { cx: number; cy: number; plane: number }` helper in shared types.

---

#### 17. `apps/server/src/net/command-router.ts:42` + `63` — `countsBySessionTick` uses string key parsing
> **Status:** FIXED — Refactored to nested `Map<number, Map<string, number>>` in `simulation-kernel.ts`.
**Anti-pattern:** `const countKey = \`${session.id}:${targetTick}\`;` then `Number.parseInt(key.slice(key.lastIndexOf(":") + 1), 10)`
**Why:** String concatenation and parsing is fragile (what if `session.id` contains `:`?) and slower than structured keys.
**Fix:** Use nested Maps.

```typescript
private readonly countsBySessionTick = new Map<string, Map<number, number>>();

// route:
const byTick = this.countsBySessionTick.get(session.id) ?? new Map<number, number>();
const count = byTick.get(targetTick) ?? 0;
byTick.set(targetTick, count + 1);
this.countsBySessionTick.set(session.id, byTick);

// consumeTick:
for (const [sessionId, byTick] of this.countsBySessionTick) {
  for (const [t] of byTick) {
    if (t <= tick) byTick.delete(t);
  }
  if (byTick.size === 0) this.countsBySessionTick.delete(sessionId);
}
```

---

#### 18. `apps/server/src/sim/tick-loop.ts:92-96` — `registerPhase` deregistration is O(n)
> **Status:** OPEN
**Anti-pattern:** `handlers.indexOf(handler)` + `handlers.splice(index, 1)`
**Why:** Linear scan per deregistration.
**Fix:** Use a `Set<TickPhaseHandler>` or assign monotonic IDs.

```typescript
private readonly handlers = new Map<TickPhase, Map<number, TickPhaseHandler>>();
private nextHandlerId = 0;

registerPhase(phase: TickPhase, handler: TickPhaseHandler): () => void {
  const id = this.nextHandlerId++;
  const map = this.handlers.get(phase)!;
  map.set(id, handler);
  return () => { map.delete(id); };
}
```

---

#### 19. `apps/server/src/net/websocket-transport.ts:47` — `send` helper uses indirect type reference
> **Status:** OPEN
**Anti-pattern:** `packet: Parameters<typeof encodeTransportPacket>[0]`
**Why:** Clever but hurts readability.
**Fix:** `function send(socket: WebSocket, packet: TransportServerPacket): void`

---

#### 20. `apps/server/src/net/websocket-transport.ts:138-144` — Successful commands are silent
> **Status:** OPEN
**Anti-pattern:** `if (routeResult && !routeResult.ok) { send rejection }` — no `else` branch.
**Why:** If `onCommand` returns `{ ok: true }`, the client receives no acknowledgment.
**Fix:** Either document the intentional fire-and-forget, or send an explicit `CommandAccepted` packet.

---

#### 21. `apps/server/src/sim/delta-accumulator.ts:46` — `hasPayloadFields` uses `Object.values`
> **Status:** OPEN
**Anti-pattern:** `Object.values(payload).some((value) => value !== undefined)`
**Why:** `Object.values` loses type information and iterates over every key even though the shape is known.
**Fix:** Check the known fields explicitly.

```typescript
function hasPayloadFields(payload: EntityUpdatePayload): boolean {
  return (
    payload.position !== undefined ||
    payload.facingTile !== undefined ||
    payload.facingEntity !== undefined ||
    payload.animation !== undefined ||
    payload.graphic !== undefined ||
    payload.hitsplat !== undefined ||
    payload.overheadText !== undefined ||
    payload.appearance !== undefined ||
    payload.equipment !== undefined ||
    payload.healthBar !== undefined ||
    payload.transform !== undefined ||
    payload.moveSpeed !== undefined
  );
}
```

---

#### 22. `apps/server/src/sim/action-queue.ts:195-210` — `shouldRequeue` uses a type predicate on a private method
> **Status:** OPEN
**Anti-pattern:** `): entry is ActionQueueEntry & { readonly repeat: ActionRepeat } {`
**Why:** A type predicate on a private boolean method is over-engineered.
**Fix:** Return plain `boolean` and narrow at the call site.

```typescript
private shouldRequeue(
  entry: ActionQueueEntry,
  execution: ActionExecution,
  shouldRepeat: ActionQueueAdvanceOptions["shouldRepeat"],
): boolean {
  if (!entry.repeat) return false;
  if (entry.repeat.maxRepeats !== undefined && execution.executionCount >= entry.repeat.maxRepeats) {
    return false;
  }
  return shouldRepeat?.(execution) ?? true;
}
```

---

#### 23. `apps/server/src/net/interest-manager.ts:193-201` — `filterDelta` mutates internal state as a side effect
> **Status:** OPEN
**Anti-pattern:** Creates a default `InterestState`, mutates it, and stores it back into `stateByPlayer`.
**Why:** A method named `filterDelta` should be pure.
**Fix:** Separate interest updates from filtering. Call `updateInterest(player, center)` explicitly before `filterDelta`.

---

#### 24. `apps/server/src/net/interest-manager.ts:179-182` — `updateInterest` mutates `previous` collections directly
> **Status:** OPEN
**Anti-pattern:** `previous.chunks.clear(); for (const chunk of nextChunks) previous.chunks.add(chunk);`
**Why:** The `InterestState` interface marks `chunks` and `regions` as `readonly`, but `readonly` on a `Set`/`Map` reference does not prevent mutation of the collection.
**Fix:** Replace the collections entirely.

```typescript
this.stateByPlayer.set(player, {
  chunks: new Set(nextChunks),
  regions: new Map(nextRegions),
  knownEntities: previous.knownEntities,
});
```

---

#### 25. `apps/server/src/net/delta-broadcaster.ts:40-55` — `broadcastTick` returns the unfiltered raw delta
> **Status:** STALE — `delta-broadcaster.ts` no longer exists; broadcasting logic moved to `simulation-kernel.ts`.
**Anti-pattern:** Method sends filtered packets to clients but returns the unfiltered accumulator state.
**Why:** The return value is misleading.
**Fix:** Return `void` and rename the method, or return a summary of what was sent.

---

#### 26. `packages/shared/src/protocol/packets.ts:175` — `TickDeltaPacket` only allows one inventory delta
> **Status:** FIXED — Changed to `readonly inventoryDeltas?: readonly InventoryDelta[]`.
**Anti-pattern:** `readonly inventoryDelta?: InventoryDelta;` (singular)
**Why:** The type itself prevents sending inventory changes for more than one player/container per tick.
**Fix:** Change to an array.

```typescript
readonly inventoryDeltas?: readonly InventoryDelta[];
```

---

#### 27. `packages/shared/src/protocol/command-schemas.ts:24` — `command` helper uses loose `z.ZodTypeAny`
> **Status:** OPEN
**Anti-pattern:** `function command<T extends z.ZodTypeAny>(...)`
**Why:** `ZodTypeAny` accepts any Zod schema without constraining the inferred type.
**Fix:**

```typescript
function command<TPayload>(type: ClientCommandType, payload: z.ZodType<TPayload>) {
  return z.object({
    type: z.literal(type),
    commandId: commandIdSchema,
    clientTickHint: clientTickHintSchema.optional(),
    payload,
  }).strict();
}
```

---

### SUGGESTION

#### 28. `apps/server/src/net/websocket-transport.ts:67` — `nextSessionId` is a bare mutable counter
> **Status:** OPEN
**Fix:** Extract to a small generator.

```typescript
function createSessionIdGenerator(): () => string {
  let next = 1;
  return () => `dev-${next++}`;
}
```

---

#### 29. `apps/server/src/net/interest-manager.ts:63-65` + `apps/server/src/sim/delta-accumulator.ts:41-43` — `entityOrder` helper duplicated
> **Status:** OPEN
**Fix:** Move to `packages/shared/src/types/ids.ts`.

```typescript
export function entityIdOrder(a: EntityId, b: EntityId): number {
  return (a as number) - (b as number);
}
```

---

#### 30. `apps/server/src/net/interest-manager.ts:50-61` + `126-128` — String-parsing logic for region/chunk IDs duplicated
> **Status:** OPEN
**Fix:** Provide inverse helpers in shared types.

```typescript
export function parseRegionId(id: RegionId): { rx: number; ry: number; plane: number };
export function parseChunkId(id: ChunkId): { cx: number; cy: number; plane: number };
```

---

## Lane 4: Server ECS, Systems & World

**Directories:** `apps/server/src/ecs/`, `apps/server/src/systems/`, `apps/server/src/world/`  
**Files audited:** 17

### CRITICAL

#### 1. `apps/server/src/ecs/entity.ts:21` and `entity.ts:30`
> **Status:** FIXED — `EntityPool` now stores `EntityId` directly; `as number` casts removed.
**Anti-pattern:** `id as number` type assertion on `EntityId`.
**Why:** If `EntityId` is a branded nominal type, `as number` silently strips the brand, allowing raw numbers to leak into `EntityId`-typed contexts and breaking type safety across the ECS.
**Fix:** Store `EntityId` directly in the pool so no assertion is needed.

```typescript
export class EntityPool {
  private nextId = 0;
  private freeList: EntityId[] = [];
  private alive = new Set<EntityId>();

  allocate(): EntityId {
    const reused = this.freeList.pop();
    const id = reused ?? entityId(this.nextId++);
    this.alive.add(id);
    return id;
  }

  release(id: EntityId): void {
    if (!this.alive.has(id)) {
      throw new Error(`Cannot release non-existent entity ${id}`);
    }
    this.alive.delete(id);
    this.freeList.push(id);
  }

  isAlive(id: EntityId): boolean {
    return this.alive.has(id);
  }

  getAlive(): readonly EntityId[] {
    return Array.from(this.alive);
  }
}
```

---

#### 2. `apps/server/src/world/pathfinding.ts:98`
> **Status:** OPEN — Requires binary heap replacement; deferred to avoid large refactor.
**Anti-pattern:** `open.sort(compareNodes)` inside the A* expansion loop.
**Why:** Sorting the open list on every node expansion is O(m log m) per expansion, making the overall algorithm O(n² log n) worst-case instead of O(n log n). With `maxVisited = 4096`, this can perform ~200M comparisons per pathfind.
**Fix:** Replace the array with a binary min-heap.

```typescript
class BinaryHeap<T> {
  private heap: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}
  push(item: T): void {
    let i = this.heap.length;
    this.heap.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(this.heap[p]!, item) <= 0) break;
      this.heap[i] = this.heap[p]!;
      this.heap[p] = item;
      i = p;
    }
  }
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const root = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length === 0) return root;
    this.heap[0] = last;
    let i = 0;
    while (true) {
      const l = (i << 1) + 1;
      const r = l + 1;
      let smallest = i;
      if (l < this.heap.length && this.compare(this.heap[l]!, this.heap[smallest]!) < 0) smallest = l;
      if (r < this.heap.length && this.compare(this.heap[r]!, this.heap[smallest]!) < 0) smallest = r;
      if (smallest === i) break;
      const tmp = this.heap[i]!;
      this.heap[i] = this.heap[smallest]!;
      this.heap[smallest] = tmp;
      i = smallest;
    }
    return root;
  }
  get size(): number {
    return this.heap.length;
  }
}

// In findPath:
const open = new BinaryHeap<SearchNode>(compareNodes);
open.push(startNode);
// ...
while (open.size > 0 && closed.size < maxVisited) {
  const current = open.pop();
  if (!current || closed.has(current.key)) continue;
  // ...
  open.push(node);
}
```

---

#### 3. `apps/server/src/systems/interaction-reach.ts:151–175`
> **Status:** OPEN — Requires BFS replacement for looped A*; deferred to avoid large refactor.
**Anti-pattern:** Calling `findPath` (A*) inside a loop over candidate tiles.
**Why:** For `requiredDistance = 4`, `candidateTiles` generates ~80 candidates. Each A* explores up to 4096 nodes, yielding up to 327k node explorations per interaction resolve.
**Fix:** Replace the looped A* with a single BFS from the actor that stops at the first reachable candidate.

```typescript
export function findNearestInteractionTile(
  collision: CollisionMap,
  actorTile: TileCoord,
  target: InteractionTarget,
  actorFootprint: Footprint = ONE_TILE,
): TileCoord | undefined {
  const candidates = candidateTiles(target, actorFootprint);
  const goalSet = new Set(candidates.map((t) => `${t.x}:${t.y}:${t.plane}`));

  const queue: TileCoord[] = [actorTile];
  const visited = new Set<string>([`${actorTile.x}:${actorTile.y}:${actorTile.plane}`]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = `${current.x}:${current.y}:${current.plane}`;

    if (goalSet.has(currentKey) && collision.canOccupy(current, actorFootprint)) {
      if (
        target.requiresLineOfSight !== true ||
        hasTargetLineOfSight(collision, current, target)
      ) {
        return current;
      }
    }

    for (const [dx, dy] of [
      [0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, -1], [-1, 1],
    ] as const) {
      const next: TileCoord = {
        x: current.x + dx,
        y: current.y + dy,
        plane: current.plane,
      };
      const nextKey = `${next.x}:${next.y}:${next.plane}`;
      if (visited.has(nextKey)) continue;
      if (!collision.canStep(current, next, actorFootprint)) continue;
      visited.add(nextKey);
      queue.push(next);
    }
  }

  return undefined;
}
```

---

#### 4. `apps/server/src/systems/movement-system.ts:119`
> **Status:** FIXED — Replaced `slice(1)` in loop with `pathIndex` tracking; single `slice` at end.
**Anti-pattern:** `remainingPath = remainingPath.slice(1)` inside the step loop.
**Why:** `Array.prototype.slice(1)` is O(n) where n is the remaining path length. Called up to `stepCount` (2) times per entity per tick. For a 64-tile path, this copies up to 128 elements per entity per tick.
**Fix:** Track a path index and slice once at the end.

```typescript
let pathIndex = 0;
for (let i = 0; i < stepCount; i += 1) {
  const next = movement.path[pathIndex];
  if (!next) break;
  if (!context.collision.canStep(current, next, footprint)) {
    pathIndex = 0;
    context.world.stores.movement.set(entityId, {
      entityId,
      mode: movement.mode,
      path: [],
      ...(lastStepDirection !== undefined ? { lastStepDirection } : {}),
      blockedUntilTick: tick + 1,
    });
    break;
  }
  pathIndex += 1;
  // ... rest of step logic unchanged
}

const remainingPath = movement.path.slice(pathIndex);
// ... use remainingPath for the store update and debug path
```

---

### WARNING

#### 5. `apps/server/src/systems/movement-system.ts:39`
> **Status:** FIXED — `PositionComponent.plane` changed to `Plane`; cast removed.
**Anti-pattern:** `position.plane as TileCoord["plane"]` type assertion.
**Why:** Unnecessary and dangerous cast. If `TileCoord["plane"]` is `number`, this is redundant. If it's branded, it bypasses type safety.
**Fix:** Remove the assertion and align `PositionComponent.plane` to match `TileCoord["plane"]`.

---

#### 6. `apps/server/src/systems/movement-system.ts:47`
> **Status:** FIXED — Sorting removed; `sortedMovementEntityIds` now delegates directly to `world.entityIdsWith`.
**Anti-pattern:** `(a as number) - (b as number)` in `sortedMovementEntityIds`.
**Why:** Type assertion on `EntityId`. Also sorts every tick at O(m log m) cost.
**Fix:** If order is not required, remove sorting entirely. If required, use a raw helper after fixing `EntityPool`.

---

#### 7. `apps/server/src/world/region-loader.ts:32`
> **Status:** FIXED — `RuntimeRegion` now uses `EntityId[]`; `entityNumbers` helper deleted.
**Anti-pattern:** `id as number` in `entityNumbers`.
**Why:** Same brand-stripping issue as CRITICAL #1.
**Fix:** Change `RuntimeRegion` to store `EntityId` arrays and delete `entityNumbers`.

```typescript
export interface RuntimeRegion {
  // ...
  readonly objectEntityIds: readonly EntityId[];
  readonly npcEntityIds: readonly EntityId[];
  readonly groundItemEntityIds: readonly EntityId[];
  readonly resourceNodeEntityIds: readonly EntityId[];
  // ...
}
```

---

#### 8. `apps/server/src/world/region-loader.ts:46`
> **Status:** FIXED — `RuntimeAreaTrigger.plane` changed to `Plane`; cast removed.
**Anti-pattern:** `region.plane as TileCoord["plane"]` type assertion.
**Why:** Unnecessary cast in `globalTile`.
**Fix:** Remove the assertion.

---

#### 9. `apps/server/src/world/collision.ts:311`
> **Status:** FIXED — Cast removed; `position.plane` is now `Plane`.
**Anti-pattern:** `position.plane as TileCoord["plane"]` type assertion.
**Why:** Same unnecessary cast pattern.
**Fix:** Remove the assertion.

---

#### 10. `apps/server/src/systems/interaction-reach.ts:140`
> **Status:** STALE — Current code returns `candidates` without sorting; no mutation issue.
**Anti-pattern:** `candidates.sort(...)` returning `readonly TileCoord[]`.
**Why:** `sort` mutates the array in place, but the function signature promises a readonly view.
**Fix:** Copy before sorting.

```typescript
return [...candidates].sort((a, b) => a.x - b.x || a.y - b.y);
```

---

#### 11. `apps/server/src/ecs/components.ts:78`
> **Status:** FIXED — `slots` now uses `Partial<Record<EquipmentSlotName, string>>`.
**Anti-pattern:** `slots: Record<string, string | undefined>` loose index signature.
**Why:** Accepts any string key without compile-time validation. Typos like `slots.helmat` compile silently.
**Fix:** Use a union of known equipment slots.

```typescript
type EquipmentSlot =
  | "head"
  | "cape"
  | "neck"
  | "ammo"
  | "weapon"
  | "body"
  | "shield"
  | "legs"
  | "hands"
  | "feet"
  | "ring";

export interface EquipmentComponent {
  entityId: EntityId;
  slots: Partial<Record<EquipmentSlot, string>>;
}
```

---

#### 12. `apps/server/src/ecs/components.ts:88`
> **Status:** OPEN — Requires `SkillId` union; deferred to avoid breaking content-driven skill registry.
**Anti-pattern:** `skills: Record<string, SkillState>` loose index signature.
**Fix:** Use a union of skill IDs or a branded type.

```typescript
type SkillId = "woodcutting" | "mining" | "fishing" | "attack" | "strength" | "defence" | "hitpoints";

export interface SkillsComponent {
  entityId: EntityId;
  skills: Partial<Record<SkillId, SkillState>>;
}
```

---

#### 13. `apps/server/src/ecs/components.ts:114`
> **Status:** OPEN — Requires `QuestVarId` brand; deferred as quest vars are dynamically keyed.
**Anti-pattern:** `vars: Record<string, number | string | boolean>` loose index signature.
**Fix:** Brand quest variable keys.

```typescript
type QuestVarId = string & { __brand: "QuestVarId" };

export interface QuestVarsComponent {
  entityId: EntityId;
  vars: Record<QuestVarId, number | string | boolean>;
}
```

---

#### 14. `apps/server/src/systems/movement-system.ts:74`, `movement-system.ts:144`, `movement-system.ts:145`, `movement-system.ts:150`
> **Status:** OPEN — `exactOptionalPropertyTypes` prevents assigning `undefined` to optional props; conditional spread is the correct pattern here.
**Anti-pattern:** Conditional object spread `...(cond ? { prop: val } : {})`.
**Why:** Produces weak union types that are harder for TypeScript to narrow and can create unexpected `Partial` shapes.
**Fix:** Explicitly set optional properties to `undefined`.

```typescript
// Line 74 example
context.world.stores.movement.set(entityId, {
  entityId,
  mode,
  path: result.path,
  destination: result.path.length > 0 ? result.destination : undefined,
});
```

---

#### 15. `apps/server/src/systems/chat-system.ts:83`
> **Status:** OPEN — `exactOptionalPropertyTypes` prevents `name: actor?.name`; conditional spread is the correct pattern here.
**Anti-pattern:** Conditional object spread `...(actor ? { name: actor.name } : {})`.
**Fix:** `name: actor?.name` if the target type accepts `undefined`.

---

#### 16. `apps/server/src/world/region-loader.ts:79` and `region-loader.ts:179`
> **Status:** OPEN — `exactOptionalPropertyTypes` prevents direct `undefined` assignment; conditional spread is the correct pattern here.
**Anti-pattern:** Conditional object spread for optional properties.
**Fix:** Set the property directly.

```typescript
// Line 79
const runtimeTile: RuntimeTile = {
  tile,
  height: override?.height ?? def.tiles.default.height,
  underlayId: override?.underlayId ?? def.tiles.default.underlayId,
  overlayId: override?.overlayId,
  collision: override?.collision ?? def.tiles.default.collision,
  water: override?.water ?? false,
  bridge: override?.bridge ?? false,
};

// Line 179
const runtimeTrigger: RuntimeAreaTrigger = {
  id: trigger.id,
  regionId: id,
  x: def.region.rx * REGION_SIZE + trigger.x,
  y: def.region.ry * REGION_SIZE + trigger.y,
  plane: def.region.plane,
  width: trigger.width,
  height: trigger.height,
  tag: trigger.tag,
};
```

---

#### 17. `apps/server/src/ecs/world.ts:76`
> **Status:** FIXED — Replaced `Object.values(componentTables)` with explicit typed `allStores` array.
**Anti-pattern:** `Object.values(stores)` on an interface.
**Why:** TypeScript inference for `Object.values` on an interface can weaken to `any[]` in non-strict configurations.
**Fix:** Use an explicit typed array.

```typescript
const allStores = [
  stores.position,
  stores.movement,
  stores.actor,
  stores.player,
  stores.npc,
  stores.object,
  stores.groundItem,
  stores.inventory,
  stores.equipment,
  stores.skills,
  stores.combatant,
  stores.resourceNode,
  stores.questVars,
] as const;

for (const store of allStores) {
  store.delete(id);
}
```

---

#### 18. `apps/server/src/world/region-loader.ts:133`
> **Status:** FIXED — Replaced `??` with explicit `!== undefined` check for `wanderRadius`.
**Anti-pattern:** `spawn.wanderRadius ?? npcDef.wanderRadius` nullish coalescing on a number.
**Why:** If `spawn.wanderRadius` is `0`, it is treated as missing and falls back to `npcDef.wanderRadius`. If `0` is a valid radius (no wander), this is a logic bug.
**Fix:**

```typescript
wanderRadius: spawn.wanderRadius !== undefined ? spawn.wanderRadius : npcDef.wanderRadius,
```

---

#### 19. `apps/server/src/world/region-loader.ts:141`
> **Status:** FIXED — Replaced `if (npcDef.maxHp)` with `if (npcDef.maxHp !== undefined && npcDef.maxHp > 0)`.
**Anti-pattern:** `if (npcDef.maxHp)` truthiness check on a number.
**Why:** `maxHp = 0` is falsy and skips combatant creation. If `0` is a valid value (e.g., an invulnerable NPC), this is wrong.
**Fix:**

```typescript
if (npcDef.maxHp !== undefined && npcDef.maxHp > 0) {
  // ...
}
```

---

### SUGGESTION

#### 20. `apps/server/src/ecs/components.ts:11–13`
> **Status:** PARTIAL — `plane` now uses `Plane` type; `x`/`y` remain `number` (integer branding for coordinates is a larger refactor).
**Anti-pattern:** `x: number; y: number; plane: number` without integer branding.
**Why:** The spec enforces "integer world, float renderer." Plain `number` allows float tile coordinates to compile.
**Fix:** Brand integer coordinates.

```typescript
type TileX = number & { __brand: "TileX" };
type TileY = number & { __brand: "TileY" };
type Plane = number & { __brand: "Plane" };

export interface PositionComponent {
  entityId: EntityId;
  x: TileX;
  y: TileY;
  plane: Plane;
}
```

---

#### 21. `apps/server/src/ecs/components.ts:48`
> **Status:** FIXED — `brainState` now uses `NpcBrainState` union type.
**Anti-pattern:** `brainState: string` is too permissive.
**Why:** Any string compiles, so typos in state names are not caught.
**Fix:** Use a union of known states.

```typescript
type BrainState = "idle" | "wander" | "combat" | "dead" | "respawning";

export interface NpcComponent {
  // ...
  brainState: BrainState;
}
```

---

#### 22. `apps/server/src/ecs/components.ts:33, 57, 64, 106`
> **Status:** OPEN — Requires branding content ID strings; deferred to avoid large-scale type changes.
**Anti-pattern:** Content IDs (`appearanceId`, `objectId`, `itemId`, `nodeId`) are plain `string`.
**Why:** Content IDs can be mixed with runtime entity IDs or other string types at compile time.
**Fix:** Brand each content ID type.

```typescript
type AppearanceId = string & { __brand: "AppearanceId" };
type ObjectId = string & { __brand: "ObjectId" };
type ItemId = string & { __brand: "ItemId" };
type ResourceNodeId = string & { __brand: "ResourceNodeId" };
```

---

#### 23. `apps/server/src/systems/chat-system.ts:27`
> **Status:** FIXED — Replaced `Array.from(raw).some(...)` with `for...of` loop and early break.
**Anti-pattern:** `Array.from(raw).some(...)` for control-character detection.
**Why:** Allocates an intermediate array of characters. For a 256-character string, this is O(n) unnecessary space.
**Fix:** Use a `for...of` loop.

```typescript
function hasControlCharacters(raw: string): boolean {
  for (const char of raw) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}
```

---

#### 24. `apps/server/src/world/runtime-map.ts:36–39`
> **Status:** OPEN — `ReadonlyMap` breaks `region-loader` mutation during construction; needs mutable builder + readonly consumer split.
**Anti-pattern:** `RuntimeMap` exposes mutable `Map`s through `readonly` properties.
**Why:** `readonly` only prevents property reassignment, not mutation of the Map contents.
**Fix:** Use `ReadonlyMap` if the maps are intended to be immutable after construction.

---

#### 25. `apps/server/src/ecs/world.ts:90–98`
> **Status:** STALE — No `queryAlive` method exists in current `world.ts`; `entityIdsWith` uses `Map.keys()` directly.
**Anti-pattern:** `queryAlive` scans the entire component store and checks `isAlive` per entry.
**Why:** O(n) per query. If multiple systems call this each tick, the cost is additive across all component types.
**Fix:** Maintain a per-component `Set<EntityId>` of alive entities, updated atomically in `createEntity`/`destroyEntity`.

---

## Lane 5: Client UI, Engine & Input

**Directories:** `apps/client/src/game/ui/`, `apps/client/src/game/picking/`, `apps/client/src/game/net/`, `apps/client/src/game/GameEngine.ts`  
**Files audited:** 11

### CRITICAL

#### 1. `apps/client/src/game/ui/ContextMenu.ts` — Lines 95-114 — **STATUS: ALREADY FIXED** (code already references `this._clickOutsideListener` directly and guards on `this._visible`)
**Anti-pattern:** Event listener leak via `setTimeout` closure.
**Why:** `hide()` clears `this._clickOutsideListener` / `this._keydownListener`, but the `setTimeout` closure captured the old function references in local `const` variables. If `hide()` is called before the timeout fires, the listeners are still attached to `document` and can never be removed.
**Fix:** Reference `this._clickOutsideListener` directly inside the timeout and guard on `this._visible`.

```typescript
setTimeout(() => {
  if (this._visible && this._clickOutsideListener) {
    document.addEventListener("click", this._clickOutsideListener);
  }
  if (this._visible && this._keydownListener) {
    document.addEventListener("keydown", this._keydownListener);
  }
}, 0);
```

---

#### 2. `apps/client/src/game/GameEngine.ts` — Lines 94-96 — **STATUS: FIXED**
**Anti-pattern:** Type assertions on `querySelector` without null checks.
**Why:** If the DOM is missing `#connection-status`, `#tick-status`, or `#fps-status`, these are `null` at runtime but typed as `HTMLDivElement`. The next property access throws.
**Fix:** Validate with `instanceof` before assignment.

```typescript
const connectionStatus = statusOverlay.querySelector("#connection-status");
const tickStatus = statusOverlay.querySelector("#tick-status");
const fpsStatus = statusOverlay.querySelector("#fps-status");
if (
  !(connectionStatus instanceof HTMLDivElement) ||
  !(tickStatus instanceof HTMLDivElement) ||
  !(fpsStatus instanceof HTMLDivElement)
) {
  throw new Error("Missing required status overlay elements");
}
this.overlays = { connectionStatus, tickStatus, fpsStatus };
```

---

#### 3. `apps/client/src/game/ui/ContentClient.ts` — Line 33 — **STATUS: FIXED**
**Anti-pattern:** Type assertion on untrusted network JSON (`as ContentClientRegistries`).
**Why:** `response.json()` returns `any`. The server could send malformed or malicious data. The type assertion gives false confidence and can crash downstream code.
**Fix:** Parse as `unknown` and validate.

```typescript
const raw: unknown = await response.json();
if (!raw || typeof raw !== "object") {
  throw new Error("Invalid content response: expected object");
}
// Replace with actual Zod schema once defined:
// const data = contentRegistriesSchema.parse(raw);
const data = raw as ContentClientRegistries;
this._registries = data;
```

---

#### 4. `apps/client/src/game/net/GameSocket.ts` — Lines 86, 112 — **STATUS: FIXED**
**Anti-pattern:** Type assertions on `JSON.parse` of WebSocket messages (`as TransportServerPacket`).
**Why:** No runtime validation of packet shape. A malformed server message bypasses type safety entirely.
**Fix:** Parse to `unknown`, then use a type guard.

```typescript
if (typeof event.data !== "string") {
  console.error("Unexpected binary WebSocket message");
  return;
}
const raw: unknown = JSON.parse(event.data);
if (!raw || typeof raw !== "object" || typeof (raw as Record<string, unknown>).type !== "string") {
  console.error("Invalid server packet structure");
  return;
}
const packet = raw as TransportServerPacket;
```

---

#### 5. `apps/client/src/game/net/GameSocket.ts` — Lines 103, 114, 116, 119 — **STATUS: FIXED** (Error branch uses property existence check; Pong/CommandRejected casts remain as they are narrowed by discriminated union type)
**Anti-pattern:** Type assertions inside discriminated union checks (`as { reason: string }`, `as TickDeltaPacket`, etc.).
**Why:** If the discriminated union types in `@old-town/shared` are correct, these assertions are unnecessary and mask narrowing bugs.
**Fix:** Use property existence checks instead of `as`.

```typescript
if (packet.type === TransportServerMessageType.Error) {
  clearTimeout(timeout);
  const reason =
    "reason" in packet && typeof packet.reason === "string"
      ? packet.reason
      : "unknown";
  reject(new Error(`Server error: ${reason}`));
  socket.close();
}
```

---

### WARNING

#### 6. `apps/client/src/game/picking/EntityPicker.ts` — Line 44 — **STATUS: FIXED**
**Anti-pattern:** `closest.object as Mesh`.
**Why:** `intersectObjects` returns `Object3D`, not guaranteed to be `Mesh`.
**Fix:**

```typescript
if (!(closest.object instanceof Mesh)) return null;
const mesh = closest.object;
```

---

#### 7. `apps/client/src/game/picking/EntityPicker.ts` — Lines 45-55 — **STATUS: FIXED**
**Anti-pattern:** Unvalidated `userData` access.
**Why:** `mesh.userData` is typed `any` in Three.js. `kind` is returned as a union string without runtime validation.
**Fix:** Validate fields before returning.

```typescript
const userData = mesh.userData;
if (!userData || typeof userData !== "object") return null;
if (typeof userData.entityId !== "number") return null;
const validKinds = new Set(["player", "npc", "object", "groundItem"]);
if (typeof userData.kind !== "string" || !validKinds.has(userData.kind)) return null;

return {
  entityId: userData.entityId,
  kind: userData.kind as PickedEntity["kind"],
  defId: typeof userData.defId === "string" ? userData.defId : undefined,
  itemId: typeof userData.itemId === "string" ? userData.itemId : undefined,
  quantity: typeof userData.quantity === "number" ? userData.quantity : undefined,
  distance: closest.distance,
};
```

---

#### 8. `apps/client/src/game/scene/ClickMarkerLayer.ts` — Lines 41, 79 — **STATUS: FIXED** (stored typed `material` field reference)
**Anti-pattern:** `as MeshBasicMaterial` on `this._clickMarker.material`.
**Why:** `material` can be `Material | Material[]`. If the property ever becomes an array, the assertion is wrong.
**Fix:** Store a reference to the material when creating the marker.

```typescript
// Add field:
private _clickMarkerMaterial: MeshBasicMaterial | undefined;

// In _showClickMarker:
this._clickMarkerMaterial = new MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
this._clickMarker = new Mesh(geometry, this._clickMarkerMaterial);

// In fade loop:
if (!this._clickMarker || !this._clickMarkerMaterial) return;
this._clickMarkerMaterial.opacity = 0.8 * (1 - elapsed / 1500);

// In _removeClickMarker:
if (this._clickMarker) {
  this.renderer.scene.remove(this._clickMarker);
  this._clickMarker.geometry.dispose();
  this._clickMarkerMaterial?.dispose();
  this._clickMarker = undefined;
  this._clickMarkerMaterial = undefined;
}
```

---

#### 9. `apps/client/src/game/ui/ContextMenu.ts` — Line 96 — **STATUS: FIXED**
**Anti-pattern:** `e.target as Node`.
**Why:** `e.target` is `EventTarget | null`. If it is `null` or a non-Node target, the assertion lies.
**Fix:**

```typescript
if (this._menuElement && e.target instanceof Node && !this._menuElement.contains(e.target)) {
  this.hide();
}
```

---

#### 10. `apps/client/src/game/scene/HoverHighlighter.ts` — Lines 62-66 — **STATUS: FIXED** (added `_disposed` flag; file is in `scene/` not `picking/`)
**Anti-pattern:** Disposing shared geometry/material without guarding against reuse.
**Why:** After `dispose()`, calling `highlight()` creates a new `Mesh` with disposed resources, causing WebGL errors.
**Fix:** Add a disposed flag.

```typescript
private _disposed = false;

dispose(): void {
  if (this._disposed) return;
  this._disposed = true;
  this.hide();
  this._ringGeometry.dispose();
  this._highlightMaterial.dispose();
}

highlight(position: Vector3, yOffset = 0.05): void {
  if (this._disposed) throw new Error("HoverHighlighter is disposed");
  // ...
}
```

---

#### 11. `apps/client/src/game/ui/UIState.ts` — Lines 124-128 — **STATUS: FIXED**
**Anti-pattern:** O(n²) chat truncation via `shift()` in a loop.
**Why:** `Array.prototype.shift()` is O(n). If 250 messages are added, 50 shifts cost ~O(10k) operations and grow quadratically.
**Fix:** Use `slice` for O(n) total.

```typescript
addChat(messages: readonly ChatPacket[]): void {
  this._chat.push(...messages);
  if (this._chat.length > 200) {
    this._chat = this._chat.slice(-200);
  }
  this._notify();
}
```

---

#### 12. `apps/client/src/game/GameEngine.ts` — Line 711 — **STATUS: FIXED**
**Anti-pattern:** `delta.debug.actionQueue as string[]`.
**Why:** No runtime proof that `actionQueue` is an array of strings.
**Fix:** Validate before casting.

```typescript
const queue = delta.debug.actionQueue;
if (Array.isArray(queue) && queue.every((s): s is string => typeof s === "string")) {
  this.debug?.setActionQueue(queue);
}
```

---

#### 13. `apps/client/src/game/GameEngine.ts` — Line 848 — **STATUS: FIXED**
**Anti-pattern:** `innerHTML` with dynamic strings derived from server state.
**Why:** `lines` contains strings from debug data. If any string contains HTML, it is injected unsanitized. Potential XSS vector.
**Fix:** Use `textContent` with created elements.

```typescript
if (stats) {
  stats.innerHTML = "";
  for (const line of lines) {
    const div = document.createElement("div");
    div.textContent = line;
    stats.appendChild(div);
  }
}
```

---

#### 14. `apps/client/src/game/ui/UIManager.ts` — Lines 216, 225 — **STATUS: STALE** (current code already caches `def` and reuses it)
**Anti-pattern:** Duplicate `this.content.getItem()` call in `_renderInventory`.
**Why:** Unnecessary second registry lookup for the same `itemId`.
**Fix:** Reuse the first result.

```typescript
const itemDef = this.content.getItem(item.itemId ?? "");
const name = itemDef?.name ?? item.itemId ?? "";
cell.textContent = name.length > 8 ? `${name.slice(0, 7)}…` : name;
// ...
const extraOptions = itemDef?.options?.filter((o) => ITEM_ACTIONS.has(o));
```

---

#### 15. `apps/client/src/game/ui/UIManager.ts` — Lines 391, 397 — **STATUS: STALE** (`getQuest` is not called in `_renderDialogue` at all)
**Anti-pattern:** Duplicate `this.content.getQuest()` call in `_renderDialogue`.
**Why:** `getQuest` is called twice with the same `dialogueId`.
**Fix:** Reuse the result.

```typescript
const questDef = this.content.getQuest(dialogue.dialogueId);
const def = questDef ?? this.content.getNpc(dialogue.dialogueId);
npcHeader.textContent = def?.name ?? dialogue.dialogueId;
// ...
if (questDef) {
  // ...
}
```

---

#### 16. `apps/client/src/game/GameEngine.ts` — Lines 76, 278, 288, 300, 349, 353, 361, 369 — **STATUS: FIXED** (added top-level `PickedEntity` import, replaced inline imports)
**Anti-pattern:** Inline `import("./picking/EntityPicker").PickedEntity` type annotations.
**Why:** Clutters code, bypasses top-level import organization, and is harder to grep.
**Fix:** Add a top-level import.

```typescript
import type { PickedEntity } from "./picking/EntityPicker";

// Replace all inline imports with:
private _hoveredEntity: PickedEntity | null = null;
private _pickEntityAt(screenX: number, screenY: number): PickedEntity | null { ... }
private _getEntityWorldPosition(entity: PickedEntity): Vector3 | null { ... }
private _executeDefaultAction(entity: PickedEntity, ...): void { ... }
private _onExamine(entity: PickedEntity): void { ... }
private _onNpcOption(entity: PickedEntity, option: string): void { ... }
private _onObjectOption(entity: PickedEntity, option: string): void { ... }
private _onItemOption(entity: PickedEntity, option: string): void { ... }
```

---

#### 17. `apps/client/src/game/net/GameSocket.ts` — Lines 75, 80 — **STATUS: FIXED** (onerror uses `_event`; onclose already uses `event.code`/`event.reason`)
**Anti-pattern:** `socket.onerror` and `socket.onclose` ignore event parameters.
**Why:** Error codes, close reasons, and error events are lost, making production debugging impossible.
**Fix:** Capture and forward the events.

```typescript
socket.onerror = (_event) => {
  clearTimeout(timeout);
  this.onError?.(new Error("WebSocket connection error"));
  reject(new Error("GameSocket connection failed"));
};

socket.onclose = (_event) => {
  clearTimeout(timeout);
  this.onClose?.();
};
```

---

#### 18. `apps/client/src/game/ui/UIManager.ts` — Lines 81, 84, 111, 112 — **STATUS: FIXED**
**Anti-pattern:** `as HTMLDivElement | null` / `as HTMLInputElement | null` on `getElementById`.
**Why:** If the element exists but is not the expected type, the type system lies.
**Fix:** Use `instanceof` checks.

```typescript
const el = document.getElementById(id);
if (el instanceof HTMLDivElement) map.set(id, el);

const debug = document.getElementById("debug-overlay");
if (debug instanceof HTMLDivElement) map.set("debug-overlay", debug);

const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("chat-send");
if (!(input instanceof HTMLInputElement) || !(sendBtn instanceof HTMLButtonElement)) return;
```

---

#### 19. `apps/client/src/game/ui/ContextMenu.test.ts` — Lines 61, 73, 85 — **STATUS: FIXED**
**Anti-pattern:** `as HTMLDivElement` in tests.
**Why:** Tests should validate assumptions, not assert types away.
**Fix:** Use `instanceof` guard.

```typescript
expect(talkTo).toBeDefined();
if (!(talkTo instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
talkTo.click();
```

---

#### 20. `apps/client/src/game/ui/UIManager.test.ts` — Multiple lines (71, 72, 81, 89, 98, 106, 107) — **STATUS: FIXED**
**Anti-pattern:** `as HTMLDivElement`, `as HTMLInputElement`, `as HTMLButtonElement` in tests.
**Fix:** Use `instanceof` guards or `querySelector` with generic type parameter plus null check.

```typescript
const btn = document.querySelector("[data-panel='inventory-panel']");
if (!(btn instanceof HTMLButtonElement)) throw new Error("Expected HTMLButtonElement");
```

---

#### 21. `apps/client/src/game/ui/UIState.ts` — Lines 15-18, 21 — **STATUS: FIXED**
**Anti-pattern:** Private collection fields not marked `readonly`.
**Why:** The references are never reassigned (only mutated via `.clear()`, `.set()`, etc.).
**Fix:**

```typescript
private readonly _inventory = new Map<number, InventorySlotChange>();
private readonly _equipment = new Map<number, string>();
private readonly _skills = new Map<string, SkillDelta>();
private readonly _vars = new Map<string, number>();
private readonly _listeners = new Set<() => void>();
```

---

#### 22. `apps/client/src/game/ui/UIManager.ts` — Lines 38, 52 — **STATUS: FIXED**
**Anti-pattern:** Missing `readonly` on fields never reassigned after construction.
**Why:** `_unsubscribe` and `_barButtonListeners` are assigned once and never reassigned.
**Fix:**

```typescript
private readonly _unsubscribe: (() => void) | undefined;
private readonly _barButtonListeners = new Map<string, () => void>();
```

---

#### 23. `apps/client/src/game/ui/ContentClient.ts` — Lines 62-72 — **STATUS: FIXED**
**Anti-pattern:** `getAllSkills()`, `getAllSpells()`, `getAllQuests()` return mutable arrays.
**Why:** Callers can mutate the returned array.
**Fix:** Return `readonly` arrays.

```typescript
getAllSkills(): readonly SkillDef[] {
  return Object.values(this._registries?.skill ?? {});
}
getAllSpells(): readonly SpellDef[] {
  return Object.values(this._registries?.spell ?? {});
}
getAllQuests(): readonly QuestDef[] {
  return Object.values(this._registries?.quest ?? {});
}
```

---

#### 24. `apps/client/src/game/ui/UIManager.ts` — Lines 291, 315, 341 — **STATUS: FIXED**
**Anti-pattern:** Redundant `Array.from()` on arrays.
**Why:** `getAllSkills()`, `getAllSpells()`, `getAllQuests()` already return arrays.
**Fix:** Use spread if a mutable copy is needed for `sort`.

```typescript
const skills = [...this.content.getAllSkills()];
skills.sort((a, b) => a.name.localeCompare(b.name));

const spells = [...this.content.getAllSpells()];
spells.sort((a, b) => a.requiredMagic - b.requiredMagic);

const quests = this.content.getAllQuests();
```

---

#### 25. `apps/client/src/game/GameEngine.ts` — Lines 333-338 & `apps/client/src/game/ui/ContextMenu.ts` — Lines 221-226 — **STATUS: STALE** (`_inferObjectAction` does not exist in either file)
**Anti-pattern:** Duplicate `_inferObjectAction` logic in two classes.
**Why:** Maintenance burden; behavior diverges if one is updated and the other forgotten.
**Fix:** Extract to a shared utility. Note that `GameEngine` returns lowercase commands while `ContextMenu` returns Title Case labels, so the shared utility should return a canonical form and callers can transform case as needed.

---

### SUGGESTION

#### 26. `apps/client/src/game/ui/UIManager.ts` — Line 226 — **STATUS: FIXED** (hoisted `ITEM_ACTIONS` Set to module level)
**Anti-pattern:** Array literal `["drop", "equip", "eat", "drink"]` recreated inside a `.filter()` callback.
**Why:** Allocates a new array on every filter iteration (up to 28 slots × option count).
**Fix:** Hoist a `Set` outside the loop.

```typescript
const ITEM_ACTIONS = new Set(["drop", "equip", "eat", "drink"]);
// inside loop:
const extraOptions = itemDef?.options?.filter((o) => ITEM_ACTIONS.has(o));
```

---

#### 27. `apps/client/src/game/GameEngine.ts` — Line 123 — **STATUS: FIXED**
**Anti-pattern:** Implicit coupling between `GameSocket.serverUrl` (WebSocket URL) and `ContentClient.load` (HTTP URL).
**Why:** `ContentClient` did string replacement (`ws://` → `http://`). If the server URL format changed, content loading broke silently.
**Fix:** `GameSocket` now exposes an explicit `httpUrl` getter. `ContentClient.load`, `IconAtlas.load`, and `IconTextureFactory.load` accept an `httpBaseUrl` directly. `GameEngine` passes `this.socket.httpUrl` to all three (E48-S06).

---

#### 28. `apps/client/src/game/GameEngine.ts` — Line 77 — **STATUS: FIXED**
**Anti-pattern:** Mutable object type for `_spellTargetMode`.
**Why:** The object is never mutated after creation, only replaced.
**Fix:** Make it readonly.

```typescript
private _spellTargetMode: { readonly spellId: string } | undefined;
```

---

#### 29. `apps/client/src/game/net/GameSocket.ts` — Line 86 — **STATUS: FIXED**
**Anti-pattern:** `String(event.data)` on WebSocket message.
**Why:** If `event.data` is a `Blob` or `ArrayBuffer`, `String()` produces `"[object Blob]"` instead of throwing.
**Fix:** Check type first.

```typescript
if (typeof event.data !== "string") {
  console.error("Unexpected non-text WebSocket message");
  return;
}
const raw: unknown = JSON.parse(event.data);
```

---

#### 30. `apps/client/src/game/GameEngine.ts` — Lines 540, 590, 604, 609 — **STATUS: STALE** (these patterns do not exist in the current code)
**Anti-pattern:** Missing optional-undefined guards on `state.entities`, `delta.entityAdds`, `delta.entityRemoves`, `delta.entityUpdates`.
**Why:** Other optional arrays in the same handlers (`regionLoads`, `hitsplats`, etc.) are checked with `if`, but these four are accessed directly.
**Fix:** Add guards for consistency.

```typescript
if (state.entities) {
  for (const entity of state.entities) { ... }
}

if (delta.entityAdds) {
  for (const entity of delta.entityAdds) { ... }
}

if (delta.entityRemoves) {
  for (const id of delta.entityRemoves) { ... }
}

if (delta.entityUpdates) {
  for (const update of delta.entityUpdates) { ... }
}
```

---

#### 31. `apps/client/src/game/ui/UIManager.ts` — Line 53 — **STATUS: STALE** (`_chatInputListener` field does not exist)
**Anti-pattern:** Dead code (`_chatInputListener` field is declared but never assigned or used).
**Why:** `_chatInputListener` is declared as a field but `_bindChatInput` only assigns `_chatSendListener` and `_chatKeydownListener`.
**Fix:** Delete the unused field.

```typescript
// Remove:
// private _chatInputListener: (() => void) | undefined;
```

---

#### 32. `apps/client/src/game/ui/ContextMenu.test.ts` — Line 115 — **STATUS: FIXED**
**Anti-pattern:** Flaky test timing (`await new Promise((resolve) => setTimeout(resolve, 0))`).
**Why:** The test's `setTimeout(0)` resolves in a microtask before the code's `setTimeout(0)` macrotask fires, so the `keydown` listener may not be attached yet when `Escape` is dispatched.
**Fix:** Use a longer delay to ensure the macrotask queue has flushed.

```typescript
await new Promise((resolve) => setTimeout(resolve, 10));
```

---

#### 33. `apps/client/src/game/GameEngine.ts` — Line 518 — **STATUS: FIXED**
**Anti-pattern:** Unnecessary `as Node` assertion on `log.firstChild`.
**Why:** `firstChild` is already `Node | null`. The assertion is redundant.
**Fix:** Remove the assertion.

```typescript
while (log.children.length > 50) {
  if (log.firstChild) {
    log.removeChild(log.firstChild);
  }
}
```

---

## Cross-Cutting Duplicates

The following patterns appear across **multiple lanes** and were flagged by multiple subagents:

### Duplicate Pattern 1: `EntityId` cast to `number` — **STATUS: ADDRESSED** (Lane 4 fixed `EntityPool` to store `EntityId` directly; remaining `as number` casts in sort comparators are acceptable for branded numeric types)
- **Lane 1 (shared):** Not explicitly flagged, but `entityId()` constructor uses `as EntityId` on validated data (acceptable branded-type pattern).
- **Lane 3 (server net/sim):** `(a as number) - (b as number)` in `dev-session.ts`, `interest-manager.ts`, `command-buffer.ts`, `delta-accumulator.ts`.
- **Lane 4 (server ECS):** `id as number` in `entity.ts`, `region-loader.ts`.
- **Resolution:** If `EntityId` is a branded number, add a `compareEntityId(a, b)` helper to `packages/shared/src/types/ids.ts` and replace all subtractive sorts with it. If `EntityId` is just `type EntityId = number`, remove the `as number` assertions entirely.

### Duplicate Pattern 2: `plane` type assertions (`as TileCoord["plane"]`) — **STATUS: FIXED** (Lane 4 changed `PositionComponent.plane` to `Plane`; Lane 3 used `isPlane` type guard for parsed values)
- **Lane 3 (server net):** `dev-session.ts`, `delta-broadcaster.ts`, `interest-manager.ts`.
- **Lane 4 (server systems/world):** `movement-system.ts`, `region-loader.ts`, `collision.ts`.
- **Resolution:** Fix the source types in `PositionComponent` and `RegionMapDef` so `plane` is already `TileCoord["plane"]` (or `Plane`), eliminating all downstream casts.

### Duplicate Pattern 3: `as` casts on Three.js `material` (array vs single) — **STATUS: FIXED** (Lane 2 added `Array.isArray` guards and typed material references; Lane 5 fixed `ClickMarkerLayer`)
- **Lane 2 (client scene):** `ObjectRenderer.ts`, `ActorRenderer.ts`, `HitsplatLayer.ts`, `GridOverlay.ts`.
- **Lane 5 (client UI/engine):** `GameEngine.ts` (click marker).
- **Resolution:** Every location needs to guard against `Material | Material[]` using `Array.isArray(mat)` before accessing material-specific properties. Where the material is known at creation time, store a typed reference as a private field instead of asserting at use sites.

### Duplicate Pattern 4: JSON/network data type assertions without validation — **STATUS: FIXED** (Lane 5 `GameSocket.ts` and `ContentClient.ts` use `unknown` + Zod validation; Lane 3 protocol decoders replaced by `parseServerPacket`, `parseTransportServerPacket`, `parseTransportMessage` — see ADR-008)
- **Lane 3 (protocol):** `decodeServerPacket` and `decodeTransportMessage` are deprecated; `parseClientCommand`, `parseServerPacket`, `parseTransportServerPacket`, and `parseTransportMessage` are the validated decoders.
- **Lane 5 (client net/ui):** `GameSocket.ts` uses `parseTransportServerPacket`; `ContentClient.ts` uses `contentClientRegistriesSchema.safeParse`.
- **Resolution:** ADR-008 establishes the wire validation policy: all JSON from the wire (WebSocket and HTTP) is `unknown` until validated with Zod. Debug data uses `.passthrough()` for forward compatibility.

### Duplicate Pattern 5: `as` casts in tests — **STATUS: FIXED** (Lane 5 replaced all `as HTMLDivElement`/`as HTMLInputElement`/`as HTMLButtonElement` with `instanceof` guards in `UIManager.test.ts` and `ContextMenu.test.ts`; Lane 2 and Lane 3 test fixes applied in prior passes)
- **Lane 2 (client scene tests):** `ChatOverheadLayer.test.ts`, `ObjectRenderer.test.ts`, `ProjectileLayer.test.ts`, `HitsplatLayer.test.ts`.
- **Lane 3 (server net tests):** `delta-broadcaster.test.ts`.
- **Lane 5 (client UI tests):** `UIManager.test.ts`, `ContextMenu.test.ts`.
- **Resolution:** Replace `as` in tests with `instanceof` checks, `expect(...).toBeInstanceOf(...)`, or `querySelector<HTMLDivElement>(...)` with null guards. Use `vi.spyOn` instead of `as unknown as` to access private state.

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| **CRITICAL** | 14 |
| **WARNING** | 43 |
| **SUGGESTION** | 30 |
| **Total** | **87** |

### Critical Themes
1. **Type assertions on untrusted data** (WebSocket, HTTP, JSON.parse) — 6 items
2. **Memory leaks** (unbounded Maps/Sets, missing cleanup) — 3 items
3. **Three.js material array assertions** — 4 items
4. **Data leak / broadcast bug** (`packetWith` spreading unfiltered deltas) — 1 item

### Warning Themes
1. **EntityId branded type mismatches** — 5 items
2. **Plane type assertions** — 6 items
3. **Module-level shared mutable state** — 4 items
4. **O(n²) or O(n log n) inefficiencies** — 6 items
5. **Missing readonly on immutable references** — 8 items
6. **Test type assertions** — 5 items
7. **DOM query assertions without null/type guards** — 4 items

### Suggestion Themes
1. **Branded integer types for tile coordinates** — 2 items
2. **Union types instead of loose `string`** — 4 items
3. **Redundant allocations** — 5 items
4. **Code duplication** — 3 items

---

*End of report.*
