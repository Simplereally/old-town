import { describe, expect, it } from "vitest";
import type { ActivityDef } from "@old-town/shared";
import { createWorld } from "../ecs/world";
import { makeRegistries } from "../test-support/registries";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { ActionQueue } from "../sim/action-queue";
import { createRng } from "@old-town/shared";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  handleActivityIntent,
  handleActivityAction,
  validateActivityEntry,
  type ActivityContext,
  type ActivityActionPayload,
} from "./activity-system";

function buildContext(): ActivityContext {
  const world = createWorld();
  const map = createRuntimeMap();
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const rng = createRng(12345);
  const registries = makeRegistries();
  return { world, collision, deltas, actionQueue, registries, rng };
}

const bellRunDef: ActivityDef = {
  id: "bell_run",
  name: "Bell Run",
  category: "course",
  risk: "safe",
  skills: ["wayfaring", "cartography"],
  entryRequirement: { skillId: "wayfaring", level: 1 },
  location: { description: "Market Bell", x: 32, y: 32, plane: 0 },
  steps: [
    { id: "step1", name: "Step 1", description: "Run", actionTicks: 1, requiredLevel: 1, inputs: [], outputs: [], xpReward: [{ skillId: "wayfaring", amount: 10 }], failureChance: 0 },
    { id: "step2", name: "Step 2", description: "Ring", actionTicks: 2, requiredLevel: 1, inputs: [], outputs: [], xpReward: [{ skillId: "cartography", amount: 5 }], failureChance: 0 },
  ],
  rewards: [{ type: "xp", skillId: "wayfaring", quantity: 10 }],
  tokenId: "bell_token",
  tokenSink: [],
  loopDescription: "Run and ring",
  failureState: "You failed to return in time.",
  inputs: [],
  outputs: [{ itemId: "bell_token", quantity: 1 }],
};

function createPlayer(world: ReturnType<typeof createWorld>, ctx: ActivityContext) {
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 32, y: 32, plane: 0 });
  world.setComponent(player, "skills", {
    entityId: player,
    skills: {
      wayfaring: { level: 5, xp: 500, boost: 0, drain: 0 },
    },
  });
  world.setComponent(player, "inventory", {
    entityId: player,
    containerId: `inventory:${player}`,
    capacity: 28,
    slots: [],
    nextUid: 1,
  });
  return player;
}

function createActivityObject(world: ReturnType<typeof createWorld>, ctx: ActivityContext) {
  const object = world.createEntity();
  world.setComponent(object, "object", { entityId: object, objectId: "market_bell", facing: 0, variant: 0 });
  world.setComponent(object, "position", { entityId: object, x: 32, y: 32, plane: 0 });
  return object;
}

describe("activity system", () => {
  it("validates entry requirement", () => {
    const ctx = buildContext();
    const player = createPlayer(ctx.world, ctx);
    const result = validateActivityEntry(ctx, player, bellRunDef);
    expect(result.ok).toBe(true);
  });

  it("rejects activity when entry requirement is not met", () => {
    const ctx = buildContext();
    const player = ctx.world.createEntity();
    ctx.world.setComponent(player, "skills", {
      entityId: player,
      skills: {
        wayfaring: { level: 1, xp: 0, boost: 0, drain: 0 },
      },
    });
    const highReqDef = { ...bellRunDef, entryRequirement: { skillId: "wayfaring", level: 2 } };
    const result = validateActivityEntry(ctx, player, highReqDef);
    expect(result.ok).toBe(false);
  });

  it("starts activity when player is adjacent to object", () => {
    const ctx = buildContext();
    const player = createPlayer(ctx.world, ctx);
    const object = createActivityObject(ctx.world, ctx);
    const registries = makeRegistries({
      object: new Map([["market_bell", { id: "market_bell", name: "Market Bell", activityId: "bell_run", length: 2, width: 2, blocksMovement: true, blocksLineOfSight: false, defaultRotation: 0, options: [] }]]),
      activity: new Map([["bell_run", bellRunDef]]),
    });
    const ctx2 = { ...ctx, registries };
    const result = handleActivityIntent(ctx2, player, object, 0, 0);
    expect(result).toBe(true);
    const state = ctx2.deltas.peek();
    expect(state.interfaceOpens).toHaveLength(1);
    expect(state.interfaceOpens?.[0]?.interfaceId).toBe("activity");
  });

  it("cancels activity when player moves too far away", () => {
    const ctx = buildContext();
    const player = createPlayer(ctx.world, ctx);
    const object = createActivityObject(ctx.world, ctx);
    const registries = makeRegistries({
      object: new Map([["market_bell", { id: "market_bell", name: "Market Bell", activityId: "bell_run", length: 2, width: 2, blocksMovement: true, blocksLineOfSight: false, defaultRotation: 0, options: [] }]]),
      activity: new Map([["bell_run", bellRunDef]]),
    });
    const ctx2 = { ...ctx, registries };
    handleActivityIntent(ctx2, player, object, 0, 0);

    // Move player far away
    ctx2.world.setComponent(player, "position", { entityId: player, x: 100, y: 100, plane: 0 });

    const payload: ActivityActionPayload = { kind: "activity", activityId: "bell_run", objectEntityId: object };
    const execution = {
      entry: {
        id: `activity:bell_run:${player}`,
        owner: player,
        type: "weak" as const,
        delayTicks: 1,
        interruptGroup: "skilling" as const,
        payload,
      },
      executionCount: 1,
    };
    handleActivityAction(ctx2, execution, payload, 1, 0);
    const state = ctx2.deltas.peek();
    expect(state.interfaceCloses?.some((c) => c.interfaceId === "activity")).toBe(true);
  });
});
