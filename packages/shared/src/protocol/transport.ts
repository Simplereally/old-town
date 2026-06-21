import { z } from "zod";
import { clientCommandSchema } from "./command-schemas";
import type { ClientCommand } from "./commands";
import type { ServerPacket } from "./packets";
import type { ParseResult } from "./parse-result";

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

/** Zod schema for the {@link DevAuthMessage} handshake. */
export const devAuthMessageSchema = z
  .object({
    type: z.literal(TransportClientMessageType.DevAuth),
    protocolVersion: z.number().int(),
    characterId: z.string().optional(),
  })
  .strict();

/**
 * Zod schema for any transport-level client → server message (DevAuth or a ClientCommand).
 * The discriminator values are disjoint, so a discriminated union is used.
 */
export const transportClientMessageSchema = z.discriminatedUnion("type", [
  devAuthMessageSchema,
  ...clientCommandSchema.options,
]);

/**
 * Validate untrusted input as a {@link TransportClientMessage}. Returns a discriminated
 * result rather than throwing, so the transport layer can reject malformed messages cleanly.
 */
export function parseTransportMessage(raw: unknown): ParseResult<TransportClientMessage> {
  const result = transportClientMessageSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, value: result.data as unknown as TransportClientMessage };
}

/**
 * Deserialize a JSON wire string back into a transport client message.
 *
 * @deprecated For trusted round-trip tests only. Server code must use
 * {@link parseTransportMessage}, which validates untrusted wire input with Zod.
 */
export function decodeTransportMessage(raw: string): TransportClientMessage {
  return JSON.parse(raw) as TransportClientMessage;
}
