import type { BufferGeometry, Material } from "three";
import {
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Sphere,
  Vector3,
} from "three";

/** Key that uniquely identifies an instance bucket. */
export interface InstanceBucketKey {
  readonly archetypeId: string;
  readonly materialId: string;
  readonly regionId: string;
  readonly layer: string;
}

/** Occupied slot record. */
export interface InstanceSlot {
  readonly entityId: number;
  readonly slot: number;
}

/** Constructor options for an InstanceBucket. */
export interface InstanceBucketOptions {
  readonly geometry: BufferGeometry;
  readonly material: Material;
  readonly initialCapacity: number;
  readonly supportsColor?: boolean;
  readonly supportsSeed?: boolean;
}

/** Stats exposed for diagnostics. */
export interface InstanceBucketStats {
  readonly capacity: number;
  readonly activeCount: number;
  readonly freeCount: number;
  readonly highestActiveSlot: number;
  readonly dirtyStart: number;
  readonly dirtyEnd: number;
  readonly boundsDirty: boolean;
  readonly lastFlushFrame: number;
}

/** Input that can be a full Matrix4, a Float32Array of 16 elements, or decomposed components. */
export interface TransformComponents {
  readonly position?: { readonly x: number; readonly y: number; readonly z: number };
  readonly rotation?: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
  };
  readonly scale?: { readonly x: number; readonly y: number; readonly z: number };
}

export type TransformInput = Matrix4 | Float32Array | TransformComponents;

/** Per-instance color/seed value (RGBA for colour, single float for seed). */
export type ColorOrSeedInput =
  | { readonly r: number; readonly g: number; readonly b: number; readonly a: number }
  | number;

/**
 * InstanceBucket manages one InstancedMesh and a fixed-capacity slot array.
 *
 * Acquire / release follow a free-list hole policy. Transforms are written
 * directly into the underlying Float32Array; flush uploads one dirty range
 * once per frame. Bounds are recomputed only when dirty.
 */
export class InstanceBucket {
  mesh: InstancedMesh;
  readonly key: InstanceBucketKey;
  dirtyStart: number;
  dirtyEnd: number;
  boundsDirty = false;
  lastFlushFrame = -1;

  private _capacity: number;
  private _activeCount = 0;
  private _highestActiveSlot = -1;
  private readonly freeList: number[] = [];
  private readonly entityIdToSlot = new Map<number, number>();
  private readonly slotToEntityId = new Map<number, number>();
  private instanceMatrixArray: Float32Array;
  private instanceColorOrSeedArray: Float32Array | null;
  private readonly _colorOrSeedItemSize: number;
  private readonly _ownsGeometry: boolean;
  private readonly _ownsMaterial: boolean;
  private _firstRender = true;
  private readonly _scratchMatrix = new Matrix4();
  private readonly _scratchPos = new Vector3();
  private readonly _scratchQuat = new Quaternion();
  private readonly _scratchScale = new Vector3();
  private readonly _scratchSphereCenter = new Vector3();

  constructor(key: InstanceBucketKey, options: InstanceBucketOptions) {
    this.key = key;
    this._capacity = options.initialCapacity;
    this._ownsMaterial = false;

    if (options.supportsSeed) {
      const cloned = options.geometry.clone();
      const itemSize = 4;
      const array = new Float32Array(this._capacity * itemSize);
      cloned.setAttribute("aSeed", new InstancedBufferAttribute(array, itemSize));
      this.mesh = new InstancedMesh(cloned, options.material, this._capacity);
      this._ownsGeometry = true;
      this.instanceColorOrSeedArray = array;
      this._colorOrSeedItemSize = itemSize;
    } else if (options.supportsColor) {
      const itemSize = 4;
      const array = new Float32Array(this._capacity * itemSize);
      this.mesh = new InstancedMesh(options.geometry, options.material, this._capacity);
      this.mesh.instanceColor = new InstancedBufferAttribute(array, itemSize);
      this._ownsGeometry = false;
      this.instanceColorOrSeedArray = array;
      this._colorOrSeedItemSize = itemSize;
    } else {
      this.mesh = new InstancedMesh(options.geometry, options.material, this._capacity);
      this._ownsGeometry = false;
      this.instanceColorOrSeedArray = null;
      this._colorOrSeedItemSize = 0;
    }

    this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.instanceMatrixArray = this.mesh.instanceMatrix.array as Float32Array;
    this.dirtyStart = this._capacity;
    this.dirtyEnd = 0;
    this.mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), 0);
  }

  /** Return the slot for an entity, or null if the bucket is full. */
  acquire(entityId: number): number | null {
    const existing = this.entityIdToSlot.get(entityId);
    if (existing !== undefined) {
      return existing;
    }

    let slot: number;
    if (this.freeList.length > 0) {
      const popped = this.freeList.pop();
      if (popped === undefined) {
        return null;
      }
      slot = popped;
    } else if (this._highestActiveSlot + 1 < this._capacity) {
      slot = this._highestActiveSlot + 1;
    } else {
      return null;
    }

    this.entityIdToSlot.set(entityId, slot);
    this.slotToEntityId.set(slot, entityId);
    this._activeCount++;
    if (slot > this._highestActiveSlot) {
      this._highestActiveSlot = slot;
    }
    return slot;
  }

  /** Release a slot and return it to the free list. */
  release(entityId: number): void {
    const slot = this.entityIdToSlot.get(entityId);
    if (slot === undefined) return;

    this.entityIdToSlot.delete(entityId);
    this.slotToEntityId.delete(slot);
    this._activeCount--;
    this.freeList.push(slot);

    // Zero-scale matrix to hide the slot
    const offset = slot * 16;
    for (let i = 0; i < 16; i++) {
      this.instanceMatrixArray[offset + i] = 0;
    }
    this._markDirty(slot, slot + 1);
    this.boundsDirty = true;

    if (slot === this._highestActiveSlot) {
      let nextHighest = -1;
      for (const [s] of this.slotToEntityId) {
        if (s > nextHighest) nextHighest = s;
      }
      this._highestActiveSlot = nextHighest;
    }
  }

  /**
   * Write a transform into the instance matrix array.
   * No new scratch objects are allocated on the hot path.
   */
  writeTransform(entityId: number, transform: TransformInput): void {
    const slot = this.entityIdToSlot.get(entityId);
    if (slot === undefined) return;

    const offset = slot * 16;

    if (transform instanceof Matrix4) {
      const elements = transform.elements;
      for (let i = 0; i < 16; i++) {
        this.instanceMatrixArray[offset + i] = elements[i] as number;
      }
    } else if (transform instanceof Float32Array) {
      for (let i = 0; i < 16; i++) {
        this.instanceMatrixArray[offset + i] = transform[i] as number;
      }
    } else {
      const pos = transform.position;
      const rot = transform.rotation;
      const scale = transform.scale;
      this._scratchPos.set(pos?.x ?? 0, pos?.y ?? 0, pos?.z ?? 0);
      this._scratchQuat.set(rot?.x ?? 0, rot?.y ?? 0, rot?.z ?? 0, rot?.w ?? 1);
      this._scratchScale.set(scale?.x ?? 1, scale?.y ?? 1, scale?.z ?? 1);
      this._scratchMatrix.compose(this._scratchPos, this._scratchQuat, this._scratchScale);
      const elements = this._scratchMatrix.elements;
      for (let i = 0; i < 16; i++) {
        this.instanceMatrixArray[offset + i] = elements[i] as number;
      }
    }

    this._markDirty(slot, slot + 1);
    this.boundsDirty = true;
  }

  /** Write a per-instance colour or seed value, if the bucket was configured for it. */
  writeColorOrSeed(entityId: number, value: ColorOrSeedInput): void {
    if (this.instanceColorOrSeedArray === null) return;
    const slot = this.entityIdToSlot.get(entityId);
    if (slot === undefined) return;

    const offset = slot * this._colorOrSeedItemSize;
    if (typeof value === "number") {
      this.instanceColorOrSeedArray[offset] = value;
    } else {
      this.instanceColorOrSeedArray[offset] = value.r;
      this.instanceColorOrSeedArray[offset + 1] = value.g;
      this.instanceColorOrSeedArray[offset + 2] = value.b;
      this.instanceColorOrSeedArray[offset + 3] = value.a;
    }
    this._markDirty(slot, slot + 1);
  }

  /** Flush all dirty data to the GPU. Call once per frame. */
  flush(frameId: number): void {
    if (this.dirtyStart < this.dirtyEnd) {
      if (this._firstRender) {
        this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this._firstRender = false;
      }

      const matrixOffset = this.dirtyStart * 16;
      const matrixCount = (this.dirtyEnd - this.dirtyStart) * 16;
      this.mesh.instanceMatrix.clearUpdateRanges();
      this.mesh.instanceMatrix.addUpdateRange(matrixOffset, matrixCount);
      this.mesh.instanceMatrix.needsUpdate = true;

      if (this.instanceColorOrSeedArray && this.mesh.instanceColor) {
        const colorOffset = this.dirtyStart * this._colorOrSeedItemSize;
        const colorCount = (this.dirtyEnd - this.dirtyStart) * this._colorOrSeedItemSize;
        this.mesh.instanceColor.clearUpdateRanges();
        this.mesh.instanceColor.addUpdateRange(colorOffset, colorCount);
        this.mesh.instanceColor.needsUpdate = true;
      }

      this.mesh.count = this._highestActiveSlot + 1;
      this.dirtyStart = this._capacity;
      this.dirtyEnd = 0;
      this.lastFlushFrame = frameId;
    }

    if (this.boundsDirty) {
      this._recomputeBounds();
      this.boundsDirty = false;
    }
  }

  /** Deterministic capacity growth. Not for hot loops; call during load or prewarm. */
  growCapacity(targetCapacity: number): void {
    if (targetCapacity <= this._capacity) return;
    const newMesh = new InstancedMesh(this.mesh.geometry, this.mesh.material, targetCapacity);
    newMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    newMesh.count = this.mesh.count;
    if (this.mesh.boundingSphere) {
      newMesh.boundingSphere = this.mesh.boundingSphere.clone();
    }

    // Copy matrix data
    const newMatrixArray = newMesh.instanceMatrix.array as Float32Array;
    newMatrixArray.set(this.instanceMatrixArray);

    // Copy color/seed data if present
    if (this.instanceColorOrSeedArray && this.mesh.instanceColor) {
      const newColorArray = new Float32Array(targetCapacity * this._colorOrSeedItemSize);
      newColorArray.set(this.instanceColorOrSeedArray);
      const newAttr = new InstancedBufferAttribute(newColorArray, this._colorOrSeedItemSize);
      newMesh.instanceColor = newAttr;
    }

    // Also migrate custom aSeed attribute if present
    if (this._ownsGeometry) {
      const oldSeed = this.mesh.geometry.getAttribute("aSeed") as
        | InstancedBufferAttribute
        | undefined;
      if (oldSeed) {
        const newSeedArray = new Float32Array(targetCapacity * this._colorOrSeedItemSize);
        newSeedArray.set(oldSeed.array as Float32Array);
        newMesh.geometry.setAttribute(
          "aSeed",
          new InstancedBufferAttribute(newSeedArray, this._colorOrSeedItemSize),
        );
      }
    }

    // Dispose old mesh (but not shared geometry/material)
    const oldMesh = this.mesh;
    (oldMesh.instanceMatrix as InstancedBufferAttribute).dispose?.();
    oldMesh.instanceColor?.dispose?.();
    const parent = oldMesh.parent;
    if (parent) {
      parent.remove(oldMesh);
      parent.add(newMesh);
    }
    this.mesh = newMesh;

    // Re-point internal typed-array references to the new mesh
    this.instanceMatrixArray = newMesh.instanceMatrix.array as Float32Array;
    if (newMesh.instanceColor) {
      this.instanceColorOrSeedArray = newMesh.instanceColor.array as Float32Array;
    } else if (this._ownsGeometry) {
      const seedAttr = newMesh.geometry.getAttribute("aSeed") as
        | InstancedBufferAttribute
        | undefined;
      if (seedAttr) {
        this.instanceColorOrSeedArray = seedAttr.array as Float32Array;
      }
    }

    this._capacity = targetCapacity;
    this.dirtyStart = this._capacity;
    this.dirtyEnd = 0;
  }

  /** Convenience: pre-warm the bucket to a target capacity. */
  prewarm(targetCapacity: number): void {
    this.growCapacity(targetCapacity);
  }

  /** Return current bucket statistics. */
  stats(): InstanceBucketStats {
    return {
      capacity: this._capacity,
      activeCount: this._activeCount,
      freeCount: this.freeList.length,
      highestActiveSlot: this._highestActiveSlot,
      dirtyStart: this.dirtyStart,
      dirtyEnd: this.dirtyEnd,
      boundsDirty: this.boundsDirty,
      lastFlushFrame: this.lastFlushFrame,
    };
  }

  private _disposed = false;

  /** Dispose all owned resources and clear internal state. Idempotent. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    if (this._ownsGeometry) {
      this.mesh.geometry.dispose();
    }
    if (this._ownsMaterial) {
      const mat = this.mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) m.dispose();
      } else {
        mat.dispose();
      }
    }
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    (this.mesh.instanceMatrix as InstancedBufferAttribute).dispose?.();
    this.mesh.instanceColor?.dispose?.();
    this.entityIdToSlot.clear();
    this.slotToEntityId.clear();
    this.freeList.length = 0;
    this._activeCount = 0;
    this._highestActiveSlot = -1;
    this.dirtyStart = this._capacity;
    this.dirtyEnd = 0;
    this.boundsDirty = false;
    this.lastFlushFrame = -1;
  }

  private _markDirty(start: number, end: number): void {
    if (start < this.dirtyStart) this.dirtyStart = start;
    if (end > this.dirtyEnd) this.dirtyEnd = end;
  }

  private _recomputeBounds(): void {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (const [slot] of this.slotToEntityId) {
      const offset = slot * 16;
      const x = this.instanceMatrixArray[offset + 12] as number;
      const y = this.instanceMatrixArray[offset + 13] as number;
      const z = this.instanceMatrixArray[offset + 14] as number;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    if (this._activeCount === 0) {
      this.mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), 0);
      return;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const radius = Math.sqrt(
      (maxX - centerX) * (maxX - centerX) +
        (maxY - centerY) * (maxY - centerY) +
        (maxZ - centerZ) * (maxZ - centerZ),
    );

    this._scratchSphereCenter.set(centerX, centerY, centerZ);
    this.mesh.boundingSphere = new Sphere(this._scratchSphereCenter.clone(), radius);
  }
}
