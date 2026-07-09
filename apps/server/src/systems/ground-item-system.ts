import type {
  ContentRegistries,
  DropTableDef,
  EntityId,
  GroundItemIntent,
  ItemQuantity,
  Plane,
  Rng,
} from "@old-town/shared";
import { GAME_TICK_MS, RARITY_MULTIPLIERS, type TileCoord } from "@old-town/shared";
import type { CombatantComponent, GroundItemComponent, InventorySlot } from "../ecs/components";
import type { World } from "../ecs/world";
import { addItem, buildDelta, catalogFromItems, count, hasSpaceFor } from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import { projectEntity } from "../net/entity-spawn-projector";
import { dispatchQuestEvent } from "../quests/quest-engine";
import { meetsAllRequirements } from "../quests/requirements";
import type { ActionExecution, ActionQueue } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";
import { beginApproach } from "./approach";
import {
  checkContractCompletion,
  findActiveContractEntity,
  trackContractItemGain,
} from "./contract-system";
import { syncNpcOccupancy } from "./npc-system";

export interface GroundItemSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly actionQueue?: ActionQueue | undefined;
}

export const DROP_PRIVATE_TICKS = 60;
export const GROUND_ITEM_DESPAWN_TICKS = 300;
export const GRAVE_DESPAWN_TICKS = 1000; // 10 minutes at 600ms/tick

const PICKUP_ACTIONS = new Set(["pickup", "take"]);

/** Payload for the poll action enqueued while walking toward a ground item. */
export interface BeginPickupPayload {
  readonly kind: "begin_pickup";
  readonly groundItemEntityId: EntityId;
}

function tileFromPosition(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane };
}

function sameTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

export function groundItemVisibleToPlayer(
  item: GroundItemComponent,
  playerId: EntityId,
  tick: number,
): boolean {
  return (
    item.ownerId === undefined ||
    item.ownerId === playerId ||
    (item.publicAtTick !== undefined && tick >= item.publicAtTick)
  );
}

export interface RollDropTableContext {
  readonly world: World;
  readonly registries: ContentRegistries;
  readonly entityId: EntityId;
}

function effectiveWeight(entry: DropTableDef["entries"][number]): number {
  const rarity = entry.rarity ?? "common";
  const multiplier = RARITY_MULTIPLIERS[rarity];
  return Math.max(1, Math.floor((entry.weight * multiplier) / 100));
}

function entryMeetsRequirements(
  entry: DropTableDef["entries"][number],
  ctx?: RollDropTableContext,
): boolean {
  const reqs = entry.requirements ?? [];
  if (reqs.length === 0) return true;
  if (!ctx) return true;
  return meetsAllRequirements(ctx, ctx.entityId, reqs);
}

export function rollDropTable(
  table: DropTableDef,
  rng: Rng,
  ctx?: RollDropTableContext,
): ItemQuantity[] {
  const drops: ItemQuantity[] = [...table.alwaysDrops];

  const guaranteed: ItemQuantity[] = [];
  const pool: DropTableDef["entries"][number][] = [];

  for (const entry of table.entries) {
    if (!entryMeetsRequirements(entry, ctx)) continue;
    if (entry.rarity === "guaranteed") {
      guaranteed.push({ itemId: entry.itemId, quantity: rng.nextInt(entry.min, entry.max) });
    } else {
      pool.push(entry);
    }
  }

  drops.push(...guaranteed);

  const totalWeight = pool.reduce((sum, entry) => sum + effectiveWeight(entry), 0);
  if (totalWeight <= 0) {
    return drops;
  }

  for (let roll = 0; roll < table.rolls; roll += 1) {
    let cursor = rng.nextInt(1, totalWeight);
    for (const entry of pool) {
      cursor -= effectiveWeight(entry);
      if (cursor > 0) {
        continue;
      }
      drops.push({ itemId: entry.itemId, quantity: rng.nextInt(entry.min, entry.max) });
      break;
    }
  }
  return drops;
}

export function spawnGroundItem(
  ctx: GroundItemSystemContext,
  itemId: string,
  quantity: number,
  tile: TileCoord,
  options: {
    readonly tick: number;
    readonly ownerId?: EntityId;
    readonly sourceEntityId?: EntityId;
  },
): EntityId | undefined {
  if (quantity <= 0 || !ctx.registries.item.has(itemId)) {
    return undefined;
  }

  const entityId = ctx.world.createEntity();
  ctx.world.setComponent(entityId, "position", {
    entityId,
    x: tile.x,
    y: tile.y,
    plane: tile.plane,
  });
  ctx.world.setComponent(entityId, "groundItem", {
    entityId,
    itemId,
    quantity,
    ...(options.ownerId !== undefined ? { ownerId: options.ownerId } : {}),
    publicAtTick: options.ownerId !== undefined ? options.tick + DROP_PRIVATE_TICKS : options.tick,
    despawnTick: options.tick + GROUND_ITEM_DESPAWN_TICKS,
  });
  const spawn = projectEntity(ctx.world, entityId);
  if (spawn) {
    ctx.deltas.markEntityAdd(spawn);
  }
  ctx.itemAudit?.recordForEntity(options.ownerId, {
    tick: options.tick,
    itemId,
    quantity,
    reason: "ground_drop_spawn",
    beforeQuantity: 0,
    afterQuantity: quantity,
    metadata: {
      groundItemEntityId: entityId,
      ...(options.ownerId !== undefined ? { ownerEntityId: options.ownerId } : {}),
      ...(options.sourceEntityId !== undefined ? { sourceEntityId: options.sourceEntityId } : {}),
    },
  });
  return entityId;
}

function eligibleOwner(ctx: GroundItemSystemContext, combatantSource: EntityId | undefined) {
  return combatantSource !== undefined && ctx.world.hasComponent(combatantSource, "player")
    ? combatantSource
    : undefined;
}

function removePendingHits(combatant: CombatantComponent): Omit<CombatantComponent, "pendingHits"> {
  const { pendingHits: _pendingHits, ...withoutPendingHits } = combatant;
  return withoutPendingHits;
}

export function processDeathResolution(
  ctx: GroundItemSystemContext,
  tick: number,
  serverTime = tick * GAME_TICK_MS,
): void {
  for (const [entityId, npc] of ctx.world.componentEntries("npc")) {
    if (npc.brainState === "respawning") {
      continue;
    }
    const combatant = ctx.world.getComponent(entityId, "combatant");
    const position = ctx.world.getComponent(entityId, "position");
    const def = ctx.registries.npc.get(npc.npcId);
    if (!combatant || !position || !def || (combatant.health > 0 && combatant.dead !== true)) {
      continue;
    }

    const tile = tileFromPosition(position);
    const ownerId = eligibleOwner(ctx, combatant.lastDamageSourceId);
    if (ownerId !== undefined) {
      dispatchQuestEvent(ctx, ownerId, { kind: "npc_killed", npcId: npc.npcId }, serverTime);
      const contractEntityId = findActiveContractEntity(ctx.world, ownerId);
      if (contractEntityId !== undefined) {
        checkContractCompletion(ctx, ownerId, contractEntityId, serverTime, tick);
      }
    }
    const drops = def.drops ? ctx.registries.dropTable.get(def.drops) : undefined;
    if (drops) {
      const rollCtx =
        ownerId !== undefined
          ? { world: ctx.world, registries: ctx.registries, entityId: ownerId }
          : undefined;
      for (const drop of rollDropTable(drops, ctx.rng, rollCtx)) {
        spawnGroundItem(ctx, drop.itemId, drop.quantity, tile, {
          tick,
          ...(ownerId !== undefined ? { ownerId } : {}),
          sourceEntityId: entityId,
        });
      }
    }

    ctx.world.setComponent(entityId, "combatant", {
      ...removePendingHits(combatant),
      health: 0,
      targetId: undefined,
      dead: true,
    });
    ctx.world.removeComponent(entityId, "movement");
    ctx.actionQueue?.cancel(entityId, {});
    ctx.world.setComponent(entityId, "npc", {
      ...npc,
      brainState: "respawning",
      respawnTick: tick + def.respawnTicks,
    });
    ctx.deltas.markEntityRemove(entityId);
  }

  for (const [entityId, combatant] of ctx.world.componentEntries("combatant")) {
    if (!ctx.world.hasComponent(entityId, "player")) {
      continue;
    }
    if (combatant.health > 0 || combatant.dead === true) {
      continue;
    }
    ctx.world.setComponent(entityId, "combatant", {
      ...removePendingHits(combatant),
      health: 0,
      targetId: undefined,
      dead: true,
      respawnTick: tick + 5,
    });
    ctx.world.removeComponent(entityId, "movement");
    ctx.actionQueue?.cancel(entityId, {});
    ctx.deltas.markEntityUpdate(entityId, {
      healthBar: { current: 0, max: combatant.maxHealth },
    });
    createGraveOnDeath(ctx, entityId, tick);
    systemMessage(ctx.deltas, entityId, "You have died. You will respawn shortly.", serverTime);
  }

  syncNpcOccupancy(ctx);
}

export function dropInventoryOnDeath(
  ctx: GroundItemSystemContext,
  playerId: EntityId,
  tick: number,
): void {
  const inventory = ctx.world.getComponent(playerId, "inventory");
  const position = ctx.world.getComponent(playerId, "position");
  if (!inventory || !position) {
    return;
  }

  const tile = tileFromPosition(position);
  const changes: import("@old-town/shared").InventorySlotChange[] = [];

  for (let slot = 0; slot < inventory.capacity; slot += 1) {
    const item = inventory.slots[slot];
    if (!item) {
      continue;
    }

    spawnGroundItem(ctx, item.itemId, item.quantity, tile, {
      tick,
      ownerId: playerId,
      sourceEntityId: playerId,
    });

    inventory.slots[slot] = undefined;
    changes.push({ slot, itemId: null, quantity: 0 });
  }

  if (changes.length > 0) {
    ctx.deltas.markInventoryDelta({
      containerId: inventory.containerId,
      changes,
    });
  }
}

export function createGraveOnDeath(
  ctx: GroundItemSystemContext,
  playerId: EntityId,
  tick: number,
): void {
  const inventory = ctx.world.getComponent(playerId, "inventory");
  const position = ctx.world.getComponent(playerId, "position");
  if (!inventory || !position) {
    return;
  }

  const tile = tileFromPosition(position);

  // Collect occupied slots with their value
  const occupiedSlots = inventory.slots
    .map((item, slot) => ({
      item,
      slot,
      value: item ? (ctx.registries.item.get(item.itemId)?.value ?? 0) : 0,
    }))
    .filter(
      (entry): entry is { item: InventorySlot; slot: number; value: number } =>
        entry.item !== undefined,
    );

  // Sort by value descending, keep top 3
  occupiedSlots.sort((a, b) => b.value - a.value);
  const keepCount = 3;
  const _toKeep = occupiedSlots.slice(0, keepCount);
  const toDrop = occupiedSlots.slice(keepCount);

  const changes: import("@old-town/shared").InventorySlotChange[] = [];

  // Clear dropped slots
  for (const entry of toDrop) {
    inventory.slots[entry.slot] = undefined;
    changes.push({ slot: entry.slot, itemId: null, quantity: 0 });
  }

  if (changes.length > 0) {
    ctx.deltas.markInventoryDelta({
      containerId: inventory.containerId,
      changes,
    });
  }

  if (toDrop.length === 0) {
    return;
  }

  // Create grave entity
  const graveEntityId = ctx.world.createEntity();
  const graveItems = toDrop.map((entry) => ({ ...entry.item }));

  ctx.world.setComponent(graveEntityId, "position", {
    entityId: graveEntityId,
    x: tile.x,
    y: tile.y,
    plane: tile.plane,
  });
  ctx.world.setComponent(graveEntityId, "grave", {
    entityId: graveEntityId,
    playerId,
    items: graveItems,
    despawnTick: tick + GRAVE_DESPAWN_TICKS,
  });

  const spawn = projectEntity(ctx.world, graveEntityId);
  if (spawn) {
    ctx.deltas.markEntityAdd(spawn);
  }
}

export function processGraveLifecycle(
  ctx: GroundItemSystemContext,
  tick: number,
  serverTime: number,
): void {
  const catalog = catalogFromItems(ctx.registries.item);

  for (const [entityId, grave] of ctx.world.componentEntries("grave")) {
    if (tick >= grave.despawnTick) {
      ctx.world.destroyEntity(entityId);
      ctx.deltas.markEntityRemove(entityId);
      continue;
    }

    const ownerPosition = ctx.world.getComponent(grave.playerId, "position");
    const gravePosition = ctx.world.getComponent(entityId, "position");
    if (!ownerPosition || !gravePosition) {
      continue;
    }

    if (!sameTile(tileFromPosition(ownerPosition), tileFromPosition(gravePosition))) {
      continue;
    }

    const ownerInventory = ctx.world.getComponent(grave.playerId, "inventory");
    if (!ownerInventory) {
      continue;
    }

    const changes: import("@old-town/shared").InventorySlotChange[] = [];
    const remainingItems: InventorySlot[] = [];
    let reclaimedAny = false;

    for (const item of grave.items) {
      const result = addItem(ownerInventory, catalog, item.itemId, item.quantity);
      if (result.added > 0) {
        changes.push(...result.changes);
        reclaimedAny = true;
      }
      if (result.added < item.quantity) {
        remainingItems.push({ ...item, quantity: item.quantity - result.added });
      }
    }

    if (changes.length > 0) {
      ctx.deltas.markInventoryDelta(buildDelta(ownerInventory, changes));
    }

    if (remainingItems.length === 0) {
      ctx.world.destroyEntity(entityId);
      ctx.deltas.markEntityRemove(entityId);
      if (reclaimedAny) {
        systemMessage(
          ctx.deltas,
          grave.playerId,
          "You reclaim all your items from the grave.",
          serverTime,
        );
      }
    } else {
      ctx.world.setComponent(entityId, "grave", {
        ...grave,
        items: remainingItems,
      });
      if (reclaimedAny) {
        systemMessage(
          ctx.deltas,
          grave.playerId,
          "You reclaim some items from the grave.",
          serverTime,
        );
      }
    }
  }
}

export function processGroundItemLifecycle(ctx: GroundItemSystemContext, tick: number): void {
  for (const [entityId, groundItem] of ctx.world.componentEntries("groundItem")) {
    if (groundItem.despawnTick !== undefined && tick >= groundItem.despawnTick) {
      ctx.itemAudit?.recordForEntity(groundItem.ownerId, {
        tick,
        itemId: groundItem.itemId,
        quantity: groundItem.quantity,
        reason: "ground_despawn",
        beforeQuantity: groundItem.quantity,
        afterQuantity: 0,
        metadata: {
          groundItemEntityId: entityId,
          ...(groundItem.ownerId !== undefined ? { ownerEntityId: groundItem.ownerId } : {}),
        },
      });
      ctx.world.destroyEntity(entityId);
      ctx.deltas.markEntityRemove(entityId);
      continue;
    }
    if (groundItem.publicAtTick === tick) {
      const spawn = projectEntity(ctx.world, entityId);
      if (spawn) {
        ctx.deltas.markEntityAdd(spawn);
      }
    }
  }
}

export function handleGroundItemIntent(
  ctx: GroundItemSystemContext,
  owner: EntityId,
  intent: GroundItemIntent,
  tick: number,
  serverTime: number,
): boolean {
  if (!PICKUP_ACTIONS.has(intent.actionId)) {
    return false;
  }

  const groundItem = ctx.world.getComponent(intent.groundItemEntityId, "groundItem");
  const itemPosition = ctx.world.getComponent(intent.groundItemEntityId, "position");
  if (!groundItem || !itemPosition) {
    systemMessage(ctx.deltas, owner, "That item is no longer there.", serverTime);
    return true;
  }
  if (!groundItemVisibleToPlayer(groundItem, owner, tick)) {
    systemMessage(ctx.deltas, owner, "That item is not yours to take yet.", serverTime);
    return true;
  }

  const ownerPosition = ctx.world.getComponent(owner, "position");
  if (!ownerPosition) {
    return true;
  }
  const itemTile = tileFromPosition(itemPosition);
  if (!sameTile(tileFromPosition(ownerPosition), itemTile)) {
    if (!ctx.actionQueue) {
      systemMessage(ctx.deltas, owner, "Move onto the item first.", serverTime);
      return true;
    }
    // Pickup requires standing on the item's tile (not adjacency), so walk to
    // the tile and enqueue a begin_pickup poll that completes on arrival.
    beginApproach(
      {
        world: ctx.world,
        collision: ctx.collision,
        deltas: ctx.deltas,
        actionQueue: ctx.actionQueue,
      },
      owner,
      itemTile,
      () => ({ kind: "begin_pickup", groundItemEntityId: intent.groundItemEntityId }),
      tick,
    );
    return true;
  }

  completePickup(ctx, owner, intent.groundItemEntityId, groundItem, tick, serverTime);
  return true;
}

/**
 * Poll action executed each tick while the actor walks toward a ground item.
 * Completes the pickup once the actor stands on the item's tile; cancels
 * itself if the item vanishes mid-approach.
 */
export function handleBeginPickup(
  ctx: GroundItemSystemContext,
  action: ActionExecution,
  payload: BeginPickupPayload,
  tick: number,
  serverTime: number,
): void {
  const owner = action.entry.owner;
  const cancelSelf = () => ctx.actionQueue?.cancel(owner, { id: action.entry.id });

  const groundItem = ctx.world.getComponent(payload.groundItemEntityId, "groundItem");
  const itemPosition = ctx.world.getComponent(payload.groundItemEntityId, "position");
  if (!groundItem || !itemPosition) {
    cancelSelf();
    systemMessage(ctx.deltas, owner, "That item is no longer there.", serverTime);
    return;
  }

  const ownerPosition = ctx.world.getComponent(owner, "position");
  if (!ownerPosition) {
    cancelSelf();
    return;
  }
  if (!sameTile(tileFromPosition(ownerPosition), tileFromPosition(itemPosition))) {
    return;
  }

  cancelSelf();
  if (!groundItemVisibleToPlayer(groundItem, owner, tick)) {
    systemMessage(ctx.deltas, owner, "That item is not yours to take yet.", serverTime);
    return;
  }
  completePickup(ctx, owner, payload.groundItemEntityId, groundItem, tick, serverTime);
}

function completePickup(
  ctx: GroundItemSystemContext,
  owner: EntityId,
  groundItemEntityId: EntityId,
  groundItem: GroundItemComponent,
  tick: number,
  serverTime: number,
): void {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    systemMessage(ctx.deltas, owner, "You have nowhere to put that.", serverTime);
    return;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  if (!hasSpaceFor(inventory, catalog, groundItem.itemId, groundItem.quantity)) {
    systemMessage(ctx.deltas, owner, "Your inventory is full.", serverTime);
    return;
  }

  const beforeQuantity = count(inventory, groundItem.itemId);
  const result = addItem(inventory, catalog, groundItem.itemId, groundItem.quantity);
  if (result.added !== groundItem.quantity) {
    systemMessage(ctx.deltas, owner, "Your inventory is full.", serverTime);
    return;
  }

  ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
  ctx.itemAudit?.recordForEntity(owner, {
    tick,
    itemId: groundItem.itemId,
    quantity: groundItem.quantity,
    reason: "ground_pickup",
    beforeQuantity,
    afterQuantity: count(inventory, groundItem.itemId),
    metadata: {
      groundItemEntityId,
      ...(groundItem.ownerId !== undefined ? { ownerEntityId: groundItem.ownerId } : {}),
    },
  });
  dispatchQuestEvent(
    ctx,
    owner,
    { kind: "item_gained", itemId: groundItem.itemId, quantity: groundItem.quantity },
    serverTime,
  );
  trackContractItemGain(ctx, owner, groundItem.itemId, groundItem.quantity);
  ctx.world.destroyEntity(groundItemEntityId);
  ctx.deltas.markEntityRemove(groundItemEntityId);
}
