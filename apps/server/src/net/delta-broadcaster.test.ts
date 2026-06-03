import { createServer } from "node:http";
import {
  ACTIVE_SCENE_SIZE,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
  TransportClientMessageType,
} from "@old-town/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { DeltaBroadcaster } from "./delta-broadcaster";
import { InterestManager } from "./interest-manager";
import { createWebSocketTransport, type TransportSession } from "./websocket-transport";

let cleanup: (() => Promise<void>) | undefined;

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function createPlayer(world: World, session: TransportSession, at: TileCoord) {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x: at.x, y: at.y, plane: at.plane });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: "dev",
    sessionId: session.id,
    interestRadius: ACTIVE_SCENE_SIZE / 2,
  });
  world.setComponent(entityId, "actor", {
    entityId,
    name: session.characterId,
    level: 3,
    appearanceId: "dev_player",
  });
  return entityId;
}

function playerSpawns(world: World) {
  return world.entityIdsWith("player").map((entityId) => {
    const position = world.getComponent(entityId, "position");
    if (!position) {
      throw new Error(`Missing position for ${entityId}`);
    }
    return {
      entityId,
      kind: "player" as const,
      tile: tile(position.x, position.y),
    };
  });
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

async function startSocketHarness() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const interestManager = new InterestManager();
  const entityBySession = new Map<string, ReturnType<World["createEntity"]>>();
  const httpServer = createServer();
  const refs = {
    broadcaster: undefined as DeltaBroadcaster | undefined,
  };
  const transport = createWebSocketTransport({
    httpServer,
    logger: { debug: () => undefined, warn: () => undefined },
    getFullState: (session) => {
      const entityId =
        entityBySession.get(session.id) ?? createPlayer(world, session, tile(30, 32));
      entityBySession.set(session.id, entityId);
      const entities = playerSpawns(world);
      refs.broadcaster?.primeSession(session, entities);
      const entityById = new Map(entities.map((e) => [e.entityId, e]));
      const selfSpawn = entityById.get(entityId);
      if (selfSpawn) {
        deltas.markEntityAdd(selfSpawn);
      }
      return {
        type: ServerPacketType.FullState,
        protocolVersion: PROTOCOL_VERSION,
        tick: 0,
        serverTime: 0,
        selfEntityId: entityId,
        entities,
      };
    },
  });
  refs.broadcaster = new DeltaBroadcaster({
    world,
    deltas,
    interestManager,
    transport,
    getEntityId: (session) => entityBySession.get(session.id),
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
  const broadcaster = refs.broadcaster;
  if (!broadcaster) {
    throw new Error("Delta broadcaster was not initialized");
  }
  return {
    url: `ws://127.0.0.1:${address.port}${transport.path}`,
    world,
    deltas,
    broadcaster,
  };
}

describe("DeltaBroadcaster", () => {
  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("consumes one accumulator packet per tick and filters irrelevant entities", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();
    const session = { id: "s1", characterId: "nearby" };
    const player = createPlayer(world, session, tile(0, 0));
    const far = world.createEntity();
    const sent: TickDeltaPacket[] = [];
    world.setComponent(far, "position", { entityId: far, x: 1_000, y: 1_000, plane: 0 });

    const broadcaster = new DeltaBroadcaster({
      world,
      deltas,
      interestManager: new InterestManager(),
      transport: {
        sessions: new Map([[session.id, session]]),
        send: (_sessionId, packet) => {
          sent.push(packet);
          return true;
        },
      },
      getEntityId: () => player,
    });

    deltas.markEntityAdd({ entityId: far, kind: "npc", tile: tile(1_000, 1_000) });
    const raw = broadcaster.broadcastTick(1, 600);

    expect(raw.entityAdds.map((entity) => entity.entityId)).toEqual([far]);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: ServerPacketType.TickDelta,
      tick: 1,
      entityAdds: [],
      entityUpdates: [],
    });
    expect(deltas.peek().entityAdds).toEqual([]);
  });

  it("broadcasts movement deltas so two socket clients see each other move", async () => {
    const harness = await startSocketHarness();
    const firstSocket = await openSocket(harness.url);
    firstSocket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
        characterId: "first",
      }),
    );
    await nextMessage(firstSocket);

    const secondSocket = await openSocket(harness.url);
    secondSocket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
        characterId: "second",
      }),
    );
    const secondFullState = (await nextMessage(secondSocket)) as {
      readonly selfEntityId: ReturnType<World["createEntity"]>;
    };

    const firstJoinPacket = nextMessage(firstSocket) as Promise<TickDeltaPacket>;
    const secondJoinPacket = nextMessage(secondSocket);
    harness.broadcaster.broadcastTick(1, 600);

    const [firstJoin] = await Promise.all([firstJoinPacket, secondJoinPacket]);
    expect(firstJoin.entityAdds.map((entity) => entity.entityId)).toEqual([
      secondFullState.selfEntityId,
    ]);

    harness.world.setComponent(secondFullState.selfEntityId, "position", {
      entityId: secondFullState.selfEntityId,
      x: 31,
      y: 32,
      plane: 0,
    });
    harness.deltas.markEntityUpdate(secondFullState.selfEntityId, {
      position: tile(31, 32),
      moveSpeed: "walk",
    });

    const firstMovementPacket = nextMessage(firstSocket) as Promise<TickDeltaPacket>;
    harness.broadcaster.broadcastTick(2, 1_200);

    expect((await firstMovementPacket).entityUpdates[0]).toMatchObject({
      entityId: secondFullState.selfEntityId,
      changes: { position: tile(31, 32), moveSpeed: "walk" },
    });
  });
});
