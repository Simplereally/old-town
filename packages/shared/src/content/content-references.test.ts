import { describe, expect, it } from "vitest";
import type { ActivityDef } from "../content-schemas/activity";
import type { BossDef } from "../content-schemas/boss";
import type { ContractDef } from "../content-schemas/contract";
import type { DialogueDef } from "../content-schemas/dialogue";
import type { DropTableDef } from "../content-schemas/drop-table";
import type { ItemDef } from "../content-schemas/item";
import type { NpcDef } from "../content-schemas/npc";
import type { ObjectDef } from "../content-schemas/object";
import type { ProcessingRecipeDef } from "../content-schemas/processing-recipe";
import type { QuestDef } from "../content-schemas/quest";
import type { RegionMapDef } from "../content-schemas/region-map";
import type { ServiceFeeDef } from "../content-schemas/service-fee";
import type { ShopDef } from "../content-schemas/shop";
import type { SpellDef } from "../content-schemas/spell";
import type { StatusEffectDef } from "../content-schemas/status-effect";
import type { TrailDef } from "../content-schemas/trail";
import { validateContentGraph } from "./content-references";
import type { ContentRegistries } from "./content-registries";

function buildRegistries(overrides: Partial<ContentRegistries> = {}): ContentRegistries {
  return {
    item: new Map(),
    npc: new Map(),
    object: new Map(),
    prayer: new Map(),
    processingRecipe: new Map(),
    skill: new Map(),
    resourceNode: new Map(),
    spell: new Map(),
    dropTable: new Map(),
    quest: new Map(),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
    shop: new Map(),
    bank: new Map(),
    serviceFee: new Map(),
    statusEffect: new Map(),
    contract: new Map(),
    property: new Map(),
    charter: new Map(),
    activity: new Map(),
    boss: new Map(),
    trail: new Map(),
    audio: new Map(),
    ...overrides,
  };
}

function sources(entries: [string, string][]): ReadonlyMap<string, string> {
  return new Map(entries);
}

describe("validateContentGraph", () => {
  it("returns no issues for empty registries", () => {
    const result = validateContentGraph(buildRegistries(), sources([]));
    expect(result.issues).toEqual([]);
  });

  it("flags a resource node referencing a missing output item", () => {
    const registries = buildRegistries({
      resourceNode: new Map([
        [
          "oak_tree",
          {
            id: "oak_tree",
            name: "Oak Tree",
            skill: "woodcutting",
            requiredLevel: 1,
            baseXp: 1,
            actionTicks: 4,
            depletionChance: 0.1,
            respawnTicks: 30,
            toolTags: ["axe"],
            outputItemId: "missing_log",
            baseChance: 0.2,
            levelScale: 0.005,
            outputQuantity: 1,
          },
        ],
      ]),
    });

    const result = validateContentGraph(
      registries,
      sources([["resourceNode:oak_tree", "nodes/trees.json"]]),
    );
    expect(result.issues).toHaveLength(2);
    const missingLog = result.issues.find((i) => i.message.includes("missing_log"));
    expect(missingLog?.path).toBe("nodes/trees.json");
  });

  it("flags an NPC referencing a missing drop table", () => {
    const registries = buildRegistries({
      npc: new Map([
        [
          "goblin",
          {
            id: "goblin",
            name: "Goblin",
            size: 1 as const,
            respawnTicks: 30,
            drops: "ghost_table",
            options: [],
            wanderRadius: 0,
            movementType: "static" as const,
            aggressionMode: "peaceful" as const,
            contractEligible: false,
          },
        ],
      ]),
    });

    const result = validateContentGraph(registries, sources([]));
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("ghost_table");
  });

  it("flags a dialogue option linking to a missing node", () => {
    const registries = buildRegistries({
      dialogue: new Map([
        [
          "baker_dialogue",
          {
            id: "baker_dialogue",
            root: "start",
            nodes: [
              {
                id: "start",
                npcText: "Hi",
                requirements: [],
                playerOptions: [{ text: "Bye", next: "nowhere", requirements: [], effects: [] }],
                effects: [],
              },
            ],
          },
        ],
      ]),
    });

    const result = validateContentGraph(
      registries,
      sources([["dialogue:baker_dialogue", "dialogue/baker.json"]]),
    );
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("nowhere");
  });

  it("flags a spell with a missing bead cost item", () => {
    const registries = buildRegistries({
      spell: new Map([
        [
          "teleport",
          {
            id: "teleport",
            name: "Teleport",
            spellbook: "common" as const,
            requiredMagic: 1,
            beadCosts: [{ itemId: "missing_bead", quantity: 1 }],
            castXp: 0,
            rangeTiles: 0,
            targetType: "self" as const,
            requiresLineOfSight: false,
            effect: { kind: "bind", durationTicks: 5, maxHit: 0 },
          },
        ],
      ]),
    });

    const result = validateContentGraph(registries, sources([]));
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("missing_bead");
  });

  it("flags a quest objective referencing a missing NPC", () => {
    const registries = buildRegistries({
      quest: new Map([
        [
          "quest_a",
          {
            id: "quest_a",
            name: "Quest A",
            questPoints: 1,
            varPrefix: "quest_a",
            requirements: [],
            rewards: [],
            stages: [
              {
                stage: 0,
                journalText: "Start",
                objectives: [],
                triggers: [],
              },
              {
                stage: 1,
                journalText: "Talk",
                objectives: [{ kind: "talk", npcId: "missing_npc" }],
                triggers: [],
              },
            ],
          },
        ],
      ]),
    });

    const result = validateContentGraph(registries, sources([]));
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("missing_npc");
  });

  it("passes when all references are valid", () => {
    const registries = buildRegistries({
      item: new Map([
        [
          "oak_log",
          {
            id: "oak_log",
            name: "Oak Log",
            stackable: false,
            tradeable: true,
            examine: "A log.",
            icon: "icon",
            value: 1,
            options: [],
            tags: [],
          },
        ],
      ]),
      skill: new Map([
        [
          "woodcutting",
          {
            id: "woodcutting",
            name: "Woodcutting",
            maxLevel: 99,
            xpTableId: "oldtown_default" as const,
            combat: false,
            unlocks: [],
          },
        ],
      ]),
      resourceNode: new Map([
        [
          "oak_tree",
          {
            id: "oak_tree",
            name: "Oak Tree",
            skill: "woodcutting",
            requiredLevel: 1,
            baseXp: 1,
            actionTicks: 4,
            depletionChance: 0.1,
            respawnTicks: 30,
            toolTags: ["axe"],
            outputItemId: "oak_log",
            baseChance: 0.2,
            levelScale: 0.005,
            outputQuantity: 1,
          },
        ],
      ]),
    });

    const result = validateContentGraph(registries, sources([]));
    expect(result.issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Branch-coverage: exercise every per-kind reference check in the graph.
// Each test builds a registry with a single dangling reference and asserts the
// validator flags exactly that dependency. Fixtures are minimal partial defs
// cast to the full def type — `validateContentGraph` only reads the fields it
// checks, so the rest of the shape is irrelevant for these unit tests.
// ---------------------------------------------------------------------------

describe("validateContentGraph branch coverage", () => {
  function emptySources(): ReadonlyMap<string, string> {
    return new Map();
  }

  it("flags spell alchemy effect referencing a missing coin item", () => {
    const registries = buildRegistries({
      spell: new Map<string, SpellDef>([
        [
          "coin_spell",
          {
            id: "coin_spell",
            name: "Coin Spell",
            spellbook: "common",
            requiredMagic: 1,
            beadCosts: [],
            castXp: 0,
            rangeTiles: 0,
            targetType: "self",
            requiresLineOfSight: false,
            effect: { kind: "alchemy", coinItemId: "missing_coin", valueMultiplier: 1 },
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_coin"))).toBe(true);
  });

  it("flags spell enchant effect referencing missing from/to items", () => {
    const registries = buildRegistries({
      spell: new Map<string, SpellDef>([
        [
          "enchant_spell",
          {
            id: "enchant_spell",
            name: "Enchant",
            spellbook: "common",
            requiredMagic: 1,
            beadCosts: [],
            castXp: 0,
            rangeTiles: 0,
            targetType: "item",
            requiresLineOfSight: false,
            effect: { kind: "enchant", fromItemId: "missing_from", toItemId: "missing_to" },
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_from"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_to"))).toBe(true);
  });

  it("flags NPC dialogueId and trophyId referencing missing defs", () => {
    const registries = buildRegistries({
      npc: new Map<string, NpcDef>([
        [
          "npc_a",
          {
            id: "npc_a",
            name: "NPC A",
            size: 1,
            respawnTicks: 30,
            dialogueId: "missing_dialogue",
            trophyId: "missing_trophy",
            options: [],
            wanderRadius: 0,
            movementType: "static",
            aggressionMode: "peaceful",
            contractEligible: false,
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_dialogue"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_trophy"))).toBe(true);
  });

  it("flags object resourceNodeId and dialogueId referencing missing defs", () => {
    const registries = buildRegistries({
      object: new Map<string, ObjectDef>([
        [
          "obj_a",
          {
            id: "obj_a",
            name: "Object A",
            resourceNodeId: "missing_node",
            dialogueId: "missing_dialogue",
            options: [],
          } as unknown as ObjectDef,
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_node"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_dialogue"))).toBe(true);
  });

  it("flags processing recipe referencing missing skill, items, and station object", () => {
    const registries = buildRegistries({
      processingRecipe: new Map<string, ProcessingRecipeDef>([
        [
          "recipe_a",
          {
            id: "recipe_a",
            name: "Recipe A",
            skill: "missing_skill",
            requiredLevel: 1,
            actionTicks: 1,
            stationObjectIds: ["missing_station"],
            inputItemId: "missing_input",
            inputQuantity: 1,
            successItemId: "missing_success",
            successQuantity: 1,
            failureItemId: "missing_failure",
            failureQuantity: 1,
            xp: 0,
            failureChance: 0,
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_skill"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_input"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_success"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_failure"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_station"))).toBe(true);
  });

  it("flags drop table entries and alwaysDrops referencing missing items", () => {
    const registries = buildRegistries({
      dropTable: new Map<string, DropTableDef>([
        [
          "drops_a",
          {
            id: "drops_a",
            rolls: 1,
            alwaysDrops: [{ itemId: "missing_always", quantity: 1 }],
            entries: [
              {
                itemId: "missing_entry",
                min: 1,
                max: 1,
                weight: 1,
                requirements: [{ kind: "item", itemId: "missing_req_item", quantity: 1 }],
                rarity: "common",
              },
            ],
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_always"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_entry"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_req_item"))).toBe(true);
  });

  it("flags quest requirements (skill/item/quest_stage/kill_count) and reward effects", () => {
    const registries = buildRegistries({
      quest: new Map<string, QuestDef>([
        [
          "quest_a",
          {
            id: "quest_a",
            name: "Quest A",
            questPoints: 1,
            varPrefix: "qa",
            requirements: [
              { kind: "skill", skillId: "missing_skill", level: 1 },
              { kind: "item", itemId: "missing_item", quantity: 1 },
              { kind: "quest_stage", questId: "missing_quest", minStage: 0 },
              { kind: "kill_count", questId: "missing_quest2", npcId: "missing_npc", count: 1 },
            ],
            rewards: [
              { kind: "add_item", itemId: "missing_reward_item", quantity: 1 },
              { kind: "add_xp", skillId: "missing_xp_skill", amount: 1 },
              { kind: "start_quest", questId: "missing_start_quest" },
              { kind: "complete_quest", questId: "missing_complete_quest" },
            ],
            stages: [
              { stage: 0, journalText: "start", objectives: [], triggers: [] },
              {
                stage: 1,
                journalText: "do",
                objectives: [
                  { kind: "kill", npcId: "missing_kill_npc", count: 1 },
                  { kind: "gather", itemId: "missing_gather_item", quantity: 1 },
                  { kind: "have_item", itemId: "missing_have_item", quantity: 1 },
                  { kind: "object", objectId: "missing_object", option: "use" },
                ],
                triggers: [
                  {
                    on: "stage_enter",
                    effects: [{ kind: "remove_item", itemId: "missing_remove_item", quantity: 1 }],
                  },
                ],
              },
            ],
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_quest"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_quest2"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_npc"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_reward_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_xp_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_start_quest"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_complete_quest"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_kill_npc"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_gather_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_have_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_object"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_remove_item"))).toBe(true);
  });

  it("flags dialogue node and option requirements/effects", () => {
    const registries = buildRegistries({
      dialogue: new Map<string, DialogueDef>([
        [
          "dlg_a",
          {
            id: "dlg_a",
            root: "start",
            nodes: [
              {
                id: "start",
                npcText: "hi",
                requirements: [{ kind: "skill", skillId: "missing_skill", level: 1 }],
                effects: [{ kind: "add_item", itemId: "missing_node_item", quantity: 1 }],
                playerOptions: [
                  {
                    text: "ok",
                    next: "start",
                    requirements: [{ kind: "item", itemId: "missing_opt_item", quantity: 1 }],
                    effects: [{ kind: "add_xp", skillId: "missing_opt_skill", amount: 1 }],
                  },
                ],
              },
            ],
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_node_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_opt_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_opt_skill"))).toBe(true);
  });

  it("flags region map default/override materials, objects, spawns, and quest-gated spawn points", () => {
    const registries = buildRegistries({
      regionMap: new Map<string, RegionMapDef>([
        [
          "0:0:0",
          {
            region: { rx: 0, ry: 0, plane: 0 },
            tiles: {
              default: { underlayId: "missing_default_mat" },
              overrides: [
                { x: 0, y: 0, underlayId: "missing_override_mat" },
                { x: 1, y: 1, overlayId: "missing_overlay_mat" },
              ],
            },
            objects: [{ objectId: "missing_object", x: 0, y: 0, rotation: 0 }],
            npcSpawns: [{ npcId: "missing_npc", x: 0, y: 0 }],
            groundItemSpawns: [{ itemId: "missing_item", quantity: 1, x: 0, y: 0 }],
            resourceNodeSpawns: [{ resourceNodeId: "missing_node", x: 0, y: 0 }],
            contractSpawns: [],
            playerSpawnPoints: [{ x: 0, y: 0, requiresQuest: "missing_pquest" }],
            deathRespawnPoints: [{ x: 0, y: 0, requiresQuest: "missing_dquest" }],
            triggers: [],
          } as unknown as RegionMapDef,
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_default_mat"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_override_mat"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_overlay_mat"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_object"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_npc"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_node"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_pquest"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_dquest"))).toBe(true);
  });

  it("flags shop stock referencing a missing item", () => {
    const registries = buildRegistries({
      shop: new Map<string, ShopDef>([
        [
          "shop_a",
          {
            id: "shop_a",
            name: "Shop A",
            stock: [{ itemId: "missing_stock_item", quantity: 1, maxQuantity: 1, restockRate: 1 }],
            currency: "coin",
            sellMultiplier: 0.6,
            buyMultiplier: 1.0,
            restockTicks: 100,
            buyPolicy: "always",
            sellPolicy: "does_not_buy",
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_stock_item"))).toBe(true);
  });

  it("flags service fee material cost and requiredQuest referencing missing defs", () => {
    const registries = buildRegistries({
      serviceFee: new Map<string, ServiceFeeDef>([
        [
          "fee_a",
          {
            id: "fee_a",
            name: "Fee A",
            serviceType: "repair",
            baseFee: 0,
            levelMultiplier: 1,
            materialCost: [{ itemId: "missing_mat_item", quantity: 1 }],
            currency: "coin",
            requiresQuest: "missing_fee_quest",
            outputQuantity: 1,
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_mat_item"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("missing_fee_quest"))).toBe(true);
  });

  it("flags status effect cureItems referencing missing items", () => {
    const registries = buildRegistries({
      statusEffect: new Map<string, StatusEffectDef>([
        [
          "effect_a",
          {
            id: "effect_a",
            name: "Effect A",
            durationTicks: 10,
            maxStacks: 1,
            effectType: "debuff",
            statModifiers: [],
            cureItems: ["missing_cure_item"],
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_cure_item"))).toBe(true);
  });

  it("flags item consumable statusEffectId, curesStatus, and boostsSkill references", () => {
    const registries = buildRegistries({
      item: new Map<string, ItemDef>([
        [
          "potion_a",
          {
            id: "potion_a",
            name: "Potion A",
            stackable: false,
            tradeable: true,
            examine: "A potion.",
            icon: "icon",
            value: 1,
            options: [],
            tags: [],
            consumable: {
              consumeTicks: 1,
              effectType: "apply_status",
              statusEffectId: "missing_status",
              curesStatus: "missing_cures",
              boostsSkill: { skillId: "missing_boost_skill", boostAmount: 1 },
            },
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_status"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_cures"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_boost_skill"))).toBe(true);
  });

  it("flags contract target creatures, rewards, and requiredQuest references", () => {
    const registries = buildRegistries({
      contract: new Map<string, ContractDef>([
        [
          "contract_a",
          {
            id: "contract_a",
            name: "Contract A",
            contractType: "bounty",
            targetCreatureIds: ["missing_creature"],
            targetCount: 1,
            rewardItems: [{ itemId: "missing_reward", quantity: 1 }],
            rewardXp: [{ skillId: "missing_xp_skill", amount: 1 }],
            requiredLevel: 1,
            maxConcurrent: 1,
            completionTrigger: "kill",
            requiredQuest: "missing_contract_quest",
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_creature"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_reward"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_xp_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_contract_quest"))).toBe(true);
  });

  it("flags activity entry, skills, steps, rewards, token, sinks, and bulk inputs/outputs", () => {
    const registries = buildRegistries({
      activity: new Map<string, ActivityDef>([
        [
          "activity_a",
          {
            id: "activity_a",
            name: "Activity A",
            category: "skilling",
            risk: "safe",
            skills: ["missing_skill"],
            entryRequirement: { skillId: "missing_entry_skill", level: 1 },
            location: { description: "loc" },
            steps: [
              {
                id: "step_a",
                name: "Step A",
                description: "desc",
                skillId: "missing_step_skill",
                requiredLevel: 1,
                actionTicks: 1,
                inputs: [{ itemId: "missing_step_input", quantity: 1 }],
                outputs: [{ itemId: "missing_step_output", quantity: 1 }],
                xpReward: [{ skillId: "missing_step_xp", amount: 1 }],
                failureChance: 0,
              },
            ],
            rewards: [
              { type: "xp", skillId: "missing_reward_skill", quantity: 1 },
              { type: "item", itemId: "missing_reward_item", quantity: 1 },
              { type: "token", tokenId: "missing_token_id", quantity: 1 },
            ],
            tokenId: "missing_activity_token",
            tokenSink: [{ itemId: "missing_sink_item", quantity: 1 }],
            loopDescription: "loop",
            failureState: "fail",
            inputs: [{ itemId: "missing_bulk_input", quantity: 1 }],
            outputs: [{ itemId: "missing_bulk_output", quantity: 1 }],
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_entry_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_step_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_step_xp"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_step_input"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_step_output"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_reward_skill"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_reward_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_token_id"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_activity_token"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_sink_item"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_bulk_input"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_bulk_output"))).toBe(true);
  });

  it("flags boss npcId, dropTableId, trophyId, uniqueDropIds, and accessRequirements", () => {
    const registries = buildRegistries({
      boss: new Map<string, BossDef>([
        [
          "boss_a",
          {
            id: "boss_a",
            name: "Boss A",
            category: "starter",
            npcId: "missing_boss_npc",
            combatLevelBand: { low: 1, high: 10 },
            accessRequirements: [{ kind: "skill", skillId: "missing_access_skill", level: 1 }],
            mechanics: [],
            lair: { type: "room", threshold: "door", area: "a", safeRating: "safe" },
            dropTableId: "missing_boss_drops",
            trophyId: "missing_boss_trophy",
            uniqueDropIds: ["missing_unique_drop"],
            failureState: "fail",
            whatItTeaches: "x",
            whatItDoesNotReplace: "y",
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const messages = result.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes("missing_boss_npc"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_boss_drops"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_boss_trophy"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_unique_drop"))).toBe(true);
    expect(messages.some((m) => m.includes("missing_access_skill"))).toBe(true);
  });

  it("flags trail buff referencing a missing status effect", () => {
    const registries = buildRegistries({
      trail: new Map<string, TrailDef>([
        [
          "trail_a",
          {
            id: "trail_a",
            name: "Trail A",
            startTile: { x: 0, y: 0, plane: 0 },
            endTile: { x: 1, y: 1, plane: 0 },
            hidden: false,
            discoveryRadius: 3,
            buff: "missing_trail_buff",
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    expect(result.issues.some((i) => i.message.includes("missing_trail_buff"))).toBe(true);
  });

  it("produces a JSON-pointer-style pointer for a referenced field", () => {
    const registries = buildRegistries({
      resourceNode: new Map([
        [
          "oak_tree",
          {
            id: "oak_tree",
            name: "Oak Tree",
            skill: "woodcutting",
            requiredLevel: 1,
            baseXp: 1,
            actionTicks: 4,
            depletionChance: 0.1,
            respawnTicks: 30,
            toolTags: ["axe"],
            outputItemId: "missing_log",
            baseChance: 0.2,
            levelScale: 0.005,
            outputQuantity: 1,
          },
        ],
      ]),
    });
    const result = validateContentGraph(registries, emptySources());
    const issue = result.issues.find((i) => i.message.includes("missing_log"));
    expect(issue?.pointer).toBe("/outputItemId");
    expect(issue?.suggestion).toBe("create_or_fix_missing_reference");
    expect(issue?.dependency).toEqual(["resourceNode:oak_tree", "item:missing_log"]);
  });
});
