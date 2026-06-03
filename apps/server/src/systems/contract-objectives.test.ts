import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { tileKey } from "@old-town/shared";
import type { ContractDef } from "@old-town/shared";
import { trackContractObjective, checkContractCompletion } from "./contract-system";

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

function addContractEntity(world: World, contractId: string, status: "accepted" | "completed" = "accepted"): import("@old-town/shared").EntityId {
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
    contract: new Map<string, ContractDef>([
      [CONTRACT_DEF.id, CONTRACT_DEF as ContractDef],
      [COLLECT_CONTRACT_DEF.id, COLLECT_CONTRACT_DEF as ContractDef],
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

describe("contract objective tracking", () => {
  it("tracks kill objective progress", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "slay_goblins");

    trackContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 3);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.objectives[0]?.current).toBe(3);
  });

  it("tracks gather objective progress", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "collect_herbs");

    trackContractObjective(ctx, player, contractEntity, "collect", "simple_herb", 5);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.objectives[0]?.current).toBe(5);
  });

  it("detects contract completion when all objectives satisfied", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 1, 1);
    const contractEntity = addContractEntity(world, "slay_goblins");

    trackContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 10);
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

    trackContractObjective(ctx, player, contractEntity, "kill", "mud_goblin", 5);
    checkContractCompletion(ctx, player, contractEntity, 0);

    const contract = world.getComponent(contractEntity, "contract");
    expect(contract?.status).toBe("accepted");
  });
});
