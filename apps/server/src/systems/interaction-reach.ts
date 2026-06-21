import type { EntityId, TileCoord } from "@old-town/shared";
import type { ActionQueue, ActionQueueEntry } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap, Footprint } from "../world/collision";
import { findPath } from "../world/pathfinding";

export type InteractionShape = "plus" | "square";

export interface InteractionTarget {
  readonly origin: TileCoord;
  readonly footprint: Footprint;
  readonly requiredDistance: number;
  readonly requiresLineOfSight?: boolean;
  readonly faceTarget?: boolean;
  /**
   * Shape of the reachable area around the target. "square" (default) uses Chebyshev
   * distance, so corner/diagonal tiles count — correct for ranged, magic and reach
   * weapons (halberds). "plus" forbids pure-diagonal contact, matching OSRS melee
   * (range 1), which cannot be performed diagonally. The distinction is only visible
   * at corners and against multi-tile targets.
   */
  readonly requiredShape?: InteractionShape;
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

/**
 * Per-axis empty-tile gap between two footprints. Each axis is 0 when the rectangles
 * overlap or touch on that axis, otherwise the number of empty tiles between them.
 */
export function footprintAxisGaps(
  aOrigin: TileCoord,
  aFootprint: Footprint,
  bOrigin: TileCoord,
  bFootprint: Footprint,
): { readonly dx: number; readonly dy: number } {
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
  return { dx, dy };
}

export function footprintDistance(
  aOrigin: TileCoord,
  aFootprint: Footprint,
  bOrigin: TileCoord,
  bFootprint: Footprint,
): number {
  const { dx, dy } = footprintAxisGaps(aOrigin, aFootprint, bOrigin, bFootprint);
  return Math.max(dx, dy);
}

/**
 * Whether per-axis gaps satisfy the interaction shape. "plus" requires cardinal
 * alignment (one axis gap is exactly 0), rejecting pure-diagonal/corner contact;
 * "square" accepts any gap (the Chebyshev box).
 */
function shapeAllows(dx: number, dy: number, shape: InteractionShape): boolean {
  return shape === "square" || dx === 0 || dy === 0;
}

/** Clamp a tile into a footprint rectangle — the nearest occupied tile of that footprint. */
export function nearestFootprintTile(
  from: TileCoord,
  origin: TileCoord,
  footprint: Footprint,
): TileCoord {
  return {
    x: Math.min(Math.max(from.x, origin.x), rectangleMaxX(origin, footprint)),
    y: Math.min(Math.max(from.y, origin.y), rectangleMaxY(origin, footprint)),
    plane: origin.plane,
  };
}

function nearestTileInFootprint(from: TileCoord, target: InteractionTarget): TileCoord {
  return nearestFootprintTile(from, target.origin, target.footprint);
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
  const { dx, dy } = footprintAxisGaps(actorTile, actorFootprint, target.origin, target.footprint);
  if (Math.max(dx, dy) > target.requiredDistance) {
    return false;
  }
  if (!shapeAllows(dx, dy, target.requiredShape ?? "square")) {
    return false;
  }
  return target.requiresLineOfSight === true
    ? hasTargetLineOfSight(collision, actorTile, target)
    : true;
}

export function interactionCandidateTiles(
  target: InteractionTarget,
  actorFootprint: Footprint,
): readonly TileCoord[] {
  const candidates: TileCoord[] = [];
  const targetOrigin = target.origin;
  const targetFootprint = target.footprint;
  const requiredDistance = target.requiredDistance;
  const shape = target.requiredShape ?? "square";
  const minX = targetOrigin.x - requiredDistance - actorFootprint.width + 1;
  const maxX = rectangleMaxX(targetOrigin, targetFootprint) + requiredDistance;
  const minY = targetOrigin.y - requiredDistance - actorFootprint.length + 1;
  const maxY = rectangleMaxY(targetOrigin, targetFootprint) + requiredDistance;
  const targetPlane = targetOrigin.plane;

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      const candidate = { x, y, plane: targetPlane };
      const { dx, dy } = footprintAxisGaps(
        candidate,
        actorFootprint,
        targetOrigin,
        targetFootprint,
      );
      const distance = Math.max(dx, dy);
      if (
        distance <= requiredDistance &&
        (requiredDistance === 0 || distance > 0) &&
        shapeAllows(dx, dy, shape)
      ) {
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
  for (const candidate of interactionCandidateTiles(target, actorFootprint)) {
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
