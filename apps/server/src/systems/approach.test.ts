import type { EntityId, TileCoord } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { ActionQueue, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { type ApproachContext, approach, beginApproach } from "./approach";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function testMap(size = 8): ReturnType<typeof createRuntimeMap> {
  const map = createRuntimeMap();
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const coord = tile(x, y);
      map.tiles.set(`${coord.x}:${coord.y}:${coord.plane}`, {
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

function setup(actorTile: TileCoord = tile(0, 0)): {
  ctx: ApproachContext;
  world: ReturnType<typeof createWorld>;
  player: EntityId;
  actionQueue: ActionQueue;
  deltas: DeltaAccumulator;
} {
  const world = createWorld();
  const player = world.createEntity();
  world.setComponent(player, "position", {
    entityId: player,
    x: actorTile.x,
    y: actorTile.y,
    plane: actorTile.plane,
  });
  const collision = new CollisionMap(testMap());
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const ctx: ApproachContext = { world, collision, deltas, actionQueue };
  return { ctx, world, player, actionQueue, deltas };
}

describe("approach", () => {
  it("returns in_reach when actor is already adjacent", () => {
    const { ctx, player, actionQueue } = setup(tile(3, 3));

    const result = approach(ctx, player, tile(4, 3), () => ({ kind: "begin_test" }));

    expect(result).toBe("in_reach");
    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("returns in_reach when actor is on the same tile as target", () => {
    const { ctx, player, actionQueue } = setup(tile(3, 3));

    const result = approach(ctx, player, tile(3, 3), () => ({ kind: "begin_test" }));

    expect(result).toBe("in_reach");
    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("returns approaching and enqueues a begin_* poll when out of reach", () => {
    const { ctx, player, actionQueue } = setup(tile(0, 0));

    const result = approach(ctx, player, tile(3, 0), () => ({
      kind: "begin_gather",
      nodeEntityId: 99,
    }));

    expect(result).toBe("approaching");
    const queued = actionQueue.getDebugState();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      type: ActionQueueType.Weak,
      remainingDelayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      repeat: { intervalTicks: 1 },
    });
    expect(queued[0]?.payload).toEqual({ kind: "begin_gather", nodeEntityId: 99 });
  });

  it("sets a movement path toward the target tile", () => {
    const { ctx, player, world } = setup(tile(0, 0));

    approach(ctx, player, tile(3, 0), () => ({ kind: "begin_test" }));

    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([tile(1, 0), tile(2, 0), tile(3, 0)]);
  });

  it("calls the begin payload factory only when out of reach", () => {
    const { ctx: ctxInReach, player: playerInReach } = setup(tile(3, 3));
    let factoryCalls = 0;
    approach(ctxInReach, playerInReach, tile(4, 3), () => {
      factoryCalls += 1;
      return { kind: "begin_test" };
    });
    expect(factoryCalls).toBe(0);

    const { ctx: ctxOutOfRange, player: playerOutOfRange } = setup(tile(0, 0));
    approach(ctxOutOfRange, playerOutOfRange, tile(3, 0), () => {
      factoryCalls += 1;
      return { kind: "begin_test" };
    });
    expect(factoryCalls).toBe(1);
  });

  it("uses a stable action ID per owner so the previous approach can be cancelled before re-enqueueing", () => {
    const { ctx, player, actionQueue } = setup(tile(0, 0));

    approach(ctx, player, tile(3, 0), () => ({ kind: "begin_test" }));
    const firstId = actionQueue.getDebugState()[0]?.id;
    actionQueue.cancel(player, { id: `approach:${player}` });
    approach(ctx, player, tile(3, 0), () => ({ kind: "begin_test" }));
    const secondId = actionQueue.getDebugState()[0]?.id;

    expect(firstId).toBe(`approach:${player}`);
    expect(secondId).toBe(`approach:${player}`);
    expect(actionQueue.getDebugState()).toHaveLength(1);
  });

  it("passes tick to handleMoveIntent when provided", () => {
    const { ctx, player, world } = setup(tile(0, 0));

    approach(ctx, player, tile(3, 0), () => ({ kind: "begin_test" }), 42);

    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([tile(1, 0), tile(2, 0), tile(3, 0)]);
  });
});

describe("beginApproach", () => {
  it("always moves and enqueues, regardless of reach", () => {
    const { ctx, player, actionQueue } = setup(tile(3, 3));

    beginApproach(ctx, player, tile(4, 3), () => ({ kind: "begin_test" }));

    const queued = actionQueue.getDebugState();
    expect(queued).toHaveLength(1);
    expect(queued[0]?.payload).toEqual({ kind: "begin_test" });
  });

  it("enqueues with the same action-queue params as approach", () => {
    const { ctx, player, actionQueue } = setup(tile(0, 0));

    beginApproach(ctx, player, tile(3, 0), () => ({ kind: "begin_process", recipeId: "bread" }));

    const queued = actionQueue.getDebugState();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      type: ActionQueueType.Weak,
      remainingDelayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      repeat: { intervalTicks: 1 },
    });
    expect(queued[0]?.payload).toEqual({ kind: "begin_process", recipeId: "bread" });
  });

  it("uses the same stable action ID as approach", () => {
    const { ctx, player, actionQueue } = setup(tile(0, 0));

    beginApproach(ctx, player, tile(3, 0), () => ({ kind: "begin_test" }));

    expect(actionQueue.getDebugState()[0]?.id).toBe(`approach:${player}`);
  });
});
