import type {
  EntityId,
  ObjectIntent,
  ProcessingRecipeDef,
  ResourceNodeDef,
  Rng,
  TileCoord,
} from "@old-town/shared";
import type { InventoryComponent } from "../ecs/components";
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
import { dispatchQuestEvent } from "../quests/quest-engine";
import type { ActionHandler } from "../sim/action-executor";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp, getCurrentLevel, type AddXpResult } from "../skills/skill-state";
import { trackContractItemGain } from "./contract-system";
import { handleMoveIntent } from "./movement-system";
import { depleteResourceNode, type ResourceNodeContext } from "./resource-node-system";

export interface SkillingContext extends ResourceNodeContext {
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
}

export interface GatherActionPayload {
  readonly kind: "gather";
  readonly nodeEntityId: EntityId;
}

export interface BeginGatherActionPayload {
  readonly kind: "begin_gather";
  readonly nodeEntityId: EntityId;
}

export interface ProcessActionPayload {
  readonly kind: "process";
  readonly stationEntityId: EntityId;
  readonly recipeId: string;
}

export interface BeginProcessActionPayload {
  readonly kind: "begin_process";
  readonly stationEntityId: EntityId;
  readonly recipeId: string;
}

export type SkillingPayload =
  | GatherActionPayload
  | BeginGatherActionPayload
  | ProcessActionPayload
  | BeginProcessActionPayload;

export type SkillingKind = SkillingPayload["kind"];

export type SkillingHandlerTable = {
  [K in SkillingKind]: ActionHandler<Extract<SkillingPayload, { kind: K }>>;
};

export type GatherFailure =
  | "missing_actor"
  | "missing_node"
  | "depleted"
  | "out_of_range"
  | "low_level"
  | "missing_tool"
  | "inventory_full";

export interface GatherValidationResult {
  readonly ok: boolean;
  readonly reason?: GatherFailure;
  readonly nodeDef?: ResourceNodeDef;
}

const GATHER_ACTION_IDS = new Set(["chop", "woodcut", "mine", "fish"]);
const PROCESS_ACTION_IDS = new Set([
  "cook",
  "use",
  "smelt",
  "smith",
  "craft",
  "fire",
  "weave",
  "tan",
  "dye",
  "mix",
]);

function actionId(prefix: string, owner: EntityId): string {
  return `${prefix}:${owner}`;
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function announceLevelUp(
  deltas: DeltaAccumulator,
  owner: EntityId,
  result: AddXpResult | undefined,
  serverTime: number,
): void {
  if (result?.levelUp) {
    systemMessage(
      deltas,
      owner,
      `Congratulations! You've advanced to level ${result.newLevel} ${result.skillId}.`,
      serverTime,
    );
  }
}

function gatherFailureText(reason: GatherFailure, nodeDef?: ResourceNodeDef): string {
  switch (reason) {
    case "depleted":
      return "There is nothing left to gather here.";
    case "out_of_range":
      return "You need to get closer.";
    case "low_level":
      return `You need level ${nodeDef?.requiredLevel ?? 1} ${nodeDef?.skill ?? "skill"}.`;
    case "missing_tool":
      return `You need the right tool for ${nodeDef?.name ?? "that"}.`;
    case "inventory_full":
      return "Your inventory is full.";
    default:
      return "You cannot do that.";
  }
}

function hasTool(
  ctx: SkillingContext,
  inventory: InventoryComponent,
  tags: readonly string[],
): boolean {
  for (const slot of inventory.slots) {
    if (!slot) {
      continue;
    }
    const item = ctx.registries.item.get(slot.itemId);
    if (item?.tags.some((tag) => tags.includes(tag)) === true) {
      return true;
    }
  }

  const equipment = ctx.world.getComponent(inventory.entityId, "equipment");
  for (const itemId of Object.values(equipment?.slots ?? {})) {
    if (!itemId) {
      continue;
    }
    const item = ctx.registries.item.get(itemId);
    if (item?.tags.some((tag) => tags.includes(tag)) === true) {
      return true;
    }
  }
  return false;
}

function bestToolPower(
  ctx: SkillingContext,
  inventory: InventoryComponent,
  tags: readonly string[],
): number {
  let best = 0;
  for (const slot of inventory.slots) {
    if (!slot) {
      continue;
    }
    const item = ctx.registries.item.get(slot.itemId);
    if (item?.tags.some((tag) => tags.includes(tag)) === true) {
      best = Math.max(best, item.tierOrder ?? 1);
    }
  }
  const equipment = ctx.world.getComponent(inventory.entityId, "equipment");
  for (const itemId of Object.values(equipment?.slots ?? {})) {
    if (!itemId) {
      continue;
    }
    const item = ctx.registries.item.get(itemId);
    if (item?.tags.some((tag) => tags.includes(tag)) === true) {
      best = Math.max(best, item.tierOrder ?? 1);
    }
  }
  return best;
}

export function validateGatherAction(
  ctx: SkillingContext,
  owner: EntityId,
  nodeEntityId: EntityId,
): GatherValidationResult {
  const actorTile = tileOf(ctx.world, owner);
  const nodeTile = tileOf(ctx.world, nodeEntityId);
  const node = ctx.world.getComponent(nodeEntityId, "resourceNode");
  const inventory = ctx.world.getComponent(owner, "inventory");
  const skills = ctx.world.getComponent(owner, "skills");
  if (!actorTile || !nodeTile || !inventory || !skills) {
    return { ok: false, reason: "missing_actor" };
  }
  if (!node) {
    return { ok: false, reason: "missing_node" };
  }
  const nodeDef = ctx.registries.resourceNode.get(node.nodeId);
  if (!nodeDef) {
    return { ok: false, reason: "missing_node" };
  }
  if (node.depleted || node.active === false) {
    return { ok: false, reason: "depleted", nodeDef };
  }
  if (chebyshev(actorTile, nodeTile) > 1) {
    return { ok: false, reason: "out_of_range", nodeDef };
  }
  if (getCurrentLevel(skills, nodeDef.skill) < nodeDef.requiredLevel) {
    return { ok: false, reason: "low_level", nodeDef };
  }
  if (!hasTool(ctx, inventory, nodeDef.toolTags)) {
    return { ok: false, reason: "missing_tool", nodeDef };
  }
  if (
    !hasSpaceFor(
      inventory,
      catalogFromItems(ctx.registries.item),
      nodeDef.outputItemId,
      nodeDef.outputQuantity,
    )
  ) {
    return { ok: false, reason: "inventory_full", nodeDef };
  }
  return { ok: true, nodeDef };
}

function gatherSuccessChance(
  ctx: SkillingContext,
  owner: EntityId,
  inventory: InventoryComponent,
  nodeDef: ResourceNodeDef,
): number {
  const skills = ctx.world.getComponent(owner, "skills");
  const level = skills ? getCurrentLevel(skills, nodeDef.skill) : 1;
  const toolPower = bestToolPower(ctx, inventory, nodeDef.toolTags);
  return Math.min(
    0.95,
    Math.max(0.05, nodeDef.baseChance + level * nodeDef.levelScale + toolPower * 0.02),
  );
}

function enqueueBeginGather(ctx: SkillingContext, owner: EntityId, nodeEntityId: EntityId): void {
  const payload: BeginGatherActionPayload = { kind: "begin_gather", nodeEntityId };
  ctx.actionQueue.enqueue({
    id: actionId("begin-gather", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function enqueueGather(
  ctx: SkillingContext,
  owner: EntityId,
  nodeEntityId: EntityId,
  nodeDef: ResourceNodeDef,
): void {
  const targetTile = tileOf(ctx.world, nodeEntityId);
  if (targetTile) {
    ctx.deltas.markEntityUpdate(owner, { facingTile: targetTile });
  }
  const payload: GatherActionPayload = { kind: "gather", nodeEntityId };
  ctx.actionQueue.enqueue({
    id: actionId("gather", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: nodeDef.actionTicks,
    repeat: { intervalTicks: nodeDef.actionTicks },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

export function handleObjectSkillingIntent(
  ctx: SkillingContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
): boolean {
  if (GATHER_ACTION_IDS.has(intent.actionId)) {
    if (!ctx.world.hasComponent(intent.objectEntityId, "resourceNode")) {
      return false;
    }
    const validation = validateGatherAction(ctx, owner, intent.objectEntityId);
    if (validation.ok && validation.nodeDef) {
      enqueueGather(ctx, owner, intent.objectEntityId, validation.nodeDef);
      return true;
    }
    if (validation.reason === "out_of_range") {
      const nodeTile = tileOf(ctx.world, intent.objectEntityId);
      if (nodeTile) {
        handleMoveIntent(
          { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
          owner,
          {
            dest: nodeTile,
          },
          tick !== undefined ? { tick } : {},
        );
        enqueueBeginGather(ctx, owner, intent.objectEntityId);
        return true;
      }
    }
    systemMessage(
      ctx.deltas,
      owner,
      gatherFailureText(validation.reason ?? "missing_node", validation.nodeDef),
      serverTime,
    );
    return true;
  }

  if (PROCESS_ACTION_IDS.has(intent.actionId)) {
    return handleProcessingIntent(
      ctx,
      owner,
      intent.objectEntityId,
      serverTime,
      tick,
      intent.actionId,
    );
  }

  return false;
}

function matchingRecipes(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
): ProcessingRecipeDef[] {
  const station = ctx.world.getComponent(stationEntityId, "object");
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!station || !inventory) {
    return [];
  }
  return Array.from(ctx.registries.processingRecipe.values()).filter(
    (recipe) =>
      recipe.stationObjectIds.includes(station.objectId) &&
      hasItem(inventory, recipe.inputItemId, recipe.inputQuantity),
  );
}

function matchingRecipe(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
): ProcessingRecipeDef | undefined {
  const station = ctx.world.getComponent(stationEntityId, "object");
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!station || !inventory) {
    return undefined;
  }
  const recipes = Array.from(ctx.registries.processingRecipe.values()).filter((recipe) =>
    hasItem(inventory, recipe.inputItemId, recipe.inputQuantity),
  );
  return recipes.find((recipe) => recipe.stationObjectIds.includes(station.objectId)) ?? recipes[0];
}

function validateProcessAction(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipe: ProcessingRecipeDef,
): string | undefined {
  const actorTile = tileOf(ctx.world, owner);
  const stationTile = tileOf(ctx.world, stationEntityId);
  const station = ctx.world.getComponent(stationEntityId, "object");
  const inventory = ctx.world.getComponent(owner, "inventory");
  const skills = ctx.world.getComponent(owner, "skills");
  const catalog = catalogFromItems(ctx.registries.item);
  if (!actorTile || !stationTile || !station || !inventory || !skills) {
    return "You cannot do that.";
  }
  if (!recipe.stationObjectIds.includes(station.objectId)) {
    return "You need a different cooking station.";
  }
  if (chebyshev(actorTile, stationTile) > 1) {
    return "You need to get closer.";
  }
  if (!ctx.collision.hasLineOfSight(actorTile, stationTile, { projectile: true })) {
    return "You cannot see the station.";
  }
  if (getCurrentLevel(skills, recipe.skill) < recipe.requiredLevel) {
    return `You need level ${recipe.requiredLevel} ${recipe.skill}.`;
  }
  if (!hasItem(inventory, recipe.inputItemId, recipe.inputQuantity)) {
    return "You have nothing suitable to cook.";
  }
  const outputItemId = recipe.failureItemId ?? recipe.successItemId;
  const outputQuantity = recipe.failureItemId ? recipe.failureQuantity : recipe.successQuantity;
  if (!hasSpaceFor(inventory, catalog, outputItemId, outputQuantity)) {
    return "Your inventory is full.";
  }
  return undefined;
}

function enqueueBeginProcess(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipeId: string,
): void {
  const payload: BeginProcessActionPayload = { kind: "begin_process", stationEntityId, recipeId };
  ctx.actionQueue.enqueue({
    id: actionId("begin-process", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function enqueueProcess(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipe: ProcessingRecipeDef,
): void {
  const payload: ProcessActionPayload = { kind: "process", stationEntityId, recipeId: recipe.id };
  ctx.actionQueue.enqueue({
    id: actionId("process", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: recipe.actionTicks,
    repeat: { intervalTicks: recipe.actionTicks },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function handleProcessingIntent(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  serverTime: number,
  tick?: number,
  actionId?: string,
): boolean {
  const station = ctx.world.getComponent(stationEntityId, "object");
  const recipes = matchingRecipes(ctx, owner, stationEntityId);
  if (recipes.length === 0) {
    const fallback = matchingRecipe(ctx, owner, stationEntityId);
    if (!fallback) {
      if (actionId === "fire" && station?.objectId === "trap_base") {
        systemMessage(ctx.deltas, owner, "You set a fire trap.", serverTime);
        return true;
      }
      systemMessage(ctx.deltas, owner, "You have nothing suitable to cook.", serverTime);
      return true;
    }
    const error = validateProcessAction(ctx, owner, stationEntityId, fallback);
    if (!error) {
      enqueueProcess(ctx, owner, stationEntityId, fallback);
      return true;
    }
    if (error === "You need to get closer.") {
      const stationTile = tileOf(ctx.world, stationEntityId);
      if (stationTile) {
        handleMoveIntent(
          { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
          owner,
          {
            dest: stationTile,
          },
          tick !== undefined ? { tick } : {},
        );
        enqueueBeginProcess(ctx, owner, stationEntityId, fallback.id);
        return true;
      }
    }
    systemMessage(ctx.deltas, owner, error, serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  const actorTile = tileOf(ctx.world, owner);
  const stationTile = tileOf(ctx.world, stationEntityId);
  if (!actorTile || !stationTile || !station || !inventory) {
    systemMessage(ctx.deltas, owner, "You cannot do that.", serverTime);
    return true;
  }

  ctx.deltas.markRecipeList({
    interfaceId: "recipe",
    stationEntityId: stationEntityId,
    stationName: station.objectId,
    recipes: recipes.map((recipe) => ({
      recipeId: recipe.id,
      name: recipe.name,
      skillId: recipe.skill,
      levelRequired: recipe.requiredLevel,
      xp: recipe.xp,
      ingredients: [{ itemId: recipe.inputItemId, quantity: recipe.inputQuantity }],
      productId: recipe.successItemId,
      productQuantity: recipe.successQuantity,
    })),
  });

  if (chebyshev(actorTile, stationTile) > 1) {
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      {
        dest: stationTile,
      },
      tick !== undefined ? { tick } : {},
    );
  }
  return true;
}

export function handleRecipeSelect(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipeId: string,
  serverTime: number,
  tick?: number,
): boolean {
  const recipe = ctx.registries.processingRecipe.get(recipeId);
  if (!recipe) {
    systemMessage(ctx.deltas, owner, "Invalid recipe selection.", serverTime);
    return false;
  }
  const error = validateProcessAction(ctx, owner, stationEntityId, recipe);
  if (!error) {
    enqueueProcess(ctx, owner, stationEntityId, recipe);
    return true;
  }
  if (error === "You need to get closer.") {
    const stationTile = tileOf(ctx.world, stationEntityId);
    if (stationTile) {
      handleMoveIntent(
        { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
        owner,
        {
          dest: stationTile,
        },
        tick !== undefined ? { tick } : {},
      );
      enqueueBeginProcess(ctx, owner, stationEntityId, recipe.id);
      return true;
    }
  }
  systemMessage(ctx.deltas, owner, error, serverTime);
  return false;
}

export function handleBeginGather(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: BeginGatherActionPayload,
  serverTime: number,
): void {
  const validation = validateGatherAction(ctx, action.entry.owner, payload.nodeEntityId);
  if (validation.ok && validation.nodeDef) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    enqueueGather(ctx, action.entry.owner, payload.nodeEntityId, validation.nodeDef);
    return;
  }
  if (validation.reason === "out_of_range") {
    return;
  }
  ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
  systemMessage(
    ctx.deltas,
    action.entry.owner,
    gatherFailureText(validation.reason ?? "missing_node", validation.nodeDef),
    serverTime,
  );
}

export function handleGather(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: GatherActionPayload,
  tick: number,
  serverTime: number,
): void {
  const validation = validateGatherAction(ctx, action.entry.owner, payload.nodeEntityId);
  if (!validation.ok || !validation.nodeDef) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    systemMessage(
      ctx.deltas,
      action.entry.owner,
      gatherFailureText(validation.reason ?? "missing_node", validation.nodeDef),
      serverTime,
    );
    return;
  }
  const inventory = ctx.world.getComponent(action.entry.owner, "inventory");
  if (!inventory) {
    return;
  }
  const nodeDef = validation.nodeDef;
  ctx.deltas.markEntityUpdate(action.entry.owner, {
    animation: { id: `${nodeDef.skill}_attempt`, startTick: tick },
  });
  if (ctx.rng.nextFloat() >= gatherSuccessChance(ctx, action.entry.owner, inventory, nodeDef)) {
    return;
  }

  const beforeQuantity = count(inventory, nodeDef.outputItemId);
  const result = addItem(
    inventory,
    catalogFromItems(ctx.registries.item),
    nodeDef.outputItemId,
    nodeDef.outputQuantity,
  );
  if (result.added > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
    ctx.itemAudit?.recordForEntity(action.entry.owner, {
      tick,
      itemId: nodeDef.outputItemId,
      quantity: result.added,
      reason: "skilling_gather",
      beforeQuantity,
      afterQuantity: count(inventory, nodeDef.outputItemId),
      metadata: {
        nodeEntityId: payload.nodeEntityId,
        nodeId: nodeDef.id,
        skillId: nodeDef.skill,
      },
    });
    const xpResult = addXp(
      { world: ctx.world, deltas: ctx.deltas },
      action.entry.owner,
      nodeDef.skill,
      nodeDef.baseXp,
    );
    announceLevelUp(ctx.deltas, action.entry.owner, xpResult, serverTime);
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "item_gained", itemId: nodeDef.outputItemId, quantity: nodeDef.outputQuantity },
      serverTime,
      tick,
    );
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "skill_xp_gained", skillId: nodeDef.skill, amount: nodeDef.baseXp },
      serverTime,
      tick,
    );
    trackContractItemGain(ctx, action.entry.owner, nodeDef.outputItemId, nodeDef.outputQuantity);
  }
  if (ctx.rng.nextFloat() < nodeDef.depletionChance) {
    depleteResourceNode(ctx, payload.nodeEntityId, tick);
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
  }
}

export function handleBeginProcess(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: BeginProcessActionPayload,
  serverTime: number,
): void {
  const recipe = ctx.registries.processingRecipe.get(payload.recipeId);
  const error = recipe
    ? validateProcessAction(ctx, action.entry.owner, payload.stationEntityId, recipe)
    : "You cannot do that.";
  if (!error && recipe) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    enqueueProcess(ctx, action.entry.owner, payload.stationEntityId, recipe);
    return;
  }
  if (error === "You need to get closer.") {
    return;
  }
  ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
  systemMessage(ctx.deltas, action.entry.owner, error ?? "You cannot do that.", serverTime);
}

export function handleProcess(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: ProcessActionPayload,
  tick: number,
  serverTime: number,
): void {
  const recipe = ctx.registries.processingRecipe.get(payload.recipeId);
  const error = recipe
    ? validateProcessAction(ctx, action.entry.owner, payload.stationEntityId, recipe)
    : "You cannot do that.";
  if (error || !recipe) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    systemMessage(ctx.deltas, action.entry.owner, error ?? "You cannot do that.", serverTime);
    return;
  }

  const inventory = ctx.world.getComponent(action.entry.owner, "inventory");
  if (!inventory) {
    return;
  }
  const beforeInputQuantity = count(inventory, recipe.inputItemId);
  const removed = removeItem(inventory, recipe.inputItemId, recipe.inputQuantity);
  if (removed.removed < recipe.inputQuantity) {
    ctx.actionQueue.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }
  const afterInputQuantity = count(inventory, recipe.inputItemId);
  const failed = ctx.rng.nextFloat() < recipe.failureChance;
  const itemId = failed ? (recipe.failureItemId ?? recipe.successItemId) : recipe.successItemId;
  const quantity = failed ? recipe.failureQuantity : recipe.successQuantity;
  const beforeOutputQuantity = count(inventory, itemId);
  const added = addItem(inventory, catalogFromItems(ctx.registries.item), itemId, quantity);
  ctx.deltas.markInventoryDelta(buildDelta(inventory, [...removed.changes, ...added.changes]));
  if (removed.removed > 0) {
    ctx.itemAudit?.recordForEntity(action.entry.owner, {
      tick,
      itemId: recipe.inputItemId,
      quantity: removed.removed,
      reason: "skilling_process_input",
      beforeQuantity: beforeInputQuantity,
      afterQuantity: afterInputQuantity,
      metadata: {
        recipeId: recipe.id,
        stationEntityId: payload.stationEntityId,
        skillId: recipe.skill,
      },
    });
  }
  if (added.added > 0) {
    ctx.itemAudit?.recordForEntity(action.entry.owner, {
      tick,
      itemId,
      quantity: added.added,
      reason: "skilling_process_output",
      beforeQuantity: beforeOutputQuantity,
      afterQuantity: count(inventory, itemId),
      metadata: {
        recipeId: recipe.id,
        stationEntityId: payload.stationEntityId,
        skillId: recipe.skill,
        failed,
      },
    });
  }
  dispatchQuestEvent(
    ctx,
    action.entry.owner,
    { kind: "item_removed", itemId: recipe.inputItemId, quantity: recipe.inputQuantity },
    serverTime,
    tick,
  );
  dispatchQuestEvent(
    ctx,
    action.entry.owner,
    { kind: "item_gained", itemId, quantity },
    serverTime,
    tick,
  );
  trackContractItemGain(ctx, action.entry.owner, itemId, quantity);
  if (!failed) {
    const xpResult = addXp(
      { world: ctx.world, deltas: ctx.deltas },
      action.entry.owner,
      recipe.skill,
      recipe.xp,
    );
    announceLevelUp(ctx.deltas, action.entry.owner, xpResult, serverTime);
    dispatchQuestEvent(
      ctx,
      action.entry.owner,
      { kind: "skill_xp_gained", skillId: recipe.skill, amount: recipe.xp },
      serverTime,
      tick,
    );
  }

  ctx.deltas.markRecipeResult({
    recipeId: recipe.id,
    success: !failed,
    productItemId: itemId,
    productQuantity: quantity,
    ...(failed ? {} : { xpReward: recipe.xp }),
    message: failed
      ? "You fail to produce anything useful."
      : `You successfully create ${recipe.name}.`,
  });
}

export function createSkillingActionHandlers(ctx: SkillingContext): SkillingHandlerTable {
  return {
    begin_gather: (payload, actionCtx) =>
      handleBeginGather(ctx, actionCtx.execution, payload, actionCtx.serverTime),
    gather: (payload, actionCtx) =>
      handleGather(ctx, actionCtx.execution, payload, actionCtx.tick, actionCtx.serverTime),
    begin_process: (payload, actionCtx) =>
      handleBeginProcess(ctx, actionCtx.execution, payload, actionCtx.serverTime),
    process: (payload, actionCtx) =>
      handleProcess(ctx, actionCtx.execution, payload, actionCtx.tick, actionCtx.serverTime),
  };
}
