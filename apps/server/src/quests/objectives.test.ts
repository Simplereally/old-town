import { type ContentRegistries, entityId, type QuestDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { setVar } from "../vars/player-vars";
import { areObjectivesComplete, isObjectiveComplete } from "./objectives";

const PLAYER = entityId(0);

const QUEST: QuestDef = {
  id: "obj_quest",
  name: "Objective Quest",
  questPoints: 1,
  requirements: [],
  varPrefix: "obj_quest",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    {
      stage: 1,
      journalText: "Do things.",
      objectives: [
        { kind: "talk", npcId: "baker" },
        { kind: "gather", itemId: "wheat", quantity: 3 },
        { kind: "have_item", itemId: "coin", quantity: 10 },
        { kind: "kill", npcId: "rat", count: 2 },
        { kind: "object", objectId: "oven", option: "light" },
      ],
      triggers: [],
    },
  ],
  rewards: [],
};

const WHEAT = { id: "wheat", name: "Wheat", stackable: true, tradeable: true, examine: "", icon: "", value: 1, options: [], tags: [] };
const COINS = { id: "coin", name: "Coin", stackable: true, tradeable: true, examine: "", icon: "", value: 1, options: [], tags: [] };

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  const deltas = new DeltaAccumulator();
  const registries: ContentRegistries = makeRegistries({
    item: new Map([
      [WHEAT.id, WHEAT],
      [COINS.id, COINS],
    ]),
    quest: new Map([[QUEST.id, QUEST]]),
  });
  const ctx = { world, registries, deltas };
  return { world, deltas, ctx, registries };
}

describe("isObjectiveComplete", () => {
  it("talk objective reads the quest talk var", () => {
    const { ctx } = setup();
    expect(isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "talk", npcId: "baker" })).toBe(false);
    setVar(ctx, PLAYER, "quest.obj_quest.talk.baker", true);
    expect(isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "talk", npcId: "baker" })).toBe(true);
  });

  it("gather objective checks the inventory for the required quantity", () => {
    const { ctx, world, registries } = setup();
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "gather", itemId: "wheat", quantity: 3 }),
    ).toBe(false);
    addItem(world.getComponent(PLAYER, "inventory")!, catalogFromItems(registries.item), "wheat", 3);
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "gather", itemId: "wheat", quantity: 3 }),
    ).toBe(true);
  });

  it("have_item objective checks the inventory", () => {
    const { ctx, world, registries } = setup();
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "have_item", itemId: "coin", quantity: 10 }),
    ).toBe(false);
    addItem(world.getComponent(PLAYER, "inventory")!, catalogFromItems(registries.item), "coin", 10);
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "have_item", itemId: "coin", quantity: 10 }),
    ).toBe(true);
  });

  it("have_item objective returns false when there is no inventory", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "inventory");
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "have_item", itemId: "coin", quantity: 1 }),
    ).toBe(false);
  });

  it("kill objective reads the quest kill counter var", () => {
    const { ctx } = setup();
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "kill", npcId: "rat", count: 2 }),
    ).toBe(false);
    setVar(ctx, PLAYER, "quest.obj_quest.kill.rat", 2);
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, { kind: "kill", npcId: "rat", count: 2 }),
    ).toBe(true);
  });

  it("object objective reads the quest object var", () => {
    const { ctx } = setup();
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, {
        kind: "object",
        objectId: "oven",
        option: "light",
      }),
    ).toBe(false);
    setVar(ctx, PLAYER, "quest.obj_quest.object.oven.light", true);
    expect(
      isObjectiveComplete(ctx.world, PLAYER, QUEST, {
        kind: "object",
        objectId: "oven",
        option: "light",
      }),
    ).toBe(true);
  });
});

describe("areObjectivesComplete", () => {
  it("returns false until every objective in the stage is complete", () => {
    const { ctx, world, registries } = setup();
    const stage = QUEST.stages[1]!;
    expect(areObjectivesComplete(ctx.world, PLAYER, QUEST, stage)).toBe(false);

    setVar(ctx, PLAYER, "quest.obj_quest.talk.baker", true);
    addItem(world.getComponent(PLAYER, "inventory")!, catalogFromItems(registries.item), "wheat", 3);
    addItem(world.getComponent(PLAYER, "inventory")!, catalogFromItems(registries.item), "coin", 10);
    setVar(ctx, PLAYER, "quest.obj_quest.kill.rat", 2);
    setVar(ctx, PLAYER, "quest.obj_quest.object.oven.light", true);

    expect(areObjectivesComplete(ctx.world, PLAYER, QUEST, stage)).toBe(true);
  });

  it("returns true for a stage with no objectives", () => {
    const { ctx } = setup();
    expect(areObjectivesComplete(ctx.world, PLAYER, QUEST, QUEST.stages[0]!)).toBe(true);
  });
});
