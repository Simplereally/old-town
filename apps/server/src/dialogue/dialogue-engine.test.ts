import {
  type ContentRegistries,
  type DialogueDef,
  entityId,
  type ItemDef,
  type NpcDef,
  type QuestDef,
  type SkillDef,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  type DialogueContext,
  handleDialogueUiIntent,
  handleNpcDialogueIntent,
} from "./dialogue-engine";

const PLAYER = entityId(0);
const BAKER = entityId(1);

const BREAD: ItemDef = {
  id: "bread",
  name: "Bread",
  stackable: false,
  tradeable: true,
  examine: "A loaf of bread.",
  icon: "icon_bread",
  value: 4,
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

const SMOKE_QUEST: QuestDef = {
  id: "smoke_over_old_town",
  name: "Smoke Over Old Town",
  questPoints: 1,
  requirements: [],
  varPrefix: "smoke_over_old_town",
  stages: [
    { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
    { stage: 1, journalText: "Help the baker.", objectives: [], triggers: [] },
  ],
  rewards: [],
};

const BAKER_NPC: NpcDef = {
  id: "baker",
  name: "Baker",
  size: 1,
  respawnTicks: 1,
  wanderRadius: 0,
  dialogueId: "baker_dialogue",
  options: [{ label: "Talk-to", actionId: "talk", priority: 10, requiredDistance: 1 }],
};

const BAKER_DIALOGUE: DialogueDef = {
  id: "baker_dialogue",
  name: "Baker Dialogue",
  root: "start",
  nodes: [
    {
      id: "start",
      npcText: "The oven needs help.",
      requirements: [],
      effects: [],
      playerOptions: [
        {
          text: "I'll help.",
          next: "accepted",
          requirements: [],
          effects: [
            { kind: "start_quest", questId: "smoke_over_old_town" },
            { kind: "set_var", key: "quest.smoke.accepted", value: true },
            { kind: "add_item", itemId: "bread", quantity: 1 },
            { kind: "send_message", text: "You start helping the baker." },
          ],
        },
        {
          text: "Hidden branch.",
          next: "hidden",
          requirements: [{ kind: "var", key: "quest.smoke.visible", op: "eq", value: true }],
          effects: [{ kind: "set_var", key: "quest.smoke.hidden", value: true }],
        },
      ],
    },
    {
      id: "accepted",
      npcText: "Bring dry logs.",
      requirements: [],
      effects: [],
    },
    {
      id: "hidden",
      npcText: "You found the hidden branch.",
      requirements: [],
      effects: [],
    },
  ],
};

function registries(): ContentRegistries {
  return {
    item: new Map([[BREAD.id, BREAD]]),
    npc: new Map([[BAKER_NPC.id, BAKER_NPC]]),
    object: new Map(),
    processingRecipe: new Map(),
    skill: new Map([[COOKING.id, COOKING]]),
    resourceNode: new Map(),
    spell: new Map(),
    dropTable: new Map(),
    quest: new Map([[SMOKE_QUEST.id, SMOKE_QUEST]]),
    dialogue: new Map([[BAKER_DIALOGUE.id, BAKER_DIALOGUE]]),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
  };
}

function setup(): {
  readonly ctx: DialogueContext;
  readonly world: World;
  readonly deltas: DeltaAccumulator;
} {
  const world = createWorld();
  const player = world.createEntity();
  const baker = world.createEntity();
  expect(player).toBe(PLAYER);
  expect(baker).toBe(BAKER);
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 10, y: 10, plane: 0 });
  world.setComponent(PLAYER, "movement", { entityId: PLAYER, mode: "walk", path: [] });
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:player", 28));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(BAKER, "position", { entityId: BAKER, x: 11, y: 10, plane: 0 });
  world.setComponent(BAKER, "npc", {
    entityId: BAKER,
    npcId: "baker",
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 0,
  });

  const deltas = new DeltaAccumulator();
  return {
    world,
    deltas,
    ctx: {
      world,
      collision: new CollisionMap(createRuntimeMap()),
      deltas,
      actionRuntime: new ActionRuntime(),
      registries: registries(),
    },
  };
}

function openBakerDialogue(ctx: DialogueContext, serverTime = 600): void {
  expect(
    handleNpcDialogueIntent(ctx, PLAYER, { npcEntityId: BAKER, actionId: "talk" }, serverTime, 1),
  ).toBe(true);
}

describe("dialogue engine", () => {
  it("routes Talk-to NPC intents to dialogue and hides unavailable options", () => {
    const { ctx, deltas } = setup();

    openBakerDialogue(ctx);

    expect(deltas.peek().interfaceOpens?.[0]?.dialogue).toEqual({
      dialogueId: "baker_dialogue",
      nodeId: "start",
      speakerName: "Baker",
      npcText: "The oven needs help.",
      options: [{ index: 0, text: "I'll help." }],
    });
  });

  it("applies option effects and advances to the next node", () => {
    const { ctx, world, deltas } = setup();
    openBakerDialogue(ctx);
    deltas.consume(1, 600);

    expect(
      handleDialogueUiIntent(
        ctx,
        PLAYER,
        { action: "dialogue_option", targetId: "baker_dialogue", value: 0 },
        1_200,
      ),
    ).toBe(true);

    const packet = deltas.peek();
    expect(world.getComponent(PLAYER, "vars")?.values).toMatchObject({
      "quest.smoke.accepted": true,
      "quest.smoke_over_old_town.completed": false,
      "quest.smoke_over_old_town.stage": 1,
    });
    expect(world.getComponent(PLAYER, "inventory")?.slots[0]).toMatchObject({
      itemId: "bread",
      quantity: 1,
    });
    expect(packet.chat?.[0]?.text).toBe("You start helping the baker.");
    expect(packet.interfaceOpens?.[0]?.dialogue).toMatchObject({
      dialogueId: "baker_dialogue",
      nodeId: "accepted",
      speakerName: "Baker",
      npcText: "Bring dry logs.",
      options: [],
    });
  });

  it("rejects invalid option indexes", () => {
    const { ctx, world, deltas } = setup();
    openBakerDialogue(ctx);
    deltas.consume(1, 600);

    expect(
      handleDialogueUiIntent(
        ctx,
        PLAYER,
        { action: "dialogue_option", targetId: "baker_dialogue", value: 99 },
        1_200,
      ),
    ).toBe(true);

    expect(world.getComponent(PLAYER, "dialogue")).toMatchObject({
      dialogueId: "baker_dialogue",
      nodeId: "start",
    });
    expect(deltas.peek().chat?.[0]?.text).toBe("That dialogue option is unavailable.");
  });

  it("rejects unavailable options even when a client sends their original index", () => {
    const { ctx, world, deltas } = setup();
    openBakerDialogue(ctx);
    deltas.consume(1, 600);

    handleDialogueUiIntent(
      ctx,
      PLAYER,
      { action: "dialogue_option", targetId: "baker_dialogue", value: 1 },
      1_200,
    );

    expect(world.getComponent(PLAYER, "vars")?.values["quest.smoke.hidden"]).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("That dialogue option is unavailable.");
  });

  it("closes active dialogue through UI intent", () => {
    const { ctx, world, deltas } = setup();
    openBakerDialogue(ctx);
    deltas.consume(1, 600);

    expect(
      handleDialogueUiIntent(
        ctx,
        PLAYER,
        { action: "dialogue_close", targetId: "baker_dialogue" },
        1_200,
      ),
    ).toBe(true);

    expect(world.hasComponent(PLAYER, "dialogue")).toBe(false);
    expect(deltas.peek().interfaceCloses).toEqual([{ interfaceId: "dialogue" }]);
  });
});
