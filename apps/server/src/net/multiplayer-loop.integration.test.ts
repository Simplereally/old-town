/**
 * Multiplayer loop coverage.
 *
 * Behavioral matrix runs against the simulation kernel with a collecting
 * DeltaTransport (no real sockets / ports / wall-clock waits).
 *
 * A single real-socket smoke lives in the `heavy:` describe below
 * (filename `*.integration.test.ts` → vitest heavy project).
 */
import { createServer, type Server } from "node:http";
import {
  ClientCommandType,
  type EntityId,
  type FullStatePacket,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
  TransportClientMessageType,
  type TransportServerPacket,
} from "@old-town/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { loadContent } from "../content-loader";
import type { Logger } from "../logger";
import { createSimulationKernel, type SimulationKernel } from "../sim/simulation-kernel";
import {
  type CollectingDeltaTransport,
  lastCollectedDelta,
  makeCollectingDeltaTransport,
} from "./__tests__/fake-socket";
import {
  createWebSocketTransport,
  type TransportSession,
  type WebSocketTransport,
} from "./websocket-transport";

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function tile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as TileCoord["plane"] };
}

function session(id: string, characterId: string): TransportSession {
  return { id, characterId };
}

function selfUpdate(
  delta: TickDeltaPacket,
  entityId: EntityId,
): TickDeltaPacket["entityUpdates"][number] | undefined {
  return delta.entityUpdates.find((update) => update.entityId === entityId);
}

async function makeKernel(): Promise<{
  kernel: SimulationKernel;
  sessions: Map<string, TransportSession>;
  transport: CollectingDeltaTransport;
}> {
  const content = await loadContent("content");
  expect(content.ok).toBe(true);
  expect(content.issues).toEqual([]);

  const kernel = createSimulationKernel({
    registries: content.registries,
    logger,
    startServerTime: 0,
  });
  const sessions = new Map<string, TransportSession>();
  const transport = makeCollectingDeltaTransport(sessions);
  kernel.attachDeltaTransport(transport);
  return { kernel, sessions, transport };
}

async function connect(
  kernel: SimulationKernel,
  sessions: Map<string, TransportSession>,
  id: string,
  characterId: string,
): Promise<FullStatePacket> {
  const s = session(id, characterId);
  sessions.set(id, s);
  return kernel.connectSession(s);
}

function routeMove(
  kernel: SimulationKernel,
  s: TransportSession,
  commandId: number,
  dest: TileCoord,
): void {
  const result = kernel.routeCommand(s, {
    type: ClientCommandType.MoveClick,
    commandId,
    payload: { dest },
  });
  expect(result.ok).toBe(true);
  expect(kernel.stats().pendingCommandCount).toBeGreaterThanOrEqual(1);
}

describe("multiplayer loop (kernel-direct)", () => {
  it("bootstraps a dev session with full state, seed region data, and starter state", async () => {
    const { kernel, sessions } = await makeKernel();
    const state = await connect(kernel, sessions, "s1", "bootstrap-smoke");

    expect(state.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(state.selfEntityId).toBeGreaterThan(0);
    expect(state.entities.some((entity) => entity.entityId === state.selfEntityId)).toBe(true);
    expect(state.entities.some((entity) => entity.kind === "object")).toBe(true);
    expect(state.regionLoads?.length).toBe(4);
    expect(state.inventory?.changes.length).toBeGreaterThan(0);
    expect(state.worldConstants).toMatchObject({ gameTickMs: 600, regionSize: 64 });
  });

  it("moves a player from a click command through the next authoritative tick delta", async () => {
    const { kernel, sessions, transport } = await makeKernel();
    const state = await connect(kernel, sessions, "s1", "movement-smoke");
    const s = sessions.get("s1");
    if (!s) throw new Error("missing session s1");
    const self = state.selfEntityId;

    routeMove(kernel, s, 1, tile(44, 45));
    kernel.runOneTick();
    const delta = lastCollectedDelta(transport, s.id);

    expect(selfUpdate(delta, self)?.changes.position).toEqual(tile(44, 45));
    expect(selfUpdate(delta, self)?.changes.moveSpeed).toBe("walk");
  });

  it("broadcasts one player's movement to another connected session", async () => {
    const { kernel, sessions, transport } = await makeKernel();
    await connect(kernel, sessions, "s1", "movement-watch-a");
    const secondState = await connect(kernel, sessions, "s2", "movement-watch-b");
    const first = sessions.get("s1");
    const second = sessions.get("s2");
    if (!first || !second) throw new Error("missing sessions");
    const secondSelf = secondState.selfEntityId;

    kernel.runOneTick();
    const firstJoinDelta = lastCollectedDelta(transport, first.id);
    expect(firstJoinDelta.entityAdds.some((entity) => entity.entityId === secondSelf)).toBe(true);

    routeMove(kernel, second, 1, tile(44, 45));
    kernel.runOneTick();
    const firstMovementDelta = lastCollectedDelta(transport, first.id);

    expect(selfUpdate(firstMovementDelta, secondSelf)?.changes).toMatchObject({
      position: tile(44, 45),
      moveSpeed: "walk",
    });
  });

  it("does not move a player into a blocked object tile", async () => {
    const { kernel, sessions, transport } = await makeKernel();
    const state = await connect(kernel, sessions, "s1", "blocked-smoke");
    const s = sessions.get("s1");
    if (!s) throw new Error("missing session s1");
    const self = state.selfEntityId;

    routeMove(kernel, s, 1, tile(44, 45));
    kernel.runOneTick();
    routeMove(kernel, s, 2, tile(46, 46));
    kernel.runOneTick();
    const delta = lastCollectedDelta(transport, s.id);

    expect(selfUpdate(delta, self)?.changes.position).not.toEqual(tile(46, 46));
  });

  it("sends recipe list for object cook interaction", async () => {
    const { kernel, sessions, transport } = await makeKernel();
    const state = await connect(kernel, sessions, "s1", "object-smoke");
    const s = sessions.get("s1");
    if (!s) throw new Error("missing session s1");
    const hearth = state.entities.find(
      (entity) => entity.kind === "object" && entity.defId === "market_kitchen_hearth",
    );
    if (!hearth) {
      throw new Error("Expected market kitchen hearth in bootstrap entities");
    }

    const result = kernel.routeCommand(s, {
      type: ClientCommandType.ObjectOption,
      commandId: 1,
      payload: { objectEntityId: hearth.entityId, actionId: "cook" },
    });
    expect(result.ok).toBe(true);
    expect(kernel.stats().pendingCommandCount).toBeGreaterThanOrEqual(1);

    kernel.runOneTick();
    const delta = lastCollectedDelta(transport, s.id);

    expect(delta.recipeLists).toBeDefined();
    expect(delta.recipeLists?.length).toBeGreaterThan(0);
  });

  it("shows a second session to the first and filters it out after it leaves interest", async () => {
    const { kernel, sessions, transport } = await makeKernel();
    const firstState = await connect(kernel, sessions, "s1", "visibility-a");
    const secondState = await connect(kernel, sessions, "s2", "visibility-b");
    const first = sessions.get("s1");
    const second = sessions.get("s2");
    if (!first || !second) throw new Error("missing sessions");
    const firstSelf = firstState.selfEntityId;
    const secondSelf = secondState.selfEntityId;

    expect(secondState.entities.some((entity) => entity.entityId === firstSelf)).toBe(true);

    kernel.runOneTick();
    const firstJoinDelta = lastCollectedDelta(transport, first.id);
    expect(firstJoinDelta.entityAdds.some((entity) => entity.entityId === secondSelf)).toBe(true);

    routeMove(kernel, second, 1, tile(20, 97));
    const secondDeltas: TickDeltaPacket[] = [];
    let firstSawSecondLeave = false;
    for (let i = 0; i < 200; i += 1) {
      kernel.runOneTick();
      const firstDelta = lastCollectedDelta(transport, first.id);
      const secondDelta = lastCollectedDelta(transport, second.id);
      secondDeltas.push(secondDelta);
      firstSawSecondLeave = firstSawSecondLeave || firstDelta.entityRemoves.includes(secondSelf);
      if (firstSawSecondLeave && secondDelta.regionUnloads?.length) {
        break;
      }
    }

    expect(firstSawSecondLeave).toBe(true);
    expect(secondDeltas.some((delta) => (delta.regionLoads?.length ?? 0) > 0)).toBe(true);
    expect(secondDeltas.some((delta) => (delta.regionUnloads?.length ?? 0) > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Heavy lane: irreducible real WebSocket + HTTP upgrade smoke.
// ---------------------------------------------------------------------------

interface SocketHarness {
  readonly url: string;
  readonly kernel: SimulationKernel;
  readonly transport: WebSocketTransport;
  readonly httpServer: Server;
  cleanup(): Promise<void>;
}

class SocketTestClient {
  readonly packets: TransportServerPacket[] = [];
  fullState: FullStatePacket | undefined;
  private readonly waiters: SocketWaiter[] = [];

  constructor(readonly socket: WebSocket) {
    socket.on("message", (data) => {
      const packet = JSON.parse(data.toString()) as TransportServerPacket;
      this.packets.push(packet);
      if (packet.type === ServerPacketType.FullState) {
        this.fullState = packet;
      }
      this.resolveWaiters(packet);
    });
  }

  send(raw: unknown): void {
    this.socket.send(JSON.stringify(raw));
  }

  waitFor(
    predicate: (packet: TransportServerPacket) => boolean,
    timeoutMs = 1_000,
  ): Promise<TransportServerPacket> {
    const existing = this.packets.find(predicate);
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve, reject) => {
      const waiter: SocketWaiter = {
        predicate,
        resolve: (packet) => {
          clearTimeout(waiter.timer);
          resolve(packet);
        },
        reject,
        timer: setTimeout(() => {
          this.removeWaiter(waiter);
          reject(new Error("Timed out waiting for server packet"));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  close(): void {
    this.socket.close();
  }

  private resolveWaiters(packet: TransportServerPacket): void {
    for (const waiter of [...this.waiters]) {
      if (waiter.predicate(packet)) {
        this.removeWaiter(waiter);
        waiter.resolve(packet);
      }
    }
  }

  private removeWaiter(waiter: SocketWaiter): void {
    const index = this.waiters.indexOf(waiter);
    if (index >= 0) {
      this.waiters.splice(index, 1);
    }
  }
}

interface SocketWaiter {
  readonly predicate: (packet: TransportServerPacket) => boolean;
  readonly resolve: (packet: TransportServerPacket) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

describe("heavy: multiplayer loop websocket smoke", () => {
  let harness: SocketHarness | undefined;
  const clients: SocketTestClient[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.close();
    }
    await harness?.cleanup();
    harness = undefined;
  });

  it("bootstraps a dev session over a real websocket upgrade", async () => {
    const content = await loadContent("content");
    expect(content.ok).toBe(true);

    const httpServer = createServer();
    const kernel = createSimulationKernel({
      registries: content.registries,
      logger,
      startServerTime: 0,
    });
    const transport = createWebSocketTransport({
      httpServer,
      logger,
      getFullState: (s) => kernel.connectSession(s),
      onCommand: (s, command) => kernel.routeCommand(s, command),
      onClose: (s) => kernel.disconnectSession(s),
    });
    kernel.attachDeltaTransport(transport);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP test server address");
    }

    harness = {
      url: `ws://127.0.0.1:${address.port}${transport.path}`,
      kernel,
      transport,
      httpServer,
      cleanup: async () => {
        await transport.close();
        (httpServer as unknown as { closeAllConnections?: () => void }).closeAllConnections?.();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      },
    };

    const socket = new WebSocket(harness.url);
    const client = new SocketTestClient(socket);
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", (error) => reject(error));
    });
    const fullStatePromise = client.waitFor((packet) => packet.type === ServerPacketType.FullState);
    client.send({
      type: TransportClientMessageType.DevAuth,
      protocolVersion: PROTOCOL_VERSION,
      characterId: "ws-smoke",
    });
    const state = (await fullStatePromise) as FullStatePacket;

    expect(state.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(state.selfEntityId).toBeGreaterThan(0);
    expect(state.entities.some((entity) => entity.entityId === state.selfEntityId)).toBe(true);
  });
});
