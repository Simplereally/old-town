import { describe, expect, it } from "vitest";
import { type ContentKind, contentSchemas } from "./index";

function validate(kind: ContentKind, value: unknown) {
  return contentSchemas[kind].safeParse(value);
}

const validItem = {
  id: "pennywrought_axe",
  name: "Pennywrought Axe",
  stackable: false,
  tradeable: true,
  examine: "A sturdy chopping tool.",
  icon: "icon_pennywrought_axe",
  value: 16,
  tier: "pennywrought",
  tierOrder: 1,
  family: "axe",
  category: "melee",
  options: ["wield", "drop"],
  tags: ["axe"],
  equipment: {
    slot: "weapon",
    attackSpeedTicks: 5,
    bonuses: { slashAttack: 4 },
  },
};

const validFood = {
  id: "crusty_loaf",
  name: "Crusty Loaf",
  stackable: false,
  tradeable: true,
  examine: "Fresh from the oven.",
  icon: "icon_crusty_loaf",
  value: 5,
  consumable: { heal: 5 },
};

const validNpc = {
  id: "river_rat",
  name: "River Rat",
  size: 1,
  combatLevel: 2,
  maxHp: 5,
  stats: { attack: 1, strength: 1, defence: 1, ranged: 1, magic: 1, prayer: 1, hitpoints: 5 },
  respawnTicks: 30,
  drops: "river_rat_drops",
  options: [{ label: "Attack", actionId: "attack", priority: 1, requiredDistance: 1 }],
};

const validResourceNode = {
  id: "oak_tree_node",
  name: "Oak Tree",
  skill: "woodcutting",
  requiredLevel: 15,
  baseXp: 37.5,
  actionTicks: 4,
  depletionChance: 0.125,
  respawnTicks: 30,
  toolTags: ["axe"],
  outputItemId: "oak_log",
};

const validSpell = {
  id: "ember_flick",
  name: "Ember Flick",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [{ itemId: "ember_bead", quantity: 1 }],
  castXp: 5.5,
  rangeTiles: 6,
  targetType: "entity",
  requiresLineOfSight: true,
  effect: { kind: "damage", maxHit: 2, hitDelayTicks: 2 },
};

const validQuest = {
  id: "smoke_over_old_town",
  name: "Smoke Over Old Town",
  questPoints: 1,
  varPrefix: "quest_smoke",
  stages: [
    {
      stage: 0,
      journalText: "Speak to the baker.",
      objectives: [{ kind: "talk", npcId: "baker" }],
    },
    {
      stage: 1,
      journalText: "Gather logs.",
      objectives: [{ kind: "gather", itemId: "dry_log", quantity: 3 }],
    },
  ],
  rewards: [{ kind: "add_item", itemId: "crusty_loaf", quantity: 1 }],
};

const validDialogue = {
  id: "baker_dialogue",
  root: "start",
  nodes: [
    { id: "start", npcText: "Hello!", playerOptions: [{ text: "Hi", next: "end" }] },
    { id: "end", npcText: "Goodbye." },
  ],
};

const validRegionMap = {
  region: { rx: 0, ry: 0, plane: 0 },
  tiles: { default: { underlayId: "grass" }, overrides: [{ x: 5, y: 5, collision: 256 }] },
  objects: [{ objectId: "oak_tree", x: 10, y: 12 }],
  npcSpawns: [{ npcId: "river_rat", x: 20, y: 20 }],
};

describe("contentSchemas — one entry point validates every kind", () => {
  it("accepts valid definitions for each kind", () => {
    expect(validate("item", validItem).success).toBe(true);
    expect(validate("item", validFood).success).toBe(true);
    expect(validate("npc", validNpc).success).toBe(true);
    expect(validate("resourceNode", validResourceNode).success).toBe(true);
    expect(validate("spell", validSpell).success).toBe(true);
    expect(validate("quest", validQuest).success).toBe(true);
    expect(validate("dialogue", validDialogue).success).toBe(true);
    expect(validate("regionMap", validRegionMap).success).toBe(true);
    expect(
      validate("skill", { id: "woodcutting", name: "Woodcutting", xpTableId: "oldtown_default" })
        .success,
    ).toBe(true);
    expect(validate("material", { id: "grass", name: "Grass", color: 0x4f8f3a }).success).toBe(
      true,
    );
    expect(validate("dropTable", { id: "river_rat_drops", entries: [] }).success).toBe(true);
    expect(validate("object", { id: "oak_tree", name: "Oak Tree" }).success).toBe(true);
    expect(validate("animation", { id: "chop_swing", name: "Chop" }).success).toBe(true);
  });
});

describe("schema strictness and field validation", () => {
  it("rejects unknown fields", () => {
    expect(validate("item", { ...validItem, sneaky: true }).success).toBe(false);
    expect(validate("npc", { ...validNpc, godMode: true }).success).toBe(false);
  });

  it("rejects invalid ids", () => {
    expect(validate("item", { ...validItem, id: "Pennywrought Axe" }).success).toBe(false);
    expect(
      validate("spell", { ...validSpell, beadCosts: [{ itemId: "Bad Id", quantity: 1 }] }).success,
    ).toBe(false);
  });

  it("rejects malformed fields with actionable issues", () => {
    const result = validate("resourceNode", { ...validResourceNode, depletionChance: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("rejects an out-of-range plane in a region map", () => {
    expect(
      validate("regionMap", { ...validRegionMap, region: { rx: 0, ry: 0, plane: 9 } }).success,
    ).toBe(false);
  });

  it("rejects dynamic or unknown collision bits in region maps", () => {
    expect(
      validate("regionMap", {
        ...validRegionMap,
        tiles: { default: { underlayId: "grass", collision: 1 << 12 }, overrides: [] },
      }).success,
    ).toBe(false);
    expect(
      validate("regionMap", {
        ...validRegionMap,
        tiles: {
          default: { underlayId: "grass" },
          overrides: [{ x: 1, y: 1, collision: 1 << 20 }],
        },
      }).success,
    ).toBe(false);
  });

  it("requires a quest stage 0", () => {
    expect(
      validate("quest", {
        ...validQuest,
        stages: [{ stage: 1, journalText: "x", objectives: [] }],
      }).success,
    ).toBe(false);
  });
});
