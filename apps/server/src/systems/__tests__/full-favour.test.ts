import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../../items/inventory";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import {
  activateBoon,
  type BoonDef,
  bindOath,
  breakOath,
  deductFavourXp,
  type FavourAdvancedContext,
  getActiveOathId,
  getFavourLevel,
  hasActiveOath,
  hasFavour,
  type OathDef,
  performRite,
  type RiteDef,
} from "../favour-advanced-system";

const FAVOUR_SKILL_DEF = {
  id: "favour",
  name: "Favour",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: false,
  unlocks: [],
};

const STRENGTH_SKILL_DEF = {
  id: "strength",
  name: "Strength",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: true,
  unlocks: [],
};

const CANDLE_ITEM_DEF = {
  id: "shrine_candle",
  name: "Shrine Candle",
  stackable: true,
  tradeable: true,
  examine: "A small candle.",
  icon: "icon_shrine_candle",
  value: 5,
  weight: 0.1,
  options: ["light"],
  tags: ["offering"],
};

const BONE_ITEM_DEF = {
  id: "small_bones",
  name: "Small Bones",
  stackable: true,
  tradeable: true,
  examine: "Tiny bones.",
  icon: "icon_small_bones",
  value: 2,
  weight: 0.1,
  options: ["bury"],
  tags: [],
};

const ASH_ITEM_DEF = {
  id: "ash",
  name: "Ash",
  stackable: true,
  tradeable: true,
  examine: "Remains of a fire.",
  icon: "icon_ash",
  value: 1,
  weight: 0.1,
  options: [],
  tags: [],
};

const BOON_DEF: BoonDef = {
  id: "boon_of_iron",
  name: "Boon of Iron",
  requiredFavour: 5,
  effectId: "strength_boost",
  durationTicks: 10,
  favourCost: 50,
};

const OATH_DEF: OathDef = {
  id: "oath_of_silence",
  name: "Oath of Silence",
  requiredFavour: 10,
  restriction: "You may not speak in public channels.",
  benefit: { skillId: "strength", boostAmount: 3 },
  favourCost: 100,
};

const RITE_DEF: RiteDef = {
  id: "rite_of_ash",
  name: "Rite of Ash",
  requiredFavour: 3,
  requiredItems: [
    { itemId: "ash", quantity: 2 },
    { itemId: "small_bones", quantity: 1 },
  ],
  outcome: {
    xpRewards: [{ skillId: "favour", amount: 25 }],
    statusEffectId: "strength_boost",
    effectDurationTicks: 5,
  },
  favourCost: 30,
};

function addPlayer(
  world: World,
  favourLevel: number,
  favourXp: number,
  hasInventory = true,
): import("@old-town/shared/types/ids").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x: 1, y: 1, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      favour: { level: favourLevel, xp: favourXp, boost: 0, drain: 0 },
      strength: { level: 10, xp: 0, boost: 0, drain: 0 },
    },
  });
  if (hasInventory) {
    world.setComponent(
      entityId,
      "inventory",
      createInventory(entityId, `inventory:${entityId}`, 28),
    );
  }
  world.setComponent(entityId, "combatant", {
    entityId,
    health: 50,
    maxHealth: 50,
    attackLevel: 10,
    strengthLevel: 10,
    defenceLevel: 10,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
  });
  return entityId;
}

function setup(favourLevel = 10, favourXp = 1000) {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    skill: new Map([
      [FAVOUR_SKILL_DEF.id, FAVOUR_SKILL_DEF],
      [STRENGTH_SKILL_DEF.id, STRENGTH_SKILL_DEF],
    ]),
    item: new Map([
      [CANDLE_ITEM_DEF.id, CANDLE_ITEM_DEF],
      [BONE_ITEM_DEF.id, BONE_ITEM_DEF],
      [ASH_ITEM_DEF.id, ASH_ITEM_DEF],
    ]),
  });
  const ctx: FavourAdvancedContext = { world, deltas, registries };
  const player = addPlayer(world, favourLevel, favourXp);
  return { ctx, world, deltas, player };
}

describe("getFavourLevel", () => {
  it("returns the player's Favour level", () => {
    const { world, player } = setup(5, 200);
    expect(getFavourLevel(world, player)).toBe(5);
  });

  it("returns 0 when no skills component exists", () => {
    const world = createWorld();
    const entityId = world.createEntity();
    expect(getFavourLevel(world, entityId)).toBe(0);
  });
});

describe("hasFavour", () => {
  it("returns true when player meets the required level", () => {
    const { world, player } = setup(10, 1000);
    expect(hasFavour(world, player, 5)).toBe(true);
  });

  it("returns false when player is below the required level", () => {
    const { world, player } = setup(3, 100);
    expect(hasFavour(world, player, 5)).toBe(false);
  });
});

describe("deductFavourXp", () => {
  it("deducts Favour XP and updates the skill level", () => {
    const { ctx, world, player, deltas } = setup(10, 1000);
    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    if (!skills?.skills.favour) throw new Error("unreachable");
    const before = skills.skills.favour.xp;

    const result = deductFavourXp(ctx, player, 200);

    expect(result).toBe(true);
    const afterSkills = world.getComponent(player, "skills");
    expect(afterSkills).toBeDefined();
    if (!afterSkills?.skills.favour) throw new Error("unreachable");
    const after = afterSkills.skills.favour.xp;
    expect(after).toBe(before - 200);
    expect(deltas.peek().skillDelta).toBeDefined();
    expect(deltas.peek().skillDelta?.some((d) => d.skillId === "favour")).toBe(true);
  });

  it("returns false when deduction amount is zero or negative", () => {
    const { ctx, player } = setup(10, 1000);
    expect(deductFavourXp(ctx, player, 0)).toBe(false);
    expect(deductFavourXp(ctx, player, -5)).toBe(false);
  });

  it("does not drop below 0 xp", () => {
    const { ctx, world, player } = setup(10, 50);
    const result = deductFavourXp(ctx, player, 100);
    expect(result).toBe(true);
    const after = world.getComponent(player, "skills")?.skills.favour?.xp;
    expect(after).toBe(0);
  });
});

describe("activateBoon", () => {
  it("applies a buff effect when the player has enough Favour", () => {
    const { ctx, world, player } = setup(10, 1000);

    const result = activateBoon(ctx, player, BOON_DEF, 0);

    expect(result).toBe(true);
    const statusEffects = world.getComponent(player, "statusEffect");
    expect(statusEffects).toBeDefined();
    expect(statusEffects?.activeEffects).toHaveLength(1);
    expect(statusEffects?.activeEffects[0]).toMatchObject({
      effectId: "strength_boost",
      durationTicks: 10,
    });
  });

  it("fails when the player does not meet the required Favour level", () => {
    const { ctx, player, deltas } = setup(3, 100);

    const result = activateBoon(ctx, player, BOON_DEF, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("need Favour level"))).toBe(true);
  });

  it("deducts favour cost on activation", () => {
    const { ctx, world, player } = setup(10, 1000);
    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    if (!skills?.skills.favour) throw new Error("unreachable");
    const before = skills.skills.favour.xp;

    activateBoon(ctx, player, BOON_DEF, 0);

    const afterSkills = world.getComponent(player, "skills");
    expect(afterSkills).toBeDefined();
    if (!afterSkills?.skills.favour) throw new Error("unreachable");
    const after = afterSkills.skills.favour.xp;
    expect(after).toBe(before - BOON_DEF.favourCost);
  });
});

describe("bindOath", () => {
  it("binds an oath when the player meets requirements", () => {
    const { ctx, world, player } = setup(15, 2000);

    const result = bindOath(ctx, player, OATH_DEF, 0);

    expect(result).toBe(true);
    expect(hasActiveOath(world, player, OATH_DEF.id)).toBe(true);
    expect(getActiveOathId(world, player)).toBe(OATH_DEF.id);
  });

  it("applies the oath benefit as a skill boost", () => {
    const { ctx, world, player } = setup(15, 2000);

    bindOath(ctx, player, OATH_DEF, 0);

    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    expect((skills as NonNullable<typeof skills>).skills.strength?.boost).toBe(3);
  });

  it("fails when the player already has an active oath", () => {
    const { ctx, player, deltas } = setup(15, 2000);
    bindOath(ctx, player, OATH_DEF, 0);

    const second = bindOath(ctx, player, OATH_DEF, 0);

    expect(second).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("already bound"))).toBe(true);
  });

  it("fails when the player does not meet the required Favour level", () => {
    const { ctx, player, deltas } = setup(5, 100);

    const result = bindOath(ctx, player, OATH_DEF, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("need Favour level"))).toBe(true);
  });

  it("deducts favour cost on binding", () => {
    const { ctx, world, player } = setup(15, 2000);
    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    if (!skills?.skills.favour) throw new Error("unreachable");
    const before = skills.skills.favour.xp;

    bindOath(ctx, player, OATH_DEF, 0);

    const afterSkills = world.getComponent(player, "skills");
    expect(afterSkills).toBeDefined();
    if (!afterSkills?.skills.favour) throw new Error("unreachable");
    const after = afterSkills.skills.favour.xp;
    expect(after).toBe(before - OATH_DEF.favourCost);
  });
});

describe("breakOath", () => {
  it("clears the active oath", () => {
    const { ctx, world, player } = setup(15, 2000);
    bindOath(ctx, player, OATH_DEF, 0);
    expect(getActiveOathId(world, player)).toBe(OATH_DEF.id);

    const result = breakOath(ctx, player, 0);

    expect(result).toBe(true);
    expect(getActiveOathId(world, player)).toBeUndefined();
  });

  it("returns false when no oath is active", () => {
    const { ctx, player, deltas } = setup(15, 2000);

    const result = breakOath(ctx, player, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("not bound"))).toBe(true);
  });
});

describe("performRite", () => {
  it("consumes required items and triggers outcome", () => {
    const { ctx, world, player, deltas } = setup(10, 1000);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    const inv = inventory as NonNullable<typeof inventory>;
    addItem(inv, catalogFromItems(ctx.registries.item), "ash", 5);
    addItem(inv, catalogFromItems(ctx.registries.item), "small_bones", 2);

    const result = performRite(ctx, player, RITE_DEF, 0);

    expect(result).toBe(true);
    expect(count(inv, "ash")).toBe(3);
    expect(count(inv, "small_bones")).toBe(1);

    const statusEffects = world.getComponent(player, "statusEffect");
    expect(statusEffects).toBeDefined();
    expect(statusEffects?.activeEffects).toHaveLength(1);
    expect(statusEffects?.activeEffects[0]?.effectId).toBe("strength_boost");

    expect(deltas.peek().xpDrops).toBeDefined();
    expect(deltas.peek().xpDrops?.some((d) => d.skillId === "favour" && d.amount === 25)).toBe(
      true,
    );
  });

  it("fails when the player is missing required items", () => {
    const { ctx, world, player, deltas } = setup(10, 1000);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    const inv = inventory as NonNullable<typeof inventory>;
    addItem(inv, catalogFromItems(ctx.registries.item), "ash", 1);

    const result = performRite(ctx, player, RITE_DEF, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("need"))).toBe(true);
  });

  it("fails when the player does not meet the required Favour level", () => {
    const { ctx, world, player, deltas } = setup(1, 50);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    const inv = inventory as NonNullable<typeof inventory>;
    addItem(inv, catalogFromItems(ctx.registries.item), "ash", 5);
    addItem(inv, catalogFromItems(ctx.registries.item), "small_bones", 2);

    const result = performRite(ctx, player, RITE_DEF, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("need Favour level"))).toBe(true);
  });

  it("deducts favour cost on performance", () => {
    const { ctx, world, player } = setup(10, 1000);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    const inv = inventory as NonNullable<typeof inventory>;
    addItem(inv, catalogFromItems(ctx.registries.item), "ash", 5);
    addItem(inv, catalogFromItems(ctx.registries.item), "small_bones", 2);
    const skills = world.getComponent(player, "skills");
    expect(skills).toBeDefined();
    if (!skills?.skills.favour) throw new Error("unreachable");
    const before = skills.skills.favour.xp;

    performRite(ctx, player, RITE_DEF, 0);

    const afterSkills = world.getComponent(player, "skills");
    expect(afterSkills).toBeDefined();
    if (!afterSkills?.skills.favour) throw new Error("unreachable");
    const after = afterSkills.skills.favour.xp;
    // Cost is 30, but outcome grants 25 favour XP, so net change is -5
    expect(after).toBe(before - RITE_DEF.favourCost + 25);
  });
});
