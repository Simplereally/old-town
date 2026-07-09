import { type ContractDef, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  buildContractBoard,
  handleContractAcceptIntent,
  handleContractBoardOpen,
  processContractLifecycle,
  trackContractItemGain,
  updateContractObjective,
} from "./contract-system";
import { handleObjectIntent } from "./object-interaction-router";

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

const COLLECT_CONTRACT_DEF = {
  id: "collect_herbs",
  name: "Collect Herbs",
  description: "Gather simple herbs for the Wardenry.",
  contractType: "collection" as const,
  targetCreatureIds: [],
  targetCount: 20,
  rewardItems: [{ itemId: "coin", quantity: 50 }],
  rewardXp: [{ skillId: "wardenry", amount: 30 }],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "collect" as const,
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
  const actionQueue = new ActionQueue();
  const registries = makeRegistries({
    object: new Map([[WARDEN_BOARD_DEF.id, WARDEN_BOARD_DEF]]),
    item: new Map([[COIN_DEF.id, COIN_DEF]]),
    contract: new Map<string, ContractDef>([
      [CONTRACT_DEF.id, CONTRACT_DEF],
      [HIGH_LEVEL_CONTRACT_DEF.id, HIGH_LEVEL_CONTRACT_DEF],
      [COLLECT_CONTRACT_DEF.id, COLLECT_CONTRACT_DEF],
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
    actionQueue,
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

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "accept", objectEntityId: board },
      0,
    );
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

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "accept", objectEntityId: board },
      0,
    );
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

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "accept", objectEntityId: board },
      0,
    );
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

    const result = handleObjectIntent(
      ctx,
      player,
      { actionId: "accept", objectEntityId: board },
      0,
      10,
    );
    expect(result).toBe(true);

    const afterContract = world.getComponent(board, "contract");
    expect(afterContract?.status).toBe("expired");
  });
});

describe("handleContractAcceptIntent edge cases", () => {
  it("rejects accepting a contract that is no longer available", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);
    const contract = world.getComponent(board, "contract");
    if (!contract) throw new Error("missing contract");
    world.setComponent(board, "contract", { ...contract, status: "accepted" });

    const result = handleContractAcceptIntent(
      ctx,
      player,
      { objectEntityId: board, actionId: "accept" },
      0,
    );

    expect(result).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("This contract is no longer available.");
  });

  it("returns false when the player is too far from the board", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 10, 10);

    const result = handleContractAcceptIntent(
      ctx,
      player,
      { objectEntityId: board, actionId: "accept" },
      0,
    );

    expect(result).toBe(false);
    const vars = world.getComponent(player, "vars");
    expect(vars?.values.active_contract).toBeUndefined();
  });

  it("returns false when the target entity has no contract component", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);
    world.removeComponent(board, "contract");

    const result = handleContractAcceptIntent(
      ctx,
      player,
      { objectEntityId: board, actionId: "accept" },
      0,
    );

    expect(result).toBe(false);
  });
});

describe("updateContractObjective clamping", () => {
  it("clamps objective progress at the required amount", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    updateContractObjective(ctx, player, board, "kill", "mud_goblin", 99);

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(10);
  });

  it("ignores objectives whose target id does not match", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    updateContractObjective(ctx, player, board, "kill", "wrong_target", 5);

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(0);
  });

  it("ignores updates to a contract that is not accepted", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    updateContractObjective(ctx, player, board, "kill", "mud_goblin", 5);

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(0);
  });
});

describe("trackContractItemGain", () => {
  it("advances a collect objective when the player gains the matching item", () => {
    const { ctx, world } = setup();
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
      contractId: "collect_herbs",
      status: "available",
      objectives: [{ kind: "collect", targetId: "simple_herb", required: 20, current: 0 }],
      startTick: 0,
      expiryTick: 0,
    });

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    trackContractItemGain(ctx, player, "simple_herb", 5);

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(5);
  });

  it("does nothing when the player has no active contract", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);

    trackContractItemGain(ctx, player, "simple_herb", 5);

    // No contract entity should have been mutated; assert no progress delta emitted.
    expect(ctx.deltas.peek().contractProgress).toBeUndefined();
  });
});

describe("processContractLifecycle", () => {
  it("expires accepted contracts past their expiry tick and clears the active contract var", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);
    const contract = world.getComponent(board, "contract");
    if (!contract) throw new Error("missing contract");
    world.setComponent(board, "contract", { ...contract, expiryTick: 5 });
    // Clear the accept chat so the expiry message is the first entry.
    deltas.consume(0, 0);

    processContractLifecycle(ctx, 10, 0);

    expect(world.getComponent(board, "contract")?.status).toBe("expired");
    expect(world.getComponent(player, "vars")?.values.active_contract).toBe("");
    expect(deltas.peek().chat?.[0]?.text).toBe("Your contract has expired.");
  });

  it("does not expire contracts that have not reached their expiry tick", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);
    const contract = world.getComponent(board, "contract");
    if (!contract) throw new Error("missing contract");
    world.setComponent(board, "contract", { ...contract, expiryTick: 100 });

    processContractLifecycle(ctx, 10, 0);

    expect(world.getComponent(board, "contract")?.status).toBe("accepted");
  });

  it("skips contracts that are already completed or expired", () => {
    const { ctx, world } = setup();
    addPlayer(world, 1, 1);
    const board = addWardenBoard(world, 2, 1);
    const contract = world.getComponent(board, "contract");
    if (!contract) throw new Error("missing contract");
    world.setComponent(board, "contract", {
      ...contract,
      status: "completed",
      expiryTick: 1,
    });

    processContractLifecycle(ctx, 100, 0);

    // Status remains completed; no expiry transition.
    expect(world.getComponent(board, "contract")?.status).toBe("completed");
  });
});

describe("buildContractBoard and handleContractBoardOpen", () => {
  it("lists only available contracts on the board", () => {
    const { ctx, world } = setup();
    const available = addWardenBoard(world, 2, 1);
    const accepted = addWardenBoard(world, 3, 1);
    const acceptedContract = world.getComponent(accepted, "contract");
    if (!acceptedContract) throw new Error("missing contract");
    world.setComponent(accepted, "contract", { ...acceptedContract, status: "accepted" });

    const board = buildContractBoard(ctx);

    expect(board.entries).toHaveLength(1);
    expect(board.entries[0]?.contractEntityId).toBe(available);
    expect(board.entries[0]?.status).toBe("available");
  });

  it("opens the contract board interface when contracts are available", () => {
    const { ctx, world, deltas } = setup();
    addWardenBoard(world, 2, 1);
    const player = addPlayer(world, 1, 1);

    const result = handleContractBoardOpen(ctx, player, 0);

    expect(result).toBe(true);
    expect(deltas.peek().interfaceOpens?.[0]?.interfaceId).toBe("contract_board");
    expect(deltas.peek().interfaceOpens?.[0]?.contractBoard?.entries).toHaveLength(1);
  });

  it("informs the player when no contracts are available", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);

    const result = handleContractBoardOpen(ctx, player, 0);

    expect(result).toBe(true);
    expect(deltas.peek().interfaceOpens).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("No contracts available right now.");
  });
});
