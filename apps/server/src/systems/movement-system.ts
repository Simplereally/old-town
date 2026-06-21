import {
  directionFromDelta,
  directionToDelta,
  type EntityId,
  type MoveIntent,
  type MoveSpeed,
  type Plane,
  type TileCoord,
} from "@old-town/shared";
import type { MovementMode } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap, Footprint } from "../world/collision";
import { findPath } from "../world/pathfinding";

export interface MoveIntentOptions {
  readonly mode?: MovementMode;
  readonly footprint?: Footprint;
  readonly tick?: number;
}

export type MoveIntentFailure = "missing_position" | "blocked";

export interface MoveIntentResult {
  readonly accepted: boolean;
  readonly pathLength: number;
  readonly reached: boolean;
  readonly reason?: MoveIntentFailure;
}

export interface MovementSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
}

export type FootprintResolver = Footprint | ((entityId: EntityId) => Footprint);

function positionTile(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane };
}

function moveSpeed(mode: MovementMode): MoveSpeed {
  return mode === "run" ? "run" : "walk";
}

function sortedMovementEntityIds(world: World): readonly EntityId[] {
  return world.entityIdsWith("movement");
}

function resolveFootprint(resolver: FootprintResolver, entityId: EntityId): Footprint {
  return typeof resolver === "function" ? resolver(entityId) : resolver;
}

export function isMovementBlocked(world: World, entityId: EntityId, tick: number): boolean {
  const blockedUntilTick = world.getComponent(entityId, "movement")?.blockedUntilTick;
  return blockedUntilTick !== undefined && tick < blockedUntilTick;
}

export function applyMovementBlock(
  context: MovementSystemContext,
  entityId: EntityId,
  blockedUntilTick: number,
  status: { readonly overheadText?: string; readonly graphicId?: string } = {},
): void {
  const movement = context.world.getComponent(entityId, "movement");
  const nextBlockedUntilTick = Math.max(movement?.blockedUntilTick ?? 0, blockedUntilTick);
  context.world.setComponent(entityId, "movement", {
    entityId,
    mode: movement?.mode ?? "walk",
    path: [],
    ...(movement?.lastStepDirection !== undefined
      ? { lastStepDirection: movement.lastStepDirection }
      : {}),
    blockedUntilTick: nextBlockedUntilTick,
  });
  context.deltas.markEntityUpdate(entityId, {
    moveSpeed: "stationary",
    ...(status.overheadText ? { overheadText: status.overheadText } : {}),
    ...(status.graphicId ? { graphic: { id: status.graphicId } } : {}),
  });
  context.deltas.markDebugPath(entityId, []);
}

export function handleMoveIntent(
  context: MovementSystemContext,
  entityId: EntityId,
  intent: MoveIntent,
  options: MoveIntentOptions = {},
): MoveIntentResult {
  const position = context.world.getComponent(entityId, "position");
  if (!position) {
    return { accepted: false, pathLength: 0, reached: false, reason: "missing_position" };
  }

  const movement = context.world.getComponent(entityId, "movement");
  const blockedUntilTick = movement?.blockedUntilTick;
  if (
    blockedUntilTick !== undefined &&
    (options.tick === undefined || options.tick < blockedUntilTick)
  ) {
    context.deltas.markEntityUpdate(entityId, {
      moveSpeed: "stationary",
      overheadText: "Bound",
    });
    context.deltas.markDebugPath(entityId, []);
    return { accepted: false, pathLength: 0, reached: false, reason: "blocked" };
  }

  const mode = options.mode ?? movement?.mode ?? "walk";
  const result = findPath(
    context.collision,
    positionTile(position),
    intent.dest,
    options.footprint ? { footprint: options.footprint } : {},
  );

  context.world.setComponent(entityId, "movement", {
    entityId,
    mode,
    path: result.path,
    ...(result.path.length > 0 ? { destination: result.destination } : {}),
    ...(movement?.lastStepDirection !== undefined
      ? { lastStepDirection: movement.lastStepDirection }
      : {}),
  });

  return { accepted: true, pathLength: result.path.length, reached: result.reached };
}

export function processMovementPhase(
  context: MovementSystemContext,
  tick: number,
  footprint: FootprintResolver = { width: 1, length: 1 },
): void {
  for (const entityId of sortedMovementEntityIds(context.world)) {
    const movement = context.world.getComponent(entityId, "movement");
    const position = context.world.getComponent(entityId, "position");
    if (!movement || !position || movement.path.length === 0) {
      continue;
    }
    if (movement.blockedUntilTick !== undefined && tick < movement.blockedUntilTick) {
      context.world.setComponent(entityId, "movement", {
        entityId,
        mode: movement.mode,
        path: [],
        ...(movement.lastStepDirection !== undefined
          ? { lastStepDirection: movement.lastStepDirection }
          : {}),
        blockedUntilTick: movement.blockedUntilTick,
      });
      context.deltas.markDebugPath(entityId, []);
      continue;
    }

    let current = positionTile(position);
    const entityFootprint = resolveFootprint(footprint, entityId);
    let pathIndex = 0;
    let lastStepDirection = movement.lastStepDirection;
    let facingTile: TileCoord | undefined;
    let moved = false;
    let blocked = false;
    const stepCount = movement.mode === "run" ? 2 : 1;

    for (let i = 0; i < stepCount; i += 1) {
      const next = movement.path[pathIndex];
      if (!next) {
        break;
      }
      if (!context.collision.canStep(current, next, entityFootprint)) {
        blocked = true;
        context.world.setComponent(entityId, "movement", {
          entityId,
          mode: movement.mode,
          path: [],
          ...(lastStepDirection !== undefined ? { lastStepDirection } : {}),
          blockedUntilTick: tick + 1,
        });
        break;
      }

      pathIndex += 1;
      const direction = directionFromDelta(next.x - current.x, next.y - current.y);
      lastStepDirection = direction ?? lastStepDirection;
      current = next;
      if (direction !== null) {
        const delta = directionToDelta(direction);
        facingTile = { x: current.x + delta.dx, y: current.y + delta.dy, plane: current.plane };
      }
      moved = true;
    }

    if (blocked) {
      context.deltas.markDebugPath(entityId, []);
      continue;
    }

    if (!moved) {
      continue;
    }

    const remainingPath = movement.path.slice(pathIndex);
    context.world.setComponent(entityId, "position", {
      entityId,
      x: current.x,
      y: current.y,
      plane: current.plane,
    });
    context.world.setComponent(entityId, "movement", {
      entityId,
      mode: movement.mode,
      path: remainingPath,
      ...(remainingPath.length > 0 ? { destination: remainingPath[remainingPath.length - 1] } : {}),
      ...(lastStepDirection !== undefined ? { lastStepDirection } : {}),
    });
    context.deltas.markEntityUpdate(entityId, {
      position: current,
      moveSpeed: moveSpeed(movement.mode),
      ...(facingTile ? { facingTile } : {}),
    });
    context.deltas.markDebugPath(entityId, remainingPath);
  }
}
