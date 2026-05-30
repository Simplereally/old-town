import { EntityUpdateMask, type TileCoord, entityId, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { ActionQueue, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { type RuntimeMap, createRuntimeMap } from "../world/runtime-map";
import {
  footprintDistance,
  isWithinInteractionRange,
  resolveInteraction,
} from "./interaction-reach";

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

function action(owner = entityId(1)) {
  return {
    id: "interact",
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    interruptGroup: InterruptGroup.Skilling,
    payload: { action: "chop" },
  };
}

describe("interaction reach", () => {
  it("paths to a server-selected adjacent tile for a tree, then enqueues in range", () => {
    const collision = new CollisionMap(testMap());
    const actor = entityId(1);
    const target = {
      origin: tile(2, 0),
      footprint: { width: 1, length: 1 },
      requiredDistance: 1,
    };

    const pathResult = resolveInteraction(
      { collision },
      { actor, actorTile: tile(0, 0), target, action: action(actor) },
    );
    expect(pathResult).toEqual({
      kind: "path",
      destination: tile(1, 0),
      path: [tile(1, 0)],
    });

    const queue = new ActionQueue();
    const ready = resolveInteraction(
      { collision, actionQueue: queue },
      { actor, actorTile: tile(1, 0), target, action: action(actor) },
    );

    expect(ready).toEqual({ kind: "ready", distance: 1, enqueued: true });
    expect(queue.getDebugState()).toHaveLength(1);
  });

  it("computes melee and ranged reach against footprints", () => {
    const collision = new CollisionMap(testMap());
    const npc = { origin: tile(3, 3), footprint: { width: 2, length: 2 }, requiredDistance: 1 };
    const ranged = { ...npc, requiredDistance: 4 };

    expect(footprintDistance(tile(2, 3), { width: 1, length: 1 }, npc.origin, npc.footprint)).toBe(
      1,
    );
    expect(isWithinInteractionRange(collision, tile(2, 3), npc)).toBe(true);
    expect(isWithinInteractionRange(collision, tile(0, 3), npc)).toBe(false);
    expect(isWithinInteractionRange(collision, tile(0, 3), ranged)).toBe(true);
  });

  it("blocks ready execution when line of sight is blocked", () => {
    const collision = new CollisionMap(testMap());
    collision.addDynamic(tile(1, 1), CollisionFlag.BLOCK_LOS_EAST);

    const target = {
      origin: tile(2, 1),
      footprint: { width: 1, length: 1 },
      requiredDistance: 1,
      requiresLineOfSight: true,
    };

    expect(isWithinInteractionRange(collision, tile(1, 1), target)).toBe(false);
    expect(
      resolveInteraction({ collision }, { actor: entityId(1), actorTile: tile(1, 1), target }).kind,
    ).not.toBe("ready");
  });

  it("returns unreachable when no valid interaction tile can be occupied", () => {
    const collision = new CollisionMap(testMap());
    const target = {
      origin: tile(3, 3),
      footprint: { width: 1, length: 1 },
      requiredDistance: 1,
    };

    for (let x = 2; x <= 4; x += 1) {
      for (let y = 2; y <= 4; y += 1) {
        if (x !== 3 || y !== 3) {
          collision.addDynamic(tile(x, y), CollisionFlag.BLOCK_FULL);
        }
      }
    }

    expect(
      resolveInteraction({ collision }, { actor: entityId(1), actorTile: tile(0, 0), target }),
    ).toEqual({
      kind: "unreachable",
      reason: "no_tile",
    });
  });

  it("emits facing target updates when an in-range action requires facing", () => {
    const collision = new CollisionMap(testMap());
    const deltas = new DeltaAccumulator();
    const actor = entityId(1);

    resolveInteraction(
      { collision, deltas },
      {
        actor,
        actorTile: tile(1, 0),
        target: {
          origin: tile(2, 0),
          footprint: { width: 1, length: 1 },
          requiredDistance: 1,
          faceTarget: true,
        },
      },
    );

    const update = deltas.consume(1, 600).entityUpdates[0];
    expect(update?.mask).toBe(EntityUpdateMask.FACING_TILE);
    expect(update?.changes.facingTile).toEqual(tile(2, 0));
  });
});
