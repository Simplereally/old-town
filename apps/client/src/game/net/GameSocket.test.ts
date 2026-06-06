import { PROTOCOL_VERSION, ServerPacketType, TransportClientMessageType } from "@old-town/shared";
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
});
