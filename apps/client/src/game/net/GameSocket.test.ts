import {
  PROTOCOL_VERSION,
  ServerPacketType,
  TransportClientMessageType,
  TransportServerMessageType,
} from "@old-town/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameSocket } from "./GameSocket";

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: "" } as CloseEvent);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

describe("GameSocket", () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it("stops pinging when the socket is no longer open", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    expect(fakeSocket?.sent.map((data) => JSON.parse(data).type)).toEqual([
      TransportClientMessageType.DevAuth,
    ]);

    socket.startPing(100);
    if (!fakeSocket) {
      throw new Error("Expected fake socket");
    }
    fakeSocket.readyState = FakeWebSocket.CLOSED;

    vi.advanceTimersByTime(100);

    expect(fakeSocket?.sent.map((data) => JSON.parse(data).type)).toEqual([
      TransportClientMessageType.DevAuth,
    ]);
  });

  it("httpUrl converts ws:// to http://", () => {
    const socket = new GameSocket("ws://example.test/ws");
    expect(socket.httpUrl).toBe("http://example.test/ws");
  });

  it("httpUrl converts wss:// to https://", () => {
    const socket = new GameSocket("wss://example.test/ws");
    expect(socket.httpUrl).toBe("https://example.test/ws");
  });

  it("parses a valid TickDeltaPacket and calls onTickDelta", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    let received = false;
    socket.onTickDelta = () => {
      received = true;
    };
    fakeSocket?.receive({
      type: ServerPacketType.TickDelta,
      tick: 2,
      serverTime: 1200,
      entityAdds: [],
      entityRemoves: [],
      entityUpdates: [],
    });
    expect(received).toBe(true);
  });

  it("parses a valid PongPacket and calls onPong", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    let pongClientTime: number | undefined;
    socket.onPong = (clientTimeMs) => {
      pongClientTime = clientTimeMs;
    };
    fakeSocket?.receive({
      type: TransportServerMessageType.Pong,
      commandId: 1,
      clientTimeMs: 999,
      serverTime: 1000,
    });
    expect(pongClientTime).toBe(999);
  });

  it("parses a valid CommandRejectedPacket and calls onCommandRejected", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    let rejectionReason: string | undefined;
    socket.onCommandRejected = (reason) => {
      rejectionReason = reason;
    };
    fakeSocket?.receive({
      type: TransportServerMessageType.CommandRejected,
      reason: "too_far",
    });
    expect(rejectionReason).toBe("too_far");
  });

  it("drops a malformed packet (bad JSON) without crashing", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fakeSocket?.onmessage?.({ data: "not valid json" } as MessageEvent);
    expect(errorSpy).toHaveBeenCalled();
    expect(fakeSocket?.readyState).toBe(FakeWebSocket.OPEN);
    errorSpy.mockRestore();
  });

  it("drops a packet with unknown type without crashing", async () => {
    let fakeSocket: FakeWebSocket | undefined;
    const socket = new GameSocket("ws://example.test/ws", {
      createSocket: () => {
        fakeSocket = new FakeWebSocket();
        return fakeSocket as unknown as WebSocket;
      },
    });

    const connected = socket.connect();
    fakeSocket?.open();
    fakeSocket?.receive({
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick: 1,
      serverTime: 600,
      selfEntityId: 1,
      entities: [],
    });
    await connected;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fakeSocket?.receive({ type: "S2C_UNKNOWN", tick: 1 });
    expect(errorSpy).toHaveBeenCalled();
    expect(fakeSocket?.readyState).toBe(FakeWebSocket.OPEN);
    errorSpy.mockRestore();
  });
});
