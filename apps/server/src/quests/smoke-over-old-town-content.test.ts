import type { ObjectDef } from "@old-town/shared/content-schemas/object";
import type { QuestDef } from "@old-town/shared/content-schemas/quest";
import { beforeAll, describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";

let quest: QuestDef;
let itemIds: ReadonlySet<string>;
let npcIds: ReadonlySet<string>;
let objectIds: ReadonlySet<string>;
let objectDefs: ReadonlyMap<string, ObjectDef>;

beforeAll(async () => {
  const content = await loadContent("content");
  if (!content.ok || content.issues.length > 0) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const loadedQuest = content.registries.quest.get("smoke_over_old_town");
  if (!loadedQuest) {
    throw new Error("Missing Smoke Over Old Town quest content");
  }
  quest = loadedQuest;
  itemIds = new Set(content.registries.item.keys());
  npcIds = new Set(content.registries.npc.keys());
  objectIds = new Set(content.registries.object.keys());
  objectDefs = content.registries.object;
});

describe("Smoke Over Old Town quest content", () => {
  it("declares the canonical variables, stages, objectives, triggers, and rewards", () => {
    expect(quest.varPrefix).toBe("smoke_over_old_town");
    expect(quest.variables).toEqual([
      { key: "quest.smoke_over_old_town.stage", initialValue: 0 },
      { key: "quest.smoke_over_old_town.spoke_to_pippa", initialValue: false },
      { key: "quest.smoke_over_old_town.dry_logs", initialValue: 0 },
      { key: "quest.smoke_over_old_town.rats_killed", initialValue: 0 },
      { key: "quest.smoke_over_old_town.oven_lit", initialValue: false },
      { key: "quest.smoke_over_old_town.completed", initialValue: false },
    ]);
    expect(quest.stages.map((stage) => stage.stage)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(quest.stages.slice(1, 5).every((stage) => stage.objectives.length === 1)).toBe(true);
    expect(quest.stages.slice(1, 5).every((stage) => stage.triggers.length === 1)).toBe(true);
    expect(quest.rewards).toEqual([
      { kind: "add_item", itemId: "bread", quantity: 5 },
      { kind: "add_item", itemId: "coin", quantity: 50 },
      { kind: "add_xp", skillId: "cooking", amount: 100 },
      { kind: "unlock", unlockId: "bakery_range" },
    ]);
  });

  it("forms one strictly ordered progression graph from not-started to complete", () => {
    const stages = quest.stages.map((stage) => stage.stage);
    expect(new Set(stages).size).toBe(stages.length);
    for (let index = 1; index < stages.length; index += 1) {
      expect(stages[index]).toBe((stages[index - 1] ?? -1) + 1);
    }
    expect(quest.stages[0]?.objectives).toEqual([]);
    expect(quest.stages.at(-1)?.objectives).toEqual([]);
  });

  it("resolves every objective and reward reference through the content registries", () => {
    for (const stage of quest.stages) {
      for (const objective of stage.objectives) {
        switch (objective.kind) {
          case "talk":
          case "kill":
            expect(npcIds.has(objective.npcId)).toBe(true);
            break;
          case "gather":
          case "have_item":
            expect(itemIds.has(objective.itemId)).toBe(true);
            break;
          case "object":
            expect(objectIds.has(objective.objectId)).toBe(true);
            expect(
              objectDefs
                .get(objective.objectId)
                ?.options.some((option) => option.actionId === objective.option),
            ).toBe(true);
            expect(objective.requirements).toEqual([
              { kind: "item", itemId: "dry_log", quantity: 3 },
            ]);
            break;
        }
      }
    }

    const rewardItemIds = quest.rewards.flatMap((reward) =>
      reward.kind === "add_item" ? [reward.itemId] : [],
    );
    expect(rewardItemIds).toEqual(["bread", "coin"]);
    expect(rewardItemIds.every((itemId) => itemIds.has(itemId))).toBe(true);
  });
});
