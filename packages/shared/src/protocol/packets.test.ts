import { describe, expect, it } from "vitest";
import { regionId } from "../types/coords";
import { entityId } from "../types/ids";
import type { EntitySpawnPacket, EntityUpdatePacket } from "./entity-update";
import {
  decodeServerPacket,
  encodeServerPacket,
  type FullStatePacket,
  isCompatibleProtocol,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
} from "./packets";

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
    changes: [{ slot: 0, itemId: "bronze_hatchet", quantity: 1 }],
  },
  skills: [{ skillId: "woodcutting", level: 1, xp: 0 }],
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
