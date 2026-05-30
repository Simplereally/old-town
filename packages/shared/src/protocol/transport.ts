import type { ClientCommand } from "./commands";
import type { ServerPacket } from "./packets";

export const TransportClientMessageType = {
  DevAuth: "C2S_DEV_AUTH",
} as const;

export type TransportClientMessageType =
  (typeof TransportClientMessageType)[keyof typeof TransportClientMessageType];

export interface DevAuthMessage {
  readonly type: typeof TransportClientMessageType.DevAuth;
  readonly protocolVersion: number;
  readonly characterId?: string;
}

export type TransportClientMessage = DevAuthMessage | ClientCommand;

export const TransportServerMessageType = {
  Pong: "S2C_PONG",
  CommandRejected: "S2C_COMMAND_REJECTED",
  Error: "S2C_ERROR",
} as const;

export type TransportServerMessageType =
  (typeof TransportServerMessageType)[keyof typeof TransportServerMessageType];

export interface PongPacket {
  readonly type: typeof TransportServerMessageType.Pong;
  readonly commandId: number;
  readonly clientTimeMs: number;
  readonly serverTime: number;
}

export interface CommandRejectedPacket {
  readonly type: typeof TransportServerMessageType.CommandRejected;
  readonly reason: string;
}

export interface TransportErrorPacket {
  readonly type: typeof TransportServerMessageType.Error;
  readonly reason: string;
}

export type TransportServerPacket =
  | ServerPacket
  | PongPacket
  | CommandRejectedPacket
  | TransportErrorPacket;

export function encodeTransportPacket(packet: TransportServerPacket): string {
  return JSON.stringify(packet);
}

export function decodeTransportMessage(raw: string): TransportClientMessage {
  return JSON.parse(raw) as TransportClientMessage;
}
