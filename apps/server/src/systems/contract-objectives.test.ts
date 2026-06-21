import type { ContractDef } from "@old-town/shared";
import { tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  checkContractCompletion,
  handleContractAcceptIntent,
  trackContractObjective,
  updateContractObjective,
} from "./contract-system";

const CONTRACT_DEF = {
  id: "slay_goblins",
  name: "Slay Goblins",
  description: "The Warden needs goblin numbers reduced.",
  contractType: "bounty" as const,
  targetCreatureIds: ["mud_goblin"],
  targetCount: 10,
  rewardItems: [{ itemId: "coin", quantity: 100 }],
  rewardXp: [{ skillId: "attack", amount: 50 }],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill" as const,
};

const COLLECT_CONTRACT_DEF = {
  id: "collect_herbs",
  name: "Collect Herbs",
  description: "The healer needs medicinal herbs.",
  contractType: "collection" as const,
  targetCreatureIds: [],
  targetCount: 20,
  rewardItems: [{ itemId: "coin", quantity: 50 }],
  rewardXp: [{ skillId: "gardening", amount: 25 }],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "collect" as const,
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
    },
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function addContractEntity(
  world: World,
  contractId: string,
  status: "accepted" | "completed" = "accepted",
): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  const def = contractId === "slay_goblins" ? CONTRACT_DEF : COLLECT_CONTRACT_DEF;
  world.setComponent(entityId, "contract", {
    entityId,
    contractId,
    status,
    objectives: [
      {
        kind: def.completionTrigger,
        targetId: def.targetCreatureIds[0] ?? "simple_herb",
        required: def.targetCount,
        current: 0,
      },
    ],
    startTick: 0,
    expiryTick: 0,
  });
  return entityId;
}

function addWardenBoard(
  world: World,
  contractId: string,
  x = 2,
  y = 1,
): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  const def = contractId === "slay_goblins" ? CONTRACT_DEF : COLLECT_CONTRACT_DEF;
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", {
    entityId,
    objectId: "warden_board",
    facing: 0,
    variant: 0,
  });
  world.setComponent(entityId, "contract", {
    entityId,
    contractId,
    status: "available",
    objectives: [
      {
        kind: def.completionTrigger,
        targetId: def.targetCreatureIds[0] ?? "simple_herb",
        required: def.targetCount,
        current: 0,
      },
    ],
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
    contract: new Map<string, ContractDef>([
      [CONTRACT_DEF.id, CONTRACT_DEF as ContractDef],
      [COLLECT_CONTRACT_DEF.id, COLLECT_CONTRACT_DEF as ContractDef],
    ]),
    object: new Map([
      [
        "warden_board",
        {
          id: "warden_board",
          name: "Warden Board",
          width: 1,
          length: 1,
          blocksMovement: true,
          blocksLineOfSight: false,
          defaultRotation: 0,
          examine: "A board for warden contracts.",
          options: [],
        },
      ],
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

describe("contract objective tracking", () => {
  it("tracks kill objective progress", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "slay_goblins");

    updateContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 3);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.objectives[0]?.current).toBe(3);
  });

  it("tracks gather objective progress", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "collect_herbs");

    updateContractObjective(ctx, player, contractEntity, "collect", "simple_herb", 5);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.objectives[0]?.current).toBe(5);
  });

  it("detects contract completion when all objectives satisfied", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "slay_goblins");

    updateContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 10);
    checkContractCompletion(ctx, player, contractEntity, 0);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.status).toBe("completed");

    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("Contract complete: Slay Goblins");
  });

  it("does not complete contract if objectives not satisfied", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "slay_goblins");

    updateContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 5);
    checkContractCompletion(ctx, player, contractEntity, 0);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.status).toBe("accepted");
  });
});

describe("trackContractObjective high-level API", () => {
  it("increments active contract kill objective via lookup", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, "slay_goblins", 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    trackContractObjective(ctx, player, "kill", "mud_goblin");

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(1);
  });

  it("emits contract progress delta", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, "slay_goblins", 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    trackContractObjective(ctx, player, "kill", "mud_goblin");

    const progress = deltas.peek().contractProgress;
    expect(progress).toBeDefined();
    expect(progress?.length).toBe(1);
    expect(progress?.[0]).toMatchObject({
      entityId: player,
      contractId: "slay_goblins",
      objectiveKind: "kill",
      targetId: "mud_goblin",
      current: 1,
      required: 10,
    });
  });

  it("marks contract ready-for-completion when kill objective is satisfied", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, "slay_goblins", 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    for (let i = 0; i < 10; i += 1) {
      trackContractObjective(ctx, player, "kill", "mud_goblin");
    }

    const contract = world.getComponent(board, "contract");
    expect(contract?.status).toBe("ready-for-completion");
    expect(contract?.objectives[0]?.current).toBe(10);

    const progress = deltas.peek().contractProgress;
    expect(progress?.length).toBe(10);

    const chat = deltas.peek().chat;
    expect(chat?.[chat.length - 1]?.text).toBe("Contract ready for completion: Slay Goblins");
  });

  it("does nothing when player has no active contract", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);

    trackContractObjective(ctx, player, "kill", "mud_goblin");

    const progress = deltas.peek().contractProgress;
    expect(progress).toBeUndefined();
  });

  it("does nothing when objective target does not match", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const board = addWardenBoard(world, "slay_goblins", 2, 1);

    handleContractAcceptIntent(ctx, player, { objectEntityId: board, actionId: "accept" }, 0);

    trackContractObjective(ctx, player, "kill", "wrong_creature");

    const contract = world.getComponent(board, "contract");
    expect(contract?.objectives[0]?.current).toBe(0);

    const progress = deltas.peek().contractProgress;
    expect(progress).toBeUndefined();
  });
});
