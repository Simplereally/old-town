/**
 * Shared in-memory / collecting transport helpers for server net tests.
 * Prefer these over binding real HTTP ports when asserting protocol or tick behavior.
 */

import type { TickDeltaPacket } from "@old-town/shared";
import type { DeltaTransport } from "../delta-transport";
import type { TransportSession } from "../websocket-transport";

export interface CollectingDeltaTransport extends DeltaTransport {
  readonly packetsBySession: Map<string, TickDeltaPacket[]>;
  readonly sendCalls: Array<{ sessionId: string; packet: TickDeltaPacket }>;
}

/** DeltaTransport that records every send for deterministic assertions. */
export function makeCollectingDeltaTransport(
  sessions: Map<string, TransportSession> = new Map(),
): CollectingDeltaTransport {
  const packetsBySession = new Map<string, TickDeltaPacket[]>();
  const sendCalls: Array<{ sessionId: string; packet: TickDeltaPacket }> = [];
  return {
    sessions,
    packetsBySession,
    sendCalls,
    send(sessionId, packet) {
      sendCalls.push({ sessionId, packet });
      const list = packetsBySession.get(sessionId) ?? [];
      list.push(packet);
      packetsBySession.set(sessionId, list);
      return true;
    },
  };
}

export function lastCollectedDelta(
  transport: CollectingDeltaTransport,
  sessionId: string,
): TickDeltaPacket {
  const list = transport.packetsBySession.get(sessionId) ?? [];
  const packet = list[list.length - 1];
  if (!packet) {
    throw new Error(`No tick delta for session ${sessionId}`);
  }
  return packet;
}

/**
 * Minimal duplex fake for unit-testing message handlers without a real WebSocket.
 * Not a full ws shim — callers push inbound strings and read outbound frames.
 */
export class FakeSocket {
  readonly outbound: string[] = [];
  readyState = 1; // OPEN
  private readonly messageHandlers: Array<(data: string) => void> = [];
  private readonly closeHandlers: Array<() => void> = [];

  send(data: string): void {
    this.outbound.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
    for (const handler of this.closeHandlers) handler();
  }

  on(event: "message", handler: (data: string) => void): void;
  on(event: "close", handler: () => void): void;
  on(event: "message" | "close", handler: ((data: string) => void) | (() => void)): void {
    if (event === "message") {
      this.messageHandlers.push(handler as (data: string) => void);
    } else {
      this.closeHandlers.push(handler as () => void);
    }
  }

  /** Deliver an inbound text frame to registered message handlers. */
  emitMessage(raw: string): void {
    for (const handler of this.messageHandlers) handler(raw);
  }

  lastOutbound(): unknown {
    const raw = this.outbound[this.outbound.length - 1];
    if (raw === undefined) throw new Error("No outbound frames");
    return JSON.parse(raw);
  }
}
