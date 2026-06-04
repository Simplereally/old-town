import type { TickDeltaPacket } from "@old-town/shared";
import type { TransportSession } from "./websocket-transport";

export interface DeltaTransport {
  readonly sessions: ReadonlyMap<string, TransportSession>;
  send(sessionId: string, packet: TickDeltaPacket): boolean;
}
