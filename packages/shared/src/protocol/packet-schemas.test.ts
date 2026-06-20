import { describe, expect, it } from "vitest";
import { regionId } from "../types/coords";
import { entityId } from "../types/ids";
import type { EntitySpawnPacket, EntityUpdatePacket } from "./entity-update";
import {
  type FullStatePacket,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
} from "./packets";
import { TransportServerMessageType } from "./transport";
import {
  fullStatePacketSchema,
  parseServerPacket,
  parseTransportServerPacket,
  tickDeltaPacketSchema,
} from "./packet-schemas";

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

const fullStateAll: FullStatePacket = {
  type: ServerPacketType.FullState,
  protocolVersion: PROTOCOL_VERSION,
  tick: 100,
  serverTime: 1700000000000,
  worldConstants: {
    gameTickMs: 600,
    tileSizeWorldUnits: 1,
    chunkSize: 8,
    regionSize: 64,
    activeSceneSize: 104,
    planes: 4,
  },
  selfEntityId: entityId(42),
  entities: [spawn],
  inventory: {
    containerId: "inventory",
    changes: [{ slot: 0, itemId: "penny_hatchet", quantity: 1, uid: 7 }],
  },
  bank: { containerId: "bank", changes: [{ slot: 0, itemId: null, quantity: 0 }] },
  equipment: { slots: ["penny_hatchet", null] },
  skills: [{ skillId: "woodcutting", level: 1, xp: 0, effectiveLevel: 1 }],
  vars: [{ varId: "quest_smoke", value: 0 }],
  regionLoads: [
    {
      region: { rx: 0, ry: 0, plane: 0 },
      regionId: regionId({ rx: 0, ry: 0, plane: 0 }),
      chunks: [
        {
          cx: 0,
          cy: 0,
          tiles: [
            { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0, water: false },
          ],
        },
      ],
    },
  ],
};

const tickDeltaAll: TickDeltaPacket = {
  type: ServerPacketType.TickDelta,
  tick: 101,
  serverTime: 1700000000600,
  entityAdds: [spawn],
  entityRemoves: [entityId(7)],
  entityUpdates: [update],
  inventoryDeltas: [{ containerId: "inventory", changes: [{ slot: 0, itemId: "penny_hatchet", quantity: 1 }] }],
  skillDelta: [{ skillId: "attack", level: 1, xp: 16, effectiveLevel: 1 }],
  varbitDelta: [{ varId: "quest_smoke", value: 1 }],
  chat: [{ text: "hello", channel: "public", serverTime: 1700000000600, entityId: entityId(42), name: "Bob" }],
  hitsplats: [{ entityId: entityId(1), hitsplat: { amount: 4, type: "damage" } }],
  xpDrops: [{ skillId: "attack", amount: 16 }],
  projectiles: [
    {
      id: "proj-1",
      projectileId: "arrow_proj",
      sourceEntityId: entityId(2),
      targetEntityId: entityId(3),
      startTile: { x: 1, y: 1, plane: 0 },
      endTile: { x: 5, y: 5, plane: 0 },
      startTick: 100,
      hitTick: 104,
    },
  ],
  sounds: [{ soundId: "hit_splat", tile: { x: 5, y: 6, plane: 0 }, volume: 0.8 }],
  regionLoads: [{ region: { rx: 0, ry: 1, plane: 0 }, regionId: regionId({ rx: 0, ry: 1, plane: 0 }) }],
  regionUnloads: [{ regionId: regionId({ rx: 0, ry: 0, plane: 0 }) }],
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
    {
      interfaceId: "shop",
      shop: {
        shopId: "baker_shop",
        name: "Baker's Shop",
        stock: [{ itemId: "bread", quantity: 10, price: 5, maxQuantity: 100 }],
        sellMultiplier: 1.0,
        buyMultiplier: 0.5,
      },
    },
    {
      interfaceId: "recipe",
      recipe: {
        interfaceId: "recipe",
        stationEntityId: 9,
        stationName: "Stove",
        recipes: [
          {
            recipeId: "bread_recipe",
            name: "Bread",
            skillId: "cooking",
            levelRequired: 1,
            xp: 10,
            ingredients: [{ itemId: "flour", quantity: 1 }],
            productId: "bread",
            productQuantity: 1,
          },
        ],
      },
    },
    {
      interfaceId: "activity",
      activity: {
        activityId: "chopping",
        name: "Chop Wood",
        category: "gathering",
        loopDescription: "chopping...",
        risk: "low",
      },
    },
  ],
  interfaceCloses: [{ interfaceId: "bank" }],
  deathNotices: [{ entityId: entityId(7) }],
  respawnNotices: [{ entityId: entityId(7), tile: { x: 0, y: 0, plane: 0 } }],
  contractComplete: [{ entityId: entityId(1), contractId: "rat_extermination", name: "Rat Extermination" }],
  contractProgress: [
    {
      entityId: entityId(1),
      contractId: "rat_extermination",
      objectiveKind: "kill",
      targetId: "river_rat",
      current: 3,
      required: 5,
    },
  ],
  recipeLists: [
    {
      interfaceId: "recipe",
      stationEntityId: 9,
      stationName: "Stove",
      recipes: [
        {
          recipeId: "bread_recipe",
          name: "Bread",
          skillId: "cooking",
          levelRequired: 1,
          xp: 10,
          ingredients: [{ itemId: "flour", quantity: 1 }],
          productId: "bread",
          productQuantity: 1,
        },
      ],
    },
  ],
  recipeResults: [{ recipeId: "bread_recipe", success: true, productItemId: "bread", productQuantity: 1, xpReward: 10, message: "Cooked bread." }],
  debug: {
    paths: [{ entityId: entityId(1), path: [{ x: 5, y: 6, plane: 0 }, { x: 6, y: 6, plane: 0 }] }],
    trueTiles: [{ entityId: entityId(1), tile: { x: 6, y: 6, plane: 0 } }],
    collisionTiles: [{ x: 7, y: 7, plane: 0 }],
    footprints: [{ x: 6, y: 6, plane: 0 }],
    reachTiles: [{ center: { x: 6, y: 6, plane: 0 }, radius: 1 }],
    loSRays: [{ start: { x: 5, y: 6, plane: 0 }, end: { x: 7, y: 6, plane: 0 } }],
    actionQueue: ["walk_to"],
    combatCooldown: 2,
    pendingHits: [{ targetId: entityId(3), amount: 5 }],
    npcLeash: { x: 10, y: 10, plane: 0 },
    varbits: [{ varId: "v1", value: 1 }],
  },
};

const fullStateMinimal: FullStatePacket = {
  type: ServerPacketType.FullState,
  protocolVersion: PROTOCOL_VERSION,
  tick: 0,
  serverTime: 0,
  selfEntityId: entityId(1),
  entities: [],
};

const tickDeltaMinimal: TickDeltaPacket = {
  type: ServerPacketType.TickDelta,
  tick: 0,
  serverTime: 0,
  entityAdds: [],
  entityRemoves: [],
  entityUpdates: [],
};

describe("S2C packet schemas", () => {
  it("parses a FullStatePacket with all optional fields populated", () => {
    expect(fullStatePacketSchema.safeParse(fullStateAll).success).toBe(true);
  });

  it("parses a TickDeltaPacket with all optional fields populated", () => {
    expect(tickDeltaPacketSchema.safeParse(tickDeltaAll).success).toBe(true);
  });

  it("parses a minimal FullStatePacket (only required fields)", () => {
    expect(fullStatePacketSchema.safeParse(fullStateMinimal).success).toBe(true);
  });

  it("parses a minimal TickDeltaPacket (only required fields)", () => {
    expect(tickDeltaPacketSchema.safeParse(tickDeltaMinimal).success).toBe(true);
  });

  it("rejects an unknown type discriminator", () => {
    const result = parseServerPacket({ ...fullStateMinimal, type: "S2C_UNKNOWN" });
    expect(result.ok).toBe(false);
  });

  it("rejects extra fields on a strict schema", () => {
    const result = fullStatePacketSchema.safeParse({ ...fullStateMinimal, hack: true });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid EntityKind", () => {
    const bad = { ...fullStateMinimal, entities: [{ ...spawn, kind: "dragon" }] };
    expect(fullStatePacketSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an invalid HitsplatType", () => {
    const bad = {
      ...tickDeltaMinimal,
      hitsplats: [{ entityId: 1, hitsplat: { amount: 4, type: "burn" } }],
    };
    expect(tickDeltaPacketSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an invalid plane value in embedded tile coords", () => {
    const bad = { ...fullStateMinimal, entities: [{ ...spawn, tile: { x: 5, y: 6, plane: 5 } }] };
    expect(fullStatePacketSchema.safeParse(bad).success).toBe(false);
  });

  it("parseServerPacket returns { ok: false } for malformed input", () => {
    expect(parseServerPacket("not-an-object").ok).toBe(false);
    expect(parseServerPacket(null).ok).toBe(false);
    expect(parseServerPacket(42).ok).toBe(false);
  });

  it("parseTransportServerPacket accepts PongPacket, CommandRejectedPacket, and TransportErrorPacket", () => {
    expect(
      parseTransportServerPacket({
        type: TransportServerMessageType.Pong,
        commandId: 1,
        clientTimeMs: 100,
        serverTime: 200,
      }).ok,
    ).toBe(true);
    expect(
      parseTransportServerPacket({
        type: TransportServerMessageType.CommandRejected,
        reason: "nope",
      }).ok,
    ).toBe(true);
    expect(
      parseTransportServerPacket({ type: TransportServerMessageType.Error, reason: "boom" }).ok,
    ).toBe(true);
  });

  it("DebugTickData with extra fields parses successfully (passthrough)", () => {
    const result = tickDeltaPacketSchema.safeParse({
      ...tickDeltaMinimal,
      debug: { ...tickDeltaAll.debug, futureField: { any: "thing" } },
    });
    expect(result.success).toBe(true);
  });
});
