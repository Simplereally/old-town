import type { ContentRegistries, EntityId, ObjectIntent, TileCoord } from "@old-town/shared";
import type { ContractComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { addItem, buildDelta, catalogFromItems, count, hasSpaceFor } from "../items/inventory";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp, getCurrentLevel } from "../skills/skill-state";
import { setVar } from "../vars/player-vars";
import type { ResourceNodeContext } from "./resource-node-system";

export interface ContractTrackerContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

export interface ContractSystemContext extends ResourceNodeContext {
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: ContractTrackerContext,
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

export function handleContractAcceptIntent(
  ctx: ContractSystemContext,
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
    return false;
  }

  const contract = ctx.world.getComponent(intent.objectEntityId, "contract");
  if (!contract) {
    return false;
  }

  const contractDef = ctx.registries.contract.get(contract.contractId);
  if (!contractDef) {
    return false;
  }

  // Check expiry
  if (tick !== undefined && contract.expiryTick > 0 && tick > contract.expiryTick) {
    const expired: ContractComponent = {
      ...contract,
      status: "expired",
    };
    ctx.world.setComponent(intent.objectEntityId, "contract", expired);
    systemMessage(ctx, owner, "This contract has expired.", serverTime);
    return true;
  }

  if (contract.status !== "available") {
    systemMessage(ctx, owner, "This contract is no longer available.", serverTime);
    return true;
  }

  // Validate level requirement
  const skills = ctx.world.getComponent(owner, "skills");
  if (skills) {
    const attackLevel = getCurrentLevel(skills, "attack");
    if (attackLevel < contractDef.requiredLevel) {
      systemMessage(
        ctx,
        owner,
        `You need level ${contractDef.requiredLevel} Attack to accept this contract.`,
        serverTime,
      );
      return true;
    }
  }

  const accepted: ContractComponent = {
    ...contract,
    status: "accepted",
    startTick: tick ?? 0,
  };
  ctx.world.setComponent(intent.objectEntityId, "contract", accepted);

  // Store active contract on player vars
  const vars = ctx.world.getComponent(owner, "vars");
  if (vars) {
    vars.values.active_contract = contract.contractId;
    ctx.deltas.markVarbitDelta({
      varId: "active_contract",
      value: contract.contractId,
    });
  }

  systemMessage(ctx, owner, `You accept the contract: ${contractDef.name}.`, serverTime);
  return true;
}

export function findActiveContractEntity(
  world: World,
  owner: EntityId,
): EntityId | undefined {
  const activeContractId = world.getComponent(owner, "vars")?.values.active_contract;
  if (!activeContractId || typeof activeContractId !== "string" || activeContractId === "") {
    return undefined;
  }

  for (const [entityId, contract] of world.componentEntries("contract")) {
    if (contract.contractId === activeContractId && contract.status === "accepted") {
      return entityId;
    }
  }
  return undefined;
}

export function trackContractObjective(
  ctx: ContractTrackerContext,
  _owner: EntityId,
  contractEntityId: EntityId,
  objectiveKind: string,
  targetId: string,
  amount: number,
): void {
  const contract = ctx.world.getComponent(contractEntityId, "contract");
  if (contract?.status !== "accepted") {
    return;
  }

  const updatedObjectives = contract.objectives.map((obj) => {
    if (obj.kind === objectiveKind && obj.targetId === targetId) {
      return { ...obj, current: Math.min(obj.required, obj.current + amount) };
    }
    return obj;
  });

  ctx.world.setComponent(contractEntityId, "contract", {
    ...contract,
    objectives: updatedObjectives,
  });
}

export function trackContractItemGain(
  ctx: ContractTrackerContext,
  owner: EntityId,
  itemId: string,
  quantity: number,
): void {
  const contractEntityId = findActiveContractEntity(ctx.world, owner);
  if (contractEntityId === undefined) {
    return;
  }
  trackContractObjective(ctx, owner, contractEntityId, "collect", itemId, quantity);
  checkContractCompletion(ctx, owner, contractEntityId, 0, 0);
}

export function applyContractRewards(
  ctx: ContractTrackerContext,
  owner: EntityId,
  contractEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const contract = ctx.world.getComponent(contractEntityId, "contract");
  if (contract?.status !== "completed") {
    return false;
  }

  const contractDef = ctx.registries.contract.get(contract.contractId);
  if (!contractDef) {
    return false;
  }

  // Check if already rewarded (idempotent)
  const vars = ctx.world.getComponent(owner, "vars");
  const rewardedKey = `contract.${contract.contractId}.rewarded`;
  if (vars?.values[rewardedKey] === true) {
    return false;
  }

  // Check inventory space for all item rewards atomically
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (inventory && contractDef.rewardItems.length > 0) {
    const catalog = catalogFromItems(ctx.registries.item);
    for (const rewardItem of contractDef.rewardItems) {
      if (!hasSpaceFor(inventory, catalog, rewardItem.itemId, rewardItem.quantity)) {
        systemMessage(
          ctx,
          owner,
          "You need more inventory space for the contract rewards.",
          serverTime,
        );
        return false;
      }
    }
  }

  // Apply XP rewards
  for (const rewardXp of contractDef.rewardXp) {
    addXp(ctx, owner, rewardXp.skillId, rewardXp.amount);
  }

  // Apply item rewards
  if (inventory) {
    const catalog = catalogFromItems(ctx.registries.item);
    for (const rewardItem of contractDef.rewardItems) {
      const beforeQuantity = count(inventory, rewardItem.itemId);
      const result = addItem(inventory, catalog, rewardItem.itemId, rewardItem.quantity);
      if (result.changes.length > 0) {
        ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
      }
      if (result.added > 0) {
        ctx.itemAudit?.recordForEntity(owner, {
          tick: tick ?? 0,
          itemId: rewardItem.itemId,
          quantity: result.added,
          reason: "contract_reward",
          beforeQuantity,
          afterQuantity: count(inventory, rewardItem.itemId),
          metadata: { contractId: contract.contractId },
        });
      }
    }
  }

  // Update reputation/standing
  if (contractDef.rewardReputation) {
    const repKey = `reputation.${contractDef.rewardReputation.factionId}`;
    const currentRep = (vars?.values[repKey] as number) ?? 0;
    const newRep = currentRep + contractDef.rewardReputation.amount;
    setVar(ctx, owner, repKey, newRep);
  }

  // Mark as rewarded
  setVar(ctx, owner, rewardedKey, true);

  // Clear active contract
  if (vars) {
    setVar(ctx, owner, "active_contract", "");
  }

  // Send completion packet
  ctx.deltas.markContractComplete({
    entityId: owner,
    contractId: contract.contractId,
    name: contractDef.name,
  });

  return true;
}

export function checkContractCompletion(
  ctx: ContractTrackerContext,
  owner: EntityId,
  contractEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const contract = ctx.world.getComponent(contractEntityId, "contract");
  if (contract?.status !== "accepted") {
    return false;
  }

  const allComplete = contract.objectives.every((obj) => obj.current >= obj.required);
  if (!allComplete) {
    return false;
  }

  const contractDef = ctx.registries.contract.get(contract.contractId);
  ctx.world.setComponent(contractEntityId, "contract", {
    ...contract,
    status: "completed",
  });

  systemMessage(
    ctx,
    owner,
    `Contract complete: ${contractDef?.name ?? contract.contractId}`,
    serverTime,
  );

  applyContractRewards(ctx, owner, contractEntityId, serverTime, tick);
  return true;
}

export function processContractLifecycle(
  ctx: ContractTrackerContext,
  tick: number,
  serverTime: number,
): void {
  for (const [entityId, contract] of ctx.world.componentEntries("contract")) {
    if (contract.status !== "accepted" && contract.status !== "available") {
      continue;
    }
    if (contract.expiryTick > 0 && tick > contract.expiryTick) {
      const expired: ContractComponent = {
        ...contract,
        status: "expired",
      };
      ctx.world.setComponent(entityId, "contract", expired);
      for (const [ownerId, vars] of ctx.world.componentEntries("vars")) {
        if (vars.values.active_contract === contract.contractId) {
          setVar(ctx, ownerId, "active_contract", "");
          systemMessage(ctx, ownerId, "Your contract has expired.", serverTime);
        }
      }
    }
  }
}
