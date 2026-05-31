import {
  type ContentRegistries,
  entityId,
  type ItemDef,
  type NpcDef,
  type QuestDef,
  type SkillDef,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { setQuestStage } from "../vars/player-vars";
import { completeQuest } from "./effects";
import { dispatchQuestEvent } from "./quest-engine";
import { meetsRequirement } from "./requirements";

const PLAYER = entityId(0);

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

const COOKING: SkillDef = {
  id: "cooking",
  name: "Cooking",
  maxLevel: 99,
  xpTableId: "oldtown_default",
  combat: false,
  unlocks: [],
};

const QUEST: QuestDef = {
  id: "smoke_over_old_town",
  name: "Smoke Over Old Town",
  questPoints: 1,
  requirements: [],
  varPrefix: "smoke_over_old_town",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    {
      stage: 1,
      journalText: "Talk to the baker.",
      objectives: [{ kind: "talk", npcId: "baker" }],
      triggers: [
        {
          on: "stage_complete",
          effects: [{ kind: "set_var", key: "quest.smoke.stage1_done", value: true }],
        },
      ],
    },
    {
      stage: 2,
      journalText: "Prepare the oven.",
      objectives: [
        { kind: "kill", npcId: "cellar_rat", count: 2 },
        { kind: "have_item", itemId: "dry_logs", quantity: 3 },
        { kind: "object", objectId: "bakery_oven", option: "light" },
      ],
      triggers: [
        {
          on: "stage_enter",
          effects: [{ kind: "set_var", key: "quest.smoke.stage2_entered", value: true }],
        },
      ],
    },
    {
      stage: 3,
      journalText: "Return to the baker.",
      objectives: [{ kind: "talk", npcId: "baker" }],
      triggers: [],
    },
  ],
  rewards: [],
};

const REWARD_QUEST: QuestDef = {
  id: "reward_test",
  name: "Reward Test",
  questPoints: 2,
  requirements: [],
  varPrefix: "reward_test",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    {
      stage: 1,
      journalText: "Finish the reward test.",
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

const FULL_INVENTORY_QUEST: QuestDef = {
  id: "full_inventory_test",
  name: "Full Inventory Test",
  questPoints: 1,
  requirements: [],
  varPrefix: "full_inventory_test",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    {
      stage: 1,
      journalText: "Finish with a full inventory.",
      objectives: [{ kind: "talk", npcId: "baker" }],
      triggers: [],
    },
  ],
  rewards: [{ kind: "add_item", itemId: "reward_badge", quantity: 1 }],
};

const BAKER: NpcDef = {
  id: "baker",
  name: "Baker",
  size: 1,
  respawnTicks: 1,
  wanderRadius: 0,
  options: [],
};

const RAT: NpcDef = {
  id: "cellar_rat",
  name: "Cellar Rat",
  size: 1,
  respawnTicks: 1,
  wanderRadius: 0,
  options: [],
};

function registries(): ContentRegistries {
  return {
    item: new Map([
      [DRY_LOGS.id, DRY_LOGS],
      [COINS.id, COINS],
      [REWARD_BADGE.id, REWARD_BADGE],
    ]),
    npc: new Map([
      [BAKER.id, BAKER],
      [RAT.id, RAT],
    ]),
    object: new Map(),
    processingRecipe: new Map(),
    skill: new Map([[COOKING.id, COOKING]]),
    resourceNode: new Map(),
    spell: new Map(),
    dropTable: new Map(),
    quest: new Map([
      [QUEST.id, QUEST],
      [REWARD_QUEST.id, REWARD_QUEST],
      [FULL_INVENTORY_QUEST.id, FULL_INVENTORY_QUEST],
    ]),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
  };
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
  const deltas = new DeltaAccumulator();
  const content = registries();
  const itemAudit = new ItemAuditLog();
  const ctx = { world, registries: content, deltas, serverTime: 600, tick: 1, itemAudit };
  setQuestStage(ctx, PLAYER, QUEST, 1);
  deltas.consume(1, 600);
  return { world, deltas, ctx, registries: content, itemAudit };
}

describe("quest engine", () => {
  it("advances stages from dialogue events and runs stage triggers", () => {
    const { world, deltas, ctx } = setup();

    const result = dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });

    expect(result.progressedQuestIds).toEqual(["smoke_over_old_town"]);
    expect(world.getComponent(PLAYER, "vars")?.values).toMatchObject({
      "quest.smoke_over_old_town.stage": 2,
      "quest.smoke_over_old_town.talk.baker": true,
      "quest.smoke.stage1_done": true,
      "quest.smoke.stage2_entered": true,
    });
    expect(deltas.peek().varbitDelta).toContainEqual({
      varId: "quest.smoke_over_old_town.stage",
      value: 2,
    });
  });

  it("does not advance a quest stage until every objective is complete", () => {
    const { world, ctx, registries } = setup();
    dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });

    dispatchQuestEvent(ctx, PLAYER, { kind: "npc_killed", npcId: "cellar_rat" });
    dispatchQuestEvent(ctx, PLAYER, { kind: "npc_killed", npcId: "cellar_rat" });
    expect(world.getComponent(PLAYER, "vars")?.values["quest.smoke_over_old_town.stage"]).toBe(2);

    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "dry_logs", 3);
    dispatchQuestEvent(ctx, PLAYER, { kind: "item_gained", itemId: "dry_logs", quantity: 3 });
    expect(world.getComponent(PLAYER, "vars")?.values["quest.smoke_over_old_town.stage"]).toBe(2);

    const result = dispatchQuestEvent(ctx, PLAYER, {
      kind: "object_interacted",
      objectId: "bakery_oven",
      option: "light",
    });
    expect(result.progressedQuestIds).toEqual(["smoke_over_old_town"]);
    expect(world.getComponent(PLAYER, "vars")?.values).toMatchObject({
      "quest.smoke_over_old_town.stage": 3,
      "quest.smoke_over_old_town.kill.cellar_rat": 2,
      "quest.smoke_over_old_town.object.bakery_oven.light": true,
    });
  });

  it("dispatches item removed, skill XP, and area entered event classes", () => {
    const { world, ctx, registries } = setup();
    dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "dry_logs", 1);

    expect(
      dispatchQuestEvent(ctx, PLAYER, {
        kind: "item_removed",
        itemId: "dry_logs",
        quantity: 1,
      }).progressedQuestIds,
    ).toEqual([]);
    expect(
      dispatchQuestEvent(ctx, PLAYER, {
        kind: "skill_xp_gained",
        skillId: "cooking",
        amount: 5,
      }).progressedQuestIds,
    ).toEqual([]);
    dispatchQuestEvent(ctx, PLAYER, { kind: "area_entered", areaId: "bakery_cellar" });

    expect(
      world.getComponent(PLAYER, "vars")?.values["quest.smoke_over_old_town.area.bakery_cellar"],
    ).toBe(true);
  });

  it("evaluates kill-count requirements from quest vars", () => {
    const { ctx } = setup();
    dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });
    dispatchQuestEvent(ctx, PLAYER, { kind: "npc_killed", npcId: "cellar_rat" });
    dispatchQuestEvent(ctx, PLAYER, { kind: "npc_killed", npcId: "cellar_rat" });

    expect(
      meetsRequirement(ctx, PLAYER, {
        kind: "kill_count",
        questId: "smoke_over_old_town",
        npcId: "cellar_rat",
        count: 2,
      }),
    ).toBe(true);
  });

  it("applies final quest rewards once with quest points and completion tick", () => {
    const { world, deltas, ctx, itemAudit } = setup();
    setQuestStage(ctx, PLAYER, REWARD_QUEST, 1);
    deltas.consume(1, 600);

    const result = dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });

    expect(result.progressedQuestIds).toContain("reward_test");
    expect(world.getComponent(PLAYER, "inventory")?.slots[0]).toMatchObject({
      itemId: "coin",
      quantity: 5,
    });
    expect(world.getComponent(PLAYER, "skills")?.skills.cooking?.xp).toBe(10);
    expect(world.getComponent(PLAYER, "vars")?.values).toMatchObject({
      "quest.reward_test.completed": true,
      "quest.reward_test.completed_tick": 1,
      "quest.reward_test.stage": 2,
      "quest.points": 2,
      "unlock.bakery_range": true,
    });
    expect(deltas.peek().chat?.at(-1)?.text).toBe("Quest complete: Reward Test.");
    expect(itemAudit.snapshot()[0]).toMatchObject({
      tick: 1,
      itemId: "coin",
      quantity: 5,
      reason: "quest_reward",
      beforeQuantity: 0,
      afterQuantity: 5,
      metadata: expect.objectContaining({ questId: "reward_test" }),
    });

    deltas.consume(2, 1_200);
    expect(completeQuest(ctx, PLAYER, REWARD_QUEST.id)).toEqual({
      applied: false,
      reason: "already_completed",
    });
    expect(world.getComponent(PLAYER, "inventory")?.slots[0]).toMatchObject({
      itemId: "coin",
      quantity: 5,
    });
    expect(world.getComponent(PLAYER, "vars")?.values["quest.points"]).toBe(2);
  });

  it("prevents partial completion when item rewards do not fit", () => {
    const { world, deltas, ctx, registries } = setup();
    const inventory = world.getComponent(PLAYER, "inventory");
    expect(inventory).toBeDefined();
    if (!inventory) return;
    addItem(inventory, catalogFromItems(registries.item), "reward_badge", 28);
    setQuestStage(ctx, PLAYER, FULL_INVENTORY_QUEST, 1);
    deltas.consume(1, 600);

    const result = dispatchQuestEvent(ctx, PLAYER, { kind: "dialogue", npcId: "baker" });

    expect(result.progressedQuestIds).not.toContain("full_inventory_test");
    expect(world.getComponent(PLAYER, "vars")?.values).not.toMatchObject({
      "quest.full_inventory_test.completed": true,
    });
    expect(world.getComponent(PLAYER, "vars")?.values["quest.points"]).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe(
      "You need more inventory space for the quest rewards.",
    );
    expect(inventory.slots.filter((slot) => slot?.itemId === "reward_badge")).toHaveLength(28);
  });
});
