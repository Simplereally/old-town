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
  hasItem,
  hasSpaceFor,
  removeItem,
} from "../items/inventory";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp, getCurrentLevel } from "../skills/skill-state";
import { handleMoveIntent } from "./movement-system";
import { depleteResourceNode, type ResourceNodeContext } from "./resource-node-system";

export interface SkillingContext extends ResourceNodeContext {
  readonly rng: Rng;
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

type SkillingPayload =
  | GatherActionPayload
  | BeginGatherActionPayload
  | ProcessActionPayload
  | BeginProcessActionPayload;

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

const GATHER_ACTION_IDS = new Set(["chop", "woodcut", "mine"]);
const PROCESS_ACTION_IDS = new Set(["cook", "use"]);

function actionId(prefix: string, owner: EntityId): string {
  return `${prefix}:${owner}`;
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

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
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
  ctx.actionRuntime.enqueue({
    id: actionId("begin-gather", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload: { kind: "begin_gather", nodeEntityId } satisfies BeginGatherActionPayload,
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
  ctx.actionRuntime.enqueue({
    id: actionId("gather", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: nodeDef.actionTicks,
    repeat: { intervalTicks: nodeDef.actionTicks },
    interruptGroup: InterruptGroup.Skilling,
    payload: { kind: "gather", nodeEntityId } satisfies GatherActionPayload,
  });
}

export function handleObjectSkillingIntent(
  ctx: SkillingContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
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
    return handleProcessingIntent(ctx, owner, intent.objectEntityId, serverTime);
  }

  return false;
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
  ctx.actionRuntime.enqueue({
    id: actionId("begin-process", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload: {
      kind: "begin_process",
      stationEntityId,
      recipeId,
    } satisfies BeginProcessActionPayload,
  });
}

function enqueueProcess(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipe: ProcessingRecipeDef,
): void {
  ctx.actionRuntime.enqueue({
    id: actionId("process", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: recipe.actionTicks,
    repeat: { intervalTicks: recipe.actionTicks },
    interruptGroup: InterruptGroup.Skilling,
    payload: {
      kind: "process",
      stationEntityId,
      recipeId: recipe.id,
    } satisfies ProcessActionPayload,
  });
}

function handleProcessingIntent(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  serverTime: number,
): boolean {
  const recipe = matchingRecipe(ctx, owner, stationEntityId);
  if (!recipe) {
    systemMessage(ctx.deltas, owner, "You have nothing suitable to cook.", serverTime);
    return true;
  }
  const error = validateProcessAction(ctx, owner, stationEntityId, recipe);
  if (!error) {
    enqueueProcess(ctx, owner, stationEntityId, recipe);
    return true;
  }
  if (error === "You need to get closer.") {
    const stationTile = tileOf(ctx.world, stationEntityId);
    if (stationTile) {
      handleMoveIntent({ world: ctx.world, collision: ctx.collision, deltas: ctx.deltas }, owner, {
        dest: stationTile,
      });
      enqueueBeginProcess(ctx, owner, stationEntityId, recipe.id);
      return true;
    }
  }
  systemMessage(ctx.deltas, owner, error, serverTime);
  return true;
}

function handleBeginGather(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: BeginGatherActionPayload,
  serverTime: number,
): boolean {
  const validation = validateGatherAction(ctx, action.entry.owner, payload.nodeEntityId);
  if (validation.ok && validation.nodeDef) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    enqueueGather(ctx, action.entry.owner, payload.nodeEntityId, validation.nodeDef);
    return true;
  }
  if (validation.reason === "out_of_range") {
    return true;
  }
  ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
  systemMessage(
    ctx.deltas,
    action.entry.owner,
    gatherFailureText(validation.reason ?? "missing_node", validation.nodeDef),
    serverTime,
  );
  return true;
}

function handleGather(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: GatherActionPayload,
  tick: number,
  serverTime: number,
): boolean {
  const validation = validateGatherAction(ctx, action.entry.owner, payload.nodeEntityId);
  if (!validation.ok || !validation.nodeDef) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    systemMessage(
      ctx.deltas,
      action.entry.owner,
      gatherFailureText(validation.reason ?? "missing_node", validation.nodeDef),
      serverTime,
    );
    return true;
  }
  const inventory = ctx.world.getComponent(action.entry.owner, "inventory");
  if (!inventory) {
    return true;
  }
  const nodeDef = validation.nodeDef;
  ctx.deltas.markEntityUpdate(action.entry.owner, {
    animation: { id: `${nodeDef.skill}_attempt`, startTick: tick },
  });
  if (ctx.rng.nextFloat() >= gatherSuccessChance(ctx, action.entry.owner, inventory, nodeDef)) {
    return true;
  }

  const result = addItem(
    inventory,
    catalogFromItems(ctx.registries.item),
    nodeDef.outputItemId,
    nodeDef.outputQuantity,
  );
  if (result.added > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, result.changes));
    addXp(
      { world: ctx.world, deltas: ctx.deltas },
      action.entry.owner,
      nodeDef.skill,
      nodeDef.baseXp,
    );
  }
  if (ctx.rng.nextFloat() < nodeDef.depletionChance) {
    depleteResourceNode(ctx, payload.nodeEntityId, tick);
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
  }
  return true;
}

function handleBeginProcess(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: BeginProcessActionPayload,
  serverTime: number,
): boolean {
  const recipe = ctx.registries.processingRecipe.get(payload.recipeId);
  const error = recipe
    ? validateProcessAction(ctx, action.entry.owner, payload.stationEntityId, recipe)
    : "You cannot do that.";
  if (!error && recipe) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    enqueueProcess(ctx, action.entry.owner, payload.stationEntityId, recipe);
    return true;
  }
  if (error === "You need to get closer.") {
    return true;
  }
  ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
  systemMessage(ctx.deltas, action.entry.owner, error ?? "You cannot do that.", serverTime);
  return true;
}

function handleProcess(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: ProcessActionPayload,
  serverTime: number,
): boolean {
  const recipe = ctx.registries.processingRecipe.get(payload.recipeId);
  const error = recipe
    ? validateProcessAction(ctx, action.entry.owner, payload.stationEntityId, recipe)
    : "You cannot do that.";
  if (error || !recipe) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    systemMessage(ctx.deltas, action.entry.owner, error ?? "You cannot do that.", serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(action.entry.owner, "inventory");
  if (!inventory) {
    return true;
  }
  const removed = removeItem(inventory, recipe.inputItemId, recipe.inputQuantity);
  if (removed.removed < recipe.inputQuantity) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    return true;
  }
  const failed = ctx.rng.nextFloat() < recipe.failureChance;
  const itemId = failed ? (recipe.failureItemId ?? recipe.successItemId) : recipe.successItemId;
  const quantity = failed ? recipe.failureQuantity : recipe.successQuantity;
  const added = addItem(inventory, catalogFromItems(ctx.registries.item), itemId, quantity);
  ctx.deltas.markInventoryDelta(buildDelta(inventory, [...removed.changes, ...added.changes]));
  if (!failed) {
    addXp({ world: ctx.world, deltas: ctx.deltas }, action.entry.owner, recipe.skill, recipe.xp);
  }
  return true;
}

export function handleSkillingAction(
  ctx: SkillingContext,
  action: ActionExecution,
  tick: number,
  serverTime: number,
): boolean {
  const payload = action.entry.payload as Partial<SkillingPayload>;
  switch (payload.kind) {
    case "begin_gather":
      return handleBeginGather(ctx, action, payload as BeginGatherActionPayload, serverTime);
    case "gather":
      return handleGather(ctx, action, payload as GatherActionPayload, tick, serverTime);
    case "begin_process":
      return handleBeginProcess(ctx, action, payload as BeginProcessActionPayload, serverTime);
    case "process":
      return handleProcess(ctx, action, payload as ProcessActionPayload, serverTime);
    default:
      return false;
  }
}
