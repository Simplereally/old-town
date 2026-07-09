import {
  type ContentRegistries,
  type DropTableDef,
  type EntityId,
  type ItemDef,
  type NpcDef,
  type Rng,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { InterestManager } from "../net/interest-manager";
import { ActionQueue } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import {
  type BeginPickupPayload,
  DROP_PRIVATE_TICKS,
  dropInventoryOnDeath,
  GROUND_ITEM_DESPAWN_TICKS,
  type GroundItemSystemContext,
  handleBeginPickup,
  handleGroundItemIntent,
  processDeathResolution,
  processGroundItemLifecycle,
  rollDropTable,
  spawnGroundItem,
} from "./ground-item-system";

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

const BONES: ItemDef = {
  id: "small_bones",
  name: "Small Bones",
  stackable: true,
  tradeable: true,
  examine: "Small bones.",
  icon: "icon_small_bones",
  value: 1,
  options: [],
  tags: [],
};

const DROP_TABLE: DropTableDef = {
  id: "mud_goblin_drops",
  rolls: 1,
  alwaysDrops: [{ itemId: "small_bones", quantity: 1 }],
  entries: [
    { itemId: "coin", min: 2, max: 2, weight: 1, requirements: [], rarity: "common" },
    { itemId: "small_bones", min: 3, max: 3, weight: 3, requirements: [], rarity: "common" },
  ],
};

const NPC_DEF: NpcDef = {
  id: "mud_goblin",
  name: "Mud Goblin",
  size: 1,
  combatLevel: 5,
  maxHp: 8,
  stats: {
    attack: 3,
    strength: 3,
    defence: 3,
    ranged: 1,
    magic: 1,
    prayer: 1,
    hitpoints: 8,
  },
  attackSpeedTicks: 5,
  attackRangeTiles: 1,
  wanderRadius: 3,
  respawnTicks: 7,
  drops: "mud_goblin_drops",
  options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
  movementType: "static",
  aggressionMode: "peaceful",
  contractEligible: false,
};

function fixedRng(values: readonly number[]): Rng {
  let index = 0;
  return {
    nextFloat: () => 0,
    nextInt: (min, max) => {
      const value = values[index] ?? min;
      index += 1;
      return Math.min(Math.max(value, min), max);
    },
    chanceOneIn: () => false,
  };
}

function registries(): ContentRegistries {
  return makeRegistries({
    item: new Map([
      [COIN.id, COIN],
      [BONES.id, BONES],
    ]),
    npc: new Map([[NPC_DEF.id, NPC_DEF]]),
    dropTable: new Map([[DROP_TABLE.id, DROP_TABLE]]),
  });
}

function addOpenTiles(map: RuntimeMap): void {
  for (let x = 0; x < 4; x += 1) {
    for (let y = 0; y < 4; y += 1) {
      const tile = { x, y, plane: 0 as const };
      map.tiles.set(tileKey(tile), {
        tile,
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function addPlayer(world: World, x = 1, y = 1): EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  return entityId;
}

function addNpc(world: World, x = 1, y = 1): EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "npc", {
    entityId,
    npcId: NPC_DEF.id,
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: 3,
    home: { x, y, plane: 0 },
    occupiedTile: { x, y, plane: 0 },
  });
  world.setComponent(entityId, "combatant", {
    entityId,
    health: 0,
    maxHealth: 8,
    attackLevel: 3,
    strengthLevel: 3,
    defenceLevel: 3,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 5,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    dead: false,
  });
  return entityId;
}

function setup(rng: Rng = fixedRng([1, 2])) {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const actionQueue = new ActionQueue();
  const ctx: GroundItemSystemContext = {
    world,
    collision,
    deltas,
    registries: registries(),
    rng,
    itemAudit,
    actionQueue,
  };
  return { ctx, world, deltas, itemAudit, actionQueue };
}

function pollBeginPickup(
  ctx: GroundItemSystemContext,
  actionQueue: ActionQueue,
  tick: number,
  serverTime: number,
): void {
  const execution = actionQueue.advanceTick()[0];
  if (!execution) throw new Error("expected a queued begin_pickup execution");
  handleBeginPickup(
    ctx,
    execution,
    execution.entry.payload as BeginPickupPayload,
    tick,
    serverTime,
  );
}

describe("ground item and drop system", () => {
  it("rolls always drops plus weighted entries deterministically", () => {
    expect(rollDropTable(DROP_TABLE, fixedRng([2, 3]))).toEqual([
      { itemId: "small_bones", quantity: 1 },
      { itemId: "small_bones", quantity: 3 },
    ]);
  });

  it("spawns private drops for the eligible killer and reveals them after the private window", () => {
    const { ctx, world, deltas } = setup(fixedRng([1, 2]));
    const owner = addPlayer(world);
    const bystander = addPlayer(world);
    const npc = addNpc(world);
    const combatant = world.getComponent(npc, "combatant");
    if (!combatant) throw new Error("missing combatant");
    world.setComponent(npc, "combatant", { ...combatant, lastDamageSourceId: owner });

    processDeathResolution(ctx, 10);

    const raw = deltas.consume(10, 6_000);
    const manager = new InterestManager();
    const center = { x: 1, y: 1, plane: 0 as const };
    expect(manager.filterDelta(owner, center, raw, world).entityAdds).toHaveLength(2);
    expect(manager.filterDelta(bystander, center, raw, world).entityAdds).toEqual([]);

    processGroundItemLifecycle(ctx, 10 + DROP_PRIVATE_TICKS);
    const reveal = deltas.consume(70, 42_000);
    expect(manager.filterDelta(bystander, center, reveal, world).entityAdds).toHaveLength(2);
  });

  it("picks up visible ground items through the inventory container and prevents duplicates", () => {
    const { ctx, world, deltas, itemAudit } = setup();
    const owner = addPlayer(world);
    const groundItem = spawnGroundItem(
      ctx,
      "coin",
      5,
      { x: 1, y: 1, plane: 0 },
      {
        tick: 10,
        ownerId: owner,
      },
    );
    if (groundItem === undefined) throw new Error("ground item was not spawned");
    deltas.consume(10, 6_000);

    expect(
      handleGroundItemIntent(
        ctx,
        owner,
        { groundItemEntityId: groundItem, actionId: "pickup" },
        10,
        6_000,
      ),
    ).toBe(true);

    const inventory = world.getComponent(owner, "inventory");
    if (!inventory) throw new Error("missing inventory");
    expect(count(inventory, "coin")).toBe(5);
    expect(world.isAlive(groundItem)).toBe(false);
    expect(deltas.peek().inventoryDeltas?.[0]?.changes[0]).toMatchObject({
      itemId: "coin",
      quantity: 5,
    });
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "ground_drop_spawn",
      "ground_pickup",
    ]);
    expect(itemAudit.snapshot()[1]).toMatchObject({
      itemId: "coin",
      quantity: 5,
      beforeQuantity: 0,
      afterQuantity: 5,
      metadata: expect.objectContaining({ groundItemEntityId: groundItem }),
    });

    handleGroundItemIntent(
      ctx,
      owner,
      { groundItemEntityId: groundItem, actionId: "pickup" },
      11,
      6_600,
    );
    expect(count(inventory, "coin")).toBe(5);
  });

  it("walks to a distant ground item and picks it up on arrival", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const owner = addPlayer(world, 0, 0);
    const groundItem = spawnGroundItem(ctx, "coin", 5, { x: 3, y: 3, plane: 0 }, { tick: 10 });
    if (groundItem === undefined) throw new Error("ground item was not spawned");
    deltas.consume(10, 6_000);

    expect(
      handleGroundItemIntent(
        ctx,
        owner,
        { groundItemEntityId: groundItem, actionId: "pickup" },
        10,
        6_000,
      ),
    ).toBe(true);

    // No rejection message; the actor paths toward the item with a pending poll.
    expect(deltas.peek().chat).toBeUndefined();
    const movement = world.getComponent(owner, "movement");
    expect(movement?.path.length).toBeGreaterThan(0);
    const queued = actionQueue.getDebugState();
    expect(queued.some((q) => (q.payload as { kind?: string }).kind === "begin_pickup")).toBe(true);

    // Poll before arrival: nothing happens, the poll stays queued.
    pollBeginPickup(ctx, actionQueue, 11, 6_600);
    expect(world.isAlive(groundItem)).toBe(true);
    expect(actionQueue.getDebugState()).toHaveLength(1);

    // Arrive on the item's tile: the next poll completes the pickup.
    world.setComponent(owner, "position", { entityId: owner, x: 3, y: 3, plane: 0 });
    pollBeginPickup(ctx, actionQueue, 12, 7_200);

    const inventory = world.getComponent(owner, "inventory");
    if (!inventory) throw new Error("missing inventory");
    expect(count(inventory, "coin")).toBe(5);
    expect(world.isAlive(groundItem)).toBe(false);
    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("cancels the pickup approach when the item vanishes mid-walk", () => {
    const { ctx, world, deltas, actionQueue } = setup();
    const owner = addPlayer(world, 0, 0);
    const groundItem = spawnGroundItem(ctx, "coin", 5, { x: 3, y: 3, plane: 0 }, { tick: 10 });
    if (groundItem === undefined) throw new Error("ground item was not spawned");
    deltas.consume(10, 6_000);

    handleGroundItemIntent(
      ctx,
      owner,
      { groundItemEntityId: groundItem, actionId: "pickup" },
      10,
      6_000,
    );
    world.destroyEntity(groundItem);

    pollBeginPickup(ctx, actionQueue, 11, 6_600);

    expect(actionQueue.getDebugState()).toEqual([]);
    expect(deltas.peek().chat?.[0]?.text).toBe("That item is no longer there.");
  });

  it("blocks non-owner pickup before public reveal", () => {
    const { ctx, world, deltas } = setup();
    const owner = addPlayer(world);
    const bystander = addPlayer(world);
    const groundItem = spawnGroundItem(
      ctx,
      "coin",
      1,
      { x: 1, y: 1, plane: 0 },
      {
        tick: 10,
        ownerId: owner,
      },
    );
    if (groundItem === undefined) throw new Error("ground item was not spawned");
    deltas.consume(10, 6_000);

    handleGroundItemIntent(
      ctx,
      bystander,
      { groundItemEntityId: groundItem, actionId: "pickup" },
      10,
      6_000,
    );

    expect(world.isAlive(groundItem)).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("That item is not yours to take yet.");
  });

  it("despawns ground items and records an audit entry", () => {
    const { ctx, world, itemAudit } = setup();
    const owner = addPlayer(world);
    const groundItem = spawnGroundItem(
      ctx,
      "coin",
      1,
      { x: 1, y: 1, plane: 0 },
      {
        tick: 10,
        ownerId: owner,
      },
    );
    if (groundItem === undefined) throw new Error("ground item was not spawned");
    ctx.deltas.consume(10, 6_000);

    processGroundItemLifecycle(ctx, 10 + GROUND_ITEM_DESPAWN_TICKS);

    expect(world.isAlive(groundItem)).toBe(false);
    expect(ctx.deltas.peek().entityRemoves).toEqual([groundItem]);
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "ground_drop_spawn",
      "ground_despawn",
    ]);
  });

  it("drops all inventory items on player death and tags them with owner", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 5, 5);
    const inventory = world.getComponent(player, "inventory");
    if (!inventory) throw new Error("missing inventory");

    inventory.slots[0] = { itemId: "coin", quantity: 10, uid: 1 };
    inventory.slots[1] = { itemId: "small_bones", quantity: 3, uid: 2 };

    dropInventoryOnDeath(ctx, player, 20);

    expect(inventory.slots[0]).toBeUndefined();
    expect(inventory.slots[1]).toBeUndefined();

    const delta = deltas.peek();
    expect(delta.inventoryDeltas?.[0]).toMatchObject({
      containerId: `inventory:${player}`,
      changes: [
        { slot: 0, itemId: null, quantity: 0 },
        { slot: 1, itemId: null, quantity: 0 },
      ],
    });

    const groundItems = Array.from(world.componentEntries("groundItem"));
    expect(groundItems).toHaveLength(2);
    const items = groundItems.map(([, g]) => g);
    expect(
      items.some((g) => g.itemId === "coin" && g.quantity === 10 && g.ownerId === player),
    ).toBe(true);
    expect(
      items.some((g) => g.itemId === "small_bones" && g.quantity === 3 && g.ownerId === player),
    ).toBe(true);
  });

  it("grave items expire after despawn ticks", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 5, 5);
    const inventory = world.getComponent(player, "inventory");
    if (!inventory) throw new Error("missing inventory");
    inventory.slots[0] = { itemId: "coin", quantity: 5, uid: 1 };

    dropInventoryOnDeath(ctx, player, 10);
    const groundItems = Array.from(world.componentEntries("groundItem"));
    expect(groundItems).toHaveLength(1);
    const first = groundItems[0];
    if (!first) throw new Error("ground item missing");
    const entityId = first[0];

    processGroundItemLifecycle(ctx, 10 + GROUND_ITEM_DESPAWN_TICKS);
    expect(world.isAlive(entityId)).toBe(false);
  });

  it("owner can reclaim grave items immediately without ownership check", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 5, 5);
    const inventory = world.getComponent(player, "inventory");
    if (!inventory) throw new Error("missing inventory");
    inventory.slots[0] = { itemId: "coin", quantity: 5, uid: 1 };

    dropInventoryOnDeath(ctx, player, 10);
    deltas.consume(10, 6_000);

    const groundItems = Array.from(world.componentEntries("groundItem"));
    expect(groundItems).toHaveLength(1);
    const first = groundItems[0];
    if (!first) throw new Error("ground item missing");
    const groundItemId = first[0];

    const result = handleGroundItemIntent(
      ctx,
      player,
      { groundItemEntityId: groundItemId, actionId: "pickup" },
      10,
      6_000,
    );
    expect(result).toBe(true);
    expect(world.isAlive(groundItemId)).toBe(false);
    expect(count(inventory, "coin")).toBe(5);
  });
});
