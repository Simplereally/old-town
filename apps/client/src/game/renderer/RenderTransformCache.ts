import type {
  PresentationSampleMode,
  RenderEntitySnapshot,
  RenderSnapshot,
} from "../net/SnapshotBuffer";

export const MovementPresentationKind = {
  Idle: 0,
  Walk: 1,
  Run: 2,
  Teleport: 3,
} as const;

export type MovementPresentationKind =
  (typeof MovementPresentationKind)[keyof typeof MovementPresentationKind];

export interface RenderEntityPresentation {
  readonly entityId: number;
  readonly prevTileX: number;
  readonly prevTileY: number;
  readonly prevTilePlane: number;
  readonly currTileX: number;
  readonly currTileY: number;
  readonly currTilePlane: number;
  readonly renderX: number;
  readonly renderY: number;
  readonly renderZ: number;
  readonly heading: number;
  readonly movementKind: MovementPresentationKind;
  readonly renderHandleId: number;
  readonly kind: "player" | "npc" | "creature" | "projectile" | "object" | "groundItem";
  readonly defId: string;
  readonly appearance:
    | { readonly name?: string; readonly bodyId?: string; readonly colors?: readonly number[] }
    | undefined;
  readonly debugName: string | undefined;
}

export interface RenderTransformCacheOptions {
  readonly initialCapacity: number;
  readonly tileSize?: number;
}

export interface RenderTransformSample {
  readonly alpha: number;
  readonly mode: PresentationSampleMode;
  readonly snapReason?: string | undefined;
  readonly olderSnapshot?: RenderSnapshot | undefined;
  readonly newerSnapshot: RenderSnapshot;
}

type MutablePresentation = {
  -readonly [K in keyof RenderEntityPresentation]: RenderEntityPresentation[K];
};

export class RenderTransformCache {
  private _capacity: number;
  private _count: number;
  private readonly _tileSize: number;

  // Hot fields — struct-of-arrays typed arrays
  private _entityIds: Int32Array;
  private _prevTileX: Int32Array;
  private _prevTileY: Int32Array;
  private _prevTilePlane: Int32Array;
  private _currTileX: Int32Array;
  private _currTileY: Int32Array;
  private _currTilePlane: Int32Array;
  private _renderX: Float32Array;
  private _renderY: Float32Array;
  private _renderZ: Float32Array;
  private _heading: Float32Array;
  private _movementKind: Uint8Array;
  private _renderHandleId: Int32Array;

  // Entity id → index in the struct-of-arrays
  private _entityIdToIndex: Map<number, number>;

  // Cold metadata
  private _defId: Map<number, string>;
  private _appearance: Map<
    number,
    { readonly name?: string; readonly bodyId?: string; readonly colors?: readonly number[] }
  >;
  private _kind: Map<number, RenderEntitySnapshot["kind"]>;
  private _debugName: Map<number, string>;

  // Reusable lookup maps — pre-allocated to avoid per-frame allocation
  private _olderLookup: Map<number, number>;
  private _newerSeen: Map<number, boolean>;

  // Scratch presentation object reused by forEachPresentation
  private _presentationScratch: MutablePresentation;

  constructor(options: RenderTransformCacheOptions) {
    this._capacity = options.initialCapacity;
    this._tileSize = options.tileSize ?? 1;
    this._count = 0;

    this._entityIds = new Int32Array(this._capacity);
    this._prevTileX = new Int32Array(this._capacity);
    this._prevTileY = new Int32Array(this._capacity);
    this._prevTilePlane = new Int32Array(this._capacity);
    this._currTileX = new Int32Array(this._capacity);
    this._currTileY = new Int32Array(this._capacity);
    this._currTilePlane = new Int32Array(this._capacity);
    this._renderX = new Float32Array(this._capacity);
    this._renderY = new Float32Array(this._capacity);
    this._renderZ = new Float32Array(this._capacity);
    this._heading = new Float32Array(this._capacity);
    this._movementKind = new Uint8Array(this._capacity);
    this._renderHandleId = new Int32Array(this._capacity);

    this._entityIdToIndex = new Map();
    this._defId = new Map();
    this._appearance = new Map();
    this._kind = new Map();
    this._debugName = new Map();

    this._olderLookup = new Map();
    this._newerSeen = new Map();
    this._presentationScratch = this._createPresentationScratch();
  }

  /** Number of active entities in the cache. */
  get count(): number {
    return this._count;
  }

  /** Apply a presentation sample to update every entity's numeric transforms. */
  applySample(sample: RenderTransformSample): void {
    if (sample.mode === "empty") {
      this._clearAll();
      return;
    }

    const { newerSnapshot, olderSnapshot, mode, alpha } = sample;

    // Build reusable lookup for older snapshot
    this._olderLookup.clear();
    if (olderSnapshot !== undefined) {
      for (let i = 0; i < olderSnapshot.entities.length; i++) {
        const e = olderSnapshot.entities[i];
        if (e !== undefined) {
          this._olderLookup.set(e.entityId, i);
        }
      }
    }

    // Build reusable set of seen entity ids from the newest snapshot
    this._newerSeen.clear();
    for (let i = 0; i < newerSnapshot.entities.length; i++) {
      const e = newerSnapshot.entities[i];
      if (e !== undefined) {
        this._newerSeen.set(e.entityId, true);
      }
    }

    // Update or add every entity present in the newest snapshot
    for (let i = 0; i < newerSnapshot.entities.length; i++) {
      const entity = newerSnapshot.entities[i];
      if (entity !== undefined) {
        this._updateEntity(entity, mode, alpha, olderSnapshot);
      }
    }

    // Remove entities absent from the newest snapshot
    this._removeAbsentEntities();
  }

  /** Retrieve a single entity's presentation. Returns undefined if not present. */
  getPresentation(entityId: number): RenderEntityPresentation | undefined {
    const index = this._entityIdToIndex.get(entityId);
    if (index === undefined) return undefined;
    return this._buildPresentation(index);
  }

  /**
   * Iterate every active presentation without allocating per entity.
   * The passed object is reused across callbacks — do not retain the reference.
   */
  forEachPresentation(callback: (presentation: RenderEntityPresentation) => void): void {
    for (let i = 0; i < this._count; i++) {
      this._fillPresentationScratch(i);
      callback(this._presentationScratch as RenderEntityPresentation);
    }
  }

  /** Directly set the render handle id for an entity. Returns true if the entity exists. */
  setRenderHandleId(entityId: number, renderHandleId: number): boolean {
    const index = this._entityIdToIndex.get(entityId);
    if (index === undefined) return false;
    this._renderHandleId[index] = renderHandleId;
    return true;
  }

  /** Directly set a debug name for an entity. Returns true if the entity exists. */
  setDebugName(entityId: number, debugName: string): boolean {
    const index = this._entityIdToIndex.get(entityId);
    if (index === undefined) return false;
    this._debugName.set(entityId, debugName);
    return true;
  }

  private _clearAll(): void {
    this._count = 0;
    this._entityIdToIndex.clear();
    this._defId.clear();
    this._appearance.clear();
    this._kind.clear();
    this._debugName.clear();
  }

  private _updateEntity(
    entity: RenderEntitySnapshot,
    mode: PresentationSampleMode,
    alpha: number,
    olderSnapshot?: RenderSnapshot,
  ): void {
    const existingIndex = this._entityIdToIndex.get(entity.entityId);
    let index: number;
    if (existingIndex === undefined) {
      index = this._count;
      this._ensureCapacity(this._count + 1);
      this._count++;
      this._entityIdToIndex.set(entity.entityId, index);
    } else {
      index = existingIndex;
    }

    // Update cold metadata
    this._defId.set(entity.entityId, entity.defId);
    this._appearance.set(entity.entityId, entity.appearance);
    this._kind.set(entity.entityId, entity.kind);

    // Update hot fields
    this._entityIds[index] = entity.entityId;

    // Determine the previous tile used for interpolation. Prefer the older
    // snapshot's actual tile — the entity's true position one tick ago — over
    // the per-entity previousTile field. When an entity stops moving the server
    // stops sending position updates, so its previousTile stays pinned to the
    // second-to-last tile; interpolating from that replays the final step every
    // tick (the classic "moonwalk back and re-walk" stutter at a path's end).
    // The older snapshot's tile equals the current tile once the entity is at
    // rest, so it interpolates to a standstill instead.
    let prevTile = entity.previousTile;
    if (olderSnapshot !== undefined) {
      const olderIdx = this._olderLookup.get(entity.entityId);
      if (olderIdx !== undefined) {
        const olderEntity = olderSnapshot.entities[olderIdx];
        if (olderEntity !== undefined) {
          prevTile = olderEntity.tile;
        }
      }
    }

    if (prevTile !== null) {
      this._prevTileX[index] = prevTile.x;
      this._prevTileY[index] = prevTile.y;
      this._prevTilePlane[index] = prevTile.plane;
    } else {
      // No previous tile known — snap to current tile with no interpolation
      this._prevTileX[index] = entity.tile.x;
      this._prevTileY[index] = entity.tile.y;
      this._prevTilePlane[index] = entity.tile.plane;
    }

    this._currTileX[index] = entity.tile.x;
    this._currTileY[index] = entity.tile.y;
    this._currTilePlane[index] = entity.tile.plane;

    this._heading[index] = entity.facing;

    // Determine movement presentation kind. Decide "is it actually moving"
    // from the displacement between the interpolation endpoints
    // (prevTile → currTile) rather than the moveSpeed field, which the server
    // leaves at "walk" after an entity reaches its destination. Without this a
    // stopped actor keeps playing its walk cycle on the spot.
    const movedThisWindow =
      prevTile !== null &&
      (prevTile.x !== entity.tile.x ||
        prevTile.y !== entity.tile.y ||
        prevTile.plane !== entity.tile.plane);
    let movementKind: MovementPresentationKind;
    if (entity.moveSpeed === "teleport" || entity.previousTile === null) {
      movementKind = MovementPresentationKind.Teleport;
    } else if (!movedThisWindow) {
      movementKind = MovementPresentationKind.Idle;
    } else if (entity.moveSpeed === "run" && prevTile !== null) {
      const dx = Math.abs(prevTile.x - entity.tile.x);
      const dy = Math.abs(prevTile.y - entity.tile.y);
      if (dx + dy >= 2) {
        movementKind = MovementPresentationKind.Run;
      } else {
        movementKind = MovementPresentationKind.Walk;
      }
    } else if (entity.moveSpeed === "walk") {
      movementKind = MovementPresentationKind.Walk;
    } else {
      movementKind = MovementPresentationKind.Idle;
    }
    this._movementKind[index] = movementKind;

    if (existingIndex === undefined) {
      this._renderHandleId[index] = -1;
    }

    this._computeRenderPosition(index, mode, alpha);
  }

  private _computeRenderPosition(index: number, mode: PresentationSampleMode, alpha: number): void {
    const halfTile = this._tileSize * 0.5;

    if (
      RenderTransformCache._readTypedArray(this._movementKind, index) ===
        MovementPresentationKind.Teleport ||
      mode === "snap" ||
      mode === "empty"
    ) {
      this._renderX[index] =
        RenderTransformCache._readTypedArray(this._currTileX, index) * this._tileSize + halfTile;
      this._renderY[index] = RenderTransformCache._readTypedArray(this._currTilePlane, index);
      this._renderZ[index] =
        RenderTransformCache._readTypedArray(this._currTileY, index) * this._tileSize + halfTile;
      return;
    }

    if (mode === "hold_latest" || mode === "freeze") {
      this._renderX[index] =
        RenderTransformCache._readTypedArray(this._currTileX, index) * this._tileSize + halfTile;
      this._renderY[index] = RenderTransformCache._readTypedArray(this._currTilePlane, index);
      this._renderZ[index] =
        RenderTransformCache._readTypedArray(this._currTileY, index) * this._tileSize + halfTile;
      return;
    }

    // interpolate
    const prevX =
      RenderTransformCache._readTypedArray(this._prevTileX, index) * this._tileSize + halfTile;
    const prevY = RenderTransformCache._readTypedArray(this._prevTilePlane, index);
    const prevZ =
      RenderTransformCache._readTypedArray(this._prevTileY, index) * this._tileSize + halfTile;

    const currX =
      RenderTransformCache._readTypedArray(this._currTileX, index) * this._tileSize + halfTile;
    const currY = RenderTransformCache._readTypedArray(this._currTilePlane, index);
    const currZ =
      RenderTransformCache._readTypedArray(this._currTileY, index) * this._tileSize + halfTile;

    this._renderX[index] = prevX + alpha * (currX - prevX);
    this._renderY[index] = prevY + alpha * (currY - prevY);
    this._renderZ[index] = prevZ + alpha * (currZ - prevZ);
  }

  private _removeAbsentEntities(): void {
    // Iterate backwards so removal (swap-to-end) does not disturb unvisited indices.
    for (let i = this._count - 1; i >= 0; i--) {
      const entityId = RenderTransformCache._readTypedArray(this._entityIds, i);
      if (!this._newerSeen.has(entityId)) {
        this._removeEntityAtIndex(i);
      }
    }
  }

  private _removeEntityAtIndex(index: number): void {
    const lastIndex = this._count - 1;
    const removedId = RenderTransformCache._readTypedArray(this._entityIds, index);

    if (index !== lastIndex) {
      this._swapAt(index, lastIndex);
      const swappedId = RenderTransformCache._readTypedArray(this._entityIds, index);
      this._entityIdToIndex.set(swappedId, index);
    }

    // Hygiene: clear the vacated last slot
    this._entityIds[lastIndex] = -1;
    this._prevTileX[lastIndex] = 0;
    this._prevTileY[lastIndex] = 0;
    this._prevTilePlane[lastIndex] = 0;
    this._currTileX[lastIndex] = 0;
    this._currTileY[lastIndex] = 0;
    this._currTilePlane[lastIndex] = 0;
    this._renderX[lastIndex] = 0;
    this._renderY[lastIndex] = 0;
    this._renderZ[lastIndex] = 0;
    this._heading[lastIndex] = 0;
    this._movementKind[lastIndex] = MovementPresentationKind.Idle;
    this._renderHandleId[lastIndex] = -1;

    this._count--;
    this._entityIdToIndex.delete(removedId);
    this._defId.delete(removedId);
    this._appearance.delete(removedId);
    this._kind.delete(removedId);
    this._debugName.delete(removedId);
  }

  private _swapAt(a: number, b: number): void {
    const tmpId = RenderTransformCache._readTypedArray(this._entityIds, a);
    this._entityIds[a] = RenderTransformCache._readTypedArray(this._entityIds, b);
    this._entityIds[b] = tmpId;

    const tmpPrevX = RenderTransformCache._readTypedArray(this._prevTileX, a);
    this._prevTileX[a] = RenderTransformCache._readTypedArray(this._prevTileX, b);
    this._prevTileX[b] = tmpPrevX;

    const tmpPrevY = RenderTransformCache._readTypedArray(this._prevTileY, a);
    this._prevTileY[a] = RenderTransformCache._readTypedArray(this._prevTileY, b);
    this._prevTileY[b] = tmpPrevY;

    const tmpPrevPlane = RenderTransformCache._readTypedArray(this._prevTilePlane, a);
    this._prevTilePlane[a] = RenderTransformCache._readTypedArray(this._prevTilePlane, b);
    this._prevTilePlane[b] = tmpPrevPlane;

    const tmpCurrX = RenderTransformCache._readTypedArray(this._currTileX, a);
    this._currTileX[a] = RenderTransformCache._readTypedArray(this._currTileX, b);
    this._currTileX[b] = tmpCurrX;

    const tmpCurrY = RenderTransformCache._readTypedArray(this._currTileY, a);
    this._currTileY[a] = RenderTransformCache._readTypedArray(this._currTileY, b);
    this._currTileY[b] = tmpCurrY;

    const tmpCurrPlane = RenderTransformCache._readTypedArray(this._currTilePlane, a);
    this._currTilePlane[a] = RenderTransformCache._readTypedArray(this._currTilePlane, b);
    this._currTilePlane[b] = tmpCurrPlane;

    const tmpRenderX = RenderTransformCache._readTypedArray(this._renderX, a);
    this._renderX[a] = RenderTransformCache._readTypedArray(this._renderX, b);
    this._renderX[b] = tmpRenderX;

    const tmpRenderY = RenderTransformCache._readTypedArray(this._renderY, a);
    this._renderY[a] = RenderTransformCache._readTypedArray(this._renderY, b);
    this._renderY[b] = tmpRenderY;

    const tmpRenderZ = RenderTransformCache._readTypedArray(this._renderZ, a);
    this._renderZ[a] = RenderTransformCache._readTypedArray(this._renderZ, b);
    this._renderZ[b] = tmpRenderZ;

    const tmpHeading = RenderTransformCache._readTypedArray(this._heading, a);
    this._heading[a] = RenderTransformCache._readTypedArray(this._heading, b);
    this._heading[b] = tmpHeading;

    const tmpMovement = RenderTransformCache._readTypedArray(this._movementKind, a);
    this._movementKind[a] = RenderTransformCache._readTypedArray(this._movementKind, b);
    this._movementKind[b] = tmpMovement;

    const tmpHandle = RenderTransformCache._readTypedArray(this._renderHandleId, a);
    this._renderHandleId[a] = RenderTransformCache._readTypedArray(this._renderHandleId, b);
    this._renderHandleId[b] = tmpHandle;
  }

  private _ensureCapacity(required: number): void {
    if (required <= this._capacity) return;

    let newCapacity = this._capacity * 2;
    while (newCapacity < required) {
      newCapacity *= 2;
    }

    this._entityIds = this._growInt32Array(this._entityIds, newCapacity);
    this._prevTileX = this._growInt32Array(this._prevTileX, newCapacity);
    this._prevTileY = this._growInt32Array(this._prevTileY, newCapacity);
    this._prevTilePlane = this._growInt32Array(this._prevTilePlane, newCapacity);
    this._currTileX = this._growInt32Array(this._currTileX, newCapacity);
    this._currTileY = this._growInt32Array(this._currTileY, newCapacity);
    this._currTilePlane = this._growInt32Array(this._currTilePlane, newCapacity);
    this._renderX = this._growFloat32Array(this._renderX, newCapacity);
    this._renderY = this._growFloat32Array(this._renderY, newCapacity);
    this._renderZ = this._growFloat32Array(this._renderZ, newCapacity);
    this._heading = this._growFloat32Array(this._heading, newCapacity);
    this._movementKind = this._growUint8Array(this._movementKind, newCapacity);
    this._renderHandleId = this._growInt32Array(this._renderHandleId, newCapacity);

    this._capacity = newCapacity;
  }

  private _growInt32Array(arr: Int32Array, newCapacity: number): Int32Array {
    const next = new Int32Array(newCapacity);
    next.set(arr);
    return next;
  }

  private _growFloat32Array(arr: Float32Array, newCapacity: number): Float32Array {
    const next = new Float32Array(newCapacity);
    next.set(arr);
    return next;
  }

  private _growUint8Array(arr: Uint8Array, newCapacity: number): Uint8Array {
    const next = new Uint8Array(newCapacity);
    next.set(arr);
    return next;
  }

  private static _readTypedArray<T extends Int32Array | Float32Array | Uint8Array>(
    arr: T,
    index: number,
  ): number {
    const val = arr[index];
    if (val === undefined) throw new Error("Invariant: index out of bounds");
    return val;
  }

  private _createPresentationScratch(): MutablePresentation {
    return {
      entityId: 0,
      prevTileX: 0,
      prevTileY: 0,
      prevTilePlane: 0,
      currTileX: 0,
      currTileY: 0,
      currTilePlane: 0,
      renderX: 0,
      renderY: 0,
      renderZ: 0,
      heading: 0,
      movementKind: MovementPresentationKind.Idle,
      renderHandleId: -1,
      kind: "npc",
      defId: "",
      appearance: undefined,
      debugName: undefined,
    };
  }

  private _fillPresentationScratch(index: number): void {
    const s = this._presentationScratch;
    const entityId = RenderTransformCache._readTypedArray(this._entityIds, index);
    s.entityId = entityId;
    s.prevTileX = RenderTransformCache._readTypedArray(this._prevTileX, index);
    s.prevTileY = RenderTransformCache._readTypedArray(this._prevTileY, index);
    s.prevTilePlane = RenderTransformCache._readTypedArray(this._prevTilePlane, index);
    s.currTileX = RenderTransformCache._readTypedArray(this._currTileX, index);
    s.currTileY = RenderTransformCache._readTypedArray(this._currTileY, index);
    s.currTilePlane = RenderTransformCache._readTypedArray(this._currTilePlane, index);
    s.renderX = RenderTransformCache._readTypedArray(this._renderX, index);
    s.renderY = RenderTransformCache._readTypedArray(this._renderY, index);
    s.renderZ = RenderTransformCache._readTypedArray(this._renderZ, index);
    s.heading = RenderTransformCache._readTypedArray(this._heading, index);
    s.movementKind = RenderTransformCache._readTypedArray(
      this._movementKind,
      index,
    ) as MovementPresentationKind;
    s.renderHandleId = RenderTransformCache._readTypedArray(this._renderHandleId, index);
    s.kind = this._kind.get(entityId) ?? "npc";
    s.defId = this._defId.get(entityId) ?? "";
    s.appearance = this._appearance.get(entityId);
    s.debugName = this._debugName.get(entityId);
  }

  private _buildPresentation(index: number): RenderEntityPresentation {
    const entityId = RenderTransformCache._readTypedArray(this._entityIds, index);
    return {
      entityId,
      prevTileX: RenderTransformCache._readTypedArray(this._prevTileX, index),
      prevTileY: RenderTransformCache._readTypedArray(this._prevTileY, index),
      prevTilePlane: RenderTransformCache._readTypedArray(this._prevTilePlane, index),
      currTileX: RenderTransformCache._readTypedArray(this._currTileX, index),
      currTileY: RenderTransformCache._readTypedArray(this._currTileY, index),
      currTilePlane: RenderTransformCache._readTypedArray(this._currTilePlane, index),
      renderX: RenderTransformCache._readTypedArray(this._renderX, index),
      renderY: RenderTransformCache._readTypedArray(this._renderY, index),
      renderZ: RenderTransformCache._readTypedArray(this._renderZ, index),
      heading: RenderTransformCache._readTypedArray(this._heading, index),
      movementKind: RenderTransformCache._readTypedArray(
        this._movementKind,
        index,
      ) as MovementPresentationKind,
      renderHandleId: RenderTransformCache._readTypedArray(this._renderHandleId, index),
      kind: this._kind.get(entityId) ?? "npc",
      defId: this._defId.get(entityId) ?? "",
      appearance: this._appearance.get(entityId),
      debugName: this._debugName.get(entityId),
    };
  }
}
