import type { ServerPacket, TransportServerPacket } from "@old-town/shared";
import { ServerPacketType, TransportServerMessageType } from "@old-town/shared";

/**
 * Lightweight, Zod-free discriminator for incoming server packets.
 *
 * The server is authoritative (POC_SPEC invariant: "Server is authoritative.
 * Client sends intents only"). The server constructs every packet from
 * validated, typed state, so the client does not need to re-validate packet
 * shapes with a runtime Zod schema. Discriminating on the `type` tag and
 * trusting the payload keeps Zod (~50 KB minified) out of the client bundle.
 *
 * Returns a discriminated result so call sites can handle malformed input
 * without try/catch, mirroring the shape of the server-side
 * {@link parseTransportServerPacket} from `@old-town/shared`.
 */
export type DiscriminatedResult<T> = { ok: true; value: T } | { ok: false; error: string };

const KNOWN_TYPES = new Set<string>([
  ServerPacketType.FullState,
  ServerPacketType.TickDelta,
  TransportServerMessageType.Pong,
  TransportServerMessageType.CommandRejected,
  TransportServerMessageType.Error,
]);

export function discriminateTransportServerPacket(raw: unknown): DiscriminatedResult<TransportServerPacket> {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, error: "Expected an object" };
  }
  const type = (raw as { type?: unknown }).type;
  if (typeof type !== "string" || !KNOWN_TYPES.has(type)) {
    return { ok: false, error: `Unknown packet type: ${String(type)}` };
  }
  return { ok: true, value: raw as TransportServerPacket };
}

/** Game-state packets only — FullState and TickDelta. Transport-only types
 * (Pong, CommandRejected, Error) are handled before world application and are
 * rejected here so callers can route them separately. */
const SERVER_PACKET_TYPES = new Set<string>([ServerPacketType.FullState, ServerPacketType.TickDelta]);

export function discriminateServerPacket(raw: unknown): DiscriminatedResult<ServerPacket> {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, error: "Expected an object" };
  }
  const type = (raw as { type?: unknown }).type;
  if (typeof type !== "string" || !SERVER_PACKET_TYPES.has(type)) {
    return { ok: false, error: `Unknown server packet type: ${String(type)}` };
  }
  return { ok: true, value: raw as ServerPacket };
}
