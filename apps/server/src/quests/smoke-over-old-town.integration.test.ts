import {
  type ContentRegistries,
  type DialogueViewPacket,
  entityId,
  type QuestDef,
} from "@old-town/shared";
import { beforeAll, describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { handleDialogueUiIntent, handleNpcDialogueIntent } from "../dialogue/dialogue-engine";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  getBooleanVar,
  getNumberVar,
  getQuestStage,
  setQuestStage,
  setVar,
} from "../vars/player-vars";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { dispatchQuestEvent, processQuestTriggers } from "./quest-engine";

const PLAYER = entityId(0);
const PIPPA = entityId(1);

interface SmokeQuestHarness {
  readonly world: World;
  readonly registries: ContentRegistries;
  readonly deltas: DeltaAccumulator;
  readonly actionQueue: ActionQueue;
  readonly collision: CollisionMap;
  readonly quest: QuestDef;
}

let seedContent: ContentRegistries;

beforeAll(async () => {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  seedContent = content.registries;
});

function setup(): SmokeQuestHarness {
  const quest = seedContent.quest.get("smoke_over_old_town");
  expect(quest).toBeDefined();
  if (!quest) {
    throw new Error("Missing Smoke Over Old Town quest content");
  }

  const world = createWorld();
  const player = world.createEntity();
  const pippa = world.createEntity();
  expect(player).toBe(PLAYER);
  expect(pippa).toBe(PIPPA);

  world.setComponent(PLAYER, "player", {
    entityId: PLAYER,
    accountId: "test",
    sessionId: "test",
    interestRadius: 16,
  });
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 45, y: 46, plane: 0 });
  world.setComponent(PLAYER, "movement", { entityId: PLAYER, mode: "walk", path: [] });
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });

  world.setComponent(PIPPA, "position", { entityId: PIPPA, x: 46, y: 46, plane: 0 });
  world.setComponent(PIPPA, "npc", {
    entityId: PIPPA,
    npcId: "pippa_hearth",
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 0,
  });

  return {
    world,
    registries: seedContent,
    deltas: new DeltaAccumulator(),
    actionQueue: new ActionQueue(),
    collision: new CollisionMap(createRuntimeMap()),
    quest,
  };
}

function openPippaDialogue(harness: SmokeQuestHarness, serverTime: number): DialogueViewPacket {
  expect(
    handleNpcDialogueIntent(
      harness,
      PLAYER,
      { npcEntityId: PIPPA, actionId: "talk" },
      serverTime,
      Math.floor(serverTime / 600),
    ),
  ).toBe(true);
  return latestDialogue(harness.deltas);
}

function selectDialogueOption(
  harness: SmokeQuestHarness,
  optionText: string,
  serverTime: number,
): DialogueViewPacket {
  const dialogue = latestDialogue(harness.deltas);
  const option = dialogue.options.find((candidate) => candidate.text === optionText);
  expect(option).toBeDefined();
  if (!option) {
    throw new Error(`Missing dialogue option: ${optionText}`);
  }
  harness.deltas.consume(Math.floor(serverTime / 600), serverTime);
  expect(
    handleDialogueUiIntent(
      harness,
      PLAYER,
      { action: "dialogue_option", targetId: dialogue.dialogueId, value: option.index },
      serverTime + 600,
    ),
  ).toBe(true);
  return latestDialogue(harness.deltas);
}

function latestDialogue(deltas: DeltaAccumulator): DialogueViewPacket {
  const dialogue = deltas.peek().interfaceOpens?.at(-1)?.dialogue;
  expect(dialogue).toBeDefined();
  if (!dialogue) {
    throw new Error("Expected dialogue interface to be open");
  }
  return dialogue;
}

function questEvent(
  harness: SmokeQuestHarness,
  event: Parameters<typeof dispatchQuestEvent>[2],
  serverTime: number,
  tick?: number,
): readonly string[] {
  return dispatchQuestEvent(
    {
      world: harness.world,
      registries: harness.registries,
      deltas: harness.deltas,
    },
    PLAYER,
    event,
    serverTime,
    tick,
  ).progressedQuestIds;
}

function inventoryCount(harness: SmokeQuestHarness, itemId: string): number {
  const inventory = harness.world.getComponent(PLAYER, "inventory");
  expect(inventory).toBeDefined();
  return inventory ? count(inventory, itemId) : 0;
}

function addInventory(harness: SmokeQuestHarness, itemId: string, quantity: number): void {
  const inventory = harness.world.getComponent(PLAYER, "inventory");
  expect(inventory).toBeDefined();
  if (!inventory) {
    throw new Error("Missing player inventory");
  }
  const result = addItem(inventory, catalogFromItems(harness.registries.item), itemId, quantity);
  expect(result.added).toBe(quantity);
}

function currentJournal(harness: SmokeQuestHarness): string {
  if (getBooleanVar(harness.world, PLAYER, `quest.${harness.quest.varPrefix}.completed`)) {
    return "Completed.";
  }
  const stage = getQuestStage(harness.world, PLAYER, harness.quest);
  return harness.quest.stages.find((candidate) => candidate.stage === stage)?.journalText ?? "";
}

function expectQuestStage(harness: SmokeQuestHarness, stage: number, journalText: string): void {
  expect(getQuestStage(harness.world, PLAYER, harness.quest)).toBe(stage);
  expect(currentJournal(harness)).toBe(journalText);
}

describe("Smoke Over Old Town seed quest", () => {
  it("shows Pippa's pre-quest introduction", () => {
    const harness = setup();

    const greeting = openPippaDialogue(harness, 600);

    expect(greeting).toMatchObject({
      dialogueId: "pippa_hearth_dialogue",
      speakerName: "Pippa Hearth",
      options: [
        { index: 0, text: "What's with all the smoke?" },
        { index: 6, text: "I should go." },
      ],
    });
  });

  it("starts the quest from the explicit help option", () => {
    const harness = setup();

    openPippaDialogue(harness, 600);
    selectDialogueOption(harness, "What's with all the smoke?", 1_200);
    const accepted = selectDialogueOption(harness, "Yes, I'll help.", 1_800);

    expect(accepted.npcText).toContain("First bring me three dry logs");
    expect(getQuestStage(harness.world, PLAYER, harness.quest)).toBe(1);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.spoke_to_pippa")).toBe(
      true,
    );
  });

  it("selects stage-specific reminders and the post-quest thank-you from vars", () => {
    const reminders = [
      [2, "I'm gathering the dry logs.", "Three dry logs"],
      [3, "The cellar rats are next.", "Two cellar rats"],
      [4, "I'm ready to light the hearth.", "Market Kitchen Hearth"],
    ] as const;

    for (const [stage, option, expectedText] of reminders) {
      const harness = setup();
      setQuestStage({ world: harness.world, deltas: harness.deltas }, PLAYER, harness.quest, stage);
      openPippaDialogue(harness, stage * 600);
      const reminder = selectDialogueOption(harness, option, stage * 600 + 600);
      expect(reminder.npcText).toContain(expectedText);
    }

    const completedHarness = setup();
    setQuestStage(
      { world: completedHarness.world, deltas: completedHarness.deltas },
      PLAYER,
      completedHarness.quest,
      5,
    );
    setVar(
      { world: completedHarness.world, deltas: completedHarness.deltas },
      PLAYER,
      "quest.smoke_over_old_town.completed",
      true,
    );
    openPippaDialogue(completedHarness, 3_600);
    const thanks = selectDialogueOption(completedHarness, "The hearth is drawing cleanly.", 4_200);
    expect(thanks.npcText).toContain("Thank you");
  });

  it("requires three dry logs before the hearth can be lit", () => {
    const harness = setup();
    setQuestStage({ world: harness.world, deltas: harness.deltas }, PLAYER, harness.quest, 4);
    harness.deltas.consume(1, 600);

    expect(
      questEvent(
        harness,
        { kind: "object_interacted", objectId: "market_kitchen_hearth", option: "light" },
        1_200,
        2,
      ),
    ).toEqual([]);
    expectQuestStage(
      harness,
      4,
      "The cellar is clear. I should light the Market Kitchen Hearth with the dry logs.",
    );
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.oven_lit")).toBe(false);
    expect(
      getBooleanVar(
        harness.world,
        PLAYER,
        "quest.smoke_over_old_town.object.market_kitchen_hearth.light",
      ),
    ).toBe(false);
  });

  it("plays from baker dialogue through oven lighting and final rewards", () => {
    const harness = setup();

    const greeting = openPippaDialogue(harness, 600);
    expect(greeting).toMatchObject({
      dialogueId: "pippa_hearth_dialogue",
      speakerName: "Pippa Hearth",
      options: [
        { index: 0, text: "What's with all the smoke?" },
        { index: 6, text: "I should go." },
      ],
    });

    selectDialogueOption(harness, "What's with all the smoke?", 1_200);
    selectDialogueOption(harness, "Yes, I'll help.", 1_800);
    expectQuestStage(harness, 1, "Pippa Hearth asked me to help clear the bakery's smoke.");
    expect(questEvent(harness, { kind: "dialogue", npcId: "pippa_hearth" }, 2_400)).toEqual([
      "smoke_over_old_town",
    ]);
    expectQuestStage(harness, 2, "Pippa needs a clean fire. I should gather three dry logs.");

    harness.deltas.consume(4, 2_400);
    for (let gathered = 1; gathered <= 3; gathered += 1) {
      addInventory(harness, "dry_log", 1);
      expect(
        questEvent(
          harness,
          { kind: "item_gained", itemId: "dry_log", quantity: 1 },
          2_400 + gathered * 600,
          4 + gathered,
        ),
      ).toEqual(gathered === 3 ? ["smoke_over_old_town"] : []);
      expect(getNumberVar(harness.world, PLAYER, "quest.smoke_over_old_town.dry_logs")).toBe(
        gathered,
      );
      expect(harness.deltas.peek().varbitDelta).toContainEqual({
        varId: "quest.smoke_over_old_town.dry_logs",
        value: gathered,
      });
      if (gathered < 3) {
        expectQuestStage(harness, 2, "Pippa needs a clean fire. I should gather three dry logs.");
      }
      harness.deltas.consume(4 + gathered, 2_400 + gathered * 600);
    }
    expectQuestStage(harness, 3, "I have the dry logs. I should clear two cellar rats.");
    expect(inventoryCount(harness, "dry_log")).toBe(3);

    expect(questEvent(harness, { kind: "npc_killed", npcId: "cellar_rat" }, 4_800, 8)).toEqual([]);
    expect(getNumberVar(harness.world, PLAYER, "quest.smoke_over_old_town.kill.cellar_rat")).toBe(
      1,
    );
    expect(getNumberVar(harness.world, PLAYER, "quest.smoke_over_old_town.rats_killed")).toBe(1);
    expect(harness.deltas.peek().varbitDelta).toContainEqual({
      varId: "quest.smoke_over_old_town.rats_killed",
      value: 1,
    });
    harness.deltas.consume(8, 4_800);

    expect(questEvent(harness, { kind: "npc_killed", npcId: "cellar_rat" }, 5_400, 9)).toEqual([
      "smoke_over_old_town",
    ]);
    expect(getNumberVar(harness.world, PLAYER, "quest.smoke_over_old_town.rats_killed")).toBe(2);
    expect(harness.deltas.peek().varbitDelta).toContainEqual({
      varId: "quest.smoke_over_old_town.rats_killed",
      value: 2,
    });
    expectQuestStage(
      harness,
      4,
      "The cellar is clear. I should light the Market Kitchen Hearth with the dry logs.",
    );

    harness.deltas.consume(9, 5_400);
    expect(
      questEvent(
        harness,
        { kind: "object_interacted", objectId: "market_kitchen_hearth", option: "light" },
        6_000,
        10,
      ),
    ).toEqual(["smoke_over_old_town"]);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.oven_lit")).toBe(true);
    expect(harness.deltas.peek().varbitDelta).toContainEqual({
      varId: "quest.smoke_over_old_town.oven_lit",
      value: true,
    });
    expectQuestStage(
      harness,
      5,
      "The bakery hearth burns cleanly. Smoke Over Old Town is complete.",
    );
    expect(inventoryCount(harness, "dry_log")).toBe(0);

    harness.deltas.consume(10, 6_000);
    const finalDialogue = openPippaDialogue(harness, 6_600);
    expect(finalDialogue.options).toContainEqual({
      index: 5,
      text: "The hearth is drawing cleanly.",
    });
    expect(currentJournal(harness)).toBe("Completed.");
    expect(inventoryCount(harness, "bread")).toBe(5);
    expect(inventoryCount(harness, "coin")).toBe(50);
    expect(harness.world.getComponent(PLAYER, "skills")?.skills.cooking?.xp).toBe(100);
    expect(getNumberVar(harness.world, PLAYER, "quest.points")).toBe(1);
    expect(getBooleanVar(harness.world, PLAYER, "unlock.bakery_range")).toBe(true);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.completed")).toBe(true);
  });

  it("does not duplicate rewards when the quest is completed again", () => {
    const harness = setup();

    // Fast-forward to stage 5 (oven lit, quest not yet completed).
    setQuestStage({ world: harness.world, deltas: harness.deltas }, PLAYER, harness.quest, 5);
    setVar(
      { world: harness.world, deltas: harness.deltas },
      PLAYER,
      "quest.smoke_over_old_town.oven_lit",
      true,
    );
    harness.deltas.consume(1, 600);

    // Complete the quest via the tick-loop trigger phase.
    expect(
      processQuestTriggers(
        { world: harness.world, registries: harness.registries, deltas: harness.deltas },
        1_200,
        2,
      ).progressedQuestIds,
    ).toEqual(["smoke_over_old_town"]);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.completed")).toBe(true);
    expect(inventoryCount(harness, "bread")).toBe(5);
    expect(inventoryCount(harness, "coin")).toBe(50);
    expect(getNumberVar(harness.world, PLAYER, "quest.points")).toBe(1);

    // A second trigger pass must not re-apply rewards.
    harness.deltas.consume(2, 1_200);
    expect(
      processQuestTriggers(
        { world: harness.world, registries: harness.registries, deltas: harness.deltas },
        1_800,
        3,
      ).progressedQuestIds,
    ).toEqual([]);
    expect(inventoryCount(harness, "bread")).toBe(5);
    expect(inventoryCount(harness, "coin")).toBe(50);
    expect(getNumberVar(harness.world, PLAYER, "quest.points")).toBe(1);
  });

  it("completes the quest via the tick-loop trigger phase from stage 5", () => {
    const harness = setup();

    // Simulate the player having lit the oven: stage 5 with no objectives.
    setQuestStage({ world: harness.world, deltas: harness.deltas }, PLAYER, harness.quest, 5);
    harness.deltas.consume(1, 600);

    const result = processQuestTriggers(
      { world: harness.world, registries: harness.registries, deltas: harness.deltas },
      1_200,
      2,
    );

    expect(result.progressedQuestIds).toEqual(["smoke_over_old_town"]);
    expect(getQuestStage(harness.world, PLAYER, harness.quest)).toBe(6);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.completed")).toBe(true);
    expect(getBooleanVar(harness.world, PLAYER, "unlock.bakery_range")).toBe(true);
    expect(inventoryCount(harness, "bread")).toBe(5);
    expect(inventoryCount(harness, "coin")).toBe(50);
    expect(harness.world.getComponent(PLAYER, "skills")?.skills.cooking?.xp).toBe(100);
    expect(getNumberVar(harness.world, PLAYER, "quest.points")).toBe(1);
    expect(harness.deltas.peek().varbitDelta).toContainEqual({
      varId: "quest.smoke_over_old_town.completed",
      value: true,
    });
  });
});
