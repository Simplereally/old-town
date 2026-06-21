export interface RenderObjectPoolOptions<T> {
  /** Factory that creates one pooled object. */
  readonly create: () => T;
  /** Reset an object to a safe default before it returns to the free list. */
  readonly reset: (obj: T) => void;
  /** Number of objects to allocate immediately. */
  readonly initialSize?: number;
  /** Hard limit on pool growth; acquire returns null when exhausted. */
  readonly maxSize?: number;
}

/**
 * Generic object pool for transient render objects (meshes, sprites, materials).
 *
 * The hot path (acquire / release) does not allocate.  If the pool is
 * exhausted, acquire returns null so the caller can drop the draw call
 * rather than stall the frame.
 */
export class RenderObjectPool<T> {
  private readonly _create: () => T;
  private readonly _reset: (obj: T) => void;
  private readonly _pool: T[] = [];
  private readonly _freeList: T[] = [];
  private readonly _active = new Set<T>();
  private readonly _maxSize: number;
  private _activeCount = 0;

  constructor(options: RenderObjectPoolOptions<T>) {
    this._create = options.create;
    this._reset = options.reset;
    this._maxSize = options.maxSize ?? Infinity;
    const initialSize = options.initialSize ?? 8;
    for (let i = 0; i < initialSize; i++) {
      this._freeList.push(this._createEntry());
    }
  }

  /** Allocate objects up to count. Idempotent if pool already larger. */
  prewarm(count: number): void {
    while (this._pool.length < count) {
      this._freeList.push(this._createEntry());
    }
  }

  /** Acquire an object from the pool, or null if the pool is exhausted. */
  acquire(): T | null {
    let obj = this._freeList.pop();
    if (!obj) {
      if (this._pool.length >= this._maxSize) {
        return null;
      }
      obj = this._createEntry();
    }
    this._active.add(obj);
    this._activeCount++;
    return obj;
  }

  /** Release an object back to the pool. Idempotent for already-released objects. */
  release(obj: T): void {
    if (!this._active.has(obj)) return;
    this._active.delete(obj);
    this._activeCount--;
    this._reset(obj);
    this._freeList.push(obj);
  }

  /** Release every active object and return it to the free list. */
  reset(): void {
    for (const obj of this._active) {
      this._reset(obj);
      this._freeList.push(obj);
    }
    this._active.clear();
    this._activeCount = 0;
  }

  /** Number of currently active (acquired) objects. */
  get activeCount(): number {
    return this._activeCount;
  }

  /** Total pool size (active + idle). */
  get poolSize(): number {
    return this._pool.length;
  }

  private _disposed = false;

  /** Dispose the pool and clear all references. Does not dispose pooled objects. Idempotent. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._active.clear();
    this._freeList.length = 0;
    this._pool.length = 0;
    this._activeCount = 0;
  }

  private _createEntry(): T {
    const obj = this._create();
    this._pool.push(obj);
    return obj;
  }
}
