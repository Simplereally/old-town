import { tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../../items/inventory";
import { ActionQueue } from "../../sim/action-queue";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import { CollisionMap } from "../../world/collision";
import { createRuntimeMap } from "../../world/runtime-map";
import {
  checkNookDiscovery,
  enterNook,
  isNookRevealed,
  type NookDef,
  revealNook,
  validateNookEntry,
} from "../nook-system";
import { handleObjectIntent } from "../object-interaction-router";

const HIDDEN_NOOK: NookDef = {
  id: "sewer_cache",
  name: "Sewer Cache",
  entryTile: { x: 5, y: 5, plane: 0 },
  hidden: true,
  interiorTile: { x: 10, y: 10, plane: 1 },
};

const VISIBLE_NOOK: NookDef = {
  id: "market_stall",
  name: "Market Stall",
  entryTile: { x: 3, y: 3, plane: 0 },
  hidden: false,
  interiorTile: { x: 4, y: 4, plane: 0 },
};

const ITEM_GATED_NOOK: NookDef = {
  id: "locked_cellar",
  name: "Locked Cellar",
  entryTile: { x: 6, y: 6, plane: 0 },
  hidden: false,
  requiredItem: "cellar_key",
  interiorTile: { x: 7, y: 7, plane: 0 },
};

const QUEST_GATED_NOOK: NookDef = {
  id: "temple_vault",
  name: "Temple Vault",
  entryTile: { x: 8, y: 8, plane: 0 },
  hidden: false,
  requiredQuest: "temple_quest",
  interiorTile: { x: 9, y: 9, plane: 0 },
};

const LEVEL_GATED_NOOK: NookDef = {
  id: "wizard_tower",
  name: "Wizard Tower",
  entryTile: { x: 10, y: 10, plane: 0 },
  hidden: false,
  requiredLevel: { skillId: "magic", level: 30 },
  interiorTile: { x: 11, y: 11, plane: 0 },
};

const TIME_GATED_NOOK: NookDef = {
  id: "night_market",
  name: "Night Market",
  entryTile: { x: 12, y: 12, plane: 0 },
  hidden: false,
  timeWindow: { startHour: 20, endHour: 6 },
  interiorTile: { x: 13, y: 13, plane: 0 },
};

const NO_INTERIOR_NOOK: NookDef = {
  id: "empty_cranny",
  name: "Empty Cranny",
  entryTile: { x: 14, y: 14, plane: 0 },
  hidden: false,
};

const CELLAR_KEY_DEF = {
  id: "cellar_key",
  name: "Cellar Key",
  stackable: false,
  tradeable: true,
  examine: "A rusty key.",
  icon: "icon_cellar_key",
  value: 1,
  weight: 0.1,
  options: [],
  tags: [],
};

const MAGIC_SKILL_DEF = {
  id: "magic",
  name: "Magic",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: false,
  unlocks: [],
};

const NOOK_DOOR_DEF = {
  id: "nook_door",
  name: "Nook Door",
  examine: "A hidden door.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Enter", actionId: "enter", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
  nookId: "sewer_cache",
};

function addPlayer(
  world: World,
  x = 1,
  y = 1,
  skills?: Record<string, { level: number; xp: number; boost: number; drain: number }>,
): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  world.setComponent(entityId, "skills", {
    entityId,
    skills: skills ?? {},
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function addNookDoor(
  world: World,
  objectId: string,
  _nookId: string | undefined,
  x: number,
  y: number,
): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId,
    facing: 0,
    variant: 0,
  });
  return entityId;
}

function addOpenTiles(map: ReturnType<typeof createRuntimeMap>): void {
  for (let x = 0; x < 64; x += 1) {
    for (let y = 0; y < 64; y += 1) {
      map.tiles.set(tileKey({ x, y, plane: 0 }), {
        tile: { x, y, plane: 0 },
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function setup() {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const registries = makeRegistries({
    object: new Map([[NOOK_DOOR_DEF.id, NOOK_DOOR_DEF]]),
    item: new Map([[CELLAR_KEY_DEF.id, CELLAR_KEY_DEF]]),
    skill: new Map([[MAGIC_SKILL_DEF.id, MAGIC_SKILL_DEF]]),
  });
  const ctx = {
    world,
    collision,
    deltas,
    actionQueue,
    registries,
    rng: { nextFloat: () => 0, nextInt: () => 0, chanceOneIn: () => false },
    itemAudit: undefined,
  };
  return { ctx, world, deltas, actionQueue };
}

function setupNookCtx() {
  const { ctx, world, deltas } = setup();
  return {
    ctx: { world, deltas } as import("../nook-system").NookSystemContext,
    world,
    deltas,
    registries: ctx.registries,
  };
}

describe("nook entry validation", () => {
  it("passes when no conditions are set", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    const result = validateNookEntry(ctx, player, VISIBLE_NOOK, 0);
    expect(result.ok).toBe(true);
  });

  it("fails when required item is missing", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 6, 6);

    const result = validateNookEntry(ctx, player, ITEM_GATED_NOOK, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("item");
    }
  });

  it("passes when required item is present", () => {
    const { ctx, registries } = setupNookCtx();
    const player = addPlayer(ctx.world, 6, 6);
    const inventory = ctx.world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "cellar_key", 1);

    const result = validateNookEntry(ctx, player, ITEM_GATED_NOOK, 0);
    expect(result.ok).toBe(true);
  });

  it("fails when required quest is not started", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 8, 8);

    const result = validateNookEntry(ctx, player, QUEST_GATED_NOOK, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("quest");
    }
  });

  it("passes when required quest is completed", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 8, 8);
    const vars = ctx.world.getComponent(player, "vars");
    expect(vars).toBeDefined();
    if (!vars) return;
    vars.values["quest.temple_quest.stage"] = 5;

    const result = validateNookEntry(ctx, player, QUEST_GATED_NOOK, 0);
    expect(result.ok).toBe(true);
  });

  it("fails when required level is too low", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 10, 10, {
      magic: { level: 15, xp: 0, boost: 0, drain: 0 },
    });

    const result = validateNookEntry(ctx, player, LEVEL_GATED_NOOK, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("level 30");
    }
  });

  it("passes when required level is met", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 10, 10, {
      magic: { level: 30, xp: 0, boost: 0, drain: 0 },
    });

    const result = validateNookEntry(ctx, player, LEVEL_GATED_NOOK, 0);
    expect(result.ok).toBe(true);
  });

  it("fails when outside time window", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 12, 12);
    // 12:00 noon
    const noon = new Date("2026-06-04T12:00:00Z").getTime();

    const result = validateNookEntry(ctx, player, TIME_GATED_NOOK, noon);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("not accessible");
    }
  });

  it("passes when inside time window", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 12, 12);
    // 22:00 night
    const night = new Date("2026-06-04T22:00:00Z").getTime();

    const result = validateNookEntry(ctx, player, TIME_GATED_NOOK, night);
    expect(result.ok).toBe(true);
  });
});

describe("nook reveal", () => {
  it("reveals a hidden nook when conditions are met", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    const result = revealNook(ctx, player, HIDDEN_NOOK, 0);
    expect(result).toBe(true);
    expect(isNookRevealed(world, player, HIDDEN_NOOK.id)).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You discover a hidden nook: Sewer Cache.");
  });

  it("does not reveal a hidden nook when conditions are not met", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);
    const gated = { ...HIDDEN_NOOK, requiredItem: "cellar_key" };

    const result = revealNook(ctx, player, gated, 0);
    expect(result).toBe(false);
    expect(isNookRevealed(world, player, gated.id)).toBe(false);
    expect(deltas.peek().chat).toBeUndefined();
  });

  it("already-revealed nook returns true without duplicate chat", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    revealNook(ctx, player, HIDDEN_NOOK, 0);
    const result = revealNook(ctx, player, HIDDEN_NOOK, 0);
    expect(result).toBe(true);
    expect(isNookRevealed(world, player, HIDDEN_NOOK.id)).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.length).toBe(1);
  });

  it("visible nook is always considered revealed", () => {
    const { ctx, world } = setupNookCtx();
    const player = addPlayer(ctx.world, 3, 3);

    const result = revealNook(ctx, player, VISIBLE_NOOK, 0);
    expect(result).toBe(true);
    expect(isNookRevealed(world, player, VISIBLE_NOOK.id)).toBe(false); // no var stored for visible
  });
});

describe("nook interior", () => {
  it("teleports player to interior tile on enter", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    const result = enterNook(ctx, player, VISIBLE_NOOK, 0);
    expect(result.ok).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(4);
    expect(position?.y).toBe(4);

    const delta = deltas.peek();
    expect(delta.entityUpdates?.[0]).toMatchObject({
      entityId: player,
      changes: {
        position: { x: 4, y: 4, plane: 0 },
      },
    });
  });

  it("fails to enter nook without interior", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 14, 14);

    const result = enterNook(ctx, player, NO_INTERIOR_NOOK, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("This nook has no interior.");
  });

  it("hidden nook auto-reveals on enter when conditions met", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    expect(isNookRevealed(world, player, HIDDEN_NOOK.id)).toBe(false);
    const result = enterNook(ctx, player, HIDDEN_NOOK, 0);
    expect(result.ok).toBe(true);
    expect(isNookRevealed(world, player, HIDDEN_NOOK.id)).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.plane).toBe(1);

    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("discover"))).toBe(true);
  });

  it("hidden nook rejects enter when conditions are not met", () => {
    const { ctx, world } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);
    const gated = { ...HIDDEN_NOOK, requiredItem: "cellar_key" };

    const result = enterNook(ctx, player, gated, 0);
    expect(result.ok).toBe(false);
    expect(isNookRevealed(world, player, gated.id)).toBe(false);
  });
});

describe("nook discovery via proximity", () => {
  it("discovers hidden nook when standing on entry tile and conditions met", () => {
    const { ctx, world, deltas } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    const discovered = checkNookDiscovery(ctx, player, [HIDDEN_NOOK], 0);
    expect(discovered).toEqual(["sewer_cache"]);
    expect(isNookRevealed(world, player, "sewer_cache")).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You discover a hidden nook: Sewer Cache.");
  });

  it("does not discover hidden nook when off entry tile", () => {
    const { ctx, world } = setupNookCtx();
    const player = addPlayer(ctx.world, 50, 50);

    const discovered = checkNookDiscovery(ctx, player, [HIDDEN_NOOK], 0);
    expect(discovered).toEqual([]);
    expect(isNookRevealed(world, player, "sewer_cache")).toBe(false);
  });

  it("does not re-discover already revealed nook", () => {
    const { ctx } = setupNookCtx();
    const player = addPlayer(ctx.world, 5, 5);

    checkNookDiscovery(ctx, player, [HIDDEN_NOOK], 0);
    const again = checkNookDiscovery(ctx, player, [HIDDEN_NOOK], 0);
    expect(again).toEqual([]);
  });

  it("does not discover visible nooks", () => {
    const { ctx, world } = setupNookCtx();
    const player = addPlayer(ctx.world, 3, 3);

    const discovered = checkNookDiscovery(ctx, player, [VISIBLE_NOOK], 0);
    expect(discovered).toEqual([]);
    expect(isNookRevealed(world, player, "market_stall")).toBe(false);
  });
});

describe("nook object interaction router", () => {
  it("enter action on nook door teleports to interior", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(ctx.world, 5, 5);
    const door = addNookDoor(ctx.world, "nook_door", "sewer_cache", 5, 5);

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "enter", objectEntityId: door },
      0,
      0,
      [HIDDEN_NOOK],
    );
    expect(result).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(10);
    expect(position?.y).toBe(10);
    expect(position?.plane).toBe(1);

    const chat = deltas.peek().chat;
    expect(chat?.some((c) => c.text.includes("enter"))).toBe(true);
  });

  it("enter action on nook door fails when conditions not met", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(ctx.world, 5, 5);
    const door = addNookDoor(ctx.world, "nook_door", "sewer_cache", 5, 5);
    const gated = { ...HIDDEN_NOOK, requiredItem: "cellar_key" };

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "enter", objectEntityId: door },
      0,
      0,
      [gated],
    );
    expect(result).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(5);
    expect(position?.y).toBe(5);

    const chat = deltas.peek().chat;
    expect(chat?.length).toBeGreaterThan(0);
    expect(chat?.[0]?.text).toContain("Sewer Cache");
  });

  it("enter action falls back to transitionDestination when no nook", () => {
    const { ctx, world } = setup();
    const player = addPlayer(ctx.world, 1, 1);
    const door = world.createEntity();
    world.setComponent(door, "position", { entityId: door, x: 2, y: 1, plane: 0 });
    world.setComponent(door, "object", {
      entityId: door,
      objectId: "plain_door",
      facing: 0,
      variant: 0,
    });

    const registries = makeRegistries({
      object: new Map([
        [
          "plain_door",
          {
            id: "plain_door",
            name: "Plain Door",
            width: 1,
            length: 1,
            blocksMovement: true,
            blocksLineOfSight: false,
            options: [{ label: "Enter", actionId: "enter", priority: 10, requiredDistance: 1 }],
            defaultRotation: 0,
            transitionDestination: { x: 20, y: 20, plane: 0 },
          },
        ],
      ]),
    });
    const customCtx = { ...ctx, registries };

    const result = handleObjectIntent(
      customCtx,
      player,
      { actionId: "enter", objectEntityId: door },
      0,
      0,
    );
    expect(result).toBe(true);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(20);
    expect(position?.y).toBe(20);
  });
});
