import type { ContentRegistries, EntityId } from "@old-town/shared";
import type { Deed, DeedComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  count,
  hasSpaceFor,
  removeItem,
} from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { setVar } from "../vars/player-vars";

export interface LedgerSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

export const DEED_ITEM_ID = "ledger_deed";

function systemMessage(
  ctx: LedgerSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function getOrCreateDeedComponent(world: World, entityId: EntityId): DeedComponent {
  const existing = world.getComponent(entityId, "deed");
  if (existing) return existing;
  const component: DeedComponent = { entityId, deeds: [] };
  world.setComponent(entityId, "deed", component);
  return component;
}

function findDeed(component: DeedComponent, propertyId: string): Deed | undefined {
  return component.deeds.find((d) => d.propertyId === propertyId);
}

function removeDeed(component: DeedComponent, propertyId: string): Deed | undefined {
  const index = component.deeds.findIndex((d) => d.propertyId === propertyId);
  if (index === -1) return undefined;
  const removed = component.deeds[index];
  component.deeds.splice(index, 1);
  return removed;
}

export function createDeed(
  ctx: LedgerSystemContext,
  owner: EntityId,
  propertyId: string,
  tick: number,
  serverTime: number,
  expiryTick?: number,
): boolean {
  const propertyDef = ctx.registries.property.get(propertyId);
  if (!propertyDef) {
    systemMessage(ctx, owner, "That property does not exist.", serverTime);
    return false;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return false;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  if (!hasSpaceFor(inventory, catalog, DEED_ITEM_ID, 1)) {
    systemMessage(ctx, owner, "Your inventory is full.", serverTime);
    return false;
  }

  const deedComponent = getOrCreateDeedComponent(ctx.world, owner);

  // Prevent duplicate deeds for the same property on the same owner
  if (findDeed(deedComponent, propertyId) !== undefined) {
    systemMessage(ctx, owner, "You already hold a deed for that property.", serverTime);
    return false;
  }

  const deed: Deed = {
    id: `${propertyId}:${owner}:${tick}`,
    propertyId,
    ownerId: owner,
    issuedTick: tick,
    expiryTick: expiryTick ?? propertyDef.expiryTicks,
    transferable: propertyDef.transferable,
  };

  deedComponent.deeds.push(deed);
  ctx.world.setComponent(owner, "deed", deedComponent);

  const beforeQuantity = count(inventory, DEED_ITEM_ID);
  const addResult = addItem(inventory, catalog, DEED_ITEM_ID, 1);
  if (addResult.added > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, addResult.changes));
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: DEED_ITEM_ID,
      quantity: 1,
      reason: "deed_create",
      beforeQuantity,
      afterQuantity: count(inventory, DEED_ITEM_ID),
      metadata: { propertyId, deedId: deed.id },
    });
  }

  systemMessage(ctx, owner, `You receive a deed for ${propertyDef.name}.`, serverTime);
  return true;
}

export function transferDeed(
  ctx: LedgerSystemContext,
  from: EntityId,
  to: EntityId,
  propertyId: string,
  tick: number,
  serverTime: number,
): boolean {
  const fromDeedComponent = ctx.world.getComponent(from, "deed");
  if (!fromDeedComponent) {
    systemMessage(ctx, from, "You do not hold any deeds.", serverTime);
    return false;
  }

  const deed = findDeed(fromDeedComponent, propertyId);
  if (!deed) {
    systemMessage(ctx, from, "You do not hold a deed for that property.", serverTime);
    return false;
  }

  if (!deed.transferable) {
    systemMessage(ctx, from, "This deed is not transferable.", serverTime);
    return false;
  }

  // Check expiry
  if (deed.expiryTick > 0 && tick > deed.expiryTick) {
    systemMessage(ctx, from, "This deed has expired.", serverTime);
    return false;
  }

  const fromInventory = ctx.world.getComponent(from, "inventory");
  const toInventory = ctx.world.getComponent(to, "inventory");
  if (!fromInventory || !toInventory) {
    return false;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  if (!hasSpaceFor(toInventory, catalog, DEED_ITEM_ID, 1)) {
    systemMessage(ctx, to, "Your inventory is full.", serverTime);
    return false;
  }

  // Remove deed from source
  const removed = removeDeed(fromDeedComponent, propertyId);
  if (!removed) {
    return false;
  }
  ctx.world.setComponent(from, "deed", fromDeedComponent);

  const fromBefore = count(fromInventory, DEED_ITEM_ID);
  const removeResult = removeItem(fromInventory, DEED_ITEM_ID, 1);
  if (removeResult.removed < 1) {
    // Roll back deed removal
    fromDeedComponent.deeds.push(deed);
    ctx.world.setComponent(from, "deed", fromDeedComponent);
    systemMessage(ctx, from, "You do not have the deed item.", serverTime);
    return false;
  }

  ctx.deltas.markInventoryDelta(buildDelta(fromInventory, removeResult.changes));
  ctx.itemAudit?.recordForEntity(from, {
    tick,
    itemId: DEED_ITEM_ID,
    quantity: 1,
    reason: "deed_transfer_out",
    beforeQuantity: fromBefore,
    afterQuantity: count(fromInventory, DEED_ITEM_ID),
    metadata: { propertyId, deedId: deed.id, toEntityId: to },
  });

  // Add deed to target
  const toDeedComponent = getOrCreateDeedComponent(ctx.world, to);
  const updatedDeed: Deed = { ...deed, ownerId: to };
  toDeedComponent.deeds.push(updatedDeed);
  ctx.world.setComponent(to, "deed", toDeedComponent);

  const toBefore = count(toInventory, DEED_ITEM_ID);
  const addResult = addItem(toInventory, catalog, DEED_ITEM_ID, 1);
  if (addResult.added > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(toInventory, addResult.changes));
    ctx.itemAudit?.recordForEntity(to, {
      tick,
      itemId: DEED_ITEM_ID,
      quantity: 1,
      reason: "deed_transfer_in",
      beforeQuantity: toBefore,
      afterQuantity: count(toInventory, DEED_ITEM_ID),
      metadata: { propertyId, deedId: deed.id, fromEntityId: from },
    });
  }

  systemMessage(ctx, from, "You transfer the deed.", serverTime);
  systemMessage(
    ctx,
    to,
    `You receive a deed for ${ctx.registries.property.get(propertyId)?.name ?? propertyId}.`,
    serverTime,
  );
  return true;
}

export function redeemDeed(
  ctx: LedgerSystemContext,
  owner: EntityId,
  propertyId: string,
  tick: number,
  serverTime: number,
): boolean {
  const deedComponent = ctx.world.getComponent(owner, "deed");
  if (!deedComponent) {
    systemMessage(ctx, owner, "You do not hold any deeds.", serverTime);
    return false;
  }

  const deed = findDeed(deedComponent, propertyId);
  if (!deed) {
    systemMessage(ctx, owner, "You do not hold a deed for that property.", serverTime);
    return false;
  }

  // Check expiry
  if (deed.expiryTick > 0 && tick > deed.expiryTick) {
    systemMessage(ctx, owner, "This deed has expired.", serverTime);
    return false;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return false;
  }

  const beforeQuantity = count(inventory, DEED_ITEM_ID);
  const removeResult = removeItem(inventory, DEED_ITEM_ID, 1);
  if (removeResult.removed < 1) {
    systemMessage(ctx, owner, "You do not have the deed item.", serverTime);
    return false;
  }

  // Remove deed record
  removeDeed(deedComponent, propertyId);
  ctx.world.setComponent(owner, "deed", deedComponent);

  ctx.deltas.markInventoryDelta(buildDelta(inventory, removeResult.changes));
  ctx.itemAudit?.recordForEntity(owner, {
    tick,
    itemId: DEED_ITEM_ID,
    quantity: 1,
    reason: "deed_redeem",
    beforeQuantity,
    afterQuantity: count(inventory, DEED_ITEM_ID),
    metadata: { propertyId, deedId: deed.id },
  });

  // Grant property rights via player var
  setVar({ world: ctx.world, deltas: ctx.deltas }, owner, `property.${propertyId}.owner`, owner);

  const propertyDef = ctx.registries.property.get(propertyId);
  systemMessage(
    ctx,
    owner,
    `You redeem the deed for ${propertyDef?.name ?? propertyId}. Property rights granted.`,
    serverTime,
  );
  return true;
}

export function processDeedExpiry(
  ctx: LedgerSystemContext,
  tick: number,
  serverTime: number,
): void {
  for (const [entityId, deedComponent] of ctx.world.componentEntries("deed")) {
    const expiredDeeds: Deed[] = [];
    for (const deed of deedComponent.deeds) {
      if (deed.expiryTick > 0 && tick > deed.expiryTick) {
        expiredDeeds.push(deed);
      }
    }
    if (expiredDeeds.length === 0) {
      continue;
    }

    const inventory = ctx.world.getComponent(entityId, "inventory");

    for (const deed of expiredDeeds) {
      const propertyDef = ctx.registries.property.get(deed.propertyId);
      systemMessage(
        ctx,
        entityId,
        `Your deed for ${propertyDef?.name ?? deed.propertyId} has expired.`,
        serverTime,
      );

      // Remove deed record
      removeDeed(deedComponent, deed.propertyId);

      // Remove deed item
      if (inventory) {
        const beforeQuantity = count(inventory, DEED_ITEM_ID);
        const removeResult = removeItem(inventory, DEED_ITEM_ID, 1);
        if (removeResult.removed > 0) {
          ctx.deltas.markInventoryDelta(buildDelta(inventory, removeResult.changes));
          ctx.itemAudit?.recordForEntity(entityId, {
            tick,
            itemId: DEED_ITEM_ID,
            quantity: 1,
            reason: "deed_expiry",
            beforeQuantity,
            afterQuantity: count(inventory, DEED_ITEM_ID),
            metadata: { propertyId: deed.propertyId, deedId: deed.id },
          });
        }
      }

      // Clear property rights if this entity was the owner
      const ownerVar = ctx.world.getComponent(entityId, "vars")?.values[
        `property.${deed.propertyId}.owner`
      ];
      if (ownerVar === entityId) {
        setVar(
          { world: ctx.world, deltas: ctx.deltas },
          entityId,
          `property.${deed.propertyId}.owner`,
          "",
        );
      }
    }

    ctx.world.setComponent(entityId, "deed", deedComponent);
  }
}
