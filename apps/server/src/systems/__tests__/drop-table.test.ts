import type { ContentRegistries, DropTableDef, EntityId, Rng } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../../ecs/world";
import { createInventory } from "../../items/inventory";
import { makeRegistries } from "../../test-support/registries";
import { type RollDropTableContext, rollDropTable } from "../ground-item-system";

function fixedRng(values: readonly number[]): Rng {
  let index = 0;
  return {
    nextFloat: () => 0,
    nextInt: (min, max) => {
      const value = values[index] ?? min;
      index += 1;
      return Math.min(Math.max(value, min), max);
    },
    chanceOneIn: () => false,
  };
}

function addPlayer(world: World): EntityId {
  const id = world.createEntity();
  world.setComponent(id, "position", { entityId: id, x: 0, y: 0, plane: 0 });
  world.setComponent(id, "player", {
    entityId: id,
    accountId: `account:${id}`,
    sessionId: `session:${id}`,
    interestRadius: 8,
  });
  world.setComponent(id, "inventory", createInventory(id, `inventory:${id}`, 28));
  world.setComponent(id, "skills", {
    entityId: id,
    skills: {
      attack: { level: 1, xp: 0, boost: 0, drain: 0 },
      strength: { level: 1, xp: 0, boost: 0, drain: 0 },
      defence: { level: 1, xp: 0, boost: 0, drain: 0 },
      woodcutting: { level: 10, xp: 0, boost: 0, drain: 0 },
    },
  });
  world.setComponent(id, "vars", { entityId: id, values: {} });
  return id;
}

function registries(dropTable: DropTableDef): ContentRegistries {
  return makeRegistries({
    dropTable: new Map([[dropTable.id, dropTable]]),
  });
}

function makeCtx(
  world: World,
  registries: ContentRegistries,
  playerId: EntityId,
): RollDropTableContext {
  return { world, registries, entityId: playerId };
}

describe("drop table rarity and conditionals", () => {
  it("scales weight by rarity tier", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        { itemId: "common_item", min: 1, max: 1, weight: 100, rarity: "common", requirements: [] },
        {
          itemId: "uncommon_item",
          min: 1,
          max: 1,
          weight: 100,
          rarity: "uncommon",
          requirements: [],
        },
        { itemId: "rare_item", min: 1, max: 1, weight: 100, rarity: "rare", requirements: [] },
        {
          itemId: "very_rare_item",
          min: 1,
          max: 1,
          weight: 100,
          rarity: "very_rare",
          requirements: [],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    // effective weights: common=100, uncommon=50, rare=20, very_rare=5
    // total = 175
    // cursor=1 -> common (100 >= 1)
    const drops = rollDropTable(table, fixedRng([1, 1]), ctx);
    expect(drops).toEqual([{ itemId: "common_item", quantity: 1 }]);

    // cursor=101 -> uncommon (100 + 50 = 150 >= 101)
    const drops2 = rollDropTable(table, fixedRng([101, 1]), ctx);
    expect(drops2).toEqual([{ itemId: "uncommon_item", quantity: 1 }]);

    // cursor=151 -> rare (100 + 50 + 20 = 170 >= 151)
    const drops3 = rollDropTable(table, fixedRng([151, 1]), ctx);
    expect(drops3).toEqual([{ itemId: "rare_item", quantity: 1 }]);

    // cursor=171 -> very_rare (175 >= 171)
    const drops4 = rollDropTable(table, fixedRng([171, 1]), ctx);
    expect(drops4).toEqual([{ itemId: "very_rare_item", quantity: 1 }]);
  });

  it("always drops guaranteed entries that meet requirements", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [{ itemId: "bones", quantity: 1 }],
      entries: [
        { itemId: "common_loot", min: 1, max: 1, weight: 10, rarity: "common", requirements: [] },
        {
          itemId: "guaranteed_loot",
          min: 1,
          max: 1,
          weight: 1,
          rarity: "guaranteed",
          requirements: [],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    const drops = rollDropTable(table, fixedRng([1, 1]), ctx);
    expect(drops).toEqual([
      { itemId: "bones", quantity: 1 },
      { itemId: "guaranteed_loot", quantity: 1 },
      { itemId: "common_loot", quantity: 1 },
    ]);
  });

  it("skips conditional guaranteed entries when requirements are not met", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "quest_item",
          min: 1,
          max: 1,
          weight: 1,
          rarity: "guaranteed",
          requirements: [{ kind: "quest_stage", questId: "test_quest", minStage: 1 }],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    const drops = rollDropTable(table, fixedRng([1, 1]), ctx);
    expect(drops).toEqual([]);
  });

  it("drops conditional guaranteed entries when requirements are met", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "quest_item",
          min: 1,
          max: 1,
          weight: 1,
          rarity: "guaranteed",
          requirements: [{ kind: "quest_stage", questId: "test_quest", minStage: 1 }],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const vars = world.getComponent(player, "vars");
    if (vars) {
      vars.values["quest.test_quest.stage"] = 2;
    }
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    const drops = rollDropTable(table, fixedRng([1, 1]), ctx);
    expect(drops).toEqual([{ itemId: "quest_item", quantity: 1 }]);
  });

  it("skips weighted conditional entries when requirements are not met", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "always_available",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [],
        },
        {
          itemId: "level_gated",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [{ kind: "skill", skillId: "woodcutting", level: 20 }],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    // player woodcutting is 10, so level_gated is excluded
    const drops = rollDropTable(table, fixedRng([5, 1]), ctx);
    expect(drops).toEqual([{ itemId: "always_available", quantity: 1 }]);
  });

  it("includes weighted conditional entries when requirements are met", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "always_available",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [],
        },
        {
          itemId: "level_gated",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [{ kind: "skill", skillId: "woodcutting", level: 5 }],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    // player woodcutting is 10, so level_gated is included
    // total weight = 20, cursor=15 -> level_gated (10 + 10 = 20 >= 15)
    const drops = rollDropTable(table, fixedRng([15, 1]), ctx);
    expect(drops).toEqual([{ itemId: "level_gated", quantity: 1 }]);
  });

  it("handles item requirements for conditional drops", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "special_loot",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [{ kind: "item", itemId: "key", quantity: 1 }],
        },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    // no key in inventory -> excluded
    const dropsWithout = rollDropTable(table, fixedRng([1, 1]), ctx);
    expect(dropsWithout).toEqual([]);
  });

  it("treats all requirements as met when no player context is provided", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 1,
      alwaysDrops: [],
      entries: [
        {
          itemId: "gated_item",
          min: 1,
          max: 1,
          weight: 10,
          rarity: "common",
          requirements: [{ kind: "skill", skillId: "woodcutting", level: 99 }],
        },
      ],
    };

    // no ctx -> requirements ignored, drop rolls normally
    const drops = rollDropTable(table, fixedRng([1, 1]));
    expect(drops).toEqual([{ itemId: "gated_item", quantity: 1 }]);
  });

  it("rolls multiple times respecting rarity scaling", () => {
    const table: DropTableDef = {
      id: "test_drops",
      rolls: 2,
      alwaysDrops: [],
      entries: [
        { itemId: "common_loot", min: 1, max: 1, weight: 100, rarity: "common", requirements: [] },
        { itemId: "rare_loot", min: 1, max: 1, weight: 100, rarity: "rare", requirements: [] },
      ],
    };

    const world = createWorld();
    const player = addPlayer(world);
    const regs = registries(table);
    const ctx = makeCtx(world, regs, player);

    // common=100, rare=20, total=120
    // first roll: cursor=1 -> common, second roll: cursor=110 -> rare (100 + 20 = 120 >= 110)
    const drops = rollDropTable(table, fixedRng([1, 999, 110, 999]), ctx);
    expect(drops).toEqual([
      { itemId: "common_loot", quantity: 1 },
      { itemId: "rare_loot", quantity: 1 },
    ]);
  });
});
