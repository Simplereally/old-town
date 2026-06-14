/**
 * Activity system — repeatable gameplay loops triggered by interacting with
 * activity objects (POC_SPEC §41).
 *
 * Activities are location-based skill training loops. A player starts an activity
 * by interacting with an object that has an `activityId`. The system validates the
 * entry requirement, then enqueues a repeating action that executes the activity
 * loop.
 */
import type { ActivityDef, ContentRegistries, EntityId, Rng, TileCoord } from "@old-town/shared";
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
import { ActionQueue, type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { ActionContext } from "../sim/action-executor";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { dispatchQuestEvent } from "../quests/quest-engine";
import { addXp, getCurrentLevel } from "../skills/skill-state";
import type { CollisionMap } from "../world/collision";
import { handleMoveIntent } from "./movement-system";

export interface ActivityContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly actionQueue: ActionQueue;
}

export interface ActivityActionPayload {
  readonly kind: "activity";
  readonly activityId: string;
  readonly objectEntityId: EntityId;
}

export interface BeginActivityPayload {
  readonly kind: "begin_activity";
  readonly activityId: string;
  readonly objectEntityId: EntityId;
}

export type ActivityPayload = ActivityActionPayload | BeginActivityPayload;
export type ActivityKind = ActivityPayload["kind"];

export type ActivityHandlerTable = {
  [K in ActivityKind]: (payload: Extract<ActivityPayload, { kind: K }>, ctx: ActionContext) => void;
};

const ACTIVITY_ACTION_ID = "activity";

function systemMessage(
  ctx: ActivityContext,
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

export function validateActivityEntry(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
): { readonly ok: boolean; readonly reason?: string } {
  const skills = ctx.world.getComponent(owner, "skills");
  if (!skills) {
    return { ok: false, reason: "You cannot do that." };
  }
  const entryLevel = getCurrentLevel(skills, activityDef.entryRequirement.skillId);
  if (entryLevel < activityDef.entryRequirement.level) {
    return {
      ok: false,
      reason: `You need level ${activityDef.entryRequirement.level} ${activityDef.entryRequirement.skillId} to do that.`,
    };
  }
  return { ok: true };
}

export function validateActivityLocation(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
): { readonly ok: boolean } {
  const actorTile = tileOf(ctx.world, owner);
  if (!actorTile) {
    return { ok: false };
  }
  const location = activityDef.location;
  if (location.x !== undefined && location.y !== undefined) {
    const distance = chebyshev(actorTile, {
      x: location.x,
      y: location.y,
      plane: (location.plane ?? 0) as TileCoord["plane"],
    });
    if (distance > 5) {
      return { ok: false };
    }
  }
  return { ok: true };
}

function totalLoopTicks(activityDef: ActivityDef): number {
  return activityDef.steps.reduce((sum: number, step) => sum + step.actionTicks, 0);
}

function totalXpRewards(activityDef: ActivityDef): Array<{ skillId: string; amount: number }> {
  const xpMap = new Map<string, number>();
  for (const step of activityDef.steps) {
    for (const xp of step.xpReward) {
      xpMap.set(xp.skillId, (xpMap.get(xp.skillId) ?? 0) + xp.amount);
    }
  }
  return Array.from(xpMap.entries()).map(([skillId, amount]) => ({ skillId, amount }));
}

function hasRequiredInputs(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
): boolean {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return false;
  for (const input of activityDef.inputs) {
    if (count(inventory, input.itemId) < input.quantity) {
      return false;
    }
  }
  return true;
}

function consumeInputs(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
  tick: number,
): boolean {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return false;
  for (const input of activityDef.inputs) {
    const beforeQuantity = count(inventory, input.itemId);
    const result = removeItem(inventory, input.itemId, input.quantity);
    if (result.removed < input.quantity) {
      return false;
    }
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: input.itemId,
      quantity: result.removed,
      reason: "activity_input",
      beforeQuantity,
      afterQuantity: count(inventory, input.itemId),
      metadata: { activityId: activityDef.id },
    });
  }
  return true;
}

function grantOutputs(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
  tick: number,
): Array<{ itemId: string; quantity: number; added: number }> {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return [];
  const catalog = catalogFromItems(ctx.registries.item);
  const results: Array<{ itemId: string; quantity: number; added: number }> = [];
  for (const output of activityDef.outputs) {
    if (!hasSpaceFor(inventory, catalog, output.itemId, output.quantity)) {
      continue;
    }
    const beforeQuantity = count(inventory, output.itemId);
    const result = addItem(inventory, catalog, output.itemId, output.quantity);
    if (result.added > 0) {
      ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
      ctx.itemAudit?.recordForEntity(owner, {
        tick,
        itemId: output.itemId,
        quantity: result.added,
        reason: "activity_output",
        beforeQuantity,
        afterQuantity: count(inventory, output.itemId),
        metadata: { activityId: activityDef.id },
      });
      results.push({ itemId: output.itemId, quantity: output.quantity, added: result.added });
    }
  }
  return results;
}

function grantXpRewards(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
): void {
  for (const xp of totalXpRewards(activityDef)) {
    addXp({ world: ctx.world, deltas: ctx.deltas }, owner, xp.skillId, xp.amount);
  }
}

function grantTokenReward(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
  tick: number,
): { itemId: string; quantity: number; added: number } | undefined {
  if (!activityDef.tokenId) return undefined;
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) return undefined;
  const catalog = catalogFromItems(ctx.registries.item);
  if (!hasSpaceFor(inventory, catalog, activityDef.tokenId, 1)) {
    return undefined;
  }
  const beforeQuantity = count(inventory, activityDef.tokenId);
  const result = addItem(inventory, catalog, activityDef.tokenId, 1);
  if (result.added > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
    ctx.itemAudit?.recordForEntity(owner, {
      tick,
      itemId: activityDef.tokenId,
      quantity: 1,
      reason: "activity_token",
      beforeQuantity,
      afterQuantity: count(inventory, activityDef.tokenId),
      metadata: { activityId: activityDef.id },
    });
    return { itemId: activityDef.tokenId, quantity: 1, added: result.added };
  }
  return undefined;
}

function stepFailureChance(activityDef: ActivityDef): number {
  // Combined failure chance across all steps (probabilistic OR)
  let p = 1;
  for (const step of activityDef.steps) {
    p *= 1 - step.failureChance;
  }
  return 1 - p;
}

function enqueueActivity(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
  objectEntityId: EntityId,
): void {
  const payload: ActivityActionPayload = {
    kind: "activity",
    activityId: activityDef.id,
    objectEntityId,
  };
  const loopTicks = totalLoopTicks(activityDef);
  ctx.actionQueue.enqueue({
    id: `activity:${activityDef.id}:${owner}`,
    owner,
    type: ActionQueueType.Weak,
    delayTicks: loopTicks,
    repeat: { intervalTicks: loopTicks },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function enqueueBeginActivity(
  ctx: ActivityContext,
  owner: EntityId,
  activityDef: ActivityDef,
  objectEntityId: EntityId,
): void {
  const payload: BeginActivityPayload = {
    kind: "begin_activity",
    activityId: activityDef.id,
    objectEntityId,
  };
  ctx.actionQueue.enqueue({
    id: `begin-activity:${activityDef.id}:${owner}`,
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

export function handleActivityIntent(
  ctx: ActivityContext,
  owner: EntityId,
  objectEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const object = ctx.world.getComponent(objectEntityId, "object");
  if (!object) {
    return false;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef?.activityId) {
    return false;
  }
  const activityDef = ctx.registries.activity.get(objectDef.activityId);
  if (!activityDef) {
    return false;
  }

  const entryValidation = validateActivityEntry(ctx, owner, activityDef);
  if (!entryValidation.ok) {
    systemMessage(ctx, owner, entryValidation.reason ?? "You cannot do that.", serverTime);
    return true;
  }

  const actorTile = tileOf(ctx.world, owner);
  const objectTile = tileOf(ctx.world, objectEntityId);
  if (!actorTile || !objectTile) {
    return false;
  }

  if (chebyshev(actorTile, objectTile) > 1) {
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      { dest: objectTile },
    );
    return true;
  }

  if (!hasRequiredInputs(ctx, owner, activityDef)) {
    systemMessage(ctx, owner, "You do not have the required items.", serverTime);
    return true;
  }

  // Cancel any existing activity
  ctx.actionQueue.cancel(owner, { interruptGroup: InterruptGroup.Skilling });
  ctx.deltas.markInterfaceClose({ interfaceId: "activity" });

  // Start the activity
  systemMessage(ctx, owner, `You start ${activityDef.name}.`, serverTime);
  ctx.deltas.markEntityUpdate(owner, { animation: { id: "activity_start", startTick: tick ?? 0 } });
  ctx.deltas.markInterfaceOpen({
    interfaceId: "activity",
    activity: {
      activityId: activityDef.id,
      name: activityDef.name,
      category: activityDef.category,
      loopDescription: activityDef.loopDescription,
      risk: activityDef.risk,
    },
  });
  enqueueActivity(ctx, owner, activityDef, objectEntityId);
  return true;
}

export function handleBeginActivity(
  ctx: ActivityContext,
  action: ActionExecution,
  payload: BeginActivityPayload,
  serverTime: number,
): void {
  const object = ctx.world.getComponent(payload.objectEntityId, "object");
  if (!object) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef?.activityId) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }
  const activityDef = ctx.registries.activity.get(objectDef.activityId);
  if (!activityDef) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }

  const actorTile = tileOf(ctx.world, action.entry.owner);
  const objectTile = tileOf(ctx.world, payload.objectEntityId);
  if (!actorTile || !objectTile) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }

  if (chebyshev(actorTile, objectTile) > 1) {
    return;
  }

  ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
  enqueueActivity(ctx, action.entry.owner, activityDef, payload.objectEntityId);
}

export function handleActivityAction(
  ctx: ActivityContext,
  action: ActionExecution,
  payload: ActivityActionPayload,
  tick: number,
  serverTime: number,
): void {
  const object = ctx.world.getComponent(payload.objectEntityId, "object");
  if (!object) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    return;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef?.activityId) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    return;
  }
  const activityDef = ctx.registries.activity.get(objectDef.activityId);
  if (!activityDef) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    return;
  }

  const actorTile = tileOf(ctx.world, action.entry.owner);
  const objectTile = tileOf(ctx.world, payload.objectEntityId);
  if (!actorTile || !objectTile) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    return;
  }

  if (chebyshev(actorTile, objectTile) > 1) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    systemMessage(ctx, action.entry.owner, "You moved too far away.", serverTime);
    return;
  }

  const inventory = ctx.world.getComponent(action.entry.owner, "inventory");
  if (!inventory) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    return;
  }

  if (!hasRequiredInputs(ctx, action.entry.owner, activityDef)) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    ctx.deltas.markInterfaceClose({ interfaceId: "activity" });
    systemMessage(ctx, action.entry.owner, "You ran out of required items.", serverTime);
    return;
  }

  ctx.deltas.markEntityUpdate(action.entry.owner, {
    animation: { id: activityDef.id, startTick: tick },
  });

  const failed = ctx.rng.nextFloat() < stepFailureChance(activityDef);
  if (failed) {
    systemMessage(ctx, action.entry.owner, activityDef.failureState, serverTime);
    ctx.deltas.markEntityUpdate(action.entry.owner, {
      animation: { id: "activity_fail", startTick: tick },
    });
    // Continue the activity after failure (no penalty beyond lost time)
    return;
  }

  // Consume inputs
  if (!consumeInputs(ctx, action.entry.owner, activityDef, tick)) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    systemMessage(ctx, action.entry.owner, "You ran out of required items.", serverTime);
    return;
  }

  // Grant XP
  grantXpRewards(ctx, action.entry.owner, activityDef);
  for (const xp of totalXpRewards(activityDef)) {
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "skill_xp_gained", skillId: xp.skillId, amount: xp.amount },
      serverTime,
      tick,
    );
  }

  // Grant outputs
  const outputResults = grantOutputs(ctx, action.entry.owner, activityDef, tick);
  for (const result of outputResults) {
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "item_gained", itemId: result.itemId, quantity: result.quantity },
      serverTime,
      tick,
    );
  }

  // Grant token
  const tokenResult = grantTokenReward(ctx, action.entry.owner, activityDef, tick);
  if (tokenResult) {
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "item_gained", itemId: tokenResult.itemId, quantity: tokenResult.quantity },
      serverTime,
      tick,
    );
  }

  // Dispatch object interaction quest event
  dispatchQuestEvent(
    ctx,
    action.entry.owner,
    { kind: "object_interacted", objectId: object.objectId, option: "activity" },
    serverTime,
    tick,
  );

  // Every 5 loops, send a reminder message
  if (action.executionCount % 5 === 0) {
    systemMessage(ctx, action.entry.owner, activityDef.loopDescription, serverTime);
  }
}

export function createActivityActionHandlers(ctx: ActivityContext): ActivityHandlerTable {
  return {
    begin_activity: (payload, actionCtx) => {
      handleBeginActivity(ctx, actionCtx.execution, payload, actionCtx.serverTime);
    },
    activity: (payload, actionCtx) => {
      handleActivityAction(ctx, actionCtx.execution, payload, actionCtx.tick, actionCtx.serverTime);
    },
  };
}
