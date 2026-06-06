import {
  BoxGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { beforeEach, describe, expect, it } from "vitest";
import {
  InstanceBucket,
  type InstanceBucketKey,
  type InstanceBucketOptions,
} from "./InstanceBucket";

function makeKey(partial?: Partial<InstanceBucketKey>): InstanceBucketKey {
  return {
    archetypeId: "prop:stone_wall",
    materialId: "default",
    regionId: "r0",
    layer: "props",
    ...partial,
  };
}

function makeOptions(partial?: Partial<InstanceBucketOptions>): InstanceBucketOptions {
  return {
    geometry: new BoxGeometry(1, 1, 1),
    material: new MeshBasicMaterial({ color: 0xff0000 }),
    initialCapacity: 4,
    ...partial,
  };
}

describe("InstanceBucket", () => {
  let bucket: InstanceBucket;

  beforeEach(() => {
    bucket = new InstanceBucket(makeKey(), makeOptions());
  });

  it("constructs with InstancedMesh from registry-owned geometry and material", () => {
    expect(bucket.mesh).toBeInstanceOf(InstancedMesh);
    expect(bucket.mesh.geometry).toBeInstanceOf(BoxGeometry);
    expect(bucket.mesh.material).toBeInstanceOf(MeshBasicMaterial);
  });

  it("sets instanceMatrix usage to DynamicDrawUsage before first render", () => {
    expect(bucket.mesh.instanceMatrix.usage).toBe(DynamicDrawUsage);
  });

  it("acquires slots sequentially and maps entityId to slot", () => {
    const s0 = bucket.acquire(100);
    const s1 = bucket.acquire(200);
    const s2 = bucket.acquire(300);
    expect(s0).toBe(0);
    expect(s1).toBe(1);
    expect(s2).toBe(2);
    expect(bucket.stats().activeCount).toBe(3);
  });

  it("returns null when the bucket is full", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.acquire(300);
    bucket.acquire(400);
    expect(bucket.acquire(500)).toBeNull();
    expect(bucket.stats().activeCount).toBe(4);
  });

  it("returns existing slot for duplicate entityId", () => {
    const s = bucket.acquire(100);
    expect(bucket.acquire(100)).toBe(s);
    expect(bucket.stats().activeCount).toBe(1);
  });

  it("releases a slot, clears mapping, and hides it with zero matrix", () => {
    bucket.acquire(100);
    bucket.release(100);
    expect(bucket.stats().activeCount).toBe(0);
    expect(bucket.stats().freeCount).toBe(1);
    // verify zero matrix
    const arr = bucket.mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < 16; i++) {
      expect(arr[i]).toBe(0);
    }
  });

  it("reacquires released slots from the free list", () => {
    bucket.acquire(100); // slot 0
    bucket.acquire(200); // slot 1
    bucket.release(100); // slot 0 freed
    const s = bucket.acquire(300);
    expect(s).toBe(0); // reused
    expect(bucket.stats().freeCount).toBe(0);
    expect(bucket.stats().activeCount).toBe(2);
  });

  it("preserves correct entity-to-slot mappings after release and reacquire", () => {
    bucket.acquire(100); // 0
    bucket.acquire(200); // 1
    bucket.acquire(300); // 2
    bucket.release(200); // free 1
    const s1 = bucket.acquire(400); // reuses 1
    expect(s1).toBe(1);
    expect(bucket.acquire(100)).toBe(0);
    expect(bucket.acquire(300)).toBe(2);
    expect(bucket.acquire(400)).toBe(1);
  });

  it("reduces highestActiveSlot when the highest slot is released", () => {
    bucket.acquire(100); // 0
    bucket.acquire(200); // 1
    bucket.acquire(300); // 2
    expect(bucket.stats().highestActiveSlot).toBe(2);
    bucket.release(300);
    expect(bucket.stats().highestActiveSlot).toBe(1);
    expect(bucket.stats().activeCount).toBe(2);
  });

  it("does not reduce highestActiveSlot when a non-highest slot is released", () => {
    bucket.acquire(100); // 0
    bucket.acquire(200); // 1
    bucket.acquire(300); // 2
    bucket.release(200);
    expect(bucket.stats().highestActiveSlot).toBe(2);
  });

  it("writes a Matrix4 transform without allocating per call", () => {
    bucket.acquire(100);
    const matrix = new Matrix4();
    matrix.set(1, 0, 0, 10, 0, 1, 0, 20, 0, 0, 1, 30, 0, 0, 0, 1);
    bucket.writeTransform(100, matrix);
    const arr = bucket.mesh.instanceMatrix.array as Float32Array;
    expect(arr[12]).toBe(10);
    expect(arr[13]).toBe(20);
    expect(arr[14]).toBe(30);
  });

  it("writes a Float32Array transform without allocating per call", () => {
    bucket.acquire(100);
    const elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1]);
    bucket.writeTransform(100, elements);
    const arr = bucket.mesh.instanceMatrix.array as Float32Array;
    expect(arr[12]).toBe(5);
    expect(arr[13]).toBe(6);
    expect(arr[14]).toBe(7);
  });

  it("writes transform components without allocating per call", () => {
    bucket.acquire(100);
    bucket.writeTransform(100, {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 2, y: 2, z: 2 },
    });
    const arr = bucket.mesh.instanceMatrix.array as Float32Array;
    // Translation column is the position directly; scale is in the upper 3x3
    expect(arr[12]).toBe(1);
    expect(arr[13]).toBe(2);
    expect(arr[14]).toBe(3);
  });

  it("sets needsUpdate at most once per attribute per flush", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.writeTransform(200, new Matrix4().makeTranslation(4, 5, 6));

    const before = bucket.mesh.instanceMatrix.version;
    bucket.flush(1);
    const after = bucket.mesh.instanceMatrix.version;
    // needsUpdate was set at least once
    expect(after).toBeGreaterThan(before);
    // after flush, dirty state is cleared
    expect(bucket.dirtyStart).toBe(bucket.stats().capacity);
    expect(bucket.dirtyEnd).toBe(0);

    // second flush with no new writes should not increment version again
    bucket.flush(2);
    expect(bucket.mesh.instanceMatrix.version).toBe(after);
  });

  it("updates mesh.count to highestActiveSlot + 1 on flush", () => {
    bucket.acquire(100); // 0
    bucket.acquire(200); // 1
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.writeTransform(200, new Matrix4().makeTranslation(4, 5, 6));
    bucket.flush(1);
    expect(bucket.mesh.count).toBe(2);
  });

  it("updates mesh.count to highestActiveSlot + 1 after release of highest slot", () => {
    bucket.acquire(100); // 0
    bucket.acquire(200); // 1
    bucket.acquire(300); // 2
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.writeTransform(200, new Matrix4().makeTranslation(4, 5, 6));
    bucket.writeTransform(300, new Matrix4().makeTranslation(7, 8, 9));
    bucket.flush(1);
    expect(bucket.mesh.count).toBe(3);

    bucket.release(300);
    bucket.flush(2);
    expect(bucket.mesh.count).toBe(2);
  });

  it("recomputes bounds after bulk placement", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.writeTransform(200, new Matrix4().makeTranslation(10, 20, 30));
    expect(bucket.boundsDirty).toBe(true);
    bucket.flush(1);
    expect(bucket.boundsDirty).toBe(false);
    expect(bucket.mesh.boundingSphere).toBeDefined();
    expect(bucket.mesh.boundingSphere!.center).toBeInstanceOf(Vector3);
    expect(bucket.mesh.boundingSphere!.radius).toBeGreaterThan(0);
  });

  it("does not recompute bounds when nothing is dirty", () => {
    bucket.acquire(100);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.flush(1);
    const sphere = bucket.mesh.boundingSphere;
    bucket.flush(2);
    expect(bucket.mesh.boundingSphere).toBe(sphere);
  });

  it("tracks dirtyStart and dirtyEnd correctly across writes", () => {
    bucket.acquire(100); // slot 0
    bucket.acquire(200); // slot 1
    bucket.writeTransform(200, new Matrix4().makeTranslation(1, 2, 3));
    expect(bucket.dirtyStart).toBe(1);
    expect(bucket.dirtyEnd).toBe(2);
    bucket.writeTransform(100, new Matrix4().makeTranslation(4, 5, 6));
    expect(bucket.dirtyStart).toBe(0);
    expect(bucket.dirtyEnd).toBe(2);
  });

  it("no per-instance flush happens inside a batch update", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.acquire(300);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.writeTransform(200, new Matrix4().makeTranslation(4, 5, 6));
    bucket.writeTransform(300, new Matrix4().makeTranslation(7, 8, 9));

    expect(bucket.dirtyStart).toBe(0);
    expect(bucket.dirtyEnd).toBe(3);
    expect(bucket.lastFlushFrame).toBe(-1);
    bucket.flush(1);
    expect(bucket.lastFlushFrame).toBe(1);
    expect(bucket.dirtyStart).toBe(bucket.stats().capacity);
    expect(bucket.dirtyEnd).toBe(0);
  });

  it("supports optional color writes through instanceColor", () => {
    const colorBucket = new InstanceBucket(makeKey(), makeOptions({ supportsColor: true }));
    colorBucket.acquire(100);
    colorBucket.writeColorOrSeed(100, { r: 1, g: 0.5, b: 0.25, a: 1 });
    const arr = colorBucket.mesh.instanceColor!.array as Float32Array;
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(0.5);
    expect(arr[2]).toBe(0.25);
    expect(arr[3]).toBe(1);
  });

  it("supports optional seed writes through custom aSeed attribute", () => {
    const seedBucket = new InstanceBucket(makeKey(), makeOptions({ supportsSeed: true }));
    seedBucket.acquire(100);
    seedBucket.writeColorOrSeed(100, 42);
    const attr = seedBucket.mesh.geometry.getAttribute("aSeed");
    expect(attr).toBeDefined();
    const arr = attr.array as Float32Array;
    expect(arr[0]).toBe(42);
  });

  it("ignores color/seed write when bucket does not support it", () => {
    bucket.acquire(100);
    bucket.writeColorOrSeed(100, { r: 1, g: 0, b: 0, a: 1 });
    expect(bucket.mesh.instanceColor).toBeNull();
  });

  it("ignores transform write for unknown entityId", () => {
    bucket.writeTransform(999, new Matrix4().makeTranslation(1, 2, 3));
    expect(bucket.dirtyStart).toBe(bucket.stats().capacity);
    expect(bucket.dirtyEnd).toBe(0);
  });

  it("ignores release for unknown entityId", () => {
    bucket.release(999);
    expect(bucket.stats().activeCount).toBe(0);
  });

  it("grows capacity deterministically outside hot loops", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.acquire(300);
    bucket.acquire(400);
    expect(bucket.acquire(500)).toBeNull();
    bucket.growCapacity(8);
    expect(bucket.stats().capacity).toBe(8);
    const s = bucket.acquire(500);
    expect(s).not.toBeNull();
    expect(s).toBe(4);
  });

  it("prewarm grows capacity to target", () => {
    bucket.prewarm(16);
    expect(bucket.stats().capacity).toBe(16);
  });

  it("preserves matrix data after growCapacity", () => {
    bucket.acquire(100);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.growCapacity(8);
    const arr = bucket.mesh.instanceMatrix.array as Float32Array;
    expect(arr[12]).toBe(1);
    expect(arr[13]).toBe(2);
    expect(arr[14]).toBe(3);
  });

  it("preserves color data after growCapacity", () => {
    const colorBucket = new InstanceBucket(makeKey(), makeOptions({ supportsColor: true }));
    colorBucket.acquire(100);
    colorBucket.writeColorOrSeed(100, { r: 0.1, g: 0.2, b: 0.3, a: 0.4 });
    colorBucket.growCapacity(8);
    const arr = colorBucket.mesh.instanceColor!.array as Float32Array;
    expect(arr[0]).toBeCloseTo(0.1);
    expect(arr[1]).toBeCloseTo(0.2);
    expect(arr[2]).toBeCloseTo(0.3);
    expect(arr[3]).toBeCloseTo(0.4);
  });

  it("preserves seed data after growCapacity", () => {
    const seedBucket = new InstanceBucket(makeKey(), makeOptions({ supportsSeed: true }));
    seedBucket.acquire(100);
    seedBucket.writeColorOrSeed(100, 99);
    seedBucket.growCapacity(8);
    const attr = seedBucket.mesh.geometry.getAttribute("aSeed");
    const arr = attr.array as Float32Array;
    expect(arr[0]).toBe(99);
  });

  it("stats reflect current state accurately", () => {
    bucket.acquire(100);
    bucket.acquire(200);
    bucket.release(100);
    const stats = bucket.stats();
    expect(stats.capacity).toBe(4);
    expect(stats.activeCount).toBe(1);
    expect(stats.freeCount).toBe(1);
    expect(stats.highestActiveSlot).toBe(1);
    expect(stats.boundsDirty).toBe(true);
    expect(stats.lastFlushFrame).toBe(-1);
  });

  it("disposes and clears all internal state", () => {
    bucket.acquire(100);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.flush(1);
    bucket.dispose();
    expect(bucket.stats().activeCount).toBe(0);
    expect(bucket.stats().highestActiveSlot).toBe(-1);
    expect(bucket.stats().lastFlushFrame).toBe(-1);
  });

  it("marks dirty range on release", () => {
    bucket.acquire(100);
    bucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    bucket.flush(1);
    expect(bucket.dirtyStart).toBe(bucket.stats().capacity);
    expect(bucket.dirtyEnd).toBe(0);
    bucket.release(100);
    expect(bucket.dirtyStart).toBe(0);
    expect(bucket.dirtyEnd).toBe(1);
  });

  it("flushes color dirty range together with matrix", () => {
    const colorBucket = new InstanceBucket(makeKey(), makeOptions({ supportsColor: true }));
    colorBucket.acquire(100);
    colorBucket.writeTransform(100, new Matrix4().makeTranslation(1, 2, 3));
    colorBucket.writeColorOrSeed(100, { r: 1, g: 0, b: 0, a: 1 });
    colorBucket.flush(1);
    expect(colorBucket.mesh.instanceColor!.version).toBeGreaterThan(0);
    expect(colorBucket.mesh.instanceMatrix.version).toBeGreaterThan(0);
  });

  it("mesh.count is 0 when bucket is empty after flush", () => {
    bucket.flush(1);
    expect(bucket.mesh.count).toBe(0);
  });

  it("bounds are zero when no active slots", () => {
    bucket.flush(1);
    expect(bucket.mesh.boundingSphere).toBeDefined();
    expect(bucket.mesh.boundingSphere!.radius).toBe(0);
  });
});
