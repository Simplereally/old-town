import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  activateBoon,
  bindOath,
  breakOath,
  getFavourLevel,
  hasActiveOath,
  hasFavour,
  performRite,
} from "./favour-advanced-system";

const BOON_DEF: import("./favour-advanced-system").BoonDef = {
  id: "healing_boon",
  name: "Healing Boon",
  requiredFavour: 5,
  effectId: "heal_over_time",
  durationTicks: 10,
  favourCost: 20,
};

const OATH_DEF: import("./favour-advanced-system").OathDef = {
  id: "warrior_oath",
  name: "Warrior Oath",
  requiredFavour: 10,
  restriction: "Cannot use magic.",
  benefit: { skillId: "strength", boostAmount: 5 },
  favourCost: 30,
};

const RITE_DEF: import("./favour-advanced-system").RiteDef = {
  id: "blessing_rite",
  name: "Blessing Rite",
  requiredFavour: 3,
  requiredItems: [{ itemId: "candle", quantity: 2 }],
  outcome: {
    xpRewards: [{ skillId: "favour", amount: 50 }],
    statusEffectId: "blessed",
    effectDurationTicks: 20,
  },
  favourCost: 10,
};

function addPlayer(world: World, favourLevel = 1, favourXp = 0): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x: 0, y: 0, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      favour: { level: favourLevel, xp: favourXp, boost: 0, drain: 0 },
      strength: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries();
  const ctx = {
    world,
    deltas,
    registries,
  };
  return { ctx, world, deltas };
}

describe("getFavourLevel", () => {
  it("returns favour level when present", () => {
    const { world } = setup();
    const player = addPlayer(world, 10);

    expect(getFavourLevel(world, player)).toBe(10);
  });

  it("returns 0 when skills component is missing", () => {
    const { world } = setup();
    const entityId = world.createEntity();

    expect(getFavourLevel(world, entityId)).toBe(0);
  });
});

describe("hasFavour", () => {
  it("returns true when player has enough favour", () => {
    const { world } = setup();
    const player = addPlayer(world, 10);

    expect(hasFavour(world, player, 5)).toBe(true);
  });

  it("returns false when player does not have enough favour", () => {
    const { world } = setup();
    const player = addPlayer(world, 3);

    expect(hasFavour(world, player, 5)).toBe(false);
  });
});

describe("activateBoon", () => {
  it("fails when player does not have enough favour level", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1);

    const result = activateBoon(ctx, player, BOON_DEF, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need Favour level 5 to activate Healing Boon.");
  });

  it("fails when player does not have enough favour level", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 100);

    const result = activateBoon(ctx, player, BOON_DEF, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need Favour level 5 to activate Healing Boon.");
  });
});

describe("bindOath", () => {
  it("binds an oath when requirements are met", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 15, 3000);

    const result = bindOath(ctx, player, OATH_DEF, 0);

    expect(result).toBe(true);
    expect(hasActiveOath(world, player, "warrior_oath")).toBe(true);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You bind the Warrior Oath oath. Cannot use magic.");
  });

  it("fails when player already has an active oath", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 15, 3000);
    bindOath(ctx, player, OATH_DEF, 0);
    deltas.consume(0, 0);

    const result = bindOath(ctx, player, OATH_DEF, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You are already bound to an oath. You must break it first.");
  });

  it("fails when player does not have enough favour level", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 5);

    const result = bindOath(ctx, player, OATH_DEF, 0);

    expect(result).toBe(false);
  });
});

describe("breakOath", () => {
  it("breaks an active oath", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 15, 100);
    bindOath(ctx, player, OATH_DEF, 0);
    deltas.consume(0, 0);

    const result = breakOath(ctx, player, 0);

    expect(result).toBe(true);
    expect(hasActiveOath(world, player, "warrior_oath")).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You break your oath.");
  });

  it("fails when player has no active oath", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 10);

    const result = breakOath(ctx, player, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You are not bound to any oath.");
  });
});

describe("performRite", () => {
  it("fails when player does not have required items", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 10, 100);

    const result = performRite(ctx, player, RITE_DEF, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need 2 candle to perform Blessing Rite.");
  });

  it("fails when player does not have enough favour level", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "candle", quantity: 5, uid: 1 };

    const result = performRite(ctx, player, RITE_DEF, 0);

    expect(result).toBe(false);
  });
});
