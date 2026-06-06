import type { ContentRegistries } from "@old-town/shared/content/content-registries";
import type { EntityId } from "@old-town/shared/types/ids";
import type { PublicWorkComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  count,
  hasItem,
  hasSpaceFor,
  removeItem,
} from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp } from "../skills/skill-state";
import { setVar } from "../vars/player-vars";

export interface PublicWorkSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: PublicWorkSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function getOrCreatePublicWorkComponent(world: World, entityId: EntityId): PublicWorkComponent {
  const existing = world.getComponent(entityId, "publicWork");
  if (existing) return existing;
  const component: PublicWorkComponent = {
    entityId,
    publicWorkId: "",
    name: "",
    requiredResources: [],
    currentResources: [],
    contributors: [],
    completed: false,
  };
  world.setComponent(entityId, "publicWork", component);
  return component;
}

function findCurrentResource(
  publicWork: PublicWorkComponent,
  itemId: string,
): { index: number; resource: import("../ecs/components").PublicWorkResource | undefined } {
  const index = publicWork.currentResources.findIndex((r) => r.itemId === itemId);
  return { index, resource: index >= 0 ? publicWork.currentResources[index] : undefined };
}

function findRequiredResource(
  publicWork: PublicWorkComponent,
  itemId: string,
): import("../ecs/components").PublicWorkResource | undefined {
  return publicWork.requiredResources.find((r) => r.itemId === itemId);
}

export function contributeToPublicWork(
  ctx: PublicWorkSystemContext,
  playerId: EntityId,
  publicWorkEntityId: EntityId,
  itemId: string,
  quantity: number,
  tick: number,
  serverTime: number,
): boolean {
  const publicWork = ctx.world.getComponent(publicWorkEntityId, "publicWork");
  if (!publicWork) {
    return false;
  }

  if (publicWork.completed) {
    systemMessage(ctx, playerId, "This public work has already been completed.", serverTime);
    return false;
  }

  const required = findRequiredResource(publicWork, itemId);
  if (!required) {
    systemMessage(ctx, playerId, "That item is not required for this project.", serverTime);
    return false;
  }

  const { resource: current } = findCurrentResource(publicWork, itemId);
  const alreadyContributed = current?.quantity ?? 0;
  const remainingNeeded = required.quantity - alreadyContributed;
  if (remainingNeeded <= 0) {
    systemMessage(ctx, playerId, "That resource requirement has already been met.", serverTime);
    return false;
  }

  const toTake = Math.min(quantity, remainingNeeded);

  const inventory = ctx.world.getComponent(playerId, "inventory");
  if (!inventory) {
    return false;
  }

  if (!hasItem(inventory, itemId, toTake)) {
    systemMessage(ctx, playerId, "You do not have enough of that resource.", serverTime);
    return false;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  const beforeQuantity = count(inventory, itemId);
  const removeResult = removeItem(inventory, itemId, toTake);
  if (removeResult.removed < toTake) {
    systemMessage(ctx, playerId, "You do not have enough of that resource.", serverTime);
    return false;
  }

  ctx.deltas.markInventoryDelta(buildDelta(inventory, removeResult.changes));
  ctx.itemAudit?.recordForEntity(playerId, {
    tick,
    itemId,
    quantity: removeResult.removed,
    reason: "public_work_contribution",
    beforeQuantity,
    afterQuantity: count(inventory, itemId),
    metadata: { publicWorkId: publicWork.publicWorkId },
  });

  // Update currentResources
  if (current) {
    current.quantity += toTake;
  } else {
    publicWork.currentResources.push({ itemId, quantity: toTake });
  }

  // Update contributors
  publicWork.contributors.push({ playerId, itemId, quantity: toTake });

  ctx.world.setComponent(publicWorkEntityId, "publicWork", publicWork);

  systemMessage(
    ctx,
    playerId,
    `You contribute ${toTake} ${itemId} to ${publicWork.name}.`,
    serverTime,
  );

  checkPublicWorkCompletion(ctx, publicWorkEntityId, serverTime, tick);

  return true;
}

export function checkPublicWorkCompletion(
  ctx: PublicWorkSystemContext,
  publicWorkEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const publicWork = ctx.world.getComponent(publicWorkEntityId, "publicWork");
  if (!publicWork || publicWork.completed) {
    return false;
  }

  const allMet = publicWork.requiredResources.every((req) => {
    const current = publicWork.currentResources.find((r) => r.itemId === req.itemId);
    return (current?.quantity ?? 0) >= req.quantity;
  });

  if (!allMet) {
    return false;
  }

  publicWork.completed = true;
  ctx.world.setComponent(publicWorkEntityId, "publicWork", publicWork);

  // Notify all contributors
  const contributorIds = [...new Set(publicWork.contributors.map((c) => c.playerId))];
  for (const contributorId of contributorIds) {
    systemMessage(ctx, contributorId, `${publicWork.name} has been completed!`, serverTime);
  }

  // Apply world change via global var on all players
  if (publicWork.worldChange) {
    for (const [playerId] of ctx.world.componentEntries("vars")) {
      setVar(
        { world: ctx.world, deltas: ctx.deltas },
        playerId,
        `publicWork.${publicWork.publicWorkId}.completed`,
        true,
      );
    }
  }

  distributePublicWorkRewards(ctx, publicWorkEntityId, serverTime, tick);

  return true;
}

export function distributePublicWorkRewards(
  ctx: PublicWorkSystemContext,
  publicWorkEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const publicWork = ctx.world.getComponent(publicWorkEntityId, "publicWork");
  if (!publicWork || !publicWork.completed || publicWork.rewardsDistributed) {
    return false;
  }

  // Get unique contributors
  const contributorIds = [...new Set(publicWork.contributors.map((c) => c.playerId))];
  if (contributorIds.length === 0) {
    return false;
  }

  const catalog = catalogFromItems(ctx.registries.item);

  for (const contributorId of contributorIds) {
    const inventory = ctx.world.getComponent(contributorId, "inventory");
    if (!inventory) {
      continue;
    }

    // Check inventory space for all item rewards atomically
    if (publicWork.rewardItems && publicWork.rewardItems.length > 0) {
      let hasSpace = true;
      for (const reward of publicWork.rewardItems) {
        if (!hasSpaceFor(inventory, catalog, reward.itemId, reward.quantity)) {
          hasSpace = false;
          break;
        }
      }
      if (!hasSpace) {
        systemMessage(
          ctx,
          contributorId,
          "You need more inventory space for the public work rewards.",
          serverTime,
        );
        continue;
      }
    }

    // Apply item rewards
    if (publicWork.rewardItems) {
      for (const reward of publicWork.rewardItems) {
        const beforeQuantity = count(inventory, reward.itemId);
        const result = addItem(inventory, catalog, reward.itemId, reward.quantity);
        if (result.changes.length > 0) {
          ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
        }
        if (result.added > 0) {
          ctx.itemAudit?.recordForEntity(contributorId, {
            tick: tick ?? 0,
            itemId: reward.itemId,
            quantity: result.added,
            reason: "public_work_reward",
            beforeQuantity,
            afterQuantity: count(inventory, reward.itemId),
            metadata: { publicWorkId: publicWork.publicWorkId },
          });
        }
      }
    }

    // Apply XP rewards
    if (publicWork.rewardXp) {
      for (const rewardXp of publicWork.rewardXp) {
        addXp(ctx, contributorId, rewardXp.skillId, rewardXp.amount);
      }
    }

    systemMessage(
      ctx,
      contributorId,
      `You receive rewards for completing ${publicWork.name}.`,
      serverTime,
    );
  }

  publicWork.rewardsDistributed = true;
  ctx.world.setComponent(publicWorkEntityId, "publicWork", publicWork);

  return true;
}

export function createPublicWork(
  world: World,
  entityId: EntityId,
  publicWorkId: string,
  name: string,
  requiredResources: { itemId: string; quantity: number }[],
  rewardItems?: { itemId: string; quantity: number }[],
  rewardXp?: { skillId: string; amount: number }[],
  worldChange?: string,
): PublicWorkComponent {
  const component: PublicWorkComponent = {
    entityId,
    publicWorkId,
    name,
    requiredResources: [...requiredResources],
    currentResources: [],
    contributors: [],
    completed: false,
    ...(rewardItems !== undefined ? { rewardItems } : {}),
    ...(rewardXp !== undefined ? { rewardXp } : {}),
    ...(worldChange !== undefined ? { worldChange } : {}),
  };
  world.setComponent(entityId, "publicWork", component);
  return component;
}
