import { type ContentRegistries, entityId, type QuestDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { setQuestStage } from "../vars/player-vars";
import { meetsAllRequirements, meetsRequirement } from "./requirements";

const PLAYER = entityId(0);

const QUEST: QuestDef = {
  id: "gate_quest",
  name: "Gate Quest",
  questPoints: 1,
  requirements: [],
  varPrefix: "gate_quest",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    { stage: 1, journalText: "Do the thing.", objectives: [], triggers: [] },
    { stage: 2, journalText: "Done.", objectives: [], triggers: [] },
  ],
  rewards: [],
};

const COINS = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "",
  icon: "",
  value: 1,
  options: [],
  tags: [],
};

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { attack: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  const deltas = new DeltaAccumulator();
  const registries: ContentRegistries = makeRegistries({
    item: new Map([[COINS.id, COINS]]),
    quest: new Map([[QUEST.id, QUEST]]),
  });
  const ctx = { world, registries };
  return { world, deltas, ctx, registries };
}

describe("meetsRequirement", () => {
  it("skill requirement passes when the level is high enough", () => {
    const { ctx } = setup();
    expect(meetsRequirement(ctx, PLAYER, { kind: "skill", skillId: "attack", level: 1 })).toBe(
      true,
    );
    expect(meetsRequirement(ctx, PLAYER, { kind: "skill", skillId: "attack", level: 5 })).toBe(
      false,
    );
  });

  it("skill requirement returns false when there is no skills component", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "skills");
    expect(meetsRequirement(ctx, PLAYER, { kind: "skill", skillId: "attack", level: 1 })).toBe(
      false,
    );
  });

  it("item requirement checks inventory contents", () => {
    const { ctx, world, registries } = setup();
    expect(meetsRequirement(ctx, PLAYER, { kind: "item", itemId: "coin", quantity: 5 })).toBe(
      false,
    );
    addItem(world.getComponent(PLAYER, "inventory")!, catalogFromItems(registries.item), "coin", 5);
    expect(meetsRequirement(ctx, PLAYER, { kind: "item", itemId: "coin", quantity: 5 })).toBe(true);
  });

  it("item requirement returns false when there is no inventory component", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "inventory");
    expect(meetsRequirement(ctx, PLAYER, { kind: "item", itemId: "coin", quantity: 1 })).toBe(
      false,
    );
  });

  it("quest_stage requirement reads the current quest stage", () => {
    const { ctx } = setup();
    setQuestStage(ctx, PLAYER, QUEST, 2);
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "quest_stage",
        questId: "gate_quest",
        minStage: 2,
      }),
    ).toBe(true);
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "quest_stage",
        questId: "gate_quest",
        minStage: 3,
      }),
    ).toBe(false);
  });

  it("quest_stage requirement falls back to the raw quest id string", () => {
    const { ctx } = setup();
    setQuestStage(ctx, PLAYER, "gate_quest", 1);
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "quest_stage",
        questId: "unknown_quest",
        minStage: 0,
      }),
    ).toBe(true);
  });

  it("kill_count requirement reads the quest kill var", () => {
    const { ctx } = setup();
    setQuestStage(ctx, PLAYER, QUEST, 1);
    // Manually set the kill counter var.
    ctx.world.setComponent(PLAYER, "vars", {
      entityId: PLAYER,
      values: { "quest.gate_quest.kill.cellar_rat": 3 },
    });
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "kill_count",
        questId: "gate_quest",
        npcId: "cellar_rat",
        count: 3,
      }),
    ).toBe(true);
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "kill_count",
        questId: "gate_quest",
        npcId: "cellar_rat",
        count: 4,
      }),
    ).toBe(false);
  });

  it("var requirement delegates to the var comparator", () => {
    const { ctx } = setup();
    ctx.world.setComponent(PLAYER, "vars", {
      entityId: PLAYER,
      values: { "custom.flag": true },
    });
    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "var",
        key: "custom.flag",
        op: "eq",
        value: true,
      }),
    ).toBe(true);
  });
});

describe("meetsAllRequirements", () => {
  it("returns true only when every requirement is met", () => {
    const { ctx } = setup();
    expect(
      meetsAllRequirements(ctx, PLAYER, [
        { kind: "skill", skillId: "attack", level: 1 },
        { kind: "item", itemId: "coin", quantity: 1 },
      ]),
    ).toBe(false);
  });

  it("returns true when all requirements pass", () => {
    const { ctx } = setup();
    expect(
      meetsAllRequirements(ctx, PLAYER, [{ kind: "skill", skillId: "attack", level: 1 }]),
    ).toBe(true);
  });

  it("returns true for an empty requirement list", () => {
    const { ctx } = setup();
    expect(meetsAllRequirements(ctx, PLAYER, [])).toBe(true);
  });
});
