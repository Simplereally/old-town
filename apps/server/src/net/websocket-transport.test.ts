import { createServer } from "node:http";
import {
  ClientCommandType,
  entityId,
  PROTOCOL_VERSION,
  ServerPacketType,
  TransportClientMessageType,
  TransportServerMessageType,
} from "@old-town/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createWebSocketTransport } from "./websocket-transport";

let cleanup: (() => Promise<void>) | undefined;

function logger() {
  return {
    debug: () => undefined,
    warn: () => undefined,
  };
}

async function startHarness(onCommand = () => undefined) {
  const httpServer = createServer();
  const transport = createWebSocketTransport({
    httpServer,
    logger: logger(),
    getFullState: () => ({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 0,
      serverTime: 0,
      selfEntityId: entityId(1),
      entities: [],
    }),
    onCommand,
  });
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }
  cleanup = async () => {
    await Promise.all([
      transport.close(),
      new Promise<void>((resolve) => httpServer.close(() => resolve())),
    ]);
  };
  return { url: `ws://127.0.0.1:${address.port}${transport.path}`, transport };
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

describe("WebSocket transport", () => {
  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("authenticates dev clients and sends a full-state protocol bootstrap", async () => {
    const { url, transport } = await startHarness();
    const socket = await openSocket(url);

    socket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
      }),
    );
    const message = await nextMessage(socket);

    expect(message).toMatchObject({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      selfEntityId: 1,
    });
    expect(transport.sessions.size).toBe(1);
    socket.close();
  });

  it("routes websocket upgrades by pathname so dev query strings do not break login", async () => {
    const { url, transport } = await startHarness();
    const socket = await openSocket(`${url}?devClientId=old-town`);

    socket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
      }),
    );

    expect(await nextMessage(socket)).toMatchObject({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      selfEntityId: 1,
    });
    expect(transport.sessions.size).toBe(1);
    socket.close();
  });

  it("rejects incompatible protocol versions", async () => {
    const { url } = await startHarness();
    const socket = await openSocket(url);

    socket.send(JSON.stringify({ type: TransportClientMessageType.DevAuth, protocolVersion: 0 }));
    const message = await nextMessage(socket);

    expect(message).toEqual({
      type: TransportServerMessageType.Error,
      reason: "incompatible_protocol",
    });
  });

  it("responds to validated ping commands and rejects malformed gameplay commands", async () => {
    const { url } = await startHarness();
    const socket = await openSocket(url);
    socket.send(
      JSON.stringify({
        type: TransportClientMessageType.DevAuth,
        protocolVersion: PROTOCOL_VERSION,
      }),
    );
    await nextMessage(socket);

    socket.send(
      JSON.stringify({
        type: ClientCommandType.Ping,
        commandId: 1,
        payload: { clientTimeMs: 123 },
      }),
    );
    expect(await nextMessage(socket)).toMatchObject({
      type: TransportServerMessageType.Pong,
      commandId: 1,
      clientTimeMs: 123,
    });

    socket.send(JSON.stringify({ type: ClientCommandType.MoveClick, commandId: 2, payload: {} }));
    expect(await nextMessage(socket)).toMatchObject({
      type: TransportServerMessageType.CommandRejected,
    });
  });
});
