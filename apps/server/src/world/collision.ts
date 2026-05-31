import type { ContentRegistries, ObjectDef, TileCoord } from "@old-town/shared";
import { tileKey } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { RuntimeMap } from "./runtime-map";

export enum CollisionFlag {
  BLOCK_NORTH = 1 << 0,
  BLOCK_EAST = 1 << 1,
  BLOCK_SOUTH = 1 << 2,
  BLOCK_WEST = 1 << 3,
  BLOCK_FULL = 1 << 4,
  BLOCK_FLOOR = 1 << 5,
  BLOCK_DECORATION = 1 << 6,
  BLOCK_LOS_NORTH = 1 << 7,
  BLOCK_LOS_EAST = 1 << 8,
  BLOCK_LOS_SOUTH = 1 << 9,
  BLOCK_LOS_WEST = 1 << 10,
  BLOCK_LOS_FULL = 1 << 11,
  OCCUPIED_PLAYER = 1 << 12,
  OCCUPIED_NPC = 1 << 13,
  OCCUPIED_OBJECT = 1 << 14,
  PROJECTILE_BLOCK = 1 << 15,
}

export interface Footprint {
  readonly width: number;
  readonly length: number;
}

export interface LineOfSightOptions {
  readonly projectile?: boolean;
}

const ONE_TILE: Footprint = { width: 1, length: 1 };

const OCCUPANCY_BLOCKERS =
  CollisionFlag.BLOCK_FULL |
  CollisionFlag.BLOCK_FLOOR |
  CollisionFlag.BLOCK_DECORATION |
  CollisionFlag.OCCUPIED_PLAYER |
  CollisionFlag.OCCUPIED_NPC |
  CollisionFlag.OCCUPIED_OBJECT;

function assertFootprint(footprint: Footprint): void {
  if (
    !Number.isInteger(footprint.width) ||
    !Number.isInteger(footprint.length) ||
    footprint.width <= 0 ||
    footprint.length <= 0
  ) {
    throw new RangeError("Footprint width and length must be positive integers");
  }
}

function tileAt(origin: TileCoord, dx: number, dy: number): TileCoord {
  return { x: origin.x + dx, y: origin.y + dy, plane: origin.plane };
}

function signStep(value: number): number {
  return Math.sign(value);
}

export class CollisionMap {
  private readonly dynamic = new Map<string, number>();

  constructor(private readonly map: RuntimeMap) {}

  getMask(tile: TileCoord): number {
    const key = tileKey(tile);
    const staticMask = this.map.tiles.get(key)?.collision ?? CollisionFlag.BLOCK_FULL;
    return staticMask | (this.dynamic.get(key) ?? 0);
  }

  addDynamic(tile: TileCoord, flags: number): void {
    const key = tileKey(tile);
    this.dynamic.set(key, (this.dynamic.get(key) ?? 0) | flags);
  }

  clearDynamic(tile: TileCoord, flags?: number): void {
    const key = tileKey(tile);
    if (flags === undefined) {
      this.dynamic.delete(key);
      return;
    }
    const next = (this.dynamic.get(key) ?? 0) & ~flags;
    if (next === 0) {
      this.dynamic.delete(key);
    } else {
      this.dynamic.set(key, next);
    }
  }

  applyFootprint(origin: TileCoord, footprint: Footprint, flags: number): () => void {
    assertFootprint(footprint);
    const width = footprint.width;
    const length = footprint.length;
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < length; y += 1) {
        this.addDynamic(tileAt(origin, x, y), flags);
      }
    }
    return () => this.clearFootprint(origin, footprint, flags);
  }

  clearFootprint(origin: TileCoord, footprint: Footprint, flags?: number): void {
    assertFootprint(footprint);
    const width = footprint.width;
    const length = footprint.length;
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < length; y += 1) {
        this.clearDynamic(tileAt(origin, x, y), flags);
      }
    }
  }

  canOccupy(origin: TileCoord, footprint: Footprint = ONE_TILE): boolean {
    assertFootprint(footprint);
    const width = footprint.width;
    const length = footprint.length;
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < length; y += 1) {
        if ((this.getMask(tileAt(origin, x, y)) & OCCUPANCY_BLOCKERS) !== 0) {
          return false;
        }
      }
    }
    return true;
  }

  canStep(from: TileCoord, to: TileCoord, footprint: Footprint = ONE_TILE): boolean {
    if (from.plane !== to.plane) {
      return false;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) {
      return false;
    }

    if (dx !== 0 && dy !== 0) {
      return (
        this.canStepCardinal(from, signStep(dx), 0, footprint) &&
        this.canStepCardinal(from, 0, signStep(dy), footprint) &&
        this.canOccupy(to, footprint)
      );
    }

    return this.canStepCardinal(from, signStep(dx), signStep(dy), footprint);
  }

  hasLineOfSight(from: TileCoord, to: TileCoord, options: LineOfSightOptions = {}): boolean {
    if (from.plane !== to.plane) {
      return false;
    }

    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    if (steps === 0) {
      return true;
    }

    let current = from;
    for (let step = 1; step <= steps; step += 1) {
      const next: TileCoord = {
        x: Math.round(from.x + ((to.x - from.x) * step) / steps),
        y: Math.round(from.y + ((to.y - from.y) * step) / steps),
        plane: from.plane,
      };
      if (next.x === current.x && next.y === current.y) {
        continue;
      }
      if (this.losEdgeBlocked(current, next) || this.tileBlocksSight(next, options)) {
        return false;
      }
      current = next;
    }

    return true;
  }

  private canStepCardinal(from: TileCoord, dx: number, dy: number, footprint: Footprint): boolean {
    if (!this.canOccupy(tileAt(from, dx, dy), footprint)) {
      return false;
    }

    const width = footprint.width;
    const length = footprint.length;

    if (dx > 0) {
      for (let y = 0; y < length; y += 1) {
        if (this.movementEdgeBlocked(tileAt(from, width - 1, y), tileAt(from, width, y))) {
          return false;
        }
      }
    } else if (dx < 0) {
      for (let y = 0; y < length; y += 1) {
        if (this.movementEdgeBlocked(tileAt(from, 0, y), tileAt(from, -1, y))) {
          return false;
        }
      }
    } else if (dy > 0) {
      for (let x = 0; x < width; x += 1) {
        if (this.movementEdgeBlocked(tileAt(from, x, length - 1), tileAt(from, x, length))) {
          return false;
        }
      }
    } else if (dy < 0) {
      for (let x = 0; x < width; x += 1) {
        if (this.movementEdgeBlocked(tileAt(from, x, 0), tileAt(from, x, -1))) {
          return false;
        }
      }
    }

    return true;
  }

  private movementEdgeBlocked(from: TileCoord, to: TileCoord): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const fromMask = this.getMask(from);
    const toMask = this.getMask(to);

    if (dx > 0)
      return (
        (fromMask & CollisionFlag.BLOCK_EAST) !== 0 || (toMask & CollisionFlag.BLOCK_WEST) !== 0
      );
    if (dx < 0)
      return (
        (fromMask & CollisionFlag.BLOCK_WEST) !== 0 || (toMask & CollisionFlag.BLOCK_EAST) !== 0
      );
    if (dy > 0)
      return (
        (fromMask & CollisionFlag.BLOCK_NORTH) !== 0 || (toMask & CollisionFlag.BLOCK_SOUTH) !== 0
      );
    if (dy < 0)
      return (
        (fromMask & CollisionFlag.BLOCK_SOUTH) !== 0 || (toMask & CollisionFlag.BLOCK_NORTH) !== 0
      );
    return false;
  }

  private losEdgeBlocked(from: TileCoord, to: TileCoord): boolean {
    const dx = signStep(to.x - from.x);
    const dy = signStep(to.y - from.y);
    const fromMask = this.getMask(from);
    const toMask = this.getMask(to);

    if (
      dx > 0 &&
      ((fromMask & CollisionFlag.BLOCK_LOS_EAST) !== 0 ||
        (toMask & CollisionFlag.BLOCK_LOS_WEST) !== 0)
    ) {
      return true;
    }
    if (
      dx < 0 &&
      ((fromMask & CollisionFlag.BLOCK_LOS_WEST) !== 0 ||
        (toMask & CollisionFlag.BLOCK_LOS_EAST) !== 0)
    ) {
      return true;
    }
    if (
      dy > 0 &&
      ((fromMask & CollisionFlag.BLOCK_LOS_NORTH) !== 0 ||
        (toMask & CollisionFlag.BLOCK_LOS_SOUTH) !== 0)
    ) {
      return true;
    }
    if (
      dy < 0 &&
      ((fromMask & CollisionFlag.BLOCK_LOS_SOUTH) !== 0 ||
        (toMask & CollisionFlag.BLOCK_LOS_NORTH) !== 0)
    ) {
      return true;
    }
    return false;
  }

  private tileBlocksSight(tile: TileCoord, options: LineOfSightOptions): boolean {
    const mask = this.getMask(tile);
    return (
      (mask & CollisionFlag.BLOCK_LOS_FULL) !== 0 ||
      (options.projectile === true && (mask & CollisionFlag.PROJECTILE_BLOCK) !== 0)
    );
  }
}

export function objectCollisionFlags(def: ObjectDef): number {
  let flags = CollisionFlag.OCCUPIED_OBJECT;
  if (def.blocksMovement) {
    flags |= CollisionFlag.BLOCK_FULL;
  }
  if (def.blocksLineOfSight) {
    flags |= CollisionFlag.BLOCK_LOS_FULL | CollisionFlag.PROJECTILE_BLOCK;
  }
  return flags;
}

export function applyObjectCollision(
  world: World,
  registries: ContentRegistries,
  collision: CollisionMap,
): void {
  const objectRegistry = registries.object;
  for (const [entityId, object] of world.componentEntries("object")) {
    const position = world.getComponent(entityId, "position");
    const def = objectRegistry.get(object.objectId);
    if (!position || !def) {
      continue;
    }

    collision.applyFootprint(
      { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] },
      { width: def.width, length: def.length },
      objectCollisionFlags(def),
    );
  }
}
