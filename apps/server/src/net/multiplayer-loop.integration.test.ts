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
import { createWebSocketTransport, type WebSocketTransport } from "./websocket-transport";

interface Harness {
  readonly url: string;
  readonly kernel: SimulationKernel;
  readonly transport: WebSocketTransport;
  readonly httpServer: Server;
  cleanup(): Promise<void>;
}

class TestClient {
  readonly packets: TransportServerPacket[] = [];
  fullState: FullStatePacket | undefined;
  private readonly waiters: Waiter[] = [];

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
      const waiter: Waiter = {
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

  private removeWaiter(waiter: Waiter): void {
    const index = this.waiters.indexOf(waiter);
    if (index >= 0) {
      this.waiters.splice(index, 1);
    }
  }
}

interface Waiter {
  readonly predicate: (packet: TransportServerPacket) => boolean;
  readonly resolve: (packet: TransportServerPacket) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

let harness: Harness | undefined;
const clients: TestClient[] = [];

function tile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as TileCoord["plane"] };
}

function isDelta(packet: TransportServerPacket): packet is TickDeltaPacket {
  return packet.type === ServerPacketType.TickDelta;
}

function fullState(client: TestClient): FullStatePacket {
  if (!client.fullState) {
    throw new Error("Client has not received full state");
  }
  return client.fullState;
}

function selfUpdate(
  delta: TickDeltaPacket,
  entityId: EntityId,
): TickDeltaPacket["entityUpdates"][number] | undefined {
  return delta.entityUpdates.find((update) => update.entityId === entityId);
}

function deltaAt(deltas: readonly TickDeltaPacket[], index: number): TickDeltaPacket {
  const delta = deltas[index];
  if (!delta) {
    throw new Error(`Missing tick delta at index ${index}`);
  }
  return delta;
}

async function startHarness(): Promise<Harness> {
  const content = await loadContent("content");
  expect(content.ok).toBe(true);
  expect(content.issues).toEqual([]);

  const httpServer = createServer();
  const kernel = createSimulationKernel({
    registries: content.registries,
    logger,
    startServerTime: 0,
  });
  const transport = createWebSocketTransport({
    httpServer,
    logger,
    getFullState: (session) => kernel.connectSession(session),
    onCommand: (session, command) => kernel.routeCommand(session, command),
    onClose: (session) => kernel.disconnectSession(session),
  });
  kernel.attachDeltaTransport(transport);

  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP test server address");
  }

  return {
    url: `ws://127.0.0.1:${address.port}${transport.path}`,
    kernel,
    transport,
    httpServer,
    cleanup: async () => {
      await Promise.all([
        transport.close(),
        new Promise<void>((resolve) => httpServer.close(() => resolve())),
      ]);
    },
  };
}

async function connectClient(name: string): Promise<TestClient> {
  if (!harness) {
    throw new Error("Harness has not started");
  }
  const socket = new WebSocket(harness.url);
  const client = new TestClient(socket);
  clients.push(client);
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", (error) => reject(error));
  });
  const fullStatePromise = client.waitFor((packet) => packet.type === ServerPacketType.FullState);
  client.send({
    type: TransportClientMessageType.DevAuth,
    protocolVersion: PROTOCOL_VERSION,
    characterId: name,
  });
  await fullStatePromise;
  return client;
}

async function runTick(clientSet: readonly TestClient[]): Promise<readonly TickDeltaPacket[]> {
  if (!harness) {
    throw new Error("Harness has not started");
  }
  const nextTick = harness.kernel.stats().currentTick + 1;
  const waits = clientSet.map((client) =>
    client.waitFor(
      (packet): packet is TickDeltaPacket => isDelta(packet) && packet.tick === nextTick,
    ),
  );
  harness.kernel.runOneTick();
  const packets = await Promise.all(waits);
  return packets as readonly TickDeltaPacket[];
}

async function waitForPendingCommands(minimum = 1): Promise<void> {
  if (!harness) {
    throw new Error("Harness has not started");
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (harness.kernel.stats().pendingCommandCount >= minimum) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Timed out waiting for ${minimum} pending command(s)`);
}

async function sendMove(client: TestClient, commandId: number, dest: TileCoord): Promise<void> {
  client.send({
    type: ClientCommandType.MoveClick,
    commandId,
    payload: { dest },
  });
  await waitForPendingCommands();
}

async function sendObjectOption(
  client: TestClient,
  commandId: number,
  objectEntityId: EntityId,
  actionId: string,
): Promise<void> {
  client.send({
    type: ClientCommandType.ObjectOption,
    commandId,
    payload: { objectEntityId, actionId },
  });
  await waitForPendingCommands();
}

describe("multiplayer loop integration", () => {
  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.close();
    }
    await harness?.cleanup();
    harness = undefined;
  });

  it("bootstraps a dev session with full state, seed region data, and starter state", async () => {
    harness = await startHarness();
    const client = await connectClient("bootstrap-smoke");
    const state = fullState(client);

    expect(state.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(state.selfEntityId).toBeGreaterThan(0);
    expect(state.entities.some((entity) => entity.entityId === state.selfEntityId)).toBe(true);
    expect(state.entities.some((entity) => entity.kind === "object")).toBe(true);
    expect(state.regionLoads?.length).toBe(4);
    expect(state.inventory?.changes.length).toBeGreaterThan(0);
    expect(state.worldConstants).toMatchObject({ gameTickMs: 600, regionSize: 64 });
  });

  it("moves a player from a click command through the next authoritative tick delta", async () => {
    harness = await startHarness();
    const client = await connectClient("movement-smoke");
    const self = fullState(client).selfEntityId;

    await sendMove(client, 1, tile(31, 32));
    const delta = deltaAt(await runTick([client]), 0);

    expect(selfUpdate(delta, self)?.changes.position).toEqual(tile(31, 32));
    expect(selfUpdate(delta, self)?.changes.moveSpeed).toBe("walk");
  });

  it("does not move a player into a blocked object tile", async () => {
    harness = await startHarness();
    const client = await connectClient("blocked-smoke");
    const self = fullState(client).selfEntityId;

    await sendMove(client, 1, tile(31, 32));
    await runTick([client]);
    await sendMove(client, 2, tile(32, 32));
    const delta = deltaAt(await runTick([client]), 0);

    expect(selfUpdate(delta, self)?.changes.position).not.toEqual(tile(32, 32));
  });

  it("sends recipe list for object cook interaction", async () => {
    harness = await startHarness();
    const client = await connectClient("object-smoke");
    const state = fullState(client);
    const hearth = state.entities.find(
      (entity) => entity.kind === "object" && entity.defId === "market_kitchen_hearth",
    );
    if (!hearth) {
      throw new Error("Expected market kitchen hearth in bootstrap entities");
    }

    await sendObjectOption(client, 1, hearth.entityId, "cook");
    const delta = deltaAt(await runTick([client]), 0);

    expect(delta.recipeLists).toBeDefined();
    expect(delta.recipeLists?.length).toBeGreaterThan(0);
  });

  it("shows a second session to the first and filters it out after it leaves interest", async () => {
    harness = await startHarness();
    const first = await connectClient("visibility-a");
    const second = await connectClient("visibility-b");
    const firstSelf = fullState(first).selfEntityId;
    const secondSelf = fullState(second).selfEntityId;

    expect(fullState(second).entities.some((entity) => entity.entityId === firstSelf)).toBe(true);

    const firstJoinDelta = deltaAt(await runTick([first]), 0);
    expect(firstJoinDelta.entityAdds.some((entity) => entity.entityId === secondSelf)).toBe(true);

    await sendMove(second, 1, tile(30, 90));
    const secondDeltas: TickDeltaPacket[] = [];
    let firstSawSecondLeave = false;
    for (let i = 0; i < 90; i += 1) {
      const deltas = await runTick([first, second]);
      const firstDelta = deltaAt(deltas, 0);
      const secondDelta = deltaAt(deltas, 1);
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
