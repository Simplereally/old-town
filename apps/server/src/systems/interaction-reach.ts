import type { EntityId, TileCoord } from "@old-town/shared";
import type { ActionQueue, ActionQueueEntry } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap, Footprint } from "../world/collision";
import { findPath } from "../world/pathfinding";

export interface InteractionTarget {
  readonly origin: TileCoord;
  readonly footprint: Footprint;
  readonly requiredDistance: number;
  readonly requiresLineOfSight?: boolean;
  readonly faceTarget?: boolean;
}

export interface InteractionRequest {
  readonly actor: EntityId;
  readonly actorTile: TileCoord;
  readonly actorFootprint?: Footprint;
  readonly target: InteractionTarget;
  readonly action?: ActionQueueEntry;
}

export type InteractionResolution =
  | {
      readonly kind: "ready";
      readonly distance: number;
      readonly enqueued: boolean;
    }
  | {
      readonly kind: "path";
      readonly destination: TileCoord;
      readonly path: readonly TileCoord[];
    }
  | {
      readonly kind: "unreachable";
      readonly reason: "no_tile" | "no_path";
    };

export interface InteractionReachContext {
  readonly collision: CollisionMap;
  readonly actionQueue?: ActionQueue;
  readonly deltas?: DeltaAccumulator;
}

const ONE_TILE: Footprint = { width: 1, length: 1 };

function assertDistance(distance: number): void {
  if (!Number.isInteger(distance) || distance < 0) {
    throw new RangeError("requiredDistance must be a non-negative integer");
  }
}

function rectangleMaxX(origin: TileCoord, footprint: Footprint): number {
  return origin.x + footprint.width - 1;
}

function rectangleMaxY(origin: TileCoord, footprint: Footprint): number {
  return origin.y + footprint.length - 1;
}

export function footprintDistance(
  aOrigin: TileCoord,
  aFootprint: Footprint,
  bOrigin: TileCoord,
  bFootprint: Footprint,
): number {
  const dx = Math.max(
    0,
    bOrigin.x - rectangleMaxX(aOrigin, aFootprint),
    aOrigin.x - rectangleMaxX(bOrigin, bFootprint),
  );
  const dy = Math.max(
    0,
    bOrigin.y - rectangleMaxY(aOrigin, aFootprint),
    aOrigin.y - rectangleMaxY(bOrigin, bFootprint),
  );
  return Math.max(dx, dy);
}

function nearestTileInFootprint(from: TileCoord, target: InteractionTarget): TileCoord {
  return {
    x: Math.min(Math.max(from.x, target.origin.x), rectangleMaxX(target.origin, target.footprint)),
    y: Math.min(Math.max(from.y, target.origin.y), rectangleMaxY(target.origin, target.footprint)),
    plane: target.origin.plane,
  };
}

function hasTargetLineOfSight(
  collision: CollisionMap,
  actorTile: TileCoord,
  target: InteractionTarget,
): boolean {
  return collision.hasLineOfSight(actorTile, nearestTileInFootprint(actorTile, target));
}

export function isWithinInteractionRange(
  collision: CollisionMap,
  actorTile: TileCoord,
  target: InteractionTarget,
  actorFootprint: Footprint = ONE_TILE,
): boolean {
  assertDistance(target.requiredDistance);
  if (actorTile.plane !== target.origin.plane) {
    return false;
  }
  const distance = footprintDistance(actorTile, actorFootprint, target.origin, target.footprint);
  if (distance > target.requiredDistance) {
    return false;
  }
  return target.requiresLineOfSight === true
    ? hasTargetLineOfSight(collision, actorTile, target)
    : true;
}

function candidateTiles(
  target: InteractionTarget,
  actorFootprint: Footprint,
): readonly TileCoord[] {
  const candidates: TileCoord[] = [];
  const targetOrigin = target.origin;
  const targetFootprint = target.footprint;
  const requiredDistance = target.requiredDistance;
  const minX = targetOrigin.x - requiredDistance - actorFootprint.width + 1;
  const maxX = rectangleMaxX(targetOrigin, targetFootprint) + requiredDistance;
  const minY = targetOrigin.y - requiredDistance - actorFootprint.length + 1;
  const maxY = rectangleMaxY(targetOrigin, targetFootprint) + requiredDistance;
  const targetPlane = targetOrigin.plane;

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      const candidate = { x, y, plane: targetPlane };
      const distance = footprintDistance(candidate, actorFootprint, targetOrigin, targetFootprint);
      if (distance <= requiredDistance && (requiredDistance === 0 || distance > 0)) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

export function findNearestInteractionTile(
  collision: CollisionMap,
  actorTile: TileCoord,
  target: InteractionTarget,
  actorFootprint: Footprint = ONE_TILE,
): TileCoord | undefined {
  let best: { tile: TileCoord; pathLength: number } | undefined;

  const requiresLineOfSight = target.requiresLineOfSight === true;
  for (const candidate of candidateTiles(target, actorFootprint)) {
    if (!collision.canOccupy(candidate, actorFootprint)) {
      continue;
    }
    if (requiresLineOfSight && !hasTargetLineOfSight(collision, candidate, target)) {
      continue;
    }
    const result = findPath(collision, actorTile, candidate, { footprint: actorFootprint });
    if (!result.reached) {
      continue;
    }
    if (
      !best ||
      result.path.length < best.pathLength ||
      (result.path.length === best.pathLength &&
        candidate.x - actorTile.x < best.tile.x - actorTile.x)
    ) {
      best = { tile: candidate, pathLength: result.path.length };
    }
  }

  return best?.tile;
}

export function resolveInteraction(
  context: InteractionReachContext,
  request: InteractionRequest,
): InteractionResolution {
  const actorFootprint = request.actorFootprint ?? ONE_TILE;
  const distance = footprintDistance(
    request.actorTile,
    actorFootprint,
    request.target.origin,
    request.target.footprint,
  );

  if (
    isWithinInteractionRange(context.collision, request.actorTile, request.target, actorFootprint)
  ) {
    if (request.action) {
      context.actionQueue?.enqueue(request.action);
    }
    if (request.target.faceTarget === true) {
      context.deltas?.markEntityUpdate(request.actor, {
        facingTile: nearestTileInFootprint(request.actorTile, request.target),
      });
    }
    return {
      kind: "ready",
      distance,
      enqueued: request.action !== undefined && context.actionQueue !== undefined,
    };
  }

  const destination = findNearestInteractionTile(
    context.collision,
    request.actorTile,
    request.target,
    actorFootprint,
  );
  if (!destination) {
    return { kind: "unreachable", reason: "no_tile" };
  }

  const result = findPath(context.collision, request.actorTile, destination, {
    footprint: actorFootprint,
  });
  if (!result.reached) {
    return { kind: "unreachable", reason: "no_path" };
  }

  return {
    kind: "path",
    destination,
    path: result.path,
  };
}
