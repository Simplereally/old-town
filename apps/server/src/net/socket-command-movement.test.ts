import { ClientCommandType, type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { CommandBuffer } from "../sim/command-buffer";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { handleMoveIntent, processMovementPhase } from "../systems/movement-system";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function testMap(): RuntimeMap {
  const map = createRuntimeMap();
  for (let x = 30; x <= 32; x += 1) {
    for (let y = 32; y <= 32; y += 1) {
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

describe("command buffer movement integration", () => {
  it("buffers movement until tick processing emits a movement delta", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 30, y: 32, plane: 0 });
    world.setComponent(player, "movement", { entityId: player, mode: "walk", path: [] });
    const map = testMap();
    const collision = new CollisionMap(map);
    const deltas = new DeltaAccumulator();
    const commandBuffer = new CommandBuffer();

    const accepted = commandBuffer.accept(
      {
        type: ClientCommandType.MoveClick,
        commandId: 1,
        payload: { dest: tile(31, 32) },
      },
      {
        ownerEntityId: player,
        connectionId: "session-1",
        receivedTick: 0,
        targetTick: 1,
      },
    );
    expect(accepted.ok).toBe(true);

    expect(world.getComponent(player, "position")).toMatchObject({ x: 30, y: 32 });

    const consumed = commandBuffer.consumeTick(1);
    const move = consumed.groups[0]?.intents[0];
    if (move?.kind === "move") {
      handleMoveIntent(
        {
          world,
          collision,
          deltas,
        },
        player,
        move.payload,
      );
    }
    expect(world.getComponent(player, "position")).toMatchObject({ x: 30, y: 32 });

    processMovementPhase({ world, collision, deltas }, 1);

    expect(world.getComponent(player, "position")).toMatchObject({ x: 31, y: 32 });
    expect(deltas.consume(1, 600).entityUpdates[0]?.changes.position).toEqual(tile(31, 32));
  });
});
