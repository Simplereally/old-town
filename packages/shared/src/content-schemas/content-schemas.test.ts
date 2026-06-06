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
  resourceNodeSpawns: [{ resourceNodeId: "oak_tree_node", x: 15, y: 15 }],
  playerSpawnPoints: [{ x: 30, y: 30, spawnType: "default" }],
  deathRespawnPoints: [{ x: 25, y: 25, respawnType: "nearest" }],
};

const validShop = {
  id: "general_store",
  name: "General Store",
  stock: [{ itemId: "dry_log", quantity: 10, maxQuantity: 10, price: 5 }],
  currency: "coin",
  sellMultiplier: 0.6,
  buyMultiplier: 1.0,
  restockTicks: 100,
};

const validBank = {
  id: "old_town_bank",
  name: "Old Town Bank",
  location: { plane: 0, tileX: 20, tileY: 20 },
  capacity: 400,
  tabs: true,
  feePerItem: 0,
};

const validServiceFee = {
  id: "repair_armour",
  name: "Repair Armour",
  serviceType: "repair",
  baseFee: 10,
  levelMultiplier: 1.0,
  materialCost: [],
  currency: "coin",
};

const validStatusEffect = {
  id: "poison",
  name: "Poison",
  description: "Lose health over time.",
  durationTicks: 10,
  maxStacks: 1,
  effectType: "dot",
  statModifiers: [],
  cureItems: [],
};

const validContract = {
  id: "slay_goblins",
  name: "Slay Goblins",
  contractType: "bounty",
  targetCreatureIds: ["goblin"],
  targetCount: 10,
  rewardItems: [],
  rewardXp: [],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill",
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
    expect(
      validate("dropTable", {
        id: "goblin_drops",
        rolls: 1,
        alwaysDrops: [{ itemId: "small_bones", quantity: 1 }],
        entries: [
          { itemId: "coin", min: 1, max: 5, weight: 10, rarity: "common" },
          { itemId: "bronze_sword", min: 1, max: 1, weight: 5, rarity: "uncommon" },
          { itemId: "iron_helm", min: 1, max: 1, weight: 2, rarity: "rare" },
          { itemId: "rune_scim", min: 1, max: 1, weight: 1, rarity: "very_rare" },
          {
            itemId: "quest_token",
            min: 1,
            max: 1,
            weight: 1,
            rarity: "guaranteed",
            requirements: [{ kind: "quest_stage", questId: "test_quest", minStage: 1 }],
          },
        ],
      }).success,
    ).toBe(true);
    expect(validate("object", { id: "oak_tree", name: "Oak Tree" }).success).toBe(true);
    expect(validate("animation", { id: "chop_swing", name: "Chop" }).success).toBe(true);
    expect(validate("shop", validShop).success).toBe(true);
    expect(validate("bank", validBank).success).toBe(true);
    expect(validate("serviceFee", validServiceFee).success).toBe(true);
    expect(validate("statusEffect", validStatusEffect).success).toBe(true);
    expect(validate("contract", validContract).success).toBe(true);
    expect(
      validate("property", {
        id: "old_town_market_stall",
        name: "Old Town Market Stall",
        maxOwners: 1,
        transferable: true,
        expiryTicks: 0,
      }).success,
    ).toBe(true);
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
