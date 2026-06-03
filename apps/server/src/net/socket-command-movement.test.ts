import { createServer } from "node:http";
import {
  ClientCommandType,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TileCoord,
  TransportClientMessageType,
  tileKey,
} from "@old-town/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createWorld } from "../ecs/world";
import { CommandBuffer } from "../sim/command-buffer";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { handleMoveIntent, processMovementPhase } from "../systems/movement-system";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { CommandRouter } from "./command-router";
import { createWebSocketTransport } from "./websocket-transport";

let cleanup: (() => Promise<void>) | undefined;

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

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    const handler = (data: WebSocket.RawData) => {
      resolve(JSON.parse(data.toString()));
      socket.removeListener("message", handler);
    };
    socket.on("message", handler);
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve) => {
    const socket = new WebSocket(url);
    socket.once("open", () => resolve(socket));
  });
}

async function startHarness() {
  const world = createWorld();
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 30, y: 32, plane: 0 });
  world.setComponent(player, "movement", { entityId: player, mode: "walk", path: [] });
  const map = testMap();
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const commandBuffer = new CommandBuffer();
  const router = new CommandRouter({
    commandBuffer,
    getEntityId: () => player,
    getCurrentTick: () => 0,
  });
  const httpServer = createServer();
  let resolveCommand: (() => void) | undefined;
  const commandSeen = new Promise<void>((resolve) => {
    resolveCommand = resolve;
  });
  const transport = createWebSocketTransport({
    httpServer,
    logger: { debug: () => undefined, warn: () => undefined },
    getFullState: () => ({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 0,
      serverTime: 0,
      selfEntityId: player,
      entities: [{ entityId: player, kind: "player", tile: tile(30, 32) }],
    }),
    onCommand: (session, command) => {
      const result = router.route(session, command);
      resolveCommand?.();
      return result;
    },
  });
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }
  cleanup = async () => {
    await transport.close();
    (httpServer as any).closeAllConnections?.();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  };
  return {
    url: `ws://127.0.0.1:${address.port}${transport.path}`,
    world,
    player,
    collision,
    deltas,
    router,
    commandSeen,
  };
}

describe("socket command movement integration", () => {
  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("buffers socket movement until tick processing emits a movement delta", async () => {
    const harness = await startHarness();
    const socket = await openSocket(harness.url);
    socket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
      }),
    );
    await nextMessage(socket);

    socket.send(
      JSON.stringify({
        type: ClientCommandType.MoveClick,
        commandId: 1,
        payload: { dest: tile(31, 32) },
      }),
    );
    await harness.commandSeen;

    expect(harness.world.getComponent(harness.player, "position")).toMatchObject({ x: 30, y: 32 });

    const consumed = harness.router.consumeTick(1);
    const move = consumed.groups[0]?.intents[0];
    if (move?.kind === "move") {
      handleMoveIntent(
        {
          world: harness.world,
          collision: harness.collision,
          deltas: harness.deltas,
        },
        harness.player,
        move.payload,
      );
    }
    expect(harness.world.getComponent(harness.player, "position")).toMatchObject({ x: 30, y: 32 });

    processMovementPhase(
      { world: harness.world, collision: harness.collision, deltas: harness.deltas },
      1,
    );

    expect(harness.world.getComponent(harness.player, "position")).toMatchObject({ x: 31, y: 32 });
    expect(harness.deltas.consume(1, 600).entityUpdates[0]?.changes.position).toEqual(tile(31, 32));
  });
});
