import type { ContentRegistries, ObjectDef, TileCoord } from "@old-town/shared";
import { CollisionFlag, tileKey } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { RuntimeMap } from "./runtime-map";

export { CollisionFlag } from "@old-town/shared";

export interface Footprint {
  readonly width: number;
  readonly length: number;
  /** When true, NPC occupancy flags do not block this entity (players pass through NPCs). */
  readonly ignoreNpcOccupancy?: boolean;
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

const OCCUPANCY_BLOCKERS_IGNORE_NPC =
  CollisionFlag.BLOCK_FULL |
  CollisionFlag.BLOCK_FLOOR |
  CollisionFlag.BLOCK_DECORATION |
  CollisionFlag.OCCUPIED_PLAYER |
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
    const blockers = footprint.ignoreNpcOccupancy ? OCCUPANCY_BLOCKERS_IGNORE_NPC : OCCUPANCY_BLOCKERS;
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < length; y += 1) {
        const tile = tileAt(origin, x, y);
        if ((this.getMask(tile) & blockers) !== 0) {
          return false;
        }
        if (this.tileBlocksOccupancy(tile)) {
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
    const toOrigin = tileAt(from, dx, dy);
    if (!this.canOccupy(toOrigin, footprint)) {
      return false;
    }

    // Height difference blocks movement (unless both tiles are bridges).
    if (!this.heightCompatible(from, toOrigin)) {
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

  /** Water tiles block occupancy unless a bridge is present. */
  private tileBlocksOccupancy(tile: TileCoord): boolean {
    const rt = this.map.tiles.get(tileKey(tile));
    if (!rt) return true;
    return rt.water && !rt.bridge;
  }

  /** Height differences block movement unless both tiles are bridges. */
  private heightCompatible(from: TileCoord, to: TileCoord): boolean {
    const fromTile = this.map.tiles.get(tileKey(from));
    const toTile = this.map.tiles.get(tileKey(to));
    if (!fromTile || !toTile) return false;
    if (fromTile.height === toTile.height) return true;
    // Bridges allow crossing height differences over water.
    return fromTile.bridge && toTile.bridge;
  }
}

export function objectCollisionFlags(def: ObjectDef): number {
  if (def.defaultCollision !== undefined) {
    return def.defaultCollision;
  }
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

    const origin: TileCoord = {
      x: position.x,
      y: position.y,
      plane: position.plane,
    };
    const flags = objectCollisionFlags(def);

    if (def.footprint && def.footprint.length > 0) {
      for (const offset of def.footprint) {
        collision.addDynamic(
          { x: origin.x + offset.dx, y: origin.y + offset.dy, plane: origin.plane },
          flags,
        );
      }
    } else {
      collision.applyFootprint(
        origin,
        { width: def.width, length: def.length },
        flags,
      );
    }
  }
}
