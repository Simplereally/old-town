import {
  directionFromDelta,
  directionToDelta,
  type EntityId,
  type MoveIntent,
  type MoveSpeed,
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
}

export interface MoveIntentResult {
  readonly accepted: boolean;
  readonly pathLength: number;
  readonly reached: boolean;
}

export interface MovementSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
}

function positionTile(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: number;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] };
}

function moveSpeed(mode: MovementMode): MoveSpeed {
  return mode === "run" ? "run" : "walk";
}

function sortedMovementEntityIds(world: World): readonly EntityId[] {
  return world.entityIdsWith("movement");
}

export function handleMoveIntent(
  context: MovementSystemContext,
  entityId: EntityId,
  intent: MoveIntent,
  options: MoveIntentOptions = {},
): MoveIntentResult {
  const position = context.world.getComponent(entityId, "position");
  if (!position) {
    return { accepted: false, pathLength: 0, reached: false };
  }

  const mode = options.mode ?? context.world.getComponent(entityId, "movement")?.mode ?? "walk";
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
  });

  return { accepted: true, pathLength: result.path.length, reached: result.reached };
}

export function processMovementPhase(
  context: MovementSystemContext,
  tick: number,
  footprint: Footprint = { width: 1, length: 1 },
): void {
  for (const entityId of sortedMovementEntityIds(context.world)) {
    const movement = context.world.getComponent(entityId, "movement");
    const position = context.world.getComponent(entityId, "position");
    if (!movement || !position || movement.path.length === 0) {
      continue;
    }
    if (movement.blockedUntilTick !== undefined && tick < movement.blockedUntilTick) {
      continue;
    }

    let current = positionTile(position);
    let remainingPath = [...movement.path];
    let lastStepDirection = movement.lastStepDirection;
    let facingTile: TileCoord | undefined;
    let moved = false;
    const stepCount = movement.mode === "run" ? 2 : 1;

    for (let i = 0; i < stepCount; i += 1) {
      const next = remainingPath[0];
      if (!next) {
        break;
      }
      if (!context.collision.canStep(current, next, footprint)) {
        remainingPath = [];
        context.world.setComponent(entityId, "movement", {
          entityId,
          mode: movement.mode,
          path: [],
          ...(lastStepDirection !== undefined ? { lastStepDirection } : {}),
          blockedUntilTick: tick + 1,
        });
        break;
      }

      remainingPath = remainingPath.slice(1);
      const direction = directionFromDelta(next.x - current.x, next.y - current.y);
      lastStepDirection = direction ?? lastStepDirection;
      current = next;
      if (direction !== null) {
        const delta = directionToDelta(direction);
        facingTile = { x: current.x + delta.dx, y: current.y + delta.dy, plane: current.plane };
      }
      moved = true;
    }

    if (!moved) {
      continue;
    }

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
