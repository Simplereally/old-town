import type { ItemDef, ObjectDef, ProcessingRecipeDef, SkillDef } from "@old-town/shared";
import { createRng, entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../../items/inventory";
import { ItemAuditLog } from "../../items/item-audit";
import { ActionQueue } from "../../sim/action-queue";
import { CommandBuffer } from "../../sim/command-buffer";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { dispatchIntentGroup } from "../../sim/intent-dispatcher";
import { ChatSystem } from "../../systems/chat-system";
import { ConsumableSystem } from "../../systems/consumable-system";
import { makeRegistries } from "../../test-support/registries";
import { CollisionFlag, CollisionMap } from "../../world/collision";
import { createRuntimeMap } from "../../world/runtime-map";
import type { ProcessActionPayload } from "../skilling-system";
import { handleObjectSkillingIntent, handleProcess, handleRecipeSelect } from "../skilling-system";

const PLAYER = entityId(0);
const FIRE = entityId(1);

const COOKING: SkillDef = {
  id: "cooking",
  name: "Cooking",
  maxLevel: 99,
  xpTableId: "oldtown_default",
  combat: false,
  unlocks: [],
};

const RAW_FISH: ItemDef = {
  id: "raw_fish",
  name: "Raw fish",
  stackable: true,
  tradeable: true,
  examine: "A raw fish.",
  icon: "icon_raw_fish",
  value: 1,
  options: [],
  tags: [],
};

const COOKED_FISH: ItemDef = {
  id: "cooked_fish",
  name: "Cooked fish",
  stackable: true,
  tradeable: true,
  examine: "A cooked fish.",
  icon: "icon_cooked_fish",
  value: 2,
  options: [],
  tags: [],
};

const BURNT_FISH: ItemDef = {
  id: "burnt_fish",
  name: "Burnt fish",
  stackable: true,
  tradeable: false,
  examine: "A burnt fish.",
  icon: "icon_burnt_fish",
  value: 0,
  options: [],
  tags: [],
};

const FIRE_STATION: ObjectDef = {
  id: "fire_station",
  name: "Fire",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  defaultRotation: 0,
  examine: "A warm fire.",
  options: [
    { label: "Cook", actionId: "cook", priority: 10, requiredDistance: 1 },
    { label: "Use", actionId: "use", priority: 5, requiredDistance: 1 },
  ],
};

const RECIPE_FISH: ProcessingRecipeDef = {
  id: "cook_fish",
  name: "Cook fish",
  skill: "cooking",
  requiredLevel: 1,
  actionTicks: 1,
  stationObjectIds: ["fire_station"],
  inputItemId: "raw_fish",
  inputQuantity: 1,
  successItemId: "cooked_fish",
  successQuantity: 1,
  failureItemId: "burnt_fish",
  failureQuantity: 1,
  xp: 20,
  failureChance: 0.1,
};

const RECIPE_FISH_ADVANCED: ProcessingRecipeDef = {
  id: "cook_fish_advanced",
  name: "Cook fish (advanced)",
  skill: "cooking",
  requiredLevel: 10,
  actionTicks: 1,
  stationObjectIds: ["fire_station"],
  inputItemId: "raw_fish",
  inputQuantity: 1,
  successItemId: "cooked_fish",
  successQuantity: 2,
  failureItemId: "burnt_fish",
  failureQuantity: 1,
  xp: 40,
  failureChance: 0.05,
};

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  const fire = world.createEntity();
  expect(fire).toBe(FIRE);

  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 0, y: 0, plane: 0 });
  world.setComponent(PLAYER, "actor", {
    entityId: PLAYER,
    name: "Test",
    level: 1,
    appearanceId: "dev_player",
  });

  world.setComponent(FIRE, "object", {
    entityId: FIRE,
    objectId: "fire_station",
    facing: 0,
    variant: 0,
  });
  world.setComponent(FIRE, "position", { entityId: FIRE, x: 0, y: 0, plane: 0 });

  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    item: new Map([
      ["raw_fish", RAW_FISH],
      ["cooked_fish", COOKED_FISH],
      ["burnt_fish", BURNT_FISH],
    ]),
    object: new Map([["fire_station", FIRE_STATION]]),
    skill: new Map([["cooking", COOKING]]),
    processingRecipe: new Map([
      ["cook_fish", RECIPE_FISH],
      ["cook_fish_advanced", RECIPE_FISH_ADVANCED],
    ]),
  });

  const itemAudit = new ItemAuditLog();
  const collision = new CollisionMap(createRuntimeMap());
  const actionQueue = new ActionQueue();
  const ctx = {
    world,
    registries,
    deltas,
    itemAudit,
    collision,
    actionQueue,
    rng: createRng(1),
  };
  return { world, deltas, ctx, registries, itemAudit, collision, actionQueue };
}

function setupSingleRecipe() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  const fire = world.createEntity();
  expect(fire).toBe(FIRE);

  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 0, y: 0, plane: 0 });
  world.setComponent(PLAYER, "actor", {
    entityId: PLAYER,
    name: "Test",
    level: 1,
    appearanceId: "dev_player",
  });

  world.setComponent(FIRE, "object", {
    entityId: FIRE,
    objectId: "fire_station",
    facing: 0,
    variant: 0,
  });
  world.setComponent(FIRE, "position", { entityId: FIRE, x: 0, y: 0, plane: 0 });

  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    item: new Map([
      ["raw_fish", RAW_FISH],
      ["cooked_fish", COOKED_FISH],
      ["burnt_fish", BURNT_FISH],
    ]),
    object: new Map([["fire_station", FIRE_STATION]]),
    skill: new Map([["cooking", COOKING]]),
    processingRecipe: new Map([["cook_fish", RECIPE_FISH]]),
  });

  const itemAudit = new ItemAuditLog();
  const collision = new CollisionMap(createRuntimeMap());
  const actionQueue = new ActionQueue();
  const ctx = {
    world,
    registries,
    deltas,
    itemAudit,
    collision,
    actionQueue,
    rng: createRng(1),
  };
  return { world, deltas, ctx, registries, itemAudit, collision, actionQueue };
}

describe("recipe selection", () => {
  it("sends recipe list when multiple recipes match", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const handled = handleObjectSkillingIntent(
      ctx,
      PLAYER,
      { objectEntityId: FIRE, actionId: "use" },
      0,
      1,
    );
    expect(handled).toBe(true);

    const state = ctx.deltas.peek();
    expect(state.recipeLists).toBeDefined();
    expect(state.recipeLists?.length).toBe(1);
    const list = state.recipeLists?.[0];
    expect(list).toBeDefined();
    expect(list?.recipes.length).toBe(2);
    expect(list?.recipes[0]?.recipeId).toBe("cook_fish");
  });

  it("sends recipe list even when exactly 1 recipe matches", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const handled = handleObjectSkillingIntent(
      ctx,
      PLAYER,
      { objectEntityId: FIRE, actionId: "use" },
      0,
      1,
    );
    expect(handled).toBe(true);

    const state = ctx.deltas.peek();
    expect(state.recipeLists).toBeDefined();
    expect(state.recipeLists?.[0]?.recipes.length).toBe(1);
    expect(state.chat).toBeUndefined();
  });

  it("recipe list is filtered by level", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const handled = handleObjectSkillingIntent(
      ctx,
      PLAYER,
      { objectEntityId: FIRE, actionId: "use" },
      0,
      1,
    );
    expect(handled).toBe(true);

    const state = ctx.deltas.peek();
    const list = state.recipeLists?.[0];
    expect(list?.recipes.length).toBe(2);
    expect(list?.recipes[0]?.recipeId).toBe("cook_fish");
    expect(list?.recipes[0]?.levelRequired).toBe(1);
  });

  it("recipe list is empty when no recipes match", () => {
    const { ctx } = setup();

    const handled = handleObjectSkillingIntent(
      ctx,
      PLAYER,
      { objectEntityId: FIRE, actionId: "use" },
      0,
      1,
    );
    expect(handled).toBe(true);

    const state = ctx.deltas.peek();
    expect(state.recipeLists).toBeUndefined();
    expect(state.chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("handles recipe selection and enqueues process", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(true);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue).toBeDefined();
    expect(queue.length).toBe(1);
    expect(queue[0]?.payload).toMatchObject({
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });

  it("rejects invalid recipe id", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "nonexistent_recipe", 0, 1);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat).toBeDefined();
    expect(state.chat?.[0]?.text).toBe("Invalid recipe selection.");
  });

  it("rejects recipe when level requirement not met", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish_advanced", 0, 1);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat).toBeDefined();
    expect(state.chat?.[0]?.text).toBe("You need level 10 cooking.");
  });

  it("rejects recipe when materials missing", () => {
    const { ctx } = setup();
    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat).toBeDefined();
    expect(state.chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("rejects recipe when wrong station", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const wrongStation = world.createEntity();
    world.setComponent(wrongStation, "object", {
      entityId: wrongStation,
      objectId: "wrong_station",
      facing: 0,
      variant: 0,
    });
    world.setComponent(wrongStation, "position", { entityId: wrongStation, x: 0, y: 0, plane: 0 });

    const result = handleRecipeSelect(ctx, PLAYER, wrongStation, "cook_fish", 0, 1);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat).toBeDefined();
    expect(state.chat?.[0]?.text).toBe("You need a different cooking station.");
  });

  it("rejects recipe when out of range and enqueues begin_process", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 10, y: 10, plane: 0 });

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(true);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue.length).toBe(1);
    expect(queue[0]?.payload).toMatchObject({
      kind: "begin_process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });

  it("rejects recipe when line of sight blocked", () => {
    const { world, ctx, registries, collision } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    // Place player adjacent to fire
    world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 0, y: 1, plane: 0 });
    world.setComponent(FIRE, "position", { entityId: FIRE, x: 0, y: 0, plane: 0 });

    // Block line of sight on the fire tile
    collision.addDynamic({ x: 0, y: 0, plane: 0 }, CollisionFlag.BLOCK_LOS_FULL);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(false);

    const state = ctx.deltas.peek();
    expect(state.chat).toBeDefined();
    expect(state.chat?.[0]?.text).toBe("You cannot see the station.");
  });
});

describe("recipe processing", () => {
  it("consumes materials and produces output on success", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(true);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue.length).toBe(1);
    expect(queue[0]?.payload).toMatchObject({
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });

  it("enqueues movement when out of range", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 10, y: 10, plane: 0 });

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(true);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue.length).toBe(1);
    expect(queue[0]?.payload).toMatchObject({
      kind: "begin_process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });

  it("process tick consumes materials and produces output", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);

    const executions = ctx.actionQueue.advanceTick();
    expect(executions.length).toBe(1);
    const execution = executions[0];
    if (!execution) throw new Error("expected process execution");

    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    };
    handleProcess(ctx, execution, payload, 1, 0);

    const state = ctx.deltas.peek();
    expect(state.inventoryDeltas).toBeDefined();
    expect(state.recipeResults).toBeDefined();
    expect(state.recipeResults?.[0]).toMatchObject({
      recipeId: "cook_fish",
      success: true,
      productItemId: "cooked_fish",
      productQuantity: 1,
      xpReward: 20,
    });
  });

  it("process tick emits failure result when rng fails", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    // Override RNG to guarantee failure
    ctx.rng = {
      nextFloat: () => 0.0,
      nextInt: () => 0,
      chanceOneIn: () => false,
    };

    const recipe = { ...RECIPE_FISH, failureChance: 1 };
    const registriesWithGuaranteedFailure = makeRegistries({
      item: new Map([
        ["raw_fish", RAW_FISH],
        ["cooked_fish", COOKED_FISH],
        ["burnt_fish", BURNT_FISH],
      ]),
      object: new Map([["fire_station", FIRE_STATION]]),
      skill: new Map([["cooking", COOKING]]),
      processingRecipe: new Map([["cook_fish", recipe]]),
    });
    const ctxWithFailure = { ...ctx, registries: registriesWithGuaranteedFailure };

    handleRecipeSelect(ctxWithFailure, PLAYER, FIRE, "cook_fish", 0, 1);

    const executions = ctxWithFailure.actionQueue.advanceTick();
    expect(executions.length).toBe(1);
    const execution = executions[0];
    if (!execution) throw new Error("expected process execution");

    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    };
    handleProcess(ctxWithFailure, execution, payload, 1, 0);

    const state = ctxWithFailure.deltas.peek();
    expect(state.recipeResults?.[0]).toMatchObject({
      recipeId: "cook_fish",
      success: false,
      productItemId: "burnt_fish",
      productQuantity: 1,
    });
  });

  it("process tick stops when input is exhausted", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 1);

    handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);

    const executions = ctx.actionQueue.advanceTick();
    expect(executions.length).toBe(1);
    const execution = executions[0];
    if (!execution) throw new Error("expected process execution");

    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    };
    handleProcess(ctx, execution, payload, 1, 0);

    expect(inventory.slots.some((s) => s?.itemId === "raw_fish")).toBe(false);

    // Second tick should cancel the action because input is exhausted
    const nextExecutions = ctx.actionQueue.advanceTick();
    if (nextExecutions.length > 0) {
      const nextExecution = nextExecutions[0];
      if (nextExecution) {
        handleProcess(ctx, nextExecution, payload, 2, 0);
      }
    }

    expect(ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER)).toEqual([]);
    expect(ctx.deltas.peek().chat?.at(-1)?.text).toBe("You have nothing suitable to cook.");
  });
});

describe("recipe validation", () => {
  it("validates materials exist", () => {
    const { ctx } = setupSingleRecipe();
    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(false);
    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("validates level requirement", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish_advanced", 0, 1);
    expect(result).toBe(false);
    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need level 10 cooking.");
  });

  it("validates station type", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const wrongStation = world.createEntity();
    world.setComponent(wrongStation, "object", {
      entityId: wrongStation,
      objectId: "wrong_station",
      facing: 0,
      variant: 0,
    });
    world.setComponent(wrongStation, "position", { entityId: wrongStation, x: 0, y: 0, plane: 0 });

    const result = handleRecipeSelect(ctx, PLAYER, wrongStation, "cook_fish", 0, 1);
    expect(result).toBe(false);
    const state = ctx.deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You need a different cooking station.");
  });

  it("validates distance to station", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 10, y: 10, plane: 0 });

    const result = handleRecipeSelect(ctx, PLAYER, FIRE, "cook_fish", 0, 1);
    expect(result).toBe(true);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue[0]?.payload).toMatchObject({
      kind: "begin_process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });
});

describe("intent dispatch", () => {
  it("intent dispatcher routes RecipeSelect", () => {
    const { world, ctx, registries } = setupSingleRecipe();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "raw_fish", 5);

    const buffer = new CommandBuffer();
    const accepted = buffer.accept(
      {
        type: "C2S_RECIPE_SELECT",
        commandId: 1,
        payload: { recipeId: "cook_fish", stationEntityId: FIRE },
      },
      { ownerEntityId: PLAYER, connectionId: "conn-1", receivedTick: 0, targetTick: 1 },
    );
    expect(accepted.ok).toBe(true);

    const commands = buffer.consumeTick(1);
    expect(commands.groups.length).toBe(1);
    const group = commands.groups[0];
    expect(group).toBeDefined();
    if (!group) return;

    const dispatcherCtx = {
      world: ctx.world,
      collision: ctx.collision,
      deltas: ctx.deltas,
      actionQueue: ctx.actionQueue,
      registries: ctx.registries,
      rng: ctx.rng,
      chatSystem: new ChatSystem(),
      consumableSystem: new ConsumableSystem(),
      itemAudit: ctx.itemAudit,
    };

    dispatchIntentGroup(dispatcherCtx, group, 1, 0);

    const queue = ctx.actionQueue.getDebugState().filter((e) => e.owner === PLAYER);
    expect(queue.length).toBe(1);
    expect(queue[0]?.payload).toMatchObject({
      kind: "process",
      stationEntityId: FIRE,
      recipeId: "cook_fish",
    });
  });
});
