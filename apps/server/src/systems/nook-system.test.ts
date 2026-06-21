import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  checkNookDiscovery,
  enterNook,
  isNookRevealed,
  revealNook,
  validateNookEntry,
} from "./nook-system";

const NOOK_VISIBLE: import("./nook-system").NookDef = {
  id: "market_cellar",
  name: "Market Cellar",
  entryTile: { x: 10, y: 10, plane: 0 },
  hidden: false,
  interiorTile: { x: 5, y: 5, plane: 1 },
};

const NOOK_HIDDEN: import("./nook-system").NookDef = {
  id: "secret_passage",
  name: "Secret Passage",
  entryTile: { x: 20, y: 20, plane: 0 },
  hidden: true,
  requiredItem: "old_key",
  interiorTile: { x: 25, y: 25, plane: 0 },
};

const NOOK_QUEST_LOCKED: import("./nook-system").NookDef = {
  id: "quest_room",
  name: "Quest Room",
  entryTile: { x: 30, y: 30, plane: 0 },
  hidden: true,
  requiredQuest: "test_quest",
  interiorTile: { x: 35, y: 35, plane: 0 },
};

const NOOK_LEVEL_LOCKED: import("./nook-system").NookDef = {
  id: "skill_room",
  name: "Skill Room",
  entryTile: { x: 40, y: 40, plane: 0 },
  hidden: true,
  requiredLevel: { skillId: "mining", level: 10 },
  interiorTile: { x: 45, y: 45, plane: 0 },
};

function addPlayer(world: World, x: number, y: number): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      mining: { level: 5, xp: 0, boost: 0, drain: 0 },
    },
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const ctx = {
    world,
    deltas,
  };
  return { ctx, world, deltas };
}

describe("validateNookEntry", () => {
  it("allows entry for visible nook with no requirements", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const result = validateNookEntry(ctx, player, NOOK_VISIBLE, 0);

    expect(result.ok).toBe(true);
  });

  it("requires item for item-locked nook", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);

    const result = validateNookEntry(ctx, player, NOOK_HIDDEN, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("You need a specific item to enter Secret Passage.");
    }
  });

  it("allows entry when player has required item", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "old_key", quantity: 1, uid: 1 };

    const result = validateNookEntry(ctx, player, NOOK_HIDDEN, 0);

    expect(result.ok).toBe(true);
  });

  it("requires quest completion for quest-locked nook", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 30, 30);

    const result = validateNookEntry(ctx, player, NOOK_QUEST_LOCKED, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("You must complete a quest to enter Quest Room.");
    }
  });

  it("requires skill level for level-locked nook", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 40, 40);

    const result = validateNookEntry(ctx, player, NOOK_LEVEL_LOCKED, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("You need level 10 mining to enter Skill Room.");
    }
  });

  it("allows entry when player meets skill requirement", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 40, 40);
    world.setComponent(player, "skills", {
      entityId: player,
      skills: {
        mining: { level: 15, xp: 0, boost: 0, drain: 0 },
      },
    });

    const result = validateNookEntry(ctx, player, NOOK_LEVEL_LOCKED, 0);

    expect(result.ok).toBe(true);
  });
});

describe("revealNook", () => {
  it("reveals hidden nook when requirements are met", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "old_key", quantity: 1, uid: 1 };

    const result = revealNook(ctx, player, NOOK_HIDDEN, 0);

    expect(result).toBe(true);
    expect(isNookRevealed(world, player, "secret_passage")).toBe(true);

    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You discover a hidden nook: Secret Passage.");
  });

  it("returns true for non-hidden nook without discovery", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const result = revealNook(ctx, player, NOOK_VISIBLE, 0);

    expect(result).toBe(true);
    expect(isNookRevealed(world, player, "market_cellar")).toBe(false);
  });

  it("returns false when requirements are not met", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);

    const result = revealNook(ctx, player, NOOK_HIDDEN, 0);

    expect(result).toBe(false);
    expect(isNookRevealed(world, player, "secret_passage")).toBe(false);
  });
});

describe("enterNook", () => {
  it("teleports player to interior when entering", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const result = enterNook(ctx, player, NOOK_VISIBLE, 0);

    expect(result.ok).toBe(true);
    const position = world.getComponent(player, "position");
    expect(position).toMatchObject({ x: 5, y: 5, plane: 1 });
  });

  it("fails when player does not meet requirements", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);

    const result = enterNook(ctx, player, NOOK_HIDDEN, 0);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("You need a specific item to enter Secret Passage.");
  });

  it("fails when nook has no interior", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);
    const nook: import("./nook-system").NookDef = {
      id: "no_interior",
      name: "No Interior",
      entryTile: { x: 10, y: 10, plane: 0 },
      hidden: false,
    };

    const result = enterNook(ctx, player, nook, 0);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("This nook has no interior.");
  });
});

describe("checkNookDiscovery", () => {
  it("discovers hidden nook when player is on entry tile", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 20, 20);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "old_key", quantity: 1, uid: 1 };

    const discovered = checkNookDiscovery(ctx, player, [NOOK_HIDDEN], 0);

    expect(discovered).toEqual(["secret_passage"]);
    expect(isNookRevealed(world, player, "secret_passage")).toBe(true);
  });

  it("does not discover when player is not on entry tile", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "old_key", quantity: 1, uid: 1 };

    const discovered = checkNookDiscovery(ctx, player, [NOOK_HIDDEN], 0);

    expect(discovered).toEqual([]);
  });

  it("does not discover visible nooks", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const discovered = checkNookDiscovery(ctx, player, [NOOK_VISIBLE], 0);

    expect(discovered).toEqual([]);
  });

  it("does not discover already-discovered nooks", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 20, 20);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    inventory.slots[0] = { itemId: "old_key", quantity: 1, uid: 1 };

    checkNookDiscovery(ctx, player, [NOOK_HIDDEN], 0);
    deltas.consume(0, 0);
    const discovered = checkNookDiscovery(ctx, player, [NOOK_HIDDEN], 0);

    expect(discovered).toEqual([]);
    expect(deltas.peek().chat).toBeUndefined();
  });
});
