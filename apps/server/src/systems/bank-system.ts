import type { BankDef, BankIntent, ContentRegistries, EntityId } from "@old-town/shared";
import type { BankComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  createInventory,
  findSlotByUid,
  hasSpaceFor,
  removeFromSlot,
  toInventoryDelta,
} from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";

export interface BankSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

const BANK_INTERFACE_ID = "bank";
const DEFAULT_BANK_CAPACITY = 400;

function emitSystemMessage(
  ctx: BankSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

function getOrCreateBank(ctx: BankSystemContext, owner: EntityId): BankComponent {
  const existing = ctx.world.getComponent(owner, "bank");
  if (existing) return existing;

  const bankDef = ctx.registries.bank.values().next().value as BankDef | undefined;
  const capacity = bankDef?.capacity ?? DEFAULT_BANK_CAPACITY;

  const bank = createInventory(owner, "bank", capacity) as unknown as BankComponent;
  ctx.world.setComponent(owner, "bank", bank);
  return bank;
}

function isNearTarget(ctx: BankSystemContext, owner: EntityId, targetEntityId: EntityId): boolean {
  const playerPos = ctx.world.getComponent(owner, "position");
  const targetPos = ctx.world.getComponent(targetEntityId, "position");
  if (!playerPos || !targetPos) return false;
  if (playerPos.plane !== targetPos.plane) return false;
  const distance = Math.max(
    Math.abs(playerPos.x - targetPos.x),
    Math.abs(playerPos.y - targetPos.y),
  );
  return distance <= 1;
}

export function handleBankIntent(
  ctx: BankSystemContext,
  owner: EntityId,
  intent: BankIntent,
  tick: number,
  serverTime: number,
): boolean {
  switch (intent.action) {
    case "open": {
      if (intent.targetEntityId !== undefined) {
        if (!isNearTarget(ctx, owner, intent.targetEntityId)) {
          emitSystemMessage(ctx, owner, "You are too far away from the bank.", serverTime);
          return true;
        }
      }
      const bank = getOrCreateBank(ctx, owner);
      ctx.deltas.markInterfaceOpen({ interfaceId: BANK_INTERFACE_ID });
      ctx.deltas.markInventoryDelta(toInventoryDelta(bank));
      return true;
    }
    case "close": {
      ctx.deltas.markInterfaceClose({ interfaceId: BANK_INTERFACE_ID });
      return true;
    }
    case "deposit": {
      if (intent.itemUid === undefined || intent.quantity === undefined || intent.quantity <= 0) {
        return true;
      }
      const inventory = ctx.world.getComponent(owner, "inventory");
      const bank = getOrCreateBank(ctx, owner);
      if (!inventory) return true;

      const slot = findSlotByUid(inventory, intent.itemUid);
      if (slot === undefined) {
        emitSystemMessage(ctx, owner, "Item not found in inventory.", serverTime);
        return true;
      }

      const item = inventory.slots[slot];
      if (!item) return true;

      const quantity = Math.min(intent.quantity, item.quantity);
      const catalog = catalogFromItems(ctx.registries.item);

      const removeResult = removeFromSlot(inventory, slot, quantity);
      const addResult = addItem(bank, catalog, item.itemId, quantity);

      if (addResult.added < quantity) {
        addItem(inventory, catalog, item.itemId, removeResult.removed);
        emitSystemMessage(ctx, owner, "Your bank is full.", serverTime);
        return true;
      }

      ctx.deltas.markInventoryDelta(buildDelta(inventory, removeResult.changes));
      ctx.deltas.markInventoryDelta(buildDelta(bank, addResult.changes));

      ctx.itemAudit?.recordForEntity(owner, {
        itemId: item.itemId,
        quantity: quantity,
        reason: "bank_deposit",
        tick,
        beforeQuantity: item.quantity,
        afterQuantity: item.quantity - quantity,
      });

      return true;
    }
    case "withdraw": {
      if (intent.itemUid === undefined || intent.quantity === undefined || intent.quantity <= 0) {
        return true;
      }
      const inventory = ctx.world.getComponent(owner, "inventory");
      const bank = ctx.world.getComponent(owner, "bank");
      if (!inventory || !bank) {
        emitSystemMessage(ctx, owner, "Item not found in bank.", serverTime);
        return true;
      }

      const slot = findSlotByUid(bank, intent.itemUid);
      if (slot === undefined) {
        emitSystemMessage(ctx, owner, "Item not found in bank.", serverTime);
        return true;
      }

      const item = bank.slots[slot];
      if (!item) return true;

      const quantity = Math.min(intent.quantity, item.quantity);
      const catalog = catalogFromItems(ctx.registries.item);

      if (!hasSpaceFor(inventory, catalog, item.itemId, quantity)) {
        emitSystemMessage(ctx, owner, "Your inventory is full.", serverTime);
        return true;
      }

      const removeResult = removeFromSlot(bank, slot, quantity);
      const addResult = addItem(inventory, catalog, item.itemId, quantity);

      ctx.deltas.markInventoryDelta(buildDelta(bank, removeResult.changes));
      ctx.deltas.markInventoryDelta(buildDelta(inventory, addResult.changes));

      ctx.itemAudit?.recordForEntity(owner, {
        itemId: item.itemId,
        quantity: quantity,
        reason: "bank_withdraw",
        tick,
        beforeQuantity: 0,
        afterQuantity: quantity,
      });

      return true;
    }
    default:
      return false;
  }
}
