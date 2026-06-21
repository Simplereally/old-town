import { BoxGeometry, MeshBasicMaterial } from "three";
import {
  type ColorOrSeedInput,
  InstanceBucket,
  type InstanceBucketKey,
  type InstanceBucketOptions,
  type TransformInput,
} from "../InstanceBucket";

/** Deterministic pseudo-random generator (mulberry32). */
function makeSeededRandom(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A single prop instance tracked by the harness. */
export interface PropInstance {
  readonly entityId: number;
  readonly bucketKey: InstanceBucketKey;
  slot: number;
  active: boolean;
}

/** Aggregated stats for the whole harness. */
export interface HarnessStats {
  readonly visibleProps: number;
  readonly activeSlots: number;
  readonly bucketCount: number;
  readonly dirtyBucketCount: number;
  readonly lastFlushDurationMs: number;
  readonly totalCapacity: number;
}

/** Options for the harness. */
export interface InstancedPropHarnessOptions {
  readonly propCount: number;
  readonly seed?: number;
  readonly initialCapacity?: number;
  readonly keys?: InstanceBucketKey[];
}

/**
 * InstancedPropHarness deterministically generates thousands of prop instances
 * across multiple InstanceBucket keys and exercises the full lifecycle:
 * spawn, transform update, color/seed update, release, re-acquire, and flush.
 *
 * No real WebGL context is required — mock geometry and material are used.
 *
 * Expected POC targets:
 *   - 10,000 props: 1 draw call per unique bucket key (≤ 10 keys)
 *   - 30,000 props: 1 draw call per unique bucket key (≤ 20 keys)
 *   - Stress target: 100,000 props with 20 keys at 60 FPS (CPU-bound)
 */
export class InstancedPropHarness {
  readonly buckets = new Map<string, InstanceBucket>();
  readonly props = new Map<number, PropInstance>();
  private readonly _rand: () => number;
  private readonly _initialCapacity: number;
  private readonly _keys: InstanceBucketKey[];
  private _nextEntityId = 1;
  private _lastFlushDurationMs = 0;

  constructor(options: InstancedPropHarnessOptions) {
    this._rand = makeSeededRandom(options.seed ?? 0xdeadbeef);
    this._initialCapacity = options.initialCapacity ?? 64;
    this._keys = options.keys ?? this._generateDefaultKeys();
    this._populate(options.propCount);
  }

  private _generateDefaultKeys(): InstanceBucketKey[] {
    const archetypes = [
      "tree_oak",
      "tree_pine",
      "rock_granite",
      "rock_moss",
      "flower_red",
      "flower_blue",
      "fence_wood",
      "lamp_post",
      "bench_park",
      "barrel",
    ];
    const materials = ["mat_a", "mat_b", "mat_c"];
    const regions = ["r0", "r1", "r2"];
    const layers = ["ground", "overlay"];
    const keys: InstanceBucketKey[] = [];
    for (const a of archetypes) {
      for (const m of materials) {
        for (const r of regions) {
          for (const l of layers) {
            keys.push({ archetypeId: a, materialId: m, regionId: r, layer: l });
          }
        }
      }
    }
    return keys;
  }

  private _keyHash(key: InstanceBucketKey): string {
    return `${key.archetypeId}|${key.materialId}|${key.regionId}|${key.layer}`;
  }

  private _getOrCreateBucket(key: InstanceBucketKey): InstanceBucket {
    const hash = this._keyHash(key);
    let bucket = this.buckets.get(hash);
    if (!bucket) {
      const opts: InstanceBucketOptions = {
        geometry: new BoxGeometry(1, 1, 1),
        material: new MeshBasicMaterial({ color: 0xffffff }),
        initialCapacity: this._initialCapacity,
        supportsColor: true,
        supportsSeed: false,
      };
      bucket = new InstanceBucket(key, opts);
      this.buckets.set(hash, bucket);
    }
    return bucket;
  }

  private _randomKey(): InstanceBucketKey {
    const index = Math.floor(this._rand() * this._keys.length);
    const key = this._keys[index];
    if (!key) {
      throw new Error("Unexpected empty key array in InstancedPropHarness");
    }
    return key;
  }

  private _randomTransform(): TransformInput {
    const x = this._rand() * 1000 - 500;
    const y = this._rand() * 50;
    const z = this._rand() * 1000 - 500;
    const s = 0.5 + this._rand() * 1.5;
    return {
      position: { x, y, z },
      rotation: { x: 0, y: this._rand() * Math.PI * 2, z: 0, w: 1 },
      scale: { x: s, y: s, z: s },
    };
  }

  private _randomColor(): ColorOrSeedInput {
    return {
      r: this._rand(),
      g: this._rand(),
      b: this._rand(),
      a: 0.8 + this._rand() * 0.2,
    };
  }

  private _randomSeed(): ColorOrSeedInput {
    return Math.floor(this._rand() * 65536);
  }

  private _populate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawn();
    }
  }

  /** Spawn a new deterministic prop instance. */
  spawn(): PropInstance {
    const entityId = this._nextEntityId++;
    const key = this._randomKey();
    const bucket = this._getOrCreateBucket(key);
    const slot = bucket.acquire(entityId);
    if (slot === null) {
      // Grow and retry
      const newCap = Math.max(bucket.stats().capacity * 2, 8);
      bucket.growCapacity(newCap);
      const retrySlot = bucket.acquire(entityId);
      if (retrySlot === null) {
        throw new Error(`Failed to acquire slot after grow for entity ${entityId}`);
      }
      const prop: PropInstance = {
        entityId,
        bucketKey: key,
        slot: retrySlot,
        active: true,
      };
      this.props.set(entityId, prop);
      bucket.writeTransform(entityId, this._randomTransform());
      bucket.writeColorOrSeed(entityId, this._randomColor());
      return prop;
    }
    const prop: PropInstance = {
      entityId,
      bucketKey: key,
      slot,
      active: true,
    };
    this.props.set(entityId, prop);
    bucket.writeTransform(entityId, this._randomTransform());
    bucket.writeColorOrSeed(entityId, this._randomColor());
    return prop;
  }

  /** Update transform for an existing prop. */
  updateTransform(entityId: number): void {
    const prop = this.props.get(entityId);
    if (!prop?.active) return;
    const bucket = this._getOrCreateBucket(prop.bucketKey);
    bucket.writeTransform(entityId, this._randomTransform());
  }

  /** Update color for an existing prop. */
  updateColor(entityId: number): void {
    const prop = this.props.get(entityId);
    if (!prop?.active) return;
    const bucket = this._getOrCreateBucket(prop.bucketKey);
    bucket.writeColorOrSeed(entityId, this._randomColor());
  }

  /** Update seed for an existing prop (requires seed-supporting bucket). */
  updateSeed(entityId: number): void {
    const prop = this.props.get(entityId);
    if (!prop?.active) return;
    const bucket = this._getOrCreateBucket(prop.bucketKey);
    bucket.writeColorOrSeed(entityId, this._randomSeed());
  }

  /** Release a prop back to its bucket. */
  release(entityId: number): void {
    const prop = this.props.get(entityId);
    if (!prop?.active) return;
    const bucket = this._getOrCreateBucket(prop.bucketKey);
    bucket.release(entityId);
    prop.active = false;
    prop.slot = -1;
  }

  /** Re-acquire a previously released prop. */
  reacquire(entityId: number): PropInstance | null {
    const prop = this.props.get(entityId);
    if (!prop || prop.active) return null;
    const bucket = this._getOrCreateBucket(prop.bucketKey);
    const slot = bucket.acquire(entityId);
    if (slot === null) return null;
    prop.active = true;
    prop.slot = slot;
    bucket.writeTransform(entityId, this._randomTransform());
    bucket.writeColorOrSeed(entityId, this._randomColor());
    return prop;
  }

  /** Flush every bucket and return aggregated stats. */
  flush(frameId: number): HarnessStats {
    const t0 = performance.now();
    let dirtyCount = 0;
    let activeSlots = 0;
    let totalCapacity = 0;
    for (const bucket of this.buckets.values()) {
      const stats = bucket.stats();
      if (stats.dirtyStart < stats.dirtyEnd) {
        dirtyCount++;
      }
      bucket.flush(frameId);
      activeSlots += stats.activeCount;
      totalCapacity += stats.capacity;
    }
    const t1 = performance.now();
    this._lastFlushDurationMs = t1 - t0;

    return {
      visibleProps: this._countActive(),
      activeSlots,
      bucketCount: this.buckets.size,
      dirtyBucketCount: dirtyCount,
      lastFlushDurationMs: this._lastFlushDurationMs,
      totalCapacity,
    };
  }

  /** Return current stats without flushing. */
  stats(): HarnessStats {
    let dirtyCount = 0;
    let activeSlots = 0;
    let totalCapacity = 0;
    for (const bucket of this.buckets.values()) {
      const stats = bucket.stats();
      if (stats.dirtyStart < stats.dirtyEnd) {
        dirtyCount++;
      }
      activeSlots += stats.activeCount;
      totalCapacity += stats.capacity;
    }
    return {
      visibleProps: this._countActive(),
      activeSlots,
      bucketCount: this.buckets.size,
      dirtyBucketCount: dirtyCount,
      lastFlushDurationMs: this._lastFlushDurationMs,
      totalCapacity,
    };
  }

  /** Dispose all buckets and clear state. */
  dispose(): void {
    for (const bucket of this.buckets.values()) {
      bucket.dispose();
    }
    this.buckets.clear();
    this.props.clear();
    this._lastFlushDurationMs = 0;
  }

  private _countActive(): number {
    let count = 0;
    for (const prop of this.props.values()) {
      if (prop.active) count++;
    }
    return count;
  }
}
