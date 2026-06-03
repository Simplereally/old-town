import type { EntityId, ObjectIntent, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { count, removeItem } from "../items/inventory";
import type { ResourceNodeContext } from "./resource-node-system";
import { addXp } from "../skills/skill-state";

export interface FavourSystemContext extends ResourceNodeContext {
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: FavourSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

/** Object IDs that are valid shrines/hearths for praying. */
const SHRINE_OBJECT_IDS = new Set(["shrine_hearth", "market_kitchen_hearth", "altar"]);

function isShrine(objectId: string): boolean {
  return SHRINE_OBJECT_IDS.has(objectId);
}

/**
 * Find the first offering item in the inventory and return its itemId.
 * An offering is any item with the "offering" tag.
 */
function findOfferingItemId(
  ctx: FavourSystemContext,
  owner: EntityId,
): { itemId: string; itemName: string } | undefined {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return undefined;
  }
  for (const slot of inventory.slots) {
    if (!slot) {
      continue;
    }
    const item = ctx.registries.item.get(slot.itemId);
    if (item?.tags.includes("offering")) {
      return { itemId: slot.itemId, itemName: item.name };
    }
  }
  return undefined;
}

/** XP awarded per offering item, keyed by itemId. Falls back to item value if not explicitly set. */
const OFFERING_XP: Record<string, number> = {
  shrine_candle: 15,
  prayer_knot: 20,
  grave_flower: 25,
  small_bones: 10,
  bone_chips: 8,
  ash: 12,
  blackcoal_ash: 18,
  grave_dust: 14,
  votive_bead: 22,
  bell_token: 30,
  drake_tooth: 35,
  saintbone: 50,
  favour_cordial: 0, // consumable, not an offering
};

function offeringXp(ctx: FavourSystemContext, itemId: string): number {
  if (OFFERING_XP[itemId] !== undefined) {
    return OFFERING_XP[itemId];
  }
  const item = ctx.registries.item.get(itemId);
  // Default: 5 + item value, minimum 5
  return Math.max(5, 5 + (item?.value ?? 0));
}

export function handlePrayIntent(
  ctx: FavourSystemContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
): boolean {
  const object = ctx.world.getComponent(intent.objectEntityId, "object");
  if (!object) {
    return false;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef) {
    return false;
  }

  const actorTile = tileOf(ctx.world, owner);
  const objectTile = tileOf(ctx.world, intent.objectEntityId);
  if (!actorTile || !objectTile) {
    return false;
  }
  if (chebyshev(actorTile, objectTile) > 1) {
    // Out of range; let the router handle pathing
    return false;
  }

  if (!isShrine(object.objectId)) {
    systemMessage(ctx, owner, "You cannot pray here.", serverTime);
    return true;
  }

  const offering = findOfferingItemId(ctx, owner);
  if (!offering) {
    systemMessage(ctx, owner, "You need an offering to pray at the shrine.", serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return false;
  }

  // Consume one offering
  const removed = removeItem(inventory, offering.itemId, 1);
  if (removed.removed < 1) {
    systemMessage(ctx, owner, "You need an offering to pray at the shrine.", serverTime);
    return true;
  }

  ctx.deltas.markInventoryDelta({
    containerId: inventory.containerId,
    changes: removed.changes,
  });

  const xp = offeringXp(ctx, offering.itemId);
  const result = addXp({ world: ctx.world, deltas: ctx.deltas }, owner, "favour", xp);

  if (result?.levelUp) {
    systemMessage(
      ctx,
      owner,
      `You offer ${offering.itemName} at the shrine. Your Favour level is now ${result.newLevel}!`,
      serverTime,
    );
  } else {
    systemMessage(
      ctx,
      owner,
      `You offer ${offering.itemName} at the shrine.`,
      serverTime,
    );
  }

  ctx.itemAudit?.recordForEntity(owner, {
    tick: tick ?? 0,
    itemId: offering.itemId,
    quantity: 1,
    reason: "favour_offering",
    beforeQuantity: count(inventory, offering.itemId) + 1,
    afterQuantity: count(inventory, offering.itemId),
    metadata: {
      objectEntityId: intent.objectEntityId,
      objectId: object.objectId,
      xpAwarded: xp,
    },
  });

  return true;
}
