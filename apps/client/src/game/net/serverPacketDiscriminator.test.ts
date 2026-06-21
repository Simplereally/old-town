import { ServerPacketType, TransportServerMessageType } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  discriminateServerPacket,
  discriminateTransportServerPacket,
} from "./serverPacketDiscriminator";

describe("discriminateTransportServerPacket", () => {
  it("accepts each known transport/server type", () => {
    const cases = [
      { type: ServerPacketType.FullState },
      { type: ServerPacketType.TickDelta },
      { type: TransportServerMessageType.Pong },
      { type: TransportServerMessageType.CommandRejected },
      { type: TransportServerMessageType.Error },
    ];
    for (const raw of cases) {
      const result = discriminateTransportServerPacket(raw);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(raw);
    }
  });

  it("rejects null with an 'Expected an object' error", () => {
    const result = discriminateTransportServerPacket(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Expected an object");
  });

  it("rejects non-object primitives", () => {
    for (const raw of [42, "S2C_PONG", true, undefined] as unknown[]) {
      const result = discriminateTransportServerPacket(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe("Expected an object");
    }
  });

  it("rejects an object with a non-string type", () => {
    const result = discriminateTransportServerPacket({ type: 123 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unknown packet type");
  });

  it("rejects an object with an unknown type string", () => {
    const result = discriminateTransportServerPacket({ type: "S2C_BOGUS" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unknown packet type: S2C_BOGUS");
  });

  it("rejects an object missing a type field", () => {
    const result = discriminateTransportServerPacket({ foo: "bar" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unknown packet type: undefined");
  });
});

describe("discriminateServerPacket", () => {
  it("accepts FullState and TickDelta", () => {
    for (const type of [ServerPacketType.FullState, ServerPacketType.TickDelta]) {
      const result = discriminateServerPacket({ type });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toEqual({ type });
    }
  });

  it("rejects transport-only types (Pong, CommandRejected, Error)", () => {
    for (const type of [
      TransportServerMessageType.Pong,
      TransportServerMessageType.CommandRejected,
      TransportServerMessageType.Error,
    ]) {
      const result = discriminateServerPacket({ type });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects null with an 'Expected an object' error", () => {
    const result = discriminateServerPacket(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Expected an object");
  });

  it("rejects an object with an unknown type string", () => {
    const result = discriminateServerPacket({ type: "S2C_BOGUS" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unknown server packet type: S2C_BOGUS");
  });
});
