import {
  entityId,
  type ContractDef,
  type ItemDef,
  type ObjectDef,
  type SkillDef,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../../items/inventory";
import { ItemAuditLog } from "../../items/item-audit";
import { ActionRuntime } from "../../sim/action-runtime";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import { CollisionMap } from "../../world/collision";
import { createRuntimeMap } from "../../world/runtime-map";
import {
  applyContractRewards,
  checkContractCompletion,
  handleContractAcceptIntent,
  updateContractObjective,
} from "../contract-system";

const PLAYER = entityId(0);
const CONTRACT_BOARD = entityId(1);

const COIN: ItemDef = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "A small coin.",
  icon: "icon_coin",
  value: 1,
  options: [],
  tags: [],
};

const DRY_LOGS: ItemDef = {
  id: "dry_logs",
  name: "Dry logs",
  stackable: true,
  tradeable: true,
  examine: "Dry enough for a clean burn.",
  icon: "icon_dry_logs",
  value: 2,
  options: [],
  tags: [],
};

const REWARD_BADGE: ItemDef = {
  id: "reward_badge",
  name: "Reward badge",
  stackable: false,
  tradeable: false,
  examine: "A quest reward badge.",
  icon: "icon_reward_badge",
  value: 0,
  options: [],
  tags: [],
};

const ATTACK_SKILL: SkillDef = {
  id: "attack",
  name: "Attack",
  maxLevel: 99,
  xpTableId: "oldtown_default",
  combat: true,
  unlocks: [],
};

const WARDEN_BOARD: ObjectDef = {
  id: "warden_board",
  name: "Warden Board",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  defaultRotation: 0,
  examine: "A board for warden contracts.",
  options: [],
};

const CONTRACT_DEF: ContractDef = {
  id: "slay_goblins",
  name: "Slay Goblins",
  description: "The Warden needs goblin numbers reduced.",
  contractType: "bounty",
  targetCreatureIds: ["mud_goblin"],
  targetCount: 10,
  rewardItems: [{ itemId: "coin", quantity: 100 }],
  rewardXp: [{ skillId: "attack", amount: 50 }],
  rewardReputation: { factionId: "wardenry", amount: 10 },
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill",
};

const NO_ITEM_CONTRACT: ContractDef = {
  id: "clear_wolves",
  name: "Clear Wolf Pack",
  description: "Wolves are threatening the eastern road.",
  contractType: "extermination",
  targetCreatureIds: ["stray_dog"],
  targetCount: 5,
  rewardItems: [],
  rewardXp: [{ skillId: "attack", amount: 100 }],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill",
};

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  const board = world.createEntity();
  expect(board).toBe(CONTRACT_BOARD);

  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { attack: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "vars", { entityId: PLAYER, values: {} });
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 0, y: 0, plane: 0 });
  world.setComponent(CONTRACT_BOARD, "object", {
    entityId: CONTRACT_BOARD,
    objectId: "warden_board",
    facing: 0,
    variant: 0,
  });
  world.setComponent(CONTRACT_BOARD, "contract", {
    entityId: CONTRACT_BOARD,
    contractId: CONTRACT_DEF.id,
    status: "available",
    objectives: [{ kind: "kill", targetId: "mud_goblin", required: 10, current: 0 }],
    startTick: 0,
    expiryTick: 0,
  });
  world.setComponent(CONTRACT_BOARD, "position", {
    entityId: CONTRACT_BOARD,
    x: 0,
    y: 0,
    plane: 0,
  });

  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    item: new Map([
      [COIN.id, COIN],
      [DRY_LOGS.id, DRY_LOGS],
      [REWARD_BADGE.id, REWARD_BADGE],
    ]),
    object: new Map([[WARDEN_BOARD.id, WARDEN_BOARD]]),
    skill: new Map([[ATTACK_SKILL.id, ATTACK_SKILL]]),
    contract: new Map([[CONTRACT_DEF.id, CONTRACT_DEF]]),
  });

  const itemAudit = new ItemAuditLog();
  const collision = new CollisionMap(createRuntimeMap());
  const actionRuntime = new ActionRuntime();
  const ctx = { world, registries, deltas, itemAudit, collision, actionRuntime };
  return { world, deltas, ctx, registries, itemAudit };
}

describe("contract reward distribution", () => {
  it("applies XP rewards on contract completion", () => {
    const { world, ctx } = setup();

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
  });

  it("applies item rewards on contract completion", () => {
    const { world, ctx } = setup();

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    const coinSlot = inventory?.slots.find((slot) => slot?.itemId === "coin");
    expect(coinSlot?.quantity).toBe(100);
  });

  it("updates reputation and standing on contract completion", () => {
    const { world, ctx } = setup();

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    expect(world.getComponent(PLAYER, "vars")?.values["reputation.wardenry"]).toBe(10);
  });

  it("sends contract completion packet to client", () => {
    const { ctx, deltas } = setup();

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    const state = deltas.peek();
    expect(state.contractComplete).toBeDefined();
    expect(state.contractComplete?.length).toBe(1);
    expect(state.contractComplete?.[0]).toMatchObject({
      entityId: PLAYER,
      contractId: "slay_goblins",
      name: "Slay Goblins",
    });
  });

  it("does not apply rewards if inventory is full", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    // Fill inventory completely with unstackable items
    for (let i = 0; i < 28; i += 1) {
      addItem(inventory, catalogFromItems(registries.item), "reward_badge", 1);
    }

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);

    // checkContractCompletion applies rewards internally, so we should verify no rewards
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    // Verify no XP was applied
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(0);
    // Verify no reputation was updated
    expect(world.getComponent(PLAYER, "vars")?.values["reputation.wardenry"]).toBeUndefined();
  });

  it("is idempotent — does not reward twice", () => {
    const { world, ctx } = setup();

    handleContractAcceptIntent(ctx, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctx, PLAYER, CONTRACT_BOARD, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, PLAYER, CONTRACT_BOARD, 600, 1);

    // Verify rewards were applied once
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
    expect(world.getComponent(PLAYER, "vars")?.values["reputation.wardenry"]).toBe(10);

    // Second reward application should be idempotent
    const result = applyContractRewards(ctx, PLAYER, CONTRACT_BOARD, 600, 2);
    expect(result).toBe(false);

    // Verify XP and reputation were only applied once
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(50);
    expect(world.getComponent(PLAYER, "vars")?.values["reputation.wardenry"]).toBe(10);
  });

  it("rewards contracts without item rewards when inventory is full", () => {
    const { world, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;

    // Fill inventory with unstackable items
    for (let i = 0; i < 28; i += 1) {
      addItem(inventory, catalogFromItems(registries.item), "reward_badge", 1);
    }

    // Set up a no-item contract
    world.setComponent(CONTRACT_BOARD, "contract", {
      entityId: CONTRACT_BOARD,
      contractId: NO_ITEM_CONTRACT.id,
      status: "available",
      objectives: [{ kind: "kill", targetId: "stray_dog", required: 5, current: 0 }],
      startTick: 0,
      expiryTick: 0,
    });

    const ctxWithNoItemContract = {
      ...ctx,
      registries: makeRegistries({
        item: new Map([
          [COIN.id, COIN],
          [DRY_LOGS.id, DRY_LOGS],
          [REWARD_BADGE.id, REWARD_BADGE],
        ]),
        object: new Map([[WARDEN_BOARD.id, WARDEN_BOARD]]),
        skill: new Map([[ATTACK_SKILL.id, ATTACK_SKILL]]),
        contract: new Map([[NO_ITEM_CONTRACT.id, NO_ITEM_CONTRACT]]),
      }),
    };
    // Add collision and actionRuntime to satisfy ContractSystemContext type
    Object.assign(ctxWithNoItemContract, { collision: ctx.collision, actionRuntime: ctx.actionRuntime });

    handleContractAcceptIntent(ctxWithNoItemContract, PLAYER, { objectEntityId: CONTRACT_BOARD, actionId: "accept" }, 600, 1);
    updateContractObjective(ctxWithNoItemContract, PLAYER, CONTRACT_BOARD, "kill", "stray_dog", 5);
    checkContractCompletion(ctxWithNoItemContract, PLAYER, CONTRACT_BOARD, 600, 1);

    // XP should be applied even with full inventory
    expect(world.getComponent(PLAYER, "skills")?.skills.attack?.xp).toBe(100);
  });
});
