import { EntityUpdateMask, type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { ActionQueue, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { type RuntimeMap, createRuntimeMap } from "../world/runtime-map";
import { handleMoveIntent, processMovementPhase } from "./movement-system";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function testMap(size = 8): RuntimeMap {
  const map = createRuntimeMap();
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const coord = tile(x, y);
      map.tiles.set(tileKey(coord), {
        tile: coord,
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
  return map;
}

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  world.stores.position.set(player, { entityId: player, x: 0, y: 0, plane: 0 });
  const collision = new CollisionMap(testMap());
  const deltas = new DeltaAccumulator();
  return { world, player, collision, deltas };
}

describe("movement system", () => {
  it("stores a server-computed path without changing true tile until movement phase", () => {
    const context = setup();

    const result = handleMoveIntent(context, context.player, {
      dest: tile(3, 0),
    });

    expect(result).toMatchObject({ accepted: true, pathLength: 3, reached: true });
    expect(context.world.stores.position.get(context.player)).toMatchObject({ x: 0, y: 0 });
    expect(context.world.stores.movement.get(context.player)?.path).toEqual([
      tile(1, 0),
      tile(2, 0),
      tile(3, 0),
    ]);

    processMovementPhase(context, 1);
    expect(context.world.stores.position.get(context.player)).toMatchObject({ x: 1, y: 0 });
  });

  it("advances walk one tile per tick and emits movement deltas", () => {
    const context = setup();
    handleMoveIntent(context, context.player, { dest: tile(2, 0) }, { mode: "walk" });

    processMovementPhase(context, 1);
    const packet = context.deltas.consume(1, 600);

    expect(context.world.stores.position.get(context.player)).toMatchObject({ x: 1, y: 0 });
    expect(packet.entityUpdates[0]?.mask).toBe(
      EntityUpdateMask.POSITION | EntityUpdateMask.MOVE_SPEED | EntityUpdateMask.FACING_TILE,
    );
    expect(packet.entityUpdates[0]?.changes.position).toEqual(tile(1, 0));
    expect(packet.entityUpdates[0]?.changes.moveSpeed).toBe("walk");
  });

  it("advances run by two validated substeps per tick", () => {
    const context = setup();
    handleMoveIntent(context, context.player, { dest: tile(3, 0) }, { mode: "run" });

    processMovementPhase(context, 1);

    expect(context.world.stores.position.get(context.player)).toMatchObject({ x: 2, y: 0 });
    expect(context.world.stores.movement.get(context.player)?.path).toEqual([tile(3, 0)]);
  });

  it("clears path cleanly when the next step becomes blocked", () => {
    const context = setup();
    handleMoveIntent(context, context.player, { dest: tile(2, 0) });
    context.collision.addDynamic(tile(1, 0), CollisionFlag.BLOCK_FULL);

    processMovementPhase(context, 1);

    expect(context.world.stores.position.get(context.player)).toMatchObject({ x: 0, y: 0 });
    expect(context.world.stores.movement.get(context.player)?.path).toEqual([]);
    expect(context.world.stores.movement.get(context.player)?.blockedUntilTick).toBe(2);
    expect(context.deltas.consume(1, 600).entityUpdates).toEqual([]);
  });

  it("cancels weak actions when accepting movement", () => {
    const context = setup();
    const actionQueue = new ActionQueue();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: context.player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { action: "woodcut" },
    });

    handleMoveIntent({ ...context, actionQueue }, context.player, { dest: tile(1, 0) });

    expect(actionQueue.getDebugState()).toEqual([]);
  });
});
