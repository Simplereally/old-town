import type { ContentRegistries, EntityId, ShopDef, ShopIntent } from "@old-town/shared";
import type { ShopComponent } from "../ecs/components";
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
import type { CollisionMap } from "../world/collision";

export interface ShopSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

const SHOP_INTERFACE_ID = "shop";

function emitSystemMessage(
  ctx: ShopSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

function isNearTarget(ctx: ShopSystemContext, owner: EntityId, targetEntityId: EntityId): boolean {
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

function getOrCreateShop(ctx: ShopSystemContext, npcEntityId: EntityId): ShopComponent | undefined {
  const existing = ctx.world.getComponent(npcEntityId, "shop");
  if (existing) return existing;

  const npc = ctx.world.getComponent(npcEntityId, "npc");
  if (!npc) return undefined;

  let shopDef: ShopDef | undefined;
  for (const def of ctx.registries.shop.values()) {
    if (def.npcId === npc.npcId) {
      shopDef = def;
      break;
    }
  }
  if (!shopDef) return undefined;

  const shop: ShopComponent = {
    entityId: npcEntityId,
    shopId: shopDef.id,
    stock: shopDef.stock.map((s) => ({
      itemId: s.itemId,
      quantity: s.quantity,
      maxQuantity: s.maxQuantity,
      price: s.price ?? 1,
      restockRate: s.restockRate,
    })),
    lastRestockTick: 0,
  };

  ctx.world.setComponent(npcEntityId, "shop", shop);
  return shop;
}

function buildShopView(
  shop: ShopComponent,
  shopDef: ShopDef,
): import("@old-town/shared").ShopViewPacket {
  return {
    shopId: shop.shopId,
    name: shopDef.name,
    stock: shop.stock.map((s) => ({
      itemId: s.itemId,
      quantity: s.quantity,
      price: s.price,
      maxQuantity: s.maxQuantity,
    })),
    sellMultiplier: shopDef.sellMultiplier,
    buyMultiplier: shopDef.buyMultiplier,
  };
}

export function handleShopIntent(
  ctx: ShopSystemContext,
  owner: EntityId,
  intent: ShopIntent,
  tick: number,
  serverTime: number,
): boolean {
  switch (intent.action) {
    case "open": {
      if (intent.targetEntityId === undefined) {
        emitSystemMessage(ctx, owner, "No shop target found.", serverTime);
        return true;
      }
      if (!isNearTarget(ctx, owner, intent.targetEntityId)) {
        emitSystemMessage(ctx, owner, "You are too far away from the shop.", serverTime);
        return true;
      }
      const shop = getOrCreateShop(ctx, intent.targetEntityId);
      if (!shop) {
        emitSystemMessage(ctx, owner, "This NPC does not run a shop.", serverTime);
        return true;
      }
      const shopDef = ctx.registries.shop.get(shop.shopId);
      if (!shopDef) {
        emitSystemMessage(ctx, owner, "Shop definition not found.", serverTime);
        return true;
      }
      ctx.deltas.markInterfaceOpen({
        interfaceId: SHOP_INTERFACE_ID,
        shop: buildShopView(shop, shopDef),
      });
      return true;
    }
    case "close": {
      ctx.deltas.markInterfaceClose({ interfaceId: SHOP_INTERFACE_ID });
      return true;
    }
    case "buy": {
      if (intent.itemId === undefined || intent.quantity === undefined || intent.quantity <= 0) {
        return true;
      }
      const inventory = ctx.world.getComponent(owner, "inventory");
      if (!inventory) return true;

      const shop = findNearestShop(ctx, owner);
      if (!shop) {
        emitSystemMessage(ctx, owner, "No shop available.", serverTime);
        return true;
      }

      const shopDef = ctx.registries.shop.get(shop.shopId);
      if (!shopDef) return true;

      const stockEntry = shop.stock.find((s) => s.itemId === intent.itemId);
      if (!stockEntry) {
        emitSystemMessage(ctx, owner, "This item is not sold here.", serverTime);
        return true;
      }

      if (stockEntry.quantity < intent.quantity) {
        emitSystemMessage(ctx, owner, "The shop is out of stock.", serverTime);
        return true;
      }

      const itemDef = ctx.registries.item.get(intent.itemId);
      const unitPrice = Math.max(
        1,
        Math.floor((stockEntry.price ?? itemDef?.value ?? 1) * shopDef.buyMultiplier),
      );
      const totalPrice = unitPrice * intent.quantity;

      if (count(inventory, shopDef.currency) < totalPrice) {
        emitSystemMessage(ctx, owner, "You don't have enough coins.", serverTime);
        return true;
      }

      const catalog = catalogFromItems(ctx.registries.item);
      if (!hasSpaceFor(inventory, catalog, intent.itemId, intent.quantity)) {
        emitSystemMessage(ctx, owner, "Your inventory is full.", serverTime);
        return true;
      }

      const currencyRemoveResult = removeItem(inventory, shopDef.currency, totalPrice);
      const itemAddResult = addItem(inventory, catalog, intent.itemId, intent.quantity);
      stockEntry.quantity -= intent.quantity;

      ctx.deltas.markInventoryDelta(
        buildDelta(inventory, [...currencyRemoveResult.changes, ...itemAddResult.changes]),
      );
      ctx.deltas.markInterfaceOpen({
        interfaceId: SHOP_INTERFACE_ID,
        shop: buildShopView(shop, shopDef),
      });

      ctx.itemAudit?.recordForEntity(owner, {
        itemId: intent.itemId,
        quantity: intent.quantity,
        reason: "shop_buy",
        tick,
        beforeQuantity: stockEntry.quantity + intent.quantity,
        afterQuantity: stockEntry.quantity,
      });

      return true;
    }
    case "sell": {
      if (intent.itemId === undefined || intent.quantity === undefined || intent.quantity <= 0) {
        return true;
      }
      const inventory = ctx.world.getComponent(owner, "inventory");
      if (!inventory) return true;

      const shop = findNearestShop(ctx, owner);
      if (!shop) {
        emitSystemMessage(ctx, owner, "No shop available.", serverTime);
        return true;
      }

      const shopDef = ctx.registries.shop.get(shop.shopId);
      if (!shopDef) return true;

      const stockEntry = shop.stock.find((s) => s.itemId === intent.itemId);
      if (!stockEntry) {
        emitSystemMessage(ctx, owner, "The shop isn't interested in that.", serverTime);
        return true;
      }

      if (count(inventory, intent.itemId) < intent.quantity) {
        emitSystemMessage(ctx, owner, "You don't have enough items to sell.", serverTime);
        return true;
      }

      const itemDef = ctx.registries.item.get(intent.itemId);
      const unitPrice = Math.max(
        1,
        Math.floor((stockEntry.price ?? itemDef?.value ?? 1) * shopDef.sellMultiplier),
      );
      const totalPrice = unitPrice * intent.quantity;

      const catalog = catalogFromItems(ctx.registries.item);
      const itemRemoveResult = removeItem(inventory, intent.itemId, intent.quantity);
      const currencyAddResult = addItem(inventory, catalog, shopDef.currency, totalPrice);
      stockEntry.quantity = Math.min(stockEntry.maxQuantity, stockEntry.quantity + intent.quantity);

      ctx.deltas.markInventoryDelta(
        buildDelta(inventory, [...itemRemoveResult.changes, ...currencyAddResult.changes]),
      );
      ctx.deltas.markInterfaceOpen({
        interfaceId: SHOP_INTERFACE_ID,
        shop: buildShopView(shop, shopDef),
      });

      ctx.itemAudit?.recordForEntity(owner, {
        itemId: intent.itemId,
        quantity: intent.quantity,
        reason: "shop_sell",
        tick,
        beforeQuantity: stockEntry.quantity - intent.quantity,
        afterQuantity: stockEntry.quantity,
      });

      return true;
    }
    default:
      return false;
  }
}

function findNearestShop(ctx: ShopSystemContext, owner: EntityId): ShopComponent | undefined {
  const playerPos = ctx.world.getComponent(owner, "position");
  if (!playerPos) return undefined;

  let nearest: { shop: ShopComponent; distance: number } | undefined;

  for (const [entityId, shop] of ctx.world.componentEntries("shop")) {
    const pos = ctx.world.getComponent(entityId, "position");
    if (!pos || pos.plane !== playerPos.plane) continue;
    const distance = Math.max(Math.abs(playerPos.x - pos.x), Math.abs(playerPos.y - pos.y));
    if (!nearest || distance < nearest.distance) {
      nearest = { shop, distance };
    }
  }

  return nearest?.shop;
}

export function processShopRestockPhase(ctx: ShopSystemContext, tick: number): void {
  for (const [entityId, shop] of ctx.world.componentEntries("shop")) {
    const shopDef = ctx.registries.shop.get(shop.shopId);
    if (!shopDef) continue;

    if (tick - shop.lastRestockTick < shopDef.restockTicks) continue;

    for (const entry of shop.stock) {
      entry.quantity = Math.min(entry.maxQuantity, entry.quantity + entry.restockRate);
    }

    shop.lastRestockTick = tick;
    ctx.world.setComponent(entityId, "shop", shop);
  }
}
