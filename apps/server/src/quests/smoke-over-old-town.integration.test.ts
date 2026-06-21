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
import { getBooleanVar, getNumberVar, getQuestStage } from "../vars/player-vars";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { dispatchQuestEvent } from "./quest-engine";

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
  it("plays from baker dialogue through oven lighting and final rewards", () => {
    const harness = setup();

    const greeting = openPippaDialogue(harness, 600);
    expect(greeting).toMatchObject({
      dialogueId: "baker_dialogue",
      speakerName: "Pippa Hearth",
      options: [
        { index: 0, text: "What happened to the oven?" },
        { index: 3, text: "I should go." },
      ],
    });

    selectDialogueOption(harness, "What happened to the oven?", 1_200);
    selectDialogueOption(harness, "I'll sort it out.", 1_800);
    expectQuestStage(
      harness,
      10,
      "Pippa Hearth needs a clean fire for the bakery oven. I should gather three dry logs.",
    );
    expect(inventoryCount(harness, "smoke_over_old_town_baker_oven_key")).toBe(1);

    addInventory(harness, "dry_log", 3);
    expect(
      questEvent(harness, { kind: "item_gained", itemId: "dry_log", quantity: 3 }, 2_400),
    ).toEqual(["smoke_over_old_town"]);
    expectQuestStage(
      harness,
      20,
      "I have the dry logs. I should clear two cellar rats before the oven can be lit.",
    );
    expect(inventoryCount(harness, "dry_log")).toBe(3);

    expect(questEvent(harness, { kind: "npc_killed", npcId: "cellar_rat" }, 3_000)).toEqual([]);
    expect(getNumberVar(harness.world, PLAYER, "quest.smoke_over_old_town.kill.cellar_rat")).toBe(
      1,
    );
    expect(questEvent(harness, { kind: "npc_killed", npcId: "cellar_rat" }, 3_600)).toEqual([
      "smoke_over_old_town",
    ]);
    expectQuestStage(
      harness,
      30,
      "The cellar rats are handled. I should light the Smoking Oven with the dry logs and Pippa's key.",
    );

    expect(
      questEvent(
        harness,
        { kind: "object_interacted", objectId: "quest_oven", option: "light" },
        4_200,
      ),
    ).toEqual(["smoke_over_old_town"]);
    expectQuestStage(
      harness,
      40,
      "The bakery oven is lit. I should return to Pippa Hearth for my reward.",
    );
    expect(inventoryCount(harness, "dry_log")).toBe(0);
    expect(inventoryCount(harness, "smoke_over_old_town_baker_oven_key")).toBe(0);

    harness.deltas.consume(7, 4_200);
    const finalDialogue = openPippaDialogue(harness, 4_800);
    expect(finalDialogue.options).toContainEqual({
      index: 2,
      text: "The oven's breathing again.",
    });
    expect(currentJournal(harness)).toBe("Completed.");
    expect(inventoryCount(harness, "smoke_over_old_town_old_town_bread")).toBe(1);
    expect(inventoryCount(harness, "coin")).toBe(10);
    expect(harness.world.getComponent(PLAYER, "skills")?.skills.cooking?.xp).toBe(50);
    expect(getNumberVar(harness.world, PLAYER, "quest.points")).toBe(1);
    expect(getBooleanVar(harness.world, PLAYER, "unlock.bakery_range")).toBe(true);
    expect(getBooleanVar(harness.world, PLAYER, "quest.smoke_over_old_town.completed")).toBe(true);
  });
});
