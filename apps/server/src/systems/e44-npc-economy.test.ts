import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BankDef, ContractDef, ItemDef, NpcDef, ObjectDef, ShopDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { addItem, catalogFromItems, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { handleBankIntent } from "./bank-system";
import {
  buildContractBoard,
  handleContractAcceptIntent,
  handleContractBoardOpen,
} from "./contract-system";
import { handleShopIntent } from "./shop-system";

const COIN: ItemDef = {
  id: "coin",
  name: "Coin",
  stackable: true,
  tradeable: true,
  examine: "Currency.",
  icon: "icon_coin",
  value: 1,
  options: [],
  tags: [],
};

const BLADE: ItemDef = {
  id: "test_blade",
  name: "Test Blade",
  stackable: false,
  tradeable: true,
  examine: "A sharp blade.",
  icon: "icon_blade",
  value: 10,
  options: [],
  tags: [],
};

const RAT_TAIL: ItemDef = {
  id: "rat_tail",
  name: "Rat Tail",
  stackable: true,
  tradeable: true,
  examine: "A rat tail.",
  icon: "icon_rat_tail",
  value: 1,
  options: [],
  tags: [],
};

const ITEMS = new Map([COIN, BLADE, RAT_TAIL].map((d) => [d.id, d]));

const SHOP_DEF: ShopDef = {
  id: "test_shop",
  name: "Test Shop",
  npcId: "test_merchant",
  stock: [{ itemId: "test_blade", quantity: 5, maxQuantity: 10, price: 20, restockRate: 1 }],
  currency: "coin",
  sellMultiplier: 0.6,
  buyMultiplier: 1.0,
  restockTicks: 100,
  buyPolicy: "always",
  sellPolicy: "buys_category",
};

const BANK_DEF: BankDef = {
  id: "test_bank",
  name: "Test Bank",
  npcId: "test_banker",
  location: { plane: 0, tileX: 30, tileY: 30 },
  capacity: 100,
  tabs: true,
  feePerItem: 0,
};

const WARDEN_BOARD = {
  id: "warden_board",
  name: "Warden Board",
  examine: "A board of nailed contracts.",
  width: 2,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [
    { label: "Read", actionId: "read", priority: 10, requiredDistance: 1 },
    { label: "Accept", actionId: "accept", priority: 8, requiredDistance: 1 },
  ],
  model: "model_warden_board",
} as unknown as ObjectDef;

const CONTRACT_DEF: ContractDef = {
  id: "rat_contract",
  name: "Rat Extermination",
  description: "Clear the rats.",
  contractType: "extermination",
  targetCreatureIds: ["cellar_rat"],
  targetCount: 3,
  rewardItems: [{ itemId: "coin", quantity: 50 }],
  rewardXp: [{ skillId: "wardenry", amount: 50 }],
  requiredLevel: 1,
  maxConcurrent: 1,
  completionTrigger: "kill",
};

const MERCHANT_NPC = {
  id: "test_merchant",
  name: "Test Merchant",
  size: 1,
  combatLevel: 1,
  maxHp: 10,
  stats: {
    attack: 1,
    strength: 1,
    defence: 1,
    ranged: 1,
    magic: 1,
    prayer: 1,
    hitpoints: 10,
  },
  attackSpeedTicks: 5,
  attackRangeTiles: 1,
  wanderRadius: 0,
  respawnTicks: 10,
  options: [{ label: "Trade", actionId: "trade", priority: 0, requiredDistance: 1 }],
  dialogueId: undefined,
  drops: undefined,
  examine: "A merchant.",
} as unknown as NpcDef;

const BANKER_NPC = {
  id: "test_banker",
  name: "Test Banker",
  size: 1,
  combatLevel: 1,
  maxHp: 10,
  stats: {
    attack: 1,
    strength: 1,
    defence: 1,
    ranged: 1,
    magic: 1,
    prayer: 1,
    hitpoints: 10,
  },
  attackSpeedTicks: 5,
  attackRangeTiles: 1,
  wanderRadius: 0,
  respawnTicks: 10,
  options: [
    { label: "Talk-to", actionId: "talk", priority: 10, requiredDistance: 1 },
    { label: "Bank", actionId: "bank", priority: 8, requiredDistance: 1 },
  ],
  dialogueId: undefined,
  drops: undefined,
  examine: "A banker.",
} as unknown as NpcDef;

function setupCtx() {
  const world = createWorld();
  const owner = world.createEntity();
  const npc = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });
  world.setComponent(npc, "position", { entityId: npc, x: 30, y: 31, plane: 0 });
  world.setComponent(npc, "npc", {
    entityId: npc,
    npcId: "test_merchant",
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 0,
  });

  const catalog = catalogFromItems(ITEMS);
  addItem(inventory, catalog, "coin", 200);

  const registries = makeRegistries({
    item: ITEMS,
    shop: new Map([[SHOP_DEF.id, SHOP_DEF]]),
    bank: new Map([[BANK_DEF.id, BANK_DEF]]),
    object: new Map([[WARDEN_BOARD.id, WARDEN_BOARD]]),
    contract: new Map([[CONTRACT_DEF.id, CONTRACT_DEF]]),
    npc: new Map([
      [MERCHANT_NPC.id, MERCHANT_NPC],
      [BANKER_NPC.id, BANKER_NPC],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const collision = new CollisionMap(createRuntimeMap());

  return { world, owner, npc, registries, deltas, itemAudit, collision };
}

function setupBankCtx() {
  const world = createWorld();
  const owner = world.createEntity();
  const banker = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });
  world.setComponent(banker, "position", { entityId: banker, x: 30, y: 31, plane: 0 });
  world.setComponent(banker, "npc", {
    entityId: banker,
    npcId: "test_banker",
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 0,
  });

  const catalog = catalogFromItems(ITEMS);
  addItem(inventory, catalog, "coin", 100);
  addItem(inventory, catalog, "test_blade", 2);

  const registries = makeRegistries({
    item: ITEMS,
    shop: new Map([[SHOP_DEF.id, SHOP_DEF]]),
    bank: new Map([[BANK_DEF.id, BANK_DEF]]),
    object: new Map([[WARDEN_BOARD.id, WARDEN_BOARD]]),
    contract: new Map([[CONTRACT_DEF.id, CONTRACT_DEF]]),
    npc: new Map([
      [MERCHANT_NPC.id, MERCHANT_NPC],
      [BANKER_NPC.id, BANKER_NPC],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const collision = new CollisionMap(createRuntimeMap());

  return { world, owner, banker, registries, deltas, itemAudit, collision };
}

function setupContractCtx() {
  const world = createWorld();
  const owner = world.createEntity();
  const inventory = createInventory(owner, `inventory:${owner}`, 28);
  world.setComponent(owner, "inventory", inventory);
  world.setComponent(owner, "position", { entityId: owner, x: 30, y: 30, plane: 0 });
  world.setComponent(owner, "vars", { entityId: owner, values: {} });

  const board = world.createEntity();
  world.setComponent(board, "position", { entityId: board, x: 30, y: 31, plane: 0 });
  world.setComponent(board, "object", {
    entityId: board,
    objectId: "warden_board",
    facing: 0,
    variant: 0,
  });
  world.setComponent(board, "contract", {
    entityId: board,
    contractId: "rat_contract",
    status: "available",
    objectives: [{ kind: "kill", targetId: "cellar_rat", required: 3, current: 0 }],
    startTick: 0,
    expiryTick: 0,
  });

  const catalog = catalogFromItems(ITEMS);
  addItem(inventory, catalog, "coin", 50);

  const registries = makeRegistries({
    item: ITEMS,
    shop: new Map([[SHOP_DEF.id, SHOP_DEF]]),
    bank: new Map([[BANK_DEF.id, BANK_DEF]]),
    object: new Map([[WARDEN_BOARD.id, WARDEN_BOARD]]),
    contract: new Map([[CONTRACT_DEF.id, CONTRACT_DEF]]),
    npc: new Map([
      [MERCHANT_NPC.id, MERCHANT_NPC],
      [BANKER_NPC.id, BANKER_NPC],
    ]),
  });

  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();

  return { world, owner, board, registries, deltas, itemAudit };
}

// ============================================================
// S01: NPC options and dialogue content
// ============================================================
function loadNpcContent(): NpcDef[] {
  return readdirSync("content/npcs")
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => JSON.parse(readFileSync(join("content/npcs", file), "utf8")) as NpcDef[]);
}

describe("E44-S01: NPC options", () => {
  it("warden_holt has contract option", () => {
    const npcs = loadNpcContent();
    const holt = npcs.find((n) => n.id === "warden_holt");
    expect(holt).toBeDefined();
    const contractOpt = holt?.options?.find((o) => o.actionId === "contract");
    expect(contractOpt).toBeDefined();
    expect(contractOpt?.label).toBe("Contracts");
  });

  it("all service NPCs have talk option", () => {
    const npcs = loadNpcContent();
    const serviceIds = [
      "mara_bellkeeper",
      "tomas_tally",
      "osric_penny",
      "letha_lath",
      "nell_patch",
      "mother_tallow",
      "warden_holt",
      "sister_writ",
      "finch_quill",
      "edda_tinfin",
      "bramble_hook",
      "marn_lock",
      "pippa_hearth",
      "gravekeeper_soll",
    ];
    for (const id of serviceIds) {
      const npc = npcs.find((n) => n.id === id);
      expect(npc, `NPC ${id} should exist`).toBeDefined();
      const talkOpt = npc?.options?.find((o) => o.actionId === "talk");
      expect(talkOpt, `NPC ${id} should have talk option`).toBeDefined();
    }
  });

  it("trade NPCs have trade option and examine text", () => {
    const npcs = loadNpcContent();
    const tradeNpcs = npcs.filter((n) => n.options?.some((o) => o.actionId === "trade"));
    expect(tradeNpcs.length).toBeGreaterThan(0);
    for (const npc of tradeNpcs) {
      expect(npc.examine, `NPC ${npc.id} should have examine text`).toBeDefined();
    }
  });

  it("all 14 service NPCs are spawned in the map", async () => {
    const fs = await import("node:fs");
    const map = JSON.parse(fs.readFileSync("content/maps/old-town-0-0-0.json", "utf8"));
    const spawnedIds = new Set((map.npcSpawns as { npcId: string }[]).map((s) => s.npcId));
    const serviceIds = [
      "mara_bellkeeper",
      "tomas_tally",
      "osric_penny",
      "letha_lath",
      "nell_patch",
      "mother_tallow",
      "warden_holt",
      "sister_writ",
      "finch_quill",
      "edda_tinfin",
      "bramble_hook",
      "marn_lock",
      "pippa_hearth",
      "gravekeeper_soll",
    ];
    for (const id of serviceIds) {
      expect(spawnedIds.has(id), `NPC ${id} should be spawned in map`).toBe(true);
    }
  });
});

// ============================================================
// S02: Bank NPC wiring
// ============================================================
describe("E44-S02: Bank NPC wiring", () => {
  it("bank def has npcId linking to banker NPC", async () => {
    const fs = await import("node:fs");
    const banks = JSON.parse(
      fs.readFileSync("content/banks/starter-banks.json", "utf8"),
    ) as BankDef[];
    const bank = banks.find((b) => b.npcId === "tomas_tally");
    expect(bank).toBeDefined();
    expect(bank?.id).toBe("old_town_bank");
  });

  it("opens bank via NPC and creates bank component", () => {
    const ctx = setupBankCtx();
    handleBankIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.banker },
      0,
      0,
    );

    const bank = ctx.world.getComponent(ctx.owner, "bank");
    expect(bank).toBeDefined();
    expect(bank?.entityId).toBe(ctx.owner);
  });

  it("deposits items into bank via NPC", () => {
    const ctx = setupBankCtx();
    // Open bank first
    handleBankIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.banker },
      0,
      0,
    );

    const inventory = ctx.world.getComponent(ctx.owner, "inventory");
    const bladeSlot = inventory?.slots.findIndex((s) => s?.itemId === "test_blade");
    expect(bladeSlot).toBeGreaterThanOrEqual(0);
    const bladeUid = inventory?.slots[bladeSlot ?? -1]?.uid;
    expect(bladeUid).toBeDefined();

    handleBankIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "deposit", itemUid: bladeUid ?? 0, quantity: 1 } as never,
      0,
      0,
    );

    const bank = ctx.world.getComponent(ctx.owner, "bank");
    const bankBlade = bank?.slots.find((s) => s?.itemId === "test_blade");
    expect(bankBlade).toBeDefined();
    expect(bankBlade?.quantity).toBe(1);
  });

  it("rejects bank open when too far from NPC", () => {
    const ctx = setupBankCtx();
    // Move player far away
    ctx.world.setComponent(ctx.owner, "position", {
      entityId: ctx.owner,
      x: 50,
      y: 50,
      plane: 0,
    });

    const result = handleBankIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.banker },
      0,
      0,
    );

    expect(result).toBe(true);
    // Bank should not be created
    const bank = ctx.world.getComponent(ctx.owner, "bank");
    expect(bank).toBeUndefined();
  });
});

// ============================================================
// S03: Shop NPC wiring
// ============================================================
describe("E44-S03: Shop NPC wiring", () => {
  it("shop defs have npcId linking to correct NPCs", async () => {
    const fs = await import("node:fs");
    const shops = JSON.parse(
      fs.readFileSync("content/shops/starter-shops.json", "utf8"),
    ) as ShopDef[];
    const expectedLinks: Record<string, string> = {
      counting_house: "tomas_tally",
      general_stall: "general_stall_keeper",
      penny_and_sons_forge: "osric_penny",
      lath_and_twine: "letha_lath",
      patch_and_awl: "nell_patch",
      chalkhouse: "mother_tallow",
      shrine_hearth: "sister_writ",
      river_stoop: "edda_tinfin",
    };
    for (const [shopId, npcId] of Object.entries(expectedLinks)) {
      const shop = shops.find((s) => s.id === shopId);
      expect(shop, `Shop ${shopId} should exist`).toBeDefined();
      expect(shop?.npcId, `Shop ${shopId} should link to NPC ${npcId}`).toBe(npcId);
    }
  });

  it("opens shop via NPC and creates shop component", () => {
    const ctx = setupCtx();
    handleShopIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.npc },
      0,
      0,
    );

    const shop = ctx.world.getComponent(ctx.npc, "shop");
    expect(shop).toBeDefined();
    expect(shop?.shopId).toBe("test_shop");
  });

  it("buys item from shop via NPC", () => {
    const ctx = setupCtx();
    // Open shop
    handleShopIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.npc },
      0,
      0,
    );

    handleShopIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "buy", itemId: "test_blade", quantity: 1 },
      0,
      0,
    );

    const inventory = ctx.world.getComponent(ctx.owner, "inventory");
    const blade = inventory?.slots.find((s) => s?.itemId === "test_blade");
    expect(blade).toBeDefined();
    expect(blade?.quantity).toBe(1);
  });

  it("shop lookup fails for NPC without matching shop", () => {
    const ctx = setupCtx();
    // Change NPC id to one without a shop
    const npcComp = ctx.world.getComponent(ctx.npc, "npc");
    if (!npcComp) throw new Error("npc missing");
    ctx.world.setComponent(ctx.npc, "npc", {
      ...npcComp,
      npcId: "no_shop_npc",
    });

    handleShopIntent(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      { action: "open", targetEntityId: ctx.npc },
      0,
      0,
    );

    const shop = ctx.world.getComponent(ctx.npc, "shop");
    expect(shop).toBeUndefined();
  });
});

// ============================================================
// S04: Skill station objects
// ============================================================
describe("E44-S04: Skill station objects", () => {
  it("skill station objects have process actionIds", async () => {
    const fs = await import("node:fs");
    const objects = JSON.parse(
      fs.readFileSync("content/objects/starter-objects.json", "utf8"),
    ) as ObjectDef[];
    const stations = [
      "foundry_furnace",
      "foundry_anvil",
      "lath_bow_bench",
      "patch_tanning_frame",
      "patch_dye_vat",
      "chalkhouse_bead_kiln",
    ];
    for (const id of stations) {
      const obj = objects.find((o) => o.id === id);
      expect(obj, `Station ${id} should exist`).toBeDefined();
      const hasProcess = obj?.options?.some((o) =>
        ["smelt", "smith", "fletch", "craft", "tan", "dye", "fire"].includes(o.actionId),
      );
      expect(hasProcess, `Station ${id} should have a process actionId`).toBe(true);
    }
  });

  it("skill station objects are placed in the map", async () => {
    const fs = await import("node:fs");
    const map = JSON.parse(fs.readFileSync("content/maps/old-town-0-0-0.json", "utf8"));
    const placedIds = new Set((map.objects as { objectId: string }[]).map((o) => o.objectId));
    const expectedStations = [
      "foundry_anvil",
      "lath_bow_bench",
      "patch_tanning_frame",
      "patch_dye_vat",
    ];
    for (const id of expectedStations) {
      expect(placedIds.has(id), `Station ${id} should be placed in map`).toBe(true);
    }
  });
});

// ============================================================
// S05: Warden board, contracts, and shrine
// ============================================================
describe("E44-S05: Warden board and contracts", () => {
  it("warden board object has Accept option", async () => {
    const fs = await import("node:fs");
    const objects = JSON.parse(
      fs.readFileSync("content/objects/starter-objects.json", "utf8"),
    ) as ObjectDef[];
    const board = objects.find((o) => o.id === "warden_board");
    expect(board).toBeDefined();
    const acceptOpt = board?.options?.find((o) => o.actionId === "accept");
    expect(acceptOpt).toBeDefined();
  });

  it("contract spawns are present in the map", async () => {
    const fs = await import("node:fs");
    const map = JSON.parse(fs.readFileSync("content/maps/old-town-0-0-0.json", "utf8"));
    const spawns = map.contractSpawns as { contractId: string }[];
    expect(spawns).toBeDefined();
    expect(spawns.length).toBeGreaterThan(0);
    const contractIds = new Set(spawns.map((s) => s.contractId));
    expect(contractIds.has("rats_under_tallys_contract")).toBe(true);
    expect(contractIds.has("smoke_in_the_old_kiln")).toBe(true);
  });

  it("buildContractBoard lists available contracts", () => {
    const ctx = setupContractCtx();
    const board = buildContractBoard({
      world: ctx.world,
      deltas: ctx.deltas,
      registries: ctx.registries,
      itemAudit: ctx.itemAudit,
    });
    expect(board.entries.length).toBe(1);
    expect(board.entries[0]?.contractId).toBe("rat_contract");
    expect(board.entries[0]?.name).toBe("Rat Extermination");
    expect(board.entries[0]?.status).toBe("available");
  });

  it("handleContractBoardOpen sends interface open packet", () => {
    const ctx = setupContractCtx();
    const result = handleContractBoardOpen(
      {
        world: ctx.world,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      0,
    );
    expect(result).toBe(true);
    const packet = ctx.deltas.peekPacket(0, 0);
    expect(packet.interfaceOpens).toBeDefined();
    expect(packet.interfaceOpens?.length).toBe(1);
    expect(packet.interfaceOpens?.[0]?.interfaceId).toBe("contract_board");
    expect(packet.interfaceOpens?.[0]?.contractBoard?.entries.length).toBe(1);
  });

  it("handleContractBoardOpen shows message when no contracts available", () => {
    const ctx = setupContractCtx();
    // Mark the contract as accepted so it's no longer available
    const contract = ctx.world.getComponent(ctx.board, "contract");
    if (!contract) throw new Error("contract missing");
    ctx.world.setComponent(ctx.board, "contract", {
      ...contract,
      status: "accepted",
    });

    const result = handleContractBoardOpen(
      {
        world: ctx.world,
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
      },
      ctx.owner,
      0,
    );
    expect(result).toBe(true);
    const packet = ctx.deltas.peekPacket(0, 0);
    expect(packet.interfaceOpens).toBeUndefined();
  });

  it("handleContractAcceptIntent accepts an available contract", () => {
    const ctx = setupContractCtx();
    const result = handleContractAcceptIntent(
      {
        world: ctx.world,
        collision: new CollisionMap(createRuntimeMap()),
        deltas: ctx.deltas,
        registries: ctx.registries,
        itemAudit: ctx.itemAudit,
        actionQueue: { enqueue: () => {}, dequeue: () => undefined, size: 0 } as never,
      },
      ctx.owner,
      { objectEntityId: ctx.board, actionId: "accept" } as never,
      0,
      0,
    );
    expect(result).toBe(true);
    const contract = ctx.world.getComponent(ctx.board, "contract");
    expect(contract?.status).toBe("accepted");
    const vars = ctx.world.getComponent(ctx.owner, "vars");
    expect(vars?.values.active_contract).toBe("rat_contract");
  });

  it("shrine_hearth object has pray option", async () => {
    const fs = await import("node:fs");
    const objects = JSON.parse(
      fs.readFileSync("content/objects/starter-objects.json", "utf8"),
    ) as ObjectDef[];
    const shrine = objects.find((o) => o.id === "shrine_hearth");
    expect(shrine).toBeDefined();
    const prayOpt = shrine?.options?.find((o) => o.actionId === "pray");
    expect(prayOpt).toBeDefined();
  });

  it("shrine_hearth is placed in the map", async () => {
    const fs = await import("node:fs");
    const map = JSON.parse(fs.readFileSync("content/maps/old-town-0-0-0.json", "utf8"));
    const placed = (map.objects as { objectId: string }[]).filter(
      (o) => o.objectId === "shrine_hearth",
    );
    expect(placed.length).toBe(1);
  });
});
