import { describe, expect, it } from "vitest";
import { validateContentGraph } from "./content-references";
import type { ContentRegistries } from "./content-registry";

function buildRegistries(overrides: Partial<ContentRegistries> = {}): ContentRegistries {
  return {
    item: new Map(),
    npc: new Map(),
    object: new Map(),
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
