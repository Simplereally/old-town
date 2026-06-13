import type {
  ContentRegistries,
  EntityId,
  NpcIntent,
  Plane,
  ServiceFeeDef,
  TileCoord,
} from "@old-town/shared";
import type { InventoryComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  count,
  hasAll,
  hasSpaceFor,
  type ItemRequirement,
  removeItem,
} from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";

export interface ServiceFeeSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

const SERVICE_FEE_ACTIONS = new Set<string>([
  "repair",
  "teleport",
  "identify",
  "enchant",
  "craft",
  "tanning",
  "smelting",
  "bead_firing",
  "blessing",
  "reclaim",
  "contract_reroll",
  "ferry",
  "map_copy",
  "cleanse",
]);

function emitSystemMessage(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

function isNearTarget(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  targetEntityId: EntityId,
): boolean {
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

function findServiceFee(
  ctx: ServiceFeeSystemContext,
  serviceType: string,
): ServiceFeeDef | undefined {
  for (const def of ctx.registries.serviceFee.values()) {
    if (def.serviceType === serviceType) return def;
  }
  return undefined;
}

function calculateFee(feeDef: ServiceFeeDef, level: number): number {
  return Math.max(0, Math.floor(feeDef.baseFee + feeDef.levelMultiplier * level));
}

function getPlayerLevelForFee(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  feeDef: ServiceFeeDef,
): number {
  if (feeDef.skillId) {
    const skills = ctx.world.getComponent(owner, "skills");
    const skill = skills?.skills[feeDef.skillId];
    if (skill) return skill.level;
  }
  const actor = ctx.world.getComponent(owner, "actor");
  return actor?.level ?? 1;
}

function checkRequirements(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  feeDef: ServiceFeeDef,
  _serverTime: number,
): { ok: true } | { ok: false; message: string } {
  if (feeDef.requiresQuest !== undefined) {
    const vars = ctx.world.getComponent(owner, "vars");
    const questVar = vars?.values[`quest_${feeDef.requiresQuest}`];
    if (questVar === undefined || questVar === 0) {
      return { ok: false, message: "You must complete a required quest first." };
    }
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return { ok: false, message: "You have no inventory." };
  }

  const level = getPlayerLevelForFee(ctx, owner, feeDef);
  const fee = calculateFee(feeDef, level);

  if (count(inventory, feeDef.currency) < fee) {
    return { ok: false, message: `You don't have enough ${feeDef.currency} for that service.` };
  }

  const materialReqs: ItemRequirement[] = feeDef.materialCost.map((m) => ({
    itemId: m.itemId,
    quantity: m.quantity,
  }));
  if (materialReqs.length > 0 && !hasAll(inventory, materialReqs)) {
    return { ok: false, message: "You don't have the required materials for that service." };
  }

  return { ok: true };
}

function deductFee(
  _ctx: ServiceFeeSystemContext,
  inventory: InventoryComponent,
  feeDef: ServiceFeeDef,
  level: number,
): import("@old-town/shared").InventorySlotChange[] {
  const fee = calculateFee(feeDef, level);
  const changes: import("@old-town/shared").InventorySlotChange[] = [];

  const currencyResult = removeItem(inventory, feeDef.currency, fee);
  changes.push(...currencyResult.changes);

  for (const material of feeDef.materialCost) {
    const materialResult = removeItem(inventory, material.itemId, material.quantity);
    changes.push(...materialResult.changes);
  }

  return changes;
}

function applyRepair(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  _feeDef: ServiceFeeDef,
): string {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return "Nothing needed repair.";

  let repairedCount = 0;
  for (const slot of inventory.slots) {
    if (!slot) continue;
    const itemDef = ctx.registries.item.get(slot.itemId);
    if (itemDef?.maxDurability !== undefined) {
      slot.durability = itemDef.maxDurability;
      repairedCount++;
    }
  }

  if (repairedCount === 0) return "Nothing needed repair.";
  return `Repaired ${repairedCount} item${repairedCount === 1 ? "" : "s"}.`;
}

function applyTeleport(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  feeDef: ServiceFeeDef,
): string {
  const pos = ctx.world.getComponent(owner, "position");
  if (!pos) return "You could not be teleported.";

  const dest: TileCoord = feeDef.destination ?? { x: 0, y: 0, plane: 0 as Plane };
  pos.x = dest.x;
  pos.y = dest.y;
  pos.plane = dest.plane;
  ctx.world.setComponent(owner, "position", pos);

  return "You are teleported away.";
}

function applyCraft(ctx: ServiceFeeSystemContext, owner: EntityId, feeDef: ServiceFeeDef): string {
  if (!feeDef.outputItemId) return "Nothing to craft.";

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return "You have no inventory.";

  const catalog = catalogFromItems(ctx.registries.item);
  const quantity = feeDef.outputQuantity;

  if (!hasSpaceFor(inventory, catalog, feeDef.outputItemId, quantity)) {
    return "Your inventory is full.";
  }

  const result = addItem(inventory, catalog, feeDef.outputItemId, quantity);
  ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));

  return `Crafted ${quantity} ${feeDef.outputItemId}.`;
}

function applyCleanse(ctx: ServiceFeeSystemContext, owner: EntityId): string {
  const statusEffects = ctx.world.getComponent(owner, "statusEffects");
  if (statusEffects && statusEffects.effects.length > 0) {
    statusEffects.effects = [];
    ctx.world.setComponent(owner, "statusEffects", statusEffects);
    return "You feel cleansed of all afflictions.";
  }
  return "You have nothing to cleanse.";
}

function applyServiceEffect(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  feeDef: ServiceFeeDef,
  _serverTime: number,
): string {
  switch (feeDef.serviceType) {
    case "repair":
      return applyRepair(ctx, owner, feeDef);
    case "teleport":
    case "ferry":
      return applyTeleport(ctx, owner, feeDef);
    case "craft":
    case "tanning":
    case "smelting":
    case "bead_firing":
      return applyCraft(ctx, owner, feeDef);
    case "cleanse":
      return applyCleanse(ctx, owner);
    case "identify":
      return "The item is identified.";
    case "enchant":
      return "The item glows with new power.";
    case "blessing":
      return "You receive a blessing.";
    case "reclaim":
      return "You reclaim what was lost.";
    case "contract_reroll":
      return "Your contract is rerolled.";
    case "map_copy":
      return "You receive a copy of the map.";
    default:
      return "Service complete.";
  }
}

export function isServiceFeeAction(actionId: string): boolean {
  return SERVICE_FEE_ACTIONS.has(actionId);
}

export function handleServiceFeeIntent(
  ctx: ServiceFeeSystemContext,
  owner: EntityId,
  intent: NpcIntent,
  tick: number,
  serverTime: number,
): boolean {
  if (!isServiceFeeAction(intent.actionId)) return false;

  if (!isNearTarget(ctx, owner, intent.npcEntityId)) {
    emitSystemMessage(ctx, owner, "You are too far away.", serverTime);
    return true;
  }

  const feeDef = findServiceFee(ctx, intent.actionId);
  if (!feeDef) {
    emitSystemMessage(ctx, owner, "That service is not available.", serverTime);
    return true;
  }

  const reqCheck = checkRequirements(ctx, owner, feeDef, serverTime);
  if (!reqCheck.ok) {
    emitSystemMessage(ctx, owner, reqCheck.message, serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    emitSystemMessage(ctx, owner, "You have no inventory.", serverTime);
    return true;
  }

  const level = getPlayerLevelForFee(ctx, owner, feeDef);
  const changes = deductFee(ctx, inventory, feeDef, level);

  const effectMessage = applyServiceEffect(ctx, owner, feeDef, serverTime);

  ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
  emitSystemMessage(ctx, owner, effectMessage, serverTime);

  ctx.itemAudit?.recordForEntity(owner, {
    itemId: feeDef.currency,
    quantity: calculateFee(feeDef, level),
    reason: "service_fee",
    tick,
    beforeQuantity: count(inventory, feeDef.currency) + calculateFee(feeDef, level),
    afterQuantity: count(inventory, feeDef.currency),
  });

  return true;
}
