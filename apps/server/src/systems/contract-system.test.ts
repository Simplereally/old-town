import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleObjectIntent } from "./object-interaction-router";
import { tileKey } from "@old-town/shared";

const WARDEN_BOARD_DEF = {
  id: "warden_board",
  name: "Warden Board",
  examine: "A board listing contracts from the Wardenry.",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [{ label: "Accept", actionId: "accept", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const CONTRACT_DEF = {
  id: "slay_goblins",
  name: "Slay Goblins",
  description: "The Warden needs goblin numbers reduced.",
  contractType: "bounty" as const,
  targetCreatureIds: ["mud_goblin"],
  targetCount: 10,
  rewardItems: [{ itemId: "coin", quantity: 100 }],
  rewardXp: [{ skillId: "attack", amount: 50 }],
  rewardReputation: { factionId: "wardenry", amount: 10 },
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill" as const,
};

const HIGH_LEVEL_CONTRACT_DEF = {
  id: "hunt_bears",
  name: "Hunt Bears",
  description: "A large bear has been spotted near the river.",
  contractType: "bounty" as const,
  targetCreatureIds: ["ash_drake_whelp"],
  targetCount: 3,
  rewardItems: [{ itemId: "coin", quantity: 500 }],
  rewardXp: [{ skillId: "attack", amount: 200 }],
  requiredLevel: 20,
  maxConcurrent: 1,
  completionTrigger: "kill" as const,
};

const COIN_DEF = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "A small copper coin.",
  icon: "icon_coin",
  value: 1,
  weight: 0.01,
  options: [],
  tags: ["currency"],
};

const ATTACK_SKILL_DEF = {
  id: "attack",
  name: "Attack",
  maxLevel: 99,
  xpTableId: "oldtown_default" as const,
  combat: true,
  unlocks: [],
};

const WARDENRY_SKILL_DEF = {
  id: "wardenry",
  name: "Wardenry",
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
      attack: { level: 1, xp: 0, boost: 0, drain: 0 },
      wardenry: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function addWardenBoard(world: World, x = 2, y = 1): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId: "warden_board",
    facing: 0,
    variant: 0,
  });
  world.setComponent(entityId, "contract", {
    entityId,
    contractId: "slay_goblins",
    status: "available",
    objectives: [{ kind: "kill", targetId: "mud_goblin", required: 10, current: 0 }],
    startTick: 0,
    expiryTick: 0,
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
  const actionRuntime = new ActionRuntime();
  const registries = makeRegistries({
    object: new Map([[WARDEN_BOARD_DEF.id, WARDEN_BOARD_DEF]]),
    item: new Map([[COIN_DEF.id, COIN_DEF]]),
    contract: new Map([
      [CONTRACT_DEF.id, CONTRACT_DEF],
      [HIGH_LEVEL_CONTRACT_DEF.id, HIGH_LEVEL_CONTRACT_DEF],
    ]),
    skill: new Map([
      [ATTACK_SKILL_DEF.id, ATTACK_SKILL_DEF],
      [WARDENRY_SKILL_DEF.id, WARDENRY_SKILL_DEF],
    ]),
  });
  const ctx = {
    world,
    collision,
    deltas,
    actionRuntime,
    registries,
    rng: { nextFloat: () => 0, nextInt: () => 0, chanceOneIn: () => false },
    itemAudit: undefined,
  };
  return { ctx, world, deltas };
}

describe("contract runtime state machine", () => {
  it("accepts contract from warden board", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    const result = handleObjectIntent(ctx, player, { actionId: "accept", objectEntityId: board }, 0);
    expect(result).toBe(true);

    const vars = world.getComponent(player, "vars");
    expect(vars?.values.active_contract).toBeDefined();
  });

  it("acceptance validates level requirement", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = world.createEntity();
    world.setComponent(board, "position", { entityId: board, x: 2, y: 1, plane: 0 });
    world.setComponent(board, "object", {
      entityId: board,
      objectId: "warden_board",
      facing: 0,
      variant: 0,
    });
    world.setComponent(board, "contract", {
      entityId: board,
      contractId: "hunt_bears",
      status: "available",
      objectives: [{ kind: "kill", targetId: "ash_drake_whelp", required: 3, current: 0 }],
      startTick: 0,
      expiryTick: 0,
    });

    const result = handleObjectIntent(ctx, player, { actionId: "accept", objectEntityId: board }, 0);
    expect(result).toBe(true);

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You need level 20 Attack to accept this contract.");
  });

  it("contract state transitions from available to accepted", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    const beforeContract = world.getComponent(board, "contract");
    expect(beforeContract?.status).toBe("available");

    const result = handleObjectIntent(ctx, player, { actionId: "accept", objectEntityId: board }, 0);
    expect(result).toBe(true);

    const afterContract = world.getComponent(board, "contract");
    expect(afterContract?.status).toBe("accepted");
  });

  it("contract expiry marks contract as expired", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    const contract = world.getComponent(board, "contract");
    expect(contract).toBeDefined();
    if (!contract) return;

    contract.status = "accepted";
    contract.startTick = 0;
    contract.expiryTick = 5;
    world.setComponent(board, "contract", contract);

    const result = handleObjectIntent(ctx, player, { actionId: "accept", objectEntityId: board }, 0, 10);
    expect(result).toBe(true);

    const afterContract = world.getComponent(board, "contract");
    expect(afterContract?.status).toBe("expired");
  });
});
