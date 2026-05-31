import { EntityUpdateMask, type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
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
  world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
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
    expect(context.world.getComponent(context.player, "position")).toMatchObject({ x: 0, y: 0 });
    expect(context.world.getComponent(context.player, "movement")?.path).toEqual([
      tile(1, 0),
      tile(2, 0),
      tile(3, 0),
    ]);

    processMovementPhase(context, 1);
    expect(context.world.getComponent(context.player, "position")).toMatchObject({ x: 1, y: 0 });
  });

  it("advances walk one tile per tick and emits movement deltas", () => {
    const context = setup();
    handleMoveIntent(context, context.player, { dest: tile(2, 0) }, { mode: "walk" });

    processMovementPhase(context, 1);
    const packet = context.deltas.consume(1, 600);

    expect(context.world.getComponent(context.player, "position")).toMatchObject({ x: 1, y: 0 });
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

    expect(context.world.getComponent(context.player, "position")).toMatchObject({ x: 2, y: 0 });
    expect(context.world.getComponent(context.player, "movement")?.path).toEqual([tile(3, 0)]);
  });

  it("clears path cleanly when the next step becomes blocked", () => {
    const context = setup();
    handleMoveIntent(context, context.player, { dest: tile(2, 0) });
    context.collision.addDynamic(tile(1, 0), CollisionFlag.BLOCK_FULL);

    processMovementPhase(context, 1);

    expect(context.world.getComponent(context.player, "position")).toMatchObject({ x: 0, y: 0 });
    expect(context.world.getComponent(context.player, "movement")?.path).toEqual([]);
    expect(context.world.getComponent(context.player, "movement")?.blockedUntilTick).toBe(2);
    expect(context.deltas.consume(1, 600).entityUpdates).toEqual([]);
  });
});
