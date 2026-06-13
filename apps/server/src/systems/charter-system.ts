import type { ContentRegistries } from "@old-town/shared/content/content-registries";
import type { EntityId } from "@old-town/shared/types/ids";
import type { CharterComponent, Permit } from "../ecs/components";
import type { World } from "../ecs/world";
import { buildDelta, catalogFromItems, count, hasItem, removeItem } from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { getNumberVar } from "../vars/player-vars";

export interface CharterSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: CharterSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function getOrCreateCharterComponent(world: World, entityId: EntityId): CharterComponent {
  const existing = world.getComponent(entityId, "charter");
  if (existing) return existing;
  const component: CharterComponent = { entityId, permits: [] };
  world.setComponent(entityId, "charter", component);
  return component;
}

function findPermit(component: CharterComponent, charterId: string): Permit | undefined {
  return component.permits.find((p) => p.charterId === charterId);
}

function removePermit(component: CharterComponent, charterId: string): Permit | undefined {
  const index = component.permits.findIndex((p) => p.charterId === charterId);
  if (index === -1) return undefined;
  const removed = component.permits[index];
  component.permits.splice(index, 1);
  return removed;
}

export function issueCharter(
  ctx: CharterSystemContext,
  owner: EntityId,
  charterId: string,
  tick: number,
  serverTime: number,
): boolean {
  const charterDef = ctx.registries.charter.get(charterId);
  if (!charterDef) {
    systemMessage(ctx, owner, "That charter does not exist.", serverTime);
    return false;
  }

  // Validate standing
  const standing = getNumberVar(ctx.world, owner, "standing", 0);
  if (standing < charterDef.requiredStanding) {
    systemMessage(
      ctx,
      owner,
      `You need standing ${charterDef.requiredStanding} to obtain this charter.`,
      serverTime,
    );
    return false;
  }

  const charterComponent = getOrCreateCharterComponent(ctx.world, owner);

  // Prevent duplicate permits for the same charter
  if (findPermit(charterComponent, charterId) !== undefined) {
    systemMessage(ctx, owner, "You already hold a permit for that charter.", serverTime);
    return false;
  }

  // Deduct cost if present
  if (charterDef.cost) {
    const inventory = ctx.world.getComponent(owner, "inventory");
    if (!inventory) {
      return false;
    }
    const _catalog = catalogFromItems(ctx.registries.item);
    if (!hasItem(inventory, charterDef.cost.itemId, charterDef.cost.quantity)) {
      systemMessage(ctx, owner, "You cannot afford this charter.", serverTime);
      return false;
    }

    const beforeQuantity = count(inventory, charterDef.cost.itemId);
    const removeResult = removeItem(inventory, charterDef.cost.itemId, charterDef.cost.quantity);
    if (removeResult.removed < charterDef.cost.quantity) {
      systemMessage(ctx, owner, "You cannot afford this charter.", serverTime);
      return false;
    }

    ctx.deltas.markInventoryDelta(buildDelta(inventory, removeResult.changes));
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: charterDef.cost.itemId,
      quantity: charterDef.cost.quantity,
      reason: "charter_cost",
      beforeQuantity,
      afterQuantity: count(inventory, charterDef.cost.itemId),
      metadata: { charterId },
    });
  }

  const permit: Permit = {
    charterId,
    issuedTick: tick,
    expiryTick: charterDef.duration > 0 ? tick + charterDef.duration : 0,
  };

  charterComponent.permits.push(permit);
  ctx.world.setComponent(owner, "charter", charterComponent);

  systemMessage(ctx, owner, `You receive a permit: ${charterDef.name}.`, serverTime);
  return true;
}

export function hasPermit(world: World, owner: EntityId, charterId: string, tick: number): boolean {
  const charterComponent = world.getComponent(owner, "charter");
  if (!charterComponent) {
    return false;
  }

  const permit = findPermit(charterComponent, charterId);
  if (!permit) {
    return false;
  }

  // Check expiry
  if (permit.expiryTick > 0 && tick > permit.expiryTick) {
    return false;
  }

  return true;
}

export function validateCharter(
  ctx: CharterSystemContext,
  owner: EntityId,
  charterId: string,
  tick: number,
  serverTime: number,
): boolean {
  const charterDef = ctx.registries.charter.get(charterId);
  if (!charterDef) {
    systemMessage(ctx, owner, "That charter does not exist.", serverTime);
    return false;
  }

  if (!hasPermit(ctx.world, owner, charterId, tick)) {
    systemMessage(ctx, owner, `You need a permit: ${charterDef.name}.`, serverTime);
    return false;
  }

  return true;
}

export function processCharterExpiry(
  ctx: CharterSystemContext,
  tick: number,
  serverTime: number,
): void {
  for (const [entityId, charterComponent] of ctx.world.componentEntries("charter")) {
    const expiredPermits: Permit[] = [];
    for (const permit of charterComponent.permits) {
      if (permit.expiryTick > 0 && tick > permit.expiryTick) {
        expiredPermits.push(permit);
      }
    }
    if (expiredPermits.length === 0) {
      continue;
    }

    for (const permit of expiredPermits) {
      const charterDef = ctx.registries.charter.get(permit.charterId);
      systemMessage(
        ctx,
        entityId,
        `Your permit for ${charterDef?.name ?? permit.charterId} has expired.`,
        serverTime,
      );
      removePermit(charterComponent, permit.charterId);
    }

    ctx.world.setComponent(entityId, "charter", charterComponent);
  }
}
