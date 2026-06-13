import { tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { type ActionExecution, ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleObjectIntent } from "./object-interaction-router";
import { handleProcess, handleRecipeSelect, type ProcessActionPayload } from "./skilling-system";

function advanceToExecution(
  actionQueue: import("../sim/action-queue").ActionQueue,
  delayTicks: number,
): ActionExecution {
  let executions: readonly ActionExecution[] = [];
  for (let tick = 1; tick <= delayTicks; tick += 1) {
    executions = actionQueue.advanceTick();
  }
  const execution = executions[0];
  if (!execution) {
    throw new Error("expected action execution");
  }
  return execution;
}

const TANNING_FRAME_DEF = {
  id: "patch_tanning_frame",
  name: "Patch Tanning Frame",
  examine: "A wooden frame for stretching and curing hides.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Tan", actionId: "tan", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const DYE_VAT_DEF = {
  id: "patch_dye_vat",
  name: "Patch Dye Vat",
  examine: "A vat of dye for colouring leather and cloth.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Dye", actionId: "dye", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const LOOM_DEF = {
  id: "chalkhouse_bead_loom",
  name: "Chalkhouse Bead Loom",
  examine: "A loom for weaving beads into strands and pouches.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Weave", actionId: "weave", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const MIXING_BENCH_DEF = {
  id: "chalkhouse_mixing_bench",
  name: "Chalkhouse Mixing Bench",
  examine: "A bench for mixing herbs and brewing remedies.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Mix", actionId: "mix", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const TRAP_BASE_DEF = {
  id: "trap_base",
  name: "Trap Base",
  examine: "A base for setting traps.",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const RABBIT_HIDE_DEF = {
  id: "rabbit_hide",
  name: "Rabbit Hide",
  stackable: true,
  tradeable: true,
  examine: "A soft hide from a river rabbit.",
  icon: "icon_rabbit_hide",
  value: 6,
  weight: 0.8,
  options: [],
  tags: ["hide"],
};

const LEATHER_DEF = {
  id: "plain_leather",
  name: "Plain Leather",
  stackable: true,
  tradeable: true,
  examine: "A piece of tanned leather.",
  icon: "icon_plain_leather",
  value: 10,
  weight: 0.5,
  options: [],
  tags: ["leather"],
};

const CLOTH_DEF = {
  id: "plain_cloth",
  name: "Plain Cloth",
  stackable: true,
  tradeable: true,
  examine: "A simple woven cloth.",
  icon: "icon_plain_cloth",
  value: 8,
  weight: 0.3,
  options: [],
  tags: ["cloth"],
};

const DYE_DEF = {
  id: "simple_dye",
  name: "Simple Dye",
  stackable: true,
  tradeable: true,
  examine: "A basic dye for colouring cloth.",
  icon: "icon_simple_dye",
  value: 5,
  weight: 0.2,
  options: [],
  tags: ["dye"],
};

const COLOURED_CLOTH_DEF = {
  id: "coloured_cloth",
  name: "Coloured Cloth",
  stackable: true,
  tradeable: true,
  examine: "A brightly coloured cloth.",
  icon: "icon_coloured_cloth",
  value: 12,
  weight: 0.3,
  options: [],
  tags: ["cloth", "dyed"],
};

const BEAD_CLAY_DEF = {
  id: "bead_clay",
  name: "Bead Clay",
  stackable: true,
  tradeable: true,
  examine: "A small lump of clay suited to bead-making.",
  icon: "icon_bead_clay",
  value: 3,
  weight: 0.2,
  options: [],
  tags: ["clay", "bead_material"],
};

const BEAD_STRAND_DEF = {
  id: "bead_strand",
  name: "Bead Strand",
  stackable: true,
  tradeable: true,
  examine: "A simple strand of woven beads.",
  icon: "icon_bead_strand",
  value: 15,
  weight: 0.1,
  options: [],
  tags: ["bead", "woven"],
};

const HERB_DEF = {
  id: "simple_herb",
  name: "Simple Herb",
  stackable: true,
  tradeable: true,
  examine: "A common herb with mild properties.",
  icon: "icon_simple_herb",
  value: 4,
  weight: 0.1,
  options: [],
  tags: ["herb", "reagent"],
};

const REMEDY_DEF = {
  id: "simple_remedy",
  name: "Simple Remedy",
  stackable: true,
  tradeable: true,
  examine: "A basic remedy brewed from herbs.",
  icon: "icon_simple_remedy",
  value: 18,
  weight: 0.3,
  options: ["drink"],
  tags: ["remedy", "consumable"],
};

const HEARTHCRAFT_SKILL_DEF = {
  id: "hearthcraft",
  name: "Hearthcraft",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: false,
  unlocks: [],
};

const SLEIGHT_SKILL_DEF = {
  id: "sleight",
  name: "Sleight",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: false,
  unlocks: [],
};

function addPlayer(world: World, x = 1, y = 1): import("@old-town/shared").EntityId {
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
    skills: {
      hearthcraft: { level: 1, xp: 0, boost: 0, drain: 0 },
      sleight: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  return entityId;
}

function addObject(
  world: World,
  objectId: string,
  x = 2,
  y = 1,
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

const TAN_RECIPE = {
  id: "tan_hide",
  name: "Tan Hide",
  skill: "hearthcraft",
  requiredLevel: 1,
  actionTicks: 3,
  stationObjectIds: ["patch_tanning_frame"],
  inputItemId: "rabbit_hide",
  inputQuantity: 1,
  successItemId: "plain_leather",
  successQuantity: 1,
  failureQuantity: 1,
  xp: 20,
  failureChance: 0,
};

const DYE_RECIPE = {
  id: "dye_cloth",
  name: "Dye Cloth",
  skill: "sleight",
  requiredLevel: 1,
  actionTicks: 3,
  stationObjectIds: ["patch_dye_vat"],
  inputItemId: "plain_cloth",
  inputQuantity: 1,
  successItemId: "coloured_cloth",
  successQuantity: 1,
  failureQuantity: 1,
  xp: 25,
  failureChance: 0,
};

const WEAVE_RECIPE = {
  id: "weave_beads",
  name: "Weave Beads",
  skill: "sleight",
  requiredLevel: 1,
  actionTicks: 3,
  stationObjectIds: ["chalkhouse_bead_loom"],
  inputItemId: "bead_clay",
  inputQuantity: 2,
  successItemId: "bead_strand",
  successQuantity: 1,
  failureQuantity: 1,
  xp: 22,
  failureChance: 0,
};

const MIX_RECIPE = {
  id: "mix_remedy",
  name: "Mix Remedy",
  skill: "hearthcraft",
  requiredLevel: 1,
  actionTicks: 3,
  stationObjectIds: ["chalkhouse_mixing_bench"],
  inputItemId: "simple_herb",
  inputQuantity: 2,
  successItemId: "simple_remedy",
  successQuantity: 1,
  failureQuantity: 1,
  xp: 30,
  failureChance: 0,
};

function setup() {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const registries = makeRegistries({
    object: new Map([
      [TANNING_FRAME_DEF.id, TANNING_FRAME_DEF],
      [DYE_VAT_DEF.id, DYE_VAT_DEF],
      [LOOM_DEF.id, LOOM_DEF],
      [MIXING_BENCH_DEF.id, MIXING_BENCH_DEF],
      [TRAP_BASE_DEF.id, TRAP_BASE_DEF],
    ]),
    item: new Map([
      [RABBIT_HIDE_DEF.id, RABBIT_HIDE_DEF],
      [LEATHER_DEF.id, LEATHER_DEF],
      [CLOTH_DEF.id, CLOTH_DEF],
      [DYE_DEF.id, DYE_DEF],
      [COLOURED_CLOTH_DEF.id, COLOURED_CLOTH_DEF],
      [BEAD_CLAY_DEF.id, BEAD_CLAY_DEF],
      [BEAD_STRAND_DEF.id, BEAD_STRAND_DEF],
      [HERB_DEF.id, HERB_DEF],
      [REMEDY_DEF.id, REMEDY_DEF],
    ]),
    skill: new Map([
      [HEARTHCRAFT_SKILL_DEF.id, HEARTHCRAFT_SKILL_DEF],
      [SLEIGHT_SKILL_DEF.id, SLEIGHT_SKILL_DEF],
    ]),
    processingRecipe: new Map([
      [TAN_RECIPE.id, TAN_RECIPE],
      [DYE_RECIPE.id, DYE_RECIPE],
      [WEAVE_RECIPE.id, WEAVE_RECIPE],
      [MIX_RECIPE.id, MIX_RECIPE],
    ]),
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

describe("trapping action runtime", () => {
  it("tan converts hide to leather at tanning frame", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const player = addPlayer(world, 1, 1);
    const frame = addObject(world, "patch_tanning_frame", 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "rabbit_hide", 2);

    const result = handleObjectIntent(ctx, player, { actionId: "tan", objectEntityId: frame }, 0);
    expect(result).toBe(true);

    expect(handleRecipeSelect(ctx, player, frame, TAN_RECIPE.id, 0)).toBe(true);
    const execution = advanceToExecution(actionQueue, TAN_RECIPE.actionTicks);
    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: frame,
      recipeId: TAN_RECIPE.id,
    };
    handleProcess(ctx, execution, payload, TAN_RECIPE.actionTicks, 0);

    const leatherCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "plain_leather") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(leatherCount).toBe(1);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.some((d) => d.skillId === "hearthcraft")).toBe(true);
  });

  it("tan fails without hide", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const frame = addObject(world, "patch_tanning_frame", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "tan", objectEntityId: frame }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("dye applies dye to cloth at dye vat", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const player = addPlayer(world, 1, 1);
    const vat = addObject(world, "patch_dye_vat", 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "plain_cloth", 1);
    addItem(inventory, catalogFromItems(ctx.registries.item), "simple_dye", 1);

    const result = handleObjectIntent(ctx, player, { actionId: "dye", objectEntityId: vat }, 0);
    expect(result).toBe(true);

    expect(handleRecipeSelect(ctx, player, vat, DYE_RECIPE.id, 0)).toBe(true);
    const execution = advanceToExecution(actionQueue, DYE_RECIPE.actionTicks);
    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: vat,
      recipeId: DYE_RECIPE.id,
    };
    handleProcess(ctx, execution, payload, DYE_RECIPE.actionTicks, 0);

    const clothCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "coloured_cloth") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(clothCount).toBe(1);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.some((d) => d.skillId === "sleight")).toBe(true);
  });

  it("dye fails without cloth and dye", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const vat = addObject(world, "patch_dye_vat", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "dye", objectEntityId: vat }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });

  it("fire sets a trap at trap base", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const base = addObject(world, "trap_base", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "fire", objectEntityId: base }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You set a fire trap.");
  });

  it("weave creates bead strand at loom", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const player = addPlayer(world, 1, 1);
    const loom = addObject(world, "chalkhouse_bead_loom", 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "bead_clay", 3);

    const result = handleObjectIntent(ctx, player, { actionId: "weave", objectEntityId: loom }, 0);
    expect(result).toBe(true);

    expect(handleRecipeSelect(ctx, player, loom, WEAVE_RECIPE.id, 0)).toBe(true);
    const execution = advanceToExecution(actionQueue, WEAVE_RECIPE.actionTicks);
    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: loom,
      recipeId: WEAVE_RECIPE.id,
    };
    handleProcess(ctx, execution, payload, WEAVE_RECIPE.actionTicks, 0);

    const strandCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "bead_strand") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(strandCount).toBe(1);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.some((d) => d.skillId === "sleight")).toBe(true);
  });

  it("mix creates remedy at mixing bench", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const player = addPlayer(world, 1, 1);
    const bench = addObject(world, "chalkhouse_mixing_bench", 2, 1);
    const inventory = world.getComponent(player, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    addItem(inventory, catalogFromItems(ctx.registries.item), "simple_herb", 2);

    const result = handleObjectIntent(ctx, player, { actionId: "mix", objectEntityId: bench }, 0);
    expect(result).toBe(true);

    expect(handleRecipeSelect(ctx, player, bench, MIX_RECIPE.id, 0)).toBe(true);
    const execution = advanceToExecution(actionQueue, MIX_RECIPE.actionTicks);
    const payload: ProcessActionPayload = {
      kind: "process",
      stationEntityId: bench,
      recipeId: MIX_RECIPE.id,
    };
    handleProcess(ctx, execution, payload, MIX_RECIPE.actionTicks, 0);

    const remedyCount = inventory.slots.reduce((sum, slot) => {
      if (slot?.itemId === "simple_remedy") {
        return sum + slot.quantity;
      }
      return sum;
    }, 0);
    expect(remedyCount).toBe(1);

    const xpDrops = deltas.peek().xpDrops;
    expect(xpDrops?.some((d) => d.skillId === "hearthcraft")).toBe(true);
  });

  it("mix fails without herbs", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const bench = addObject(world, "chalkhouse_mixing_bench", 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "mix", objectEntityId: bench }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have nothing suitable to cook.");
  });
});
