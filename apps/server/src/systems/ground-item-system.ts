import type {
  ContentRegistries,
  DropTableDef,
  EntityId,
  GroundItemIntent,
  ItemQuantity,
  Rng,
  TileCoord,
} from "@old-town/shared";
import type { CombatantComponent, GroundItemComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import { addItem, buildDelta, catalogFromItems, hasSpaceFor } from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import { projectEntity } from "../net/entity-spawn-projector";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";
import { syncNpcOccupancy } from "./npc-system";

export interface GroundItemSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog;
}

export const DROP_PRIVATE_TICKS = 60;
export const GROUND_ITEM_DESPAWN_TICKS = 300;

const PICKUP_ACTIONS = new Set(["pickup", "take"]);

function tileFromPosition(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: number;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] };
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

export function rollDropTable(table: DropTableDef, rng: Rng): ItemQuantity[] {
  const drops: ItemQuantity[] = [...table.alwaysDrops];
  const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return drops;
  }

  for (let roll = 0; roll < table.rolls; roll += 1) {
    let cursor = rng.nextInt(1, totalWeight);
    for (const entry of table.entries) {
      cursor -= entry.weight;
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
  ctx.itemAudit?.record({
    kind: "drop_spawn",
    tick: options.tick,
    itemId,
    quantity,
    groundItemEntityId: entityId,
    ...(options.ownerId !== undefined ? { ownerId: options.ownerId } : {}),
    ...(options.sourceEntityId !== undefined ? { sourceEntityId: options.sourceEntityId } : {}),
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

export function processDeathResolution(ctx: GroundItemSystemContext, tick: number): void {
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
    const drops = def.drops ? ctx.registries.dropTable.get(def.drops) : undefined;
    if (drops) {
      for (const drop of rollDropTable(drops, ctx.rng)) {
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
    });
    ctx.deltas.markEntityUpdate(entityId, {
      healthBar: { current: 0, max: combatant.maxHealth },
    });
  }

  syncNpcOccupancy(ctx);
}

export function processGroundItemLifecycle(ctx: GroundItemSystemContext, tick: number): void {
  for (const [entityId, groundItem] of ctx.world.componentEntries("groundItem")) {
    if (groundItem.despawnTick !== undefined && tick >= groundItem.despawnTick) {
      ctx.itemAudit?.record({
        kind: "ground_despawn",
        tick,
        itemId: groundItem.itemId,
        quantity: groundItem.quantity,
        groundItemEntityId: entityId,
        ...(groundItem.ownerId !== undefined ? { ownerId: groundItem.ownerId } : {}),
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
  if (
    !ownerPosition ||
    !sameTile(tileFromPosition(ownerPosition), tileFromPosition(itemPosition))
  ) {
    systemMessage(ctx.deltas, owner, "Move onto the item first.", serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    systemMessage(ctx.deltas, owner, "You have nowhere to put that.", serverTime);
    return true;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  if (!hasSpaceFor(inventory, catalog, groundItem.itemId, groundItem.quantity)) {
    systemMessage(ctx.deltas, owner, "Your inventory is full.", serverTime);
    return true;
  }

  const result = addItem(inventory, catalog, groundItem.itemId, groundItem.quantity);
  if (result.added !== groundItem.quantity) {
    systemMessage(ctx.deltas, owner, "Your inventory is full.", serverTime);
    return true;
  }

  ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
  ctx.itemAudit?.record({
    kind: "ground_pickup",
    tick,
    itemId: groundItem.itemId,
    quantity: groundItem.quantity,
    actorId: owner,
    groundItemEntityId: intent.groundItemEntityId,
    ...(groundItem.ownerId !== undefined ? { ownerId: groundItem.ownerId } : {}),
  });
  ctx.world.destroyEntity(intent.groundItemEntityId);
  ctx.deltas.markEntityRemove(intent.groundItemEntityId);
  return true;
}
