import {
  type ContentRegistries,
  type Effect,
  type EntityId,
  GAME_TICK_MS,
  type TileCoord,
} from "@old-town/shared";
import type { InventoryComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  count,
  hasItem,
  removeItem,
} from "../items/inventory";
import type { ItemAuditLog, ItemAuditMetadata } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp } from "../skills/skill-state";
import {
  getBooleanVar,
  getQuestStage,
  incrementVar,
  questCompletedVarKey,
  questCompletionTickVarKey,
  questPointTotalVarKey,
  setQuestStage,
  setVar,
} from "../vars/player-vars";
import { areObjectivesComplete } from "./objectives";

export interface EffectContext {
  readonly world: World;
  readonly registries: ContentRegistries;
  readonly deltas: DeltaAccumulator;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly itemAuditReason?: string | undefined;
  readonly itemAuditMetadata?: ItemAuditMetadata | undefined;
}

export interface EffectResult {
  readonly applied: boolean;
  readonly reason?: string;
}

export function applyEffects(
  ctx: EffectContext,
  entityId: EntityId,
  effects: readonly Effect[],
  serverTime: number,
  tick?: number,
): readonly EffectResult[] {
  return effects.map((effect) => applyEffect(ctx, entityId, effect, serverTime, tick));
}

export function applyEffect(
  ctx: EffectContext,
  entityId: EntityId,
  effect: Effect,
  serverTime: number,
  tick?: number,
): EffectResult {
  switch (effect.kind) {
    case "add_item":
      return applyAddItem(ctx, entityId, effect.itemId, effect.quantity, serverTime, tick);
    case "remove_item":
      return applyRemoveItem(ctx, entityId, effect.itemId, effect.quantity, serverTime, tick);
    case "add_xp":
      return { applied: addXp(ctx, entityId, effect.skillId, effect.amount) !== undefined };
    case "set_var":
      return { applied: setVar(ctx, entityId, effect.key, effect.value) };
    case "start_quest":
      return applyStartQuest(ctx, entityId, effect.questId);
    case "complete_quest":
      return completeQuest(ctx, entityId, effect.questId, serverTime, tick);
    case "send_message":
      ctx.deltas.markChat({
        entityId,
        channel: "system",
        text: effect.text,
        serverTime,
      });
      return { applied: true };
    case "unlock":
      return { applied: setVar(ctx, entityId, `unlock.${effect.unlockId}`, true) };
    case "teleport":
      return applyTeleport(ctx, entityId, effect.tile);
  }
}

function applyAddItem(
  ctx: EffectContext,
  entityId: EntityId,
  itemId: string,
  quantity: number,
  serverTime: number,
  tick?: number,
): EffectResult {
  const inventory = ctx.world.getComponent(entityId, "inventory");
  if (!inventory) {
    return { applied: false, reason: "missing_inventory" };
  }
  const beforeQuantity = count(inventory, itemId);
  const result = addItem(inventory, catalogFromItems(ctx.registries.item), itemId, quantity);
  if (result.changes.length > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
  }
  if (result.added > 0) {
    ctx.itemAudit?.recordForEntity(entityId, {
      tick: tick ?? Math.floor(serverTime / GAME_TICK_MS),
      itemId,
      quantity: result.added,
      reason: ctx.itemAuditReason ?? "quest_effect",
      beforeQuantity,
      afterQuantity: count(inventory, itemId),
      metadata: effectMetadata(ctx, {
        effectKind: "add_item",
        requestedQuantity: quantity,
        serverTime,
      }),
    });
  }
  return {
    applied: result.added === quantity,
    ...(result.added < quantity ? { reason: "inventory_full" } : {}),
  };
}

function applyRemoveItem(
  ctx: EffectContext,
  entityId: EntityId,
  itemId: string,
  quantity: number,
  serverTime: number,
  tick?: number,
): EffectResult {
  const inventory = ctx.world.getComponent(entityId, "inventory");
  if (!inventory) {
    return { applied: false, reason: "missing_inventory" };
  }
  if (!hasItem(inventory, itemId, quantity)) {
    return { applied: false, reason: "missing_item" };
  }
  const beforeQuantity = count(inventory, itemId);
  const result = removeItem(inventory, itemId, quantity);
  if (result.changes.length > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
  }
  if (result.removed > 0) {
    ctx.itemAudit?.recordForEntity(entityId, {
      tick: tick ?? Math.floor(serverTime / GAME_TICK_MS),
      itemId,
      quantity: result.removed,
      reason: "quest_consume",
      beforeQuantity,
      afterQuantity: count(inventory, itemId),
      metadata: effectMetadata(ctx, {
        effectKind: "remove_item",
        requestedQuantity: quantity,
        serverTime,
      }),
    });
  }
  return { applied: result.removed === quantity };
}

function applyStartQuest(ctx: EffectContext, entityId: EntityId, questId: string): EffectResult {
  const quest = ctx.registries.quest.get(questId);
  if (!quest) {
    return { applied: false, reason: "missing_quest" };
  }
  if (getQuestStage(ctx.world, entityId, quest) > 0) {
    return { applied: false, reason: "already_started" };
  }
  const firstStage =
    quest.stages.filter((stage) => stage.stage > 0).toSorted((a, b) => a.stage - b.stage)[0]
      ?.stage ?? 1;
  setVar(ctx, entityId, questCompletedVarKey(quest), false);
  return { applied: setQuestStage(ctx, entityId, quest, firstStage) };
}

export function completeQuest(
  ctx: EffectContext,
  entityId: EntityId,
  questId: string,
  serverTime: number,
  tick?: number,
): EffectResult {
  const quest = ctx.registries.quest.get(questId);
  if (!quest) {
    return { applied: false, reason: "missing_quest" };
  }
  if (getBooleanVar(ctx.world, entityId, questCompletedVarKey(quest))) {
    ctx.deltas.markChat({
      entityId,
      channel: "system",
      text: `You have already completed ${quest.name}.`,
      serverTime,
    });
    return { applied: false, reason: "already_completed" };
  }

  const currentStage = quest.stages.find(
    (stage) => stage.stage === getQuestStage(ctx.world, entityId, quest),
  );
  if (!currentStage || !areObjectivesComplete(ctx.world, entityId, quest, currentStage)) {
    return { applied: false, reason: "objectives_incomplete" };
  }
  if (!canApplyItemRewards(ctx, entityId, quest.rewards)) {
    ctx.deltas.markChat({
      entityId,
      channel: "system",
      text: "You need more inventory space for the quest rewards.",
      serverTime,
    });
    return { applied: false, reason: "inventory_full" };
  }

  setVar(ctx, entityId, questCompletedVarKey(quest), true);
  setVar(
    ctx,
    entityId,
    questCompletionTickVarKey(quest),
    tick ?? Math.floor(serverTime / GAME_TICK_MS),
  );
  const finalStage = Math.max(...quest.stages.map((stage) => stage.stage)) + 1;
  setQuestStage(ctx, entityId, quest, finalStage);
  incrementVar(ctx, entityId, questPointTotalVarKey(), quest.questPoints);
  applyEffects(
    {
      ...ctx,
      itemAuditReason: "quest_reward",
      itemAuditMetadata: { questId, source: "quest_completion" },
    },
    entityId,
    quest.rewards.filter((effect) => effect.kind !== "complete_quest"),
    serverTime,
    tick,
  );
  ctx.deltas.markChat({
    entityId,
    channel: "system",
    text: `Quest complete: ${quest.name}.`,
    serverTime,
  });
  return { applied: true };
}

function canApplyItemRewards(
  ctx: EffectContext,
  entityId: EntityId,
  effects: readonly Effect[],
): boolean {
  const itemRewards = effects.filter(
    (effect): effect is Extract<Effect, { kind: "add_item" }> => effect.kind === "add_item",
  );
  if (itemRewards.length === 0) {
    return true;
  }
  const inventory = ctx.world.getComponent(entityId, "inventory");
  if (!inventory) {
    return false;
  }
  const simulation = cloneInventory(inventory);
  const catalog = catalogFromItems(ctx.registries.item);
  for (const reward of itemRewards) {
    if (addItem(simulation, catalog, reward.itemId, reward.quantity).added !== reward.quantity) {
      return false;
    }
  }
  return true;
}

function cloneInventory(inventory: InventoryComponent): InventoryComponent {
  return {
    ...inventory,
    slots: inventory.slots.map((slot) => (slot ? { ...slot } : undefined)),
  };
}

function effectMetadata(ctx: EffectContext, metadata: ItemAuditMetadata): ItemAuditMetadata {
  return { ...(ctx.itemAuditMetadata ?? {}), ...metadata };
}

function applyTeleport(ctx: EffectContext, entityId: EntityId, tile: TileCoord): EffectResult {
  const position = ctx.world.getComponent(entityId, "position");
  if (!position) {
    return { applied: false, reason: "missing_position" };
  }
  ctx.world.setComponent(entityId, "position", {
    entityId,
    x: tile.x,
    y: tile.y,
    plane: tile.plane,
  });
  const movement = ctx.world.getComponent(entityId, "movement");
  if (movement) {
    ctx.world.setComponent(entityId, "movement", {
      entityId,
      mode: movement.mode,
      path: [],
      ...(movement.lastStepDirection !== undefined
        ? { lastStepDirection: movement.lastStepDirection }
        : {}),
      ...(movement.blockedUntilTick !== undefined
        ? { blockedUntilTick: movement.blockedUntilTick }
        : {}),
    });
  }
  ctx.deltas.markEntityUpdate(entityId, { position: tile });
  return { applied: true };
}
