import {
  type ContentRegistries,
  entityId,
  type ItemDef,
  type QuestDef,
  type SkillDef,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { setQuestStage } from "../vars/player-vars";
import { applyEffect, completeQuest } from "./effects";

const PLAYER = entityId(0);

const COINS: ItemDef = {
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

const BADGE: ItemDef = {
  id: "badge",
  name: "Badge",
  stackable: false,
  tradeable: false,
  examine: "A badge.",
  icon: "icon_badge",
  value: 0,
  options: [],
  tags: [],
};

const COOKING: SkillDef = {
  id: "cooking",
  name: "Cooking",
  maxLevel: 99,
  xpTableId: "oldtown_default",
  combat: false,
  unlocks: [],
};

const QUEST: QuestDef = {
  id: "errand_quest",
  name: "Errand Quest",
  questPoints: 1,
  requirements: [],
  varPrefix: "errand_quest",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    {
      stage: 1,
      journalText: "Talk to the baker.",
      objectives: [{ kind: "talk", npcId: "baker" }],
      triggers: [],
    },
  ],
  rewards: [
    { kind: "add_item", itemId: "coin", quantity: 5 },
    { kind: "add_xp", skillId: "cooking", amount: 10 },
    { kind: "unlock", unlockId: "bakery_range" },
  ],
};

function registries(): ContentRegistries {
  return makeRegistries({
    item: new Map([
      [COINS.id, COINS],
      [BADGE.id, BADGE],
    ]),
    skill: new Map([[COOKING.id, COOKING]]),
    quest: new Map([[QUEST.id, QUEST]]),
  });
}

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 10, y: 10, plane: 0 });
  world.setComponent(PLAYER, "movement", { entityId: PLAYER, mode: "walk", path: [] });
  const deltas = new DeltaAccumulator();
  const content = registries();
  const itemAudit = new ItemAuditLog();
  const ctx = { world, registries: content, deltas, itemAudit };
  return { world, deltas, ctx, registries: content, itemAudit };
}

describe("applyEffect", () => {
  it("add_item adds to inventory, emits delta, and records audit", () => {
    const { ctx, world, deltas } = setup();
    const result = applyEffect(ctx, PLAYER, { kind: "add_item", itemId: "coin", quantity: 5 }, 600, 1);

    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "inventory")?.slots[0]).toMatchObject({
      itemId: "coin",
      quantity: 5,
    });
    expect(deltas.peek().inventoryDeltas).toHaveLength(1);
  });

  it("add_item reports inventory_full when the item does not fit", () => {
    const { ctx, world } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(ctx.registries.item), "badge", 28);

    const result = applyEffect(ctx, PLAYER, { kind: "add_item", itemId: "badge", quantity: 1 }, 600, 1);
    expect(result).toEqual({ applied: false, reason: "inventory_full" });
  });

  it("add_item returns missing_inventory when there is no inventory component", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "inventory");

    const result = applyEffect(ctx, PLAYER, { kind: "add_item", itemId: "coin", quantity: 1 }, 600, 1);
    expect(result).toEqual({ applied: false, reason: "missing_inventory" });
  });

  it("remove_item removes from inventory and records audit", () => {
    const { ctx, world } = setup();
    addItem(
      world.getComponent(PLAYER, "inventory")!,
      catalogFromItems(ctx.registries.item),
      "coin",
      10,
    );

    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "remove_item", itemId: "coin", quantity: 4 },
      600,
      1,
    );

    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "inventory")?.slots[0]).toMatchObject({
      itemId: "coin",
      quantity: 6,
    });
  });

  it("remove_item returns missing_item when not enough is present", () => {
    const { ctx } = setup();
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "remove_item", itemId: "coin", quantity: 5 },
      600,
      1,
    );
    expect(result).toEqual({ applied: false, reason: "missing_item" });
  });

  it("remove_item returns missing_inventory when there is no inventory component", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "inventory");

    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "remove_item", itemId: "coin", quantity: 1 },
      600,
      1,
    );
    expect(result).toEqual({ applied: false, reason: "missing_inventory" });
  });

  it("add_xp grants XP to the named skill", () => {
    const { ctx, world } = setup();
    const result = applyEffect(ctx, PLAYER, { kind: "add_xp", skillId: "cooking", amount: 50 }, 600, 1);
    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "skills")?.skills.cooking?.xp).toBe(50);
  });

  it("set_var writes a player var", () => {
    const { ctx, world } = setup();
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "set_var", key: "custom.flag", value: true },
      600,
      1,
    );
    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "vars")?.values["custom.flag"]).toBe(true);
  });

  it("send_message emits a system chat delta", () => {
    const { ctx, deltas } = setup();
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "send_message", text: "Something happens." },
      600,
      1,
    );
    expect(result).toEqual({ applied: true });
    expect(deltas.peek().chat?.[0]?.text).toBe("Something happens.");
  });

  it("unlock writes an unlock var", () => {
    const { ctx, world } = setup();
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "unlock", unlockId: "bakery_range" },
      600,
      1,
    );
    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "vars")?.values["unlock.bakery_range"]).toBe(true);
  });

  it("start_quest sets the first stage and marks the quest started", () => {
    const { ctx, world } = setup();
    const result = applyEffect(ctx, PLAYER, { kind: "start_quest", questId: "errand_quest" }, 600, 1);
    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "vars")?.values).toMatchObject({
      "quest.errand_quest.stage": 1,
      "quest.errand_quest.completed": false,
    });
  });

  it("start_quest returns missing_quest for an unknown quest id", () => {
    const { ctx } = setup();
    const result = applyEffect(ctx, PLAYER, { kind: "start_quest", questId: "nope" }, 600, 1);
    expect(result).toEqual({ applied: false, reason: "missing_quest" });
  });

  it("start_quest returns already_started when the quest is past stage 0", () => {
    const { ctx } = setup();
    applyEffect(ctx, PLAYER, { kind: "start_quest", questId: "errand_quest" }, 600, 1);
    const result = applyEffect(ctx, PLAYER, { kind: "start_quest", questId: "errand_quest" }, 600, 1);
    expect(result).toEqual({ applied: false, reason: "already_started" });
  });

  it("teleport moves the entity and clears the movement path", () => {
    const { ctx, world, deltas } = setup();
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "teleport", tile: { x: 30, y: 40, plane: 1 } },
      600,
      1,
    );
    expect(result).toEqual({ applied: true });
    expect(world.getComponent(PLAYER, "position")).toMatchObject({ x: 30, y: 40, plane: 1 });
    expect(world.getComponent(PLAYER, "movement")?.path).toEqual([]);
    expect(deltas.peek().entityUpdates?.[0]).toMatchObject({ entityId: PLAYER });
  });

  it("teleport returns missing_position when there is no position component", () => {
    const { ctx, world } = setup();
    world.removeComponent(PLAYER, "position");
    const result = applyEffect(
      ctx,
      PLAYER,
      { kind: "teleport", tile: { x: 30, y: 40, plane: 1 } },
      600,
      1,
    );
    expect(result).toEqual({ applied: false, reason: "missing_position" });
  });
});

describe("completeQuest", () => {
  it("returns missing_quest for an unknown quest id", () => {
    const { ctx } = setup();
    expect(completeQuest(ctx, PLAYER, "nope", 600, 1)).toEqual({
      applied: false,
      reason: "missing_quest",
    });
  });

  it("returns already_completed when the quest is already done", () => {
    const { ctx, deltas } = setup();
    setQuestStage(ctx, PLAYER, QUEST, 1);
    deltas.consume(1, 600);
    // Mark completed manually.
    ctx.world.setComponent(PLAYER, "vars", {
      entityId: PLAYER,
      values: {
        ...ctx.world.getComponent(PLAYER, "vars")!.values,
        "quest.errand_quest.completed": true,
      },
    });

    const result = completeQuest(ctx, PLAYER, QUEST.id, 600, 1);
    expect(result).toEqual({ applied: false, reason: "already_completed" });
    expect(deltas.peek().chat?.[0]?.text).toBe("You have already completed Errand Quest.");
  });

  it("returns objectives_incomplete when the current stage is not finished", () => {
    const { ctx } = setup();
    setQuestStage(ctx, PLAYER, QUEST, 1);

    const result = completeQuest(ctx, PLAYER, QUEST.id, 600, 1);
    expect(result).toEqual({ applied: false, reason: "objectives_incomplete" });
  });

  it("returns inventory_full when item rewards do not fit and does not mark completed", () => {
    const { ctx, world, deltas } = setup();
    setQuestStage(ctx, PLAYER, QUEST, 1);
    deltas.consume(1, 600);
    // Mark the talk objective complete.
    ctx.world.setComponent(PLAYER, "vars", {
      entityId: PLAYER,
      values: {
        ...ctx.world.getComponent(PLAYER, "vars")!.values,
        "quest.errand_quest.talk.baker": true,
      },
    });
    // Fill inventory so the coin reward cannot fit (coins are stackable, so fill with badges).
    const inventory = world.getComponent(PLAYER, "inventory")!;
    addItem(inventory, catalogFromItems(ctx.registries.item), "badge", 28);

    const result = completeQuest(ctx, PLAYER, QUEST.id, 600, 1);
    expect(result).toEqual({ applied: false, reason: "inventory_full" });
    expect(deltas.peek().chat?.[0]?.text).toBe(
      "You need more inventory space for the quest rewards.",
    );
  });
});
