import { describe, expect, it } from "vitest";
import { regionId } from "../types/coords";
import { entityId } from "../types/ids";
import type { EntitySpawnPacket, EntityUpdatePacket } from "./entity-update";
import { parseServerPacket, parseTransportServerPacket } from "./packet-schemas";
import {
  decodeServerPacket,
  encodeServerPacket,
  type FullStatePacket,
  isCompatibleProtocol,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
} from "./packets";
import {
  type CommandRejectedPacket,
  encodeTransportPacket,
  type PongPacket,
  type TransportErrorPacket,
  TransportServerMessageType,
} from "./transport";

const spawn: EntitySpawnPacket = {
  entityId: entityId(1),
  kind: "npc",
  tile: { x: 5, y: 6, plane: 0 },
  defId: "town_guard",
  healthBar: { current: 30, max: 30 },
};

const update: EntityUpdatePacket = {
  entityId: entityId(1),
  mask: 0b101,
  changes: {
    position: { x: 6, y: 6, plane: 0 },
    hitsplat: { amount: 4, type: "damage" },
  },
};

const fullState: FullStatePacket = {
  type: ServerPacketType.FullState,
  protocolVersion: PROTOCOL_VERSION,
  tick: 100,
  serverTime: 1700000000000,
  selfEntityId: entityId(42),
  entities: [spawn],
  inventory: {
    containerId: "inventory",
    changes: [{ slot: 0, itemId: "penny_hatchet", quantity: 1 }],
  },
  skills: [{ skillId: "woodcutting", level: 1, xp: 0, effectiveLevel: 1 }],
  vars: [{ varId: "quest_smoke", value: 0 }],
  regionLoads: [
    { region: { rx: 0, ry: 0, plane: 0 }, regionId: regionId({ rx: 0, ry: 0, plane: 0 }) },
  ],
};

const tickDelta: TickDeltaPacket = {
  type: ServerPacketType.TickDelta,
  tick: 101,
  serverTime: 1700000000600,
  entityAdds: [spawn],
  entityRemoves: [entityId(7)],
  entityUpdates: [update],
  chat: [{ text: "hello", channel: "public", serverTime: 1700000000600, entityId: entityId(42) }],
  hitsplats: [{ entityId: entityId(1), hitsplat: { amount: 4, type: "damage" } }],
  xpDrops: [{ skillId: "attack", amount: 16 }],
  levelUps: [{ skillId: "attack", newLevel: 2 }],
  interfaceOpens: [
    {
      interfaceId: "dialogue",
      dialogue: {
        dialogueId: "baker_dialogue",
        nodeId: "start",
        speakerName: "Baker",
        npcText: "Hello.",
        options: [{ index: 0, text: "Continue" }],
      },
    },
  ],
  interfaceCloses: [{ interfaceId: "bank" }],
};

describe("server packet serialization", () => {
  it("round-trips a FullStatePacket through JSON", () => {
    const decoded = decodeServerPacket(encodeServerPacket(fullState));
    expect(decoded).toEqual(fullState);
  });

  it("round-trips a TickDeltaPacket through JSON", () => {
    const decoded = decodeServerPacket(encodeServerPacket(tickDelta));
    expect(decoded).toEqual(tickDelta);
  });

  it("produces plain JSON (no class instances survive a round-trip identically)", () => {
    const decoded = decodeServerPacket(encodeServerPacket(tickDelta));
    expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
    // A Three.js Vector would lose its prototype/methods and not deep-equal; plain data does.
    expect(JSON.parse(JSON.stringify(tickDelta))).toEqual(tickDelta);
  });
});

describe("every top-level packet carries the server tick", () => {
  it("FullState and TickDelta both include tick + serverTime", () => {
    expect(typeof fullState.tick).toBe("number");
    expect(typeof fullState.serverTime).toBe("number");
    expect(typeof tickDelta.tick).toBe("number");
    expect(typeof tickDelta.serverTime).toBe("number");
  });
});

describe("protocol compatibility guard", () => {
  it("accepts the current version", () => {
    expect(isCompatibleProtocol(PROTOCOL_VERSION)).toBe(true);
  });

  it("detects a version mismatch", () => {
    expect(isCompatibleProtocol(PROTOCOL_VERSION + 1)).toBe(false);
    const stale: FullStatePacket = { ...fullState, protocolVersion: PROTOCOL_VERSION + 1 };
    expect(isCompatibleProtocol(stale.protocolVersion)).toBe(false);
  });
});

describe("validated server packet decoder round-trip", () => {
  it("parseServerPacket accepts encodeServerPacket output for a FullStatePacket", () => {
    const result = parseServerPacket(JSON.parse(encodeServerPacket(fullState)));
    expect(result.ok).toBe(true);
  });

  it("parseServerPacket accepts encodeServerPacket output for a TickDeltaPacket", () => {
    const result = parseServerPacket(JSON.parse(encodeServerPacket(tickDelta)));
    expect(result.ok).toBe(true);
  });

  it("parseServerPacket rejects a truncated JSON string", () => {
    const result = parseServerPacket(JSON.parse('{"type":"S2C_FULL_STATE","tick":1}'));
    expect(result.ok).toBe(false);
  });

  it("parseTransportServerPacket accepts encodeTransportPacket output for PongPacket", () => {
    const pong: PongPacket = {
      type: TransportServerMessageType.Pong,
      commandId: 1,
      clientTimeMs: 100,
      serverTime: 200,
    };
    const result = parseTransportServerPacket(JSON.parse(encodeTransportPacket(pong)));
    expect(result.ok).toBe(true);
  });

  it("parseTransportServerPacket accepts encodeTransportPacket output for CommandRejectedPacket", () => {
    const rejection: CommandRejectedPacket = {
      type: TransportServerMessageType.CommandRejected,
      reason: "nope",
    };
    const result = parseTransportServerPacket(JSON.parse(encodeTransportPacket(rejection)));
    expect(result.ok).toBe(true);
  });

  it("parseTransportServerPacket accepts encodeTransportPacket output for TransportErrorPacket", () => {
    const error: TransportErrorPacket = {
      type: TransportServerMessageType.Error,
      reason: "boom",
    };
    const result = parseTransportServerPacket(JSON.parse(encodeTransportPacket(error)));
    expect(result.ok).toBe(true);
  });
});
