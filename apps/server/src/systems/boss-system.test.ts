import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { makeRegistries } from "../test-support/registries";
import {
  getBossCategory,
  getBossDropTable,
  getBossLair,
  getBossMechanics,
  getBossTrophy,
  getBossUniqueDrops,
  isBoss,
  validateBossAccess,
} from "./boss-system";

function setup() {
  const world = createWorld();
  const registries = makeRegistries({
    boss: new Map([
      [
        "cellar_king",
        {
          id: "cellar_king",
          name: "The Cellar King",
          category: "starter" as const,
          npcId: "cellar_king",
          combatLevelBand: { low: 1, high: 10 },
          accessRequirements: [],
          mechanics: [
            { kind: "add_spawn" as const, description: "Summons cellar rats at low health." },
          ],
          lair: {
            type: "room" as const,
            threshold: "door" as const,
            area: "Sootcellar",
            safeRating: "safe" as const,
          },
          dropTableId: "cellar_king_drops",
          trophyId: "cellar_king_whisker",
          uniqueDropIds: ["bent_nail_ring"],
          failureState: "Retreat to the Sootcellar.",
          whatItTeaches: "Food timing and target swapping.",
          whatItDoesNotReplace: "Normal combat training.",
        },
      ],
    ]),
    npc: new Map([
      [
        "cellar_king",
        {
          id: "cellar_king",
          name: "The Cellar King",
          size: 2 as const,
          respawnTicks: 30,
          combatLevel: 5,
          maxHp: 30,
          stats: {
            attack: 3,
            strength: 3,
            defence: 2,
            ranged: 1,
            magic: 1,
            prayer: 1,
            hitpoints: 30,
          },
          attackSpeedTicks: 5,
          attackRangeTiles: 1,
          aggressiveRadius: 0,
          wanderRadius: 2,
          drops: "cellar_king_drops",
          movementType: "wander" as const,
          aggressionMode: "peaceful" as const,
          creatureKind: "passive" as const,
          contractEligible: false,
          options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
        },
      ],
    ]),
  });

  const ctx = { world, deltas: { markChat: () => {} } as any, registries };
  return { world, registries, ctx };
}

describe("boss-system", () => {
  it("isBoss returns true for a boss NPC", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    const result = isBoss(ctx, entityId);
    expect(result.isBoss).toBe(true);
    expect(result.bossDef?.id).toBe("cellar_king");
  });

  it("isBoss returns false for a non-boss NPC", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_rat",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    const result = isBoss(ctx, entityId);
    expect(result.isBoss).toBe(false);
    expect(result.bossDef).toBeUndefined();
  });

  it("isBoss returns false for a non-NPC entity", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "position", { entityId, x: 0, y: 0, plane: 0 });

    const result = isBoss(ctx, entityId);
    expect(result.isBoss).toBe(false);
    expect(result.bossDef).toBeUndefined();
  });

  it("validateBossAccess allows combat when no requirements", () => {
    const { world, ctx } = setup();
    const playerId = world.createEntity();
    world.setComponent(playerId, "position", { entityId: playerId, x: 30, y: 26, plane: 0 });
    const bossId = world.createEntity();
    world.setComponent(bossId, "npc", {
      entityId: bossId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });
    world.setComponent(bossId, "position", { entityId: bossId, x: 30, y: 26, plane: 0 });

    const result = validateBossAccess(ctx, playerId, bossId);
    expect(result.ok).toBe(true);
    expect(result.bossDef?.id).toBe("cellar_king");
  });

  it("validateBossAccess denies when player is too far", () => {
    const { world, ctx } = setup();
    const playerId = world.createEntity();
    world.setComponent(playerId, "position", { entityId: playerId, x: 0, y: 0, plane: 0 });
    const bossId = world.createEntity();
    world.setComponent(bossId, "npc", {
      entityId: bossId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });
    world.setComponent(bossId, "position", { entityId: bossId, x: 30, y: 26, plane: 0 });

    const result = validateBossAccess(ctx, playerId, bossId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("You are too far from the boss lair.");
  });

  it("validateBossAccess allows non-boss NPCs", () => {
    const { world, ctx } = setup();
    const playerId = world.createEntity();
    world.setComponent(playerId, "position", { entityId: playerId, x: 30, y: 26, plane: 0 });
    const bossId = world.createEntity();
    world.setComponent(bossId, "npc", {
      entityId: bossId,
      npcId: "cellar_rat",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });
    world.setComponent(bossId, "position", { entityId: bossId, x: 30, y: 26, plane: 0 });

    const result = validateBossAccess(ctx, playerId, bossId);
    expect(result.ok).toBe(true);
    expect(result.bossDef).toBeUndefined();
  });

  it("getBossCategory returns the category for a boss", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    expect(getBossCategory(ctx, entityId)).toBe("starter");
  });

  it("getBossMechanics returns mechanics for a boss", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    const mechanics = getBossMechanics(ctx, entityId);
    expect(mechanics).toHaveLength(1);
    expect(mechanics?.[0]?.kind).toBe("add_spawn");
  });

  it("getBossLair returns lair info for a boss", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    const lair = getBossLair(ctx, entityId);
    expect(lair?.type).toBe("room");
    expect(lair?.area).toBe("Sootcellar");
    expect(lair?.safeRating).toBe("safe");
  });

  it("getBossDropTable returns the drop table id", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    expect(getBossDropTable(ctx, entityId)).toBe("cellar_king_drops");
  });

  it("getBossTrophy returns the trophy id", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    expect(getBossTrophy(ctx, entityId)).toBe("cellar_king_whisker");
  });

  it("getBossUniqueDrops returns the unique drop ids", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_king",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    expect(getBossUniqueDrops(ctx, entityId)).toEqual(["bent_nail_ring"]);
  });

  it("returns undefined for non-boss entities", () => {
    const { world, ctx } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "cellar_rat",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
      home: { x: 30, y: 26, plane: 0 },
      leashDistance: 6,
    });

    expect(getBossCategory(ctx, entityId)).toBeUndefined();
    expect(getBossMechanics(ctx, entityId)).toBeUndefined();
    expect(getBossLair(ctx, entityId)).toBeUndefined();
    expect(getBossDropTable(ctx, entityId)).toBeUndefined();
    expect(getBossTrophy(ctx, entityId)).toBeUndefined();
    expect(getBossUniqueDrops(ctx, entityId)).toEqual([]);
  });
});
