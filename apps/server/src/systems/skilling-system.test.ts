import {
  type ContentRegistries,
  type EntityId,
  type ItemDef,
  type ObjectDef,
  type ResourceNodeDef,
  createRng,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { InventoryComponent, SkillsComponent } from "../ecs/components";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ActionQueueType, type ActionExecution, InterruptGroup } from "../sim/action-queue";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionMap, applyObjectCollision } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  handleObjectSkillingIntent,
  handleSkillingAction,
  validateGatherAction,
  type SkillingContext,
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

function registries(node: ResourceNodeDef = NODE_DEF, object: ObjectDef = TREE_DEF): ContentRegistries {
  return {
    item: new Map(ITEMS.map((item) => [item.id, item])),
    npc: new Map(),
    object: new Map([
      [TREE_DEF.id, TREE_DEF],
      [ROCK_DEF.id, ROCK_DEF],
      [object.id, object],
    ]),
    processingRecipe: new Map(),
    skill: new Map(),
    resourceNode: new Map([[node.id, node]]),
    spell: new Map(),
    dropTable: new Map(),
    quest: new Map(),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
  };
}

function skills(entityId: EntityId, level: number): SkillsComponent {
  return {
    entityId,
    skills: {
      woodcutting: { level, xp: 0, boost: 0, drain: 0 },
      mining: { level, xp: 0, boost: 0, drain: 0 },
    },
  };
}

function setup(options: {
  readonly tool?: boolean;
  readonly level?: number;
  readonly fullInventory?: boolean;
  readonly depleted?: boolean;
  readonly node?: ResourceNodeDef;
  readonly object?: ObjectDef;
  readonly toolItemId?: string;
} = {}): {
  readonly ctx: SkillingContext;
  readonly world: World;
  readonly player: EntityId;
  readonly node: EntityId;
  readonly inventory: InventoryComponent;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
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
  world.setComponent(node, "object", { entityId: node, objectId: objectDef.id, facing: 0, variant: 0 });
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
  return {
    ctx: {
      world,
      collision,
      deltas,
      actionRuntime,
      registries: content,
      rng: createRng(1),
    },
    world,
    player,
    node,
    inventory,
    actionRuntime,
    deltas,
  };
}

describe("skilling gather validation", () => {
  it("rejects a missing tool and emits server feedback", () => {
    const { ctx, player, node, deltas } = setup({ tool: false });

    expect(validateGatherAction(ctx, player, node).reason).toBe("missing_tool");
    expect(
      handleObjectSkillingIntent(
        ctx,
        player,
        { objectEntityId: node, actionId: "woodcut" },
        600,
      ),
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
    actionRuntime.enqueue({
      id: `gather:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      repeat: { intervalTicks: 4 },
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "gather", nodeEntityId: node },
    });
    const [execution] = actionRuntime.advanceTick();
    if (!execution) throw new Error("expected gather execution");

    expect(handleSkillingAction(ctx, execution, 1, 600)).toBe(true);

    expect(actionRuntime.getDebugState()).toEqual([]);
  });
});

describe("woodcutting loop", () => {
  it("queues from a Chop object option and awards logs plus XP on success", () => {
    const { ctx, player, node, actionRuntime, inventory, deltas } = setup();

    expect(
      handleObjectSkillingIntent(
        ctx,
        player,
        { objectEntityId: node, actionId: "woodcut" },
        600,
      ),
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
    expect(handleSkillingAction(ctx, execution, NODE_DEF.actionTicks, 2_400)).toBe(true);

    expect(inventory.slots.some((slot) => slot?.itemId === "dry_log")).toBe(true);
    expect(ctx.world.getComponent(player, "skills")?.skills.woodcutting?.xp).toBe(10);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "woodcutting", level: 1, xp: 10 }]);
  });

  it("depletes trees, transforms them, and cancels the repeated gather action", () => {
    const nodeDef = { ...NODE_DEF, depletionChance: 1 };
    const { ctx, player, node, actionRuntime } = setup({ node: nodeDef });
    actionRuntime.enqueue({
      id: `gather:${player}`,
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      repeat: { intervalTicks: nodeDef.actionTicks },
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "gather", nodeEntityId: node },
    });
    const [execution] = actionRuntime.advanceTick();
    if (!execution) throw new Error("expected gather execution");

    handleSkillingAction(ctx, execution, 1, 600);

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
    handleSkillingAction(ctx, execution, MINE_NODE.actionTicks, 2_400);

    expect(inventory.slots.some((slot) => slot?.itemId === "copper_ore")).toBe(true);
    expect(ctx.world.getComponent(player, "skills")?.skills.mining?.xp).toBe(15);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "mining", level: 1, xp: 15 }]);
  });
});
