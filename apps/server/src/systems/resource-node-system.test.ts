import {
  type ContentRegistries,
  type EntityId,
  type ObjectDef,
  type ResourceNodeDef,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { ActionExecutor } from "../sim/action-executor";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  applyObjectCollision,
  CollisionFlag,
  CollisionMap,
  objectCollisionFlags,
} from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  depleteResourceNode,
  resourceRespawnActionId,
  respawnResourceNode,
} from "./resource-node-system";

const TREE_DEF: ObjectDef = {
  id: "dry_tree",
  name: "Dry Tree",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  options: [],
  defaultRotation: 0,
  resourceNodeId: "dry_tree_node",
};

const NODE_DEF: ResourceNodeDef = {
  id: "dry_tree_node",
  name: "Dry Tree",
  skill: "woodcutting",
  requiredLevel: 1,
  baseXp: 10,
  actionTicks: 4,
  depletionChance: 1,
  respawnTicks: 3,
  toolTags: ["axe"],
  outputItemId: "dry_log",
  baseChance: 1,
  levelScale: 0,
  outputQuantity: 1,
};

function registries(node: ResourceNodeDef = NODE_DEF): ContentRegistries {
  return makeRegistries({
    object: new Map([[TREE_DEF.id, TREE_DEF]]),
    resourceNode: new Map([[node.id, node]]),
  });
}

function setup(node: ResourceNodeDef = NODE_DEF): {
  readonly world: World;
  readonly nodeEntity: EntityId;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
  readonly collision: CollisionMap;
  readonly content: ContentRegistries;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  const tile = { x: 4, y: 4, plane: 0 as const };
  map.tiles.set(tileKey(tile), {
    tile,
    height: 0,
    underlayId: "grass",
    collision: 0,
    water: false,
    bridge: false,
  });
  const nodeEntity = world.createEntity();
  world.setComponent(nodeEntity, "position", { entityId: nodeEntity, x: 4, y: 4, plane: 0 });
  world.setComponent(nodeEntity, "object", {
    entityId: nodeEntity,
    objectId: TREE_DEF.id,
    facing: 0,
    variant: 0,
  });
  world.setComponent(nodeEntity, "resourceNode", {
    entityId: nodeEntity,
    nodeId: node.id,
    active: true,
    depleted: false,
    respawnTick: 0,
  });
  const content = registries(node);
  const collision = new CollisionMap(map);
  applyObjectCollision(world, content, collision);
  return {
    world,
    nodeEntity,
    actionRuntime: new ActionRuntime(),
    deltas: new DeltaAccumulator(),
    collision,
    content,
  };
}

describe("resource node runtime state", () => {
  it("depletes runtime state without mutating content", () => {
    const ctx = setup();

    expect(depleteResourceNode({ ...ctx, registries: ctx.content }, ctx.nodeEntity, 10)).toBe(true);

    expect(ctx.world.getComponent(ctx.nodeEntity, "resourceNode")).toMatchObject({
      active: false,
      depleted: true,
      respawnTick: 13,
    });
    expect(ctx.content.resourceNode.get(NODE_DEF.id)).toEqual(NODE_DEF);
    expect(ctx.deltas.peek().entityUpdates[0]?.changes.transform).toBe("dry_tree_depleted");
  });

  it("alters collision while depleted and restores it on respawn", () => {
    const ctx = setup();
    const tile = { x: 4, y: 4, plane: 0 as const };
    expect(ctx.collision.getMask(tile) & objectCollisionFlags(TREE_DEF)).not.toBe(0);

    depleteResourceNode({ ...ctx, registries: ctx.content }, ctx.nodeEntity, 1);
    expect(ctx.collision.getMask(tile) & CollisionFlag.BLOCK_FULL).toBe(0);

    respawnResourceNode({ ...ctx, registries: ctx.content }, ctx.nodeEntity);
    expect(ctx.collision.getMask(tile) & CollisionFlag.BLOCK_FULL).not.toBe(0);
  });

  it("respawns through queued tick actions", () => {
    const ctx = setup();
    const actionExecutor = new ActionExecutor(
      {
        resource_respawn: (payload) => {
          respawnResourceNode(
            { ...ctx, registries: ctx.content },
            (payload as unknown as { nodeEntityId: EntityId }).nodeEntityId,
          );
        },
      },
      () => 0,
    );

    depleteResourceNode({ ...ctx, registries: ctx.content }, ctx.nodeEntity, 5);
    expect(ctx.actionRuntime.getDebugState()[0]?.id).toBe(resourceRespawnActionId(ctx.nodeEntity));

    for (let tick = 6; tick <= 8; tick += 1) {
      actionExecutor.execute(ctx.actionRuntime.advanceTick(), { tick, serverTime: tick * 600 });
    }

    expect(ctx.world.getComponent(ctx.nodeEntity, "resourceNode")).toMatchObject({
      active: true,
      depleted: false,
      respawnTick: 0,
    });
  });
});
