import type { ContentRegistries, EntityId, ResourceNodeDef, TileCoord } from "@old-town/shared";
import type { ObjectComponent, ResourceNodeComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { ActionHandler } from "../sim/action-executor";
import type { ActionQueue } from "../sim/action-queue";
import { ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, type CollisionMap, objectCollisionFlags } from "../world/collision";

export interface ResourceNodeContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionQueue: ActionQueue;
}

export interface ResourceNodeRespawnPayload {
  readonly kind: "resource_respawn";
  readonly nodeEntityId: EntityId;
}

export type ResourceNodePayload = ResourceNodeRespawnPayload;

export type ResourceNodeKind = ResourceNodePayload["kind"];

export type ResourceNodeHandlerTable = {
  [K in ResourceNodeKind]: ActionHandler<Extract<ResourceNodePayload, { kind: K }>>;
};

export function resourceRespawnActionId(nodeEntityId: EntityId): string {
  return `resource-respawn:${nodeEntityId}`;
}

function nodeTile(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function depletedTransformId(object: ObjectComponent, def: ResourceNodeDef): string {
  return def.depletedTransformId ?? `${object.objectId}_depleted`;
}

function depletedCollisionFlags(def: ResourceNodeDef): number {
  let flags = CollisionFlag.OCCUPIED_OBJECT;
  if (def.depletedBlocksMovement === true) {
    flags |= CollisionFlag.BLOCK_FULL;
  }
  if (def.depletedBlocksLineOfSight === true) {
    flags |= CollisionFlag.BLOCK_LOS_FULL | CollisionFlag.PROJECTILE_BLOCK;
  }
  return flags;
}

function setNodeCollision(
  ctx: ResourceNodeContext,
  entityId: EntityId,
  active: boolean,
  def: ResourceNodeDef,
): void {
  const object = ctx.world.getComponent(entityId, "object");
  const tile = nodeTile(ctx.world, entityId);
  const objectDef = object ? ctx.registries.object.get(object.objectId) : undefined;
  if (!object || !objectDef || !tile) {
    return;
  }

  const footprint = { width: objectDef.width, length: objectDef.length };
  ctx.collision.clearFootprint(tile, footprint, objectCollisionFlags(objectDef));
  ctx.collision.clearFootprint(tile, footprint, depletedCollisionFlags(def));
  ctx.collision.applyFootprint(
    tile,
    footprint,
    active ? objectCollisionFlags(objectDef) : depletedCollisionFlags(def),
  );
}

export function depleteResourceNode(
  ctx: ResourceNodeContext,
  entityId: EntityId,
  tick: number,
): boolean {
  const node = ctx.world.getComponent(entityId, "resourceNode");
  const object = ctx.world.getComponent(entityId, "object");
  if (!node || !object || node.depleted) {
    return false;
  }
  const def = ctx.registries.resourceNode.get(node.nodeId);
  if (!def) {
    return false;
  }

  const next: ResourceNodeComponent = {
    ...node,
    active: false,
    depleted: true,
    respawnTick: tick + def.respawnTicks,
  };
  ctx.world.setComponent(entityId, "resourceNode", next);
  setNodeCollision(ctx, entityId, false, def);
  ctx.deltas.markEntityUpdate(entityId, { transform: depletedTransformId(object, def) });
  ctx.actionQueue.cancel(entityId, { id: resourceRespawnActionId(entityId) });
  const payload: ResourceNodeRespawnPayload = { kind: "resource_respawn", nodeEntityId: entityId };
  ctx.actionQueue.enqueue({
    id: resourceRespawnActionId(entityId),
    owner: entityId,
    type: ActionQueueType.Soft,
    delayTicks: def.respawnTicks,
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
  return true;
}

export function respawnResourceNode(ctx: ResourceNodeContext, entityId: EntityId): boolean {
  const node = ctx.world.getComponent(entityId, "resourceNode");
  const object = ctx.world.getComponent(entityId, "object");
  if (!node || !object || !node.depleted) {
    return false;
  }
  const def = ctx.registries.resourceNode.get(node.nodeId);
  if (!def) {
    return false;
  }

  ctx.world.setComponent(entityId, "resourceNode", {
    ...node,
    active: true,
    depleted: false,
    respawnTick: 0,
  });
  setNodeCollision(ctx, entityId, true, def);
  ctx.deltas.markEntityUpdate(entityId, { transform: object.objectId });
  return true;
}

export function createResourceNodeActionHandlers(
  ctx: ResourceNodeContext,
): ResourceNodeHandlerTable {
  return {
    resource_respawn: (payload, _actionCtx) => {
      respawnResourceNode(ctx, payload.nodeEntityId);
    },
  };
}
