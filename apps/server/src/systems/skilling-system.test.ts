import {
  type ContentRegistries,
  createRng,
  type EntityId,
  type ItemDef,
  type ObjectDef,
  type ProcessingRecipeDef,
  type ResourceNodeDef,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { InventoryComponent, SkillsComponent } from "../ecs/components";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  type GatherActionPayload,
  handleGather,
  handleObjectSkillingIntent,
  handleProcess,
  handleRecipeSelect,
  type ProcessActionPayload,
  type SkillingContext,
  validateGatherAction,
} from "./skilling-system";

const ITEM_BASE = {
  stackable: false,
  tradeable: true,
  examine: "test",
  icon: "icon_test",
  value: 1,
  options: [],
  tags: [],
} satisfies Omit<ItemDef, "id" | "name">;

const ITEMS: readonly ItemDef[] = [
  { ...ITEM_BASE, id: "pennywrought_axe", name: "Axe", tags: ["axe"], tierOrder: 1 },
  { ...ITEM_BASE, id: "pennywrought_pickaxe", name: "Pickaxe", tags: ["pickaxe"], tierOrder: 1 },
  { ...ITEM_BASE, id: "dry_log", name: "Dry Log", stackable: true },
  { ...ITEM_BASE, id: "copper_ore", name: "Copper Ore", stackable: true },
  { ...ITEM_BASE, id: "raw_fish", name: "Raw Fish", stackable: true },
  { ...ITEM_BASE, id: "cooked_fish", name: "Cooked Fish", stackable: true },
  { ...ITEM_BASE, id: "burnt_fish", name: "Burnt Fish", stackable: true },
  { ...ITEM_BASE, id: "junk", name: "Junk" },
];

const TREE_DEF: ObjectDef = {
  id: "dry_tree",
  name: "Dry Tree",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  resourceNodeId: "dry_tree_node",
  options: [{ label: "Chop", actionId: "woodcut", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const NODE_DEF: ResourceNodeDef = {
  id: "dry_tree_node",
  name: "Dry Tree",
  skill: "woodcutting",
  requiredLevel: 1,
  baseXp: 10,
  actionTicks: 4,
  depletionChance: 0,
  respawnTicks: 10,
  toolTags: ["axe"],
  outputItemId: "dry_log",
  baseChance: 1,
  levelScale: 0,
  outputQuantity: 1,
};

const ROCK_DEF: ObjectDef = {
  id: "copper_rock",
  name: "Copper Rock",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  resourceNodeId: "copper_rock_node",
  options: [{ label: "Mine", actionId: "mine", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const MINE_NODE: ResourceNodeDef = {
  id: "copper_rock_node",
  name: "Copper Rock",
  skill: "mining",
  requiredLevel: 1,
  baseXp: 15,
  actionTicks: 4,
  depletionChance: 0,
  respawnTicks: 12,
  toolTags: ["pickaxe"],
  outputItemId: "copper_ore",
  baseChance: 1,
  levelScale: 0,
  outputQuantity: 1,
};

const RANGE_DEF: ObjectDef = {
  id: "cooking_range",
  name: "Cooking Range",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [
    { label: "Cook", actionId: "cook", priority: 10, requiredDistance: 1 },
    { label: "Use", actionId: "use", priority: 5, requiredDistance: 1 },
  ],
  defaultRotation: 0,
};

const WRONG_STATION_DEF: ObjectDef = {
  id: "cold_table",
  name: "Cold Table",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Cook", actionId: "cook", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const COOK_RECIPE: ProcessingRecipeDef = {
  id: "cook_raw_fish",
  name: "Cook Raw Fish",
  skill: "cooking",
  requiredLevel: 1,
  actionTicks: 3,
  stationObjectIds: ["cooking_range", "quest_oven"],
  inputItemId: "raw_fish",
  inputQuantity: 1,
  successItemId: "cooked_fish",
  successQuantity: 1,
  failureItemId: "burnt_fish",
  failureQuantity: 1,
  xp: 15,
  failureChance: 0,
};

function registries(
  node: ResourceNodeDef = NODE_DEF,
  object: ObjectDef = TREE_DEF,
  recipes: readonly ProcessingRecipeDef[] = [],
): ContentRegistries {
  return makeRegistries({
    item: new Map(ITEMS.map((item) => [item.id, item])),
    object: new Map([
      [TREE_DEF.id, TREE_DEF],
      [ROCK_DEF.id, ROCK_DEF],
      [object.id, object],
    ]),
    processingRecipe: new Map(recipes.map((recipe) => [recipe.id, recipe])),
    resourceNode: new Map([[node.id, node]]),
  });
}

function skills(entityId: EntityId, level: number): SkillsComponent {
  return {
    entityId,
    skills: {
      woodcutting: { level, xp: 0, boost: 0, drain: 0 },
      mining: { level, xp: 0, boost: 0, drain: 0 },
      cooking: { level, xp: 0, boost: 0, drain: 0 },
    },
  };
}

function setup(
  options: {
    readonly tool?: boolean;
    readonly level?: number;
    readonly fullInventory?: boolean;
    readonly depleted?: boolean;
    readonly node?: ResourceNodeDef;
    readonly object?: ObjectDef;
    readonly toolItemId?: string;
  } = {},
): {
  readonly ctx: SkillingContext;
  readonly world: World;
  readonly player: EntityId;
  readonly node: EntityId;
  readonly inventory: InventoryComponent;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
  readonly itemAudit: ItemAuditLog;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  for (const tile of [
    { x: 4, y: 4, plane: 0 as const },
    { x: 4, y: 5, plane: 0 as const },
  ]) {
    map.tiles.set(tileKey(tile), {
      tile,
      height: 0,
      underlayId: "grass",
      collision: 0,
      water: false,
      bridge: false,
    });
  }
  const objectDef = options.object ?? TREE_DEF;
  const nodeDef = options.node ?? NODE_DEF;
  const toolItemId = options.toolItemId ?? "pennywrought_axe";
  const content = registries(nodeDef, objectDef);
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 4, y: 5, plane: 0 });
  world.setComponent(player, "skills", skills(player, options.level ?? 1));
  const inventory = createInventory(player, `inventory:${player}`, 3);
  if (options.fullInventory) {
    addItem(inventory, catalogFromItems(content.item), toolItemId, 1);
    addItem(inventory, catalogFromItems(content.item), "junk", 2);
  } else if (options.tool !== false) {
    addItem(inventory, catalogFromItems(content.item), toolItemId, 1);
  }
  world.setComponent(player, "inventory", inventory);

  const node = world.createEntity();
  world.setComponent(node, "position", { entityId: node, x: 4, y: 4, plane: 0 });
  world.setComponent(node, "object", {
    entityId: node,
    objectId: objectDef.id,
    facing: 0,
    variant: 0,
  });
  world.setComponent(node, "resourceNode", {
    entityId: node,
    nodeId: nodeDef.id,
    active: options.depleted !== true,
    depleted: options.depleted === true,
    respawnTick: options.depleted === true ? 10 : 0,
  });

  const collision = new CollisionMap(map);
  applyObjectCollision(world, content, collision);
  const actionRuntime = new ActionRuntime();
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  return {
    ctx: {
      world,
      collision,
      deltas,
      actionRuntime,
      registries: content,
      rng: createRng(1),
      itemAudit,
    },
    world,
    player,
    node,
    inventory,
    actionRuntime,
    deltas,
    itemAudit,
  };
}

function setupProcessing(
  options: {
    readonly rawQuantity?: number;
    readonly level?: number;
    readonly object?: ObjectDef;
    readonly recipe?: ProcessingRecipeDef;
  } = {},
): {
  readonly ctx: SkillingContext;
  readonly world: World;
  readonly player: EntityId;
  readonly station: EntityId;
  readonly inventory: InventoryComponent;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
  readonly itemAudit: ItemAuditLog;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  for (const tile of [
    { x: 4, y: 4, plane: 0 as const },
    { x: 4, y: 5, plane: 0 as const },
  ]) {
    map.tiles.set(tileKey(tile), {
      tile,
      height: 0,
      underlayId: "grass",
      collision: 0,
      water: false,
      bridge: false,
    });
  }

  const objectDef = options.object ?? RANGE_DEF;
  const recipe = options.recipe ?? COOK_RECIPE;
  const content = registries(NODE_DEF, objectDef, [recipe]);
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 4, y: 5, plane: 0 });
  world.setComponent(player, "skills", skills(player, options.level ?? 1));
  const inventory = createInventory(player, `inventory:${player}`, 3);
  if ((options.rawQuantity ?? 1) > 0) {
    addItem(inventory, catalogFromItems(content.item), "raw_fish", options.rawQuantity ?? 1);
  }
  world.setComponent(player, "inventory", inventory);

  const station = world.createEntity();
  world.setComponent(station, "position", { entityId: station, x: 4, y: 4, plane: 0 });
  world.setComponent(station, "object", {
    entityId: station,
    objectId: objectDef.id,
    facing: 0,
    variant: 0,
  });

  const collision = new CollisionMap(map);
  applyObjectCollision(world, content, collision);
  const actionRuntime = new ActionRuntime();
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  return {
    ctx: {
      world,
      collision,
      deltas,
      actionRuntime,
      registries: content,
      rng: createRng(1),
      itemAudit,
    },
    world,
    player,
    station,
    inventory,
    actionRuntime,
    deltas,
    itemAudit,
  };
}

function advanceToExecution(actionRuntime: ActionRuntime, delayTicks: number): ActionExecution {
  let executions: readonly ActionExecution[] = [];
  for (let tick = 1; tick <= delayTicks; tick += 1) {
    executions = actionRuntime.advanceTick();
  }
  const execution = executions[0];
  if (!execution) {
    throw new Error("expected action execution");
  }
  return execution;
}

describe("skilling gather validation", () => {
  it("rejects a missing tool and emits server feedback", () => {
    const { ctx, player, node, deltas } = setup({ tool: false });

    expect(validateGatherAction(ctx, player, node).reason).toBe("missing_tool");
    expect(
      handleObjectSkillingIntent(ctx, player, { objectEntityId: node, actionId: "woodcut" }, 600),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You need the right tool for Dry Tree.");
  });

  it("rejects low skill level", () => {
    const node = { ...NODE_DEF, requiredLevel: 5 };
    const setupState = setup({ node, level: 1 });

    expect(validateGatherAction(setupState.ctx, setupState.player, setupState.node)).toMatchObject({
      ok: false,
      reason: "low_level",
    });
  });

  it("rejects a full inventory before rewards are possible", () => {
    const { ctx, player, node } = setup({ fullInventory: true });

    expect(validateGatherAction(ctx, player, node)).toMatchObject({
      ok: false,
      reason: "inventory_full",
    });
  });

  it("rejects depleted nodes", () => {
    const { ctx, player, node } = setup({ depleted: true });

    expect(validateGatherAction(ctx, player, node)).toMatchObject({
      ok: false,
      reason: "depleted",
    });
  });

  it("movement cancellation removes queued weak gathering actions", () => {
    const { actionRuntime, player } = setup();
    actionRuntime.enqueue({
      id: `gather:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      repeat: { intervalTicks: 4 },
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "gather" },
    });

    actionRuntime.cancel(player, { type: ActionQueueType.Weak });

    expect(actionRuntime.getDebugState()).toEqual([]);
  });

  it("revalidates repeated actions and cancels after depletion", () => {
    const { ctx, player, node, actionRuntime } = setup({ depleted: true });
    const payload: GatherActionPayload = { kind: "gather", nodeEntityId: node };
    actionRuntime.enqueue({
      id: `gather:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      repeat: { intervalTicks: 4 },
      interruptGroup: InterruptGroup.Skilling,
      payload,
    });
    const [execution] = actionRuntime.advanceTick();
    if (!execution) throw new Error("expected gather execution");

    handleGather(ctx, execution, payload, 1, 600);

    expect(actionRuntime.getDebugState()).toEqual([]);
  });
});

describe("woodcutting loop", () => {
  it("queues from a Chop object option and awards logs plus XP on success", () => {
    const { ctx, player, node, actionRuntime, inventory, deltas, itemAudit } = setup();

    expect(
      handleObjectSkillingIntent(ctx, player, { objectEntityId: node, actionId: "woodcut" }, 600),
    ).toBe(true);
    expect(deltas.peek().entityUpdates[0]?.changes.facingTile).toEqual({
      x: 4,
      y: 4,
      plane: 0,
    });

    let executions: readonly ActionExecution[] = [];
    for (let tick = 1; tick <= NODE_DEF.actionTicks; tick += 1) {
      executions = [...actionRuntime.advanceTick()];
    }
    expect(executions).toHaveLength(1);
    const execution = executions[0];
    if (!execution) throw new Error("expected woodcutting execution");
    const payload: GatherActionPayload = { kind: "gather", nodeEntityId: node };
    handleGather(ctx, execution, payload, NODE_DEF.actionTicks, 2_400);

    expect(inventory.slots.some((slot) => slot?.itemId === "dry_log")).toBe(true);
    expect(ctx.world.getComponent(player, "skills")?.skills.woodcutting?.xp).toBe(10);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "woodcutting", level: 1, xp: 10, effectiveLevel: 1 }]);
    expect(itemAudit.snapshot()[0]).toMatchObject({
      reason: "skilling_gather",
      itemId: "dry_log",
      quantity: 1,
      beforeQuantity: 0,
      afterQuantity: 1,
      metadata: expect.objectContaining({ nodeId: "dry_tree_node" }),
    });
  });

  it("depletes trees, transforms them, and cancels the repeated gather action", () => {
    const nodeDef = { ...NODE_DEF, depletionChance: 1 };
    const { ctx, player, node, actionRuntime } = setup({ node: nodeDef });
    const payload: GatherActionPayload = { kind: "gather", nodeEntityId: node };
    actionRuntime.enqueue({
      id: `gather:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      repeat: { intervalTicks: nodeDef.actionTicks },
      interruptGroup: InterruptGroup.Skilling,
      payload,
    });
    const [execution] = actionRuntime.advanceTick();
    if (!execution) throw new Error("expected gather execution");

    handleGather(ctx, execution, payload, 1, 600);

    expect(ctx.world.getComponent(node, "resourceNode")).toMatchObject({
      active: false,
      depleted: true,
    });
    expect(ctx.deltas.peek().entityUpdates.map((update) => update.changes.transform)).toContain(
      "dry_tree_depleted",
    );
    expect(actionRuntime.getDebugState().some((entry) => entry.id === `gather:${player}`)).toBe(
      false,
    );
  });
});

describe("mining loop", () => {
  it("uses the same gather engine with pickaxe, mining XP, and ore output", () => {
    const { ctx, player, node, actionRuntime, inventory, deltas } = setup({
      object: ROCK_DEF,
      node: MINE_NODE,
      toolItemId: "pennywrought_pickaxe",
    });

    handleObjectSkillingIntent(ctx, player, { objectEntityId: node, actionId: "mine" }, 600);

    let executions: readonly ActionExecution[] = [];
    for (let tick = 1; tick <= MINE_NODE.actionTicks; tick += 1) {
      executions = [...actionRuntime.advanceTick()];
    }
    const execution = executions[0];
    if (!execution) throw new Error("expected mining execution");
    const payload: GatherActionPayload = { kind: "gather", nodeEntityId: node };
    handleGather(ctx, execution, payload, MINE_NODE.actionTicks, 2_400);

    expect(inventory.slots.some((slot) => slot?.itemId === "copper_ore")).toBe(true);
    expect(ctx.world.getComponent(player, "skills")?.skills.mining?.xp).toBe(15);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "mining", level: 1, xp: 15, effectiveLevel: 1 }]);
  });
});

describe("cooking processing loop", () => {
  it("routes object Use/Cook through the tick queue and repeats until input is missing", () => {
    const { ctx, player, station, actionRuntime, inventory, deltas, itemAudit } = setupProcessing({
      rawQuantity: 2,
    });

    expect(
      handleObjectSkillingIntent(ctx, player, { objectEntityId: station, actionId: "use" }, 600),
    ).toBe(true);
    expect(deltas.peek().recipeLists?.[0]?.recipes.length).toBe(1);

    expect(handleRecipeSelect(ctx, player, station, COOK_RECIPE.id, 600, 1)).toBe(true);

    {
      const execution = advanceToExecution(actionRuntime, COOK_RECIPE.actionTicks);
      const payload: ProcessActionPayload = {
        kind: "process",
        stationEntityId: station,
        recipeId: COOK_RECIPE.id,
      };
      handleProcess(ctx, execution, payload, 3, 1_800);
    }

    expect(count(inventory, "raw_fish")).toBe(1);
    expect(count(inventory, "cooked_fish")).toBe(1);
    expect(ctx.world.getComponent(player, "skills")?.skills.cooking?.xp).toBe(15);
    expect(deltas.peek().inventoryDeltas?.[0]?.changes).toEqual([
      { slot: 0, itemId: "raw_fish", quantity: 1, uid: 1 },
      { slot: 1, itemId: "cooked_fish", quantity: 1, uid: 2 },
    ]);
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "skilling_process_input",
      "skilling_process_output",
    ]);
    expect(deltas.peek().recipeResults?.[0]).toMatchObject({
      recipeId: COOK_RECIPE.id,
      success: true,
      productItemId: "cooked_fish",
      productQuantity: 1,
      xpReward: 15,
    });

    {
      const execution = advanceToExecution(actionRuntime, COOK_RECIPE.actionTicks);
      const payload: ProcessActionPayload = {
        kind: "process",
        stationEntityId: station,
        recipeId: COOK_RECIPE.id,
      };
      handleProcess(ctx, execution, payload, 6, 3_600);
    }
    expect(count(inventory, "raw_fish")).toBe(0);
    expect(count(inventory, "cooked_fish")).toBe(2);

    {
      const execution = advanceToExecution(actionRuntime, COOK_RECIPE.actionTicks);
      const payload: ProcessActionPayload = {
        kind: "process",
        stationEntityId: station,
        recipeId: COOK_RECIPE.id,
      };
      handleProcess(ctx, execution, payload, 9, 5_400);
    }

    expect(actionRuntime.getDebugState()).toEqual([]);
    expect(deltas.peek().chat?.at(-1)?.text).toBe("You have nothing suitable to cook.");
  });

  it("can burn food without awarding cooking XP", () => {
    const { ctx, player, station, actionRuntime, inventory, deltas } = setupProcessing({
      recipe: { ...COOK_RECIPE, failureChance: 1 },
    });

    handleObjectSkillingIntent(ctx, player, { objectEntityId: station, actionId: "cook" }, 600);
    expect(deltas.peek().recipeLists?.[0]?.recipes.length).toBe(1);

    handleRecipeSelect(ctx, player, station, COOK_RECIPE.id, 600, 1);
    {
      const execution = advanceToExecution(actionRuntime, COOK_RECIPE.actionTicks);
      const payload: ProcessActionPayload = {
        kind: "process",
        stationEntityId: station,
        recipeId: COOK_RECIPE.id,
      };
      handleProcess(ctx, execution, payload, 3, 1_800);
    }

    expect(count(inventory, "raw_fish")).toBe(0);
    expect(count(inventory, "burnt_fish")).toBe(1);
    expect(ctx.world.getComponent(player, "skills")?.skills.cooking?.xp).toBe(0);
    expect(deltas.peek().recipeResults?.[0]).toMatchObject({
      recipeId: COOK_RECIPE.id,
      success: false,
      productItemId: "burnt_fish",
      productQuantity: 1,
    });
  });

  it("rejects cooking when the player has no matching raw input", () => {
    const { ctx, player, station, actionRuntime, inventory, deltas } = setupProcessing({
      rawQuantity: 0,
    });

    expect(
      handleObjectSkillingIntent(ctx, player, { objectEntityId: station, actionId: "cook" }, 600),
    ).toBe(true);

    expect(count(inventory, "cooked_fish")).toBe(0);
    expect(actionRuntime.getDebugState()).toEqual([]);
    expect(deltas.peek().recipeLists).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("rejects cooking at the wrong station without consuming input", () => {
    const { ctx, player, station, actionRuntime, inventory, deltas } = setupProcessing({
      object: WRONG_STATION_DEF,
    });

    expect(
      handleObjectSkillingIntent(ctx, player, { objectEntityId: station, actionId: "cook" }, 600),
    ).toBe(true);

    expect(count(inventory, "raw_fish")).toBe(1);
    expect(actionRuntime.getDebugState()).toEqual([]);
    expect(deltas.peek().recipeLists).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("You need a different cooking station.");
  });
});
