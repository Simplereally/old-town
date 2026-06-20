import type { EntityId, ObjectDef, ObjectIntent, Rng, TileCoord } from "@old-town/shared";
import { openDialogueNode } from "../dialogue/dialogue-engine";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { handleActivityIntent } from "./activity-system";
import { handleSurveyIntent } from "./cartography-system";
import { handleContractAcceptIntent } from "./contract-system";
import { handleDoorOpenIntent } from "./door-system";
import { handlePrayIntent } from "./favour-system";
import { handleMoveIntent } from "./movement-system";
import { enterNook, type NookDef } from "./nook-system";
import type { ResourceNodeContext } from "./resource-node-system";
import { handleObjectSkillingIntent } from "./skilling-system";
import { handleTrappingIntent, isTrappingAction } from "./trapping-system";

export interface ObjectInteractionContext extends ResourceNodeContext {
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly nooks?: readonly NookDef[] | undefined;
}

export interface BeginInteractPayload {
  readonly kind: "begin_interact";
  readonly objectEntityId: EntityId;
  readonly actionId: string;
}

export type ObjectInteractionPayload = BeginInteractPayload;
export type ObjectInteractionKind = ObjectInteractionPayload["kind"];

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
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

interface ObjectInteractionTarget {
  readonly object: { readonly objectId: string };
  readonly objectDef: ObjectDef;
  readonly actorTile: TileCoord;
  readonly objectTile: TileCoord;
}

interface ObjectOptionInvocation extends ObjectInteractionTarget {
  readonly owner: EntityId;
  readonly intent: ObjectIntent;
  readonly serverTime: number;
  readonly tick?: number;
  readonly nooks?: readonly NookDef[];
}

type ObjectOptionHandler = (
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
) => boolean;

type AdjacentObjectOptionRoute = {
  readonly kind: "adjacent";
  readonly handler: ObjectOptionHandler;
};

type ObjectOptionRoute = { readonly kind: "skilling" } | AdjacentObjectOptionRoute;

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

function enqueueBeginInteract(
  ctx: ObjectInteractionContext,
  owner: EntityId,
  intent: ObjectIntent,
): void {
  const payload: BeginInteractPayload = {
    kind: "begin_interact",
    objectEntityId: intent.objectEntityId,
    actionId: intent.actionId,
  };
  ctx.actionQueue.enqueue({
    id: `begin-interact:${owner}`,
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function loadObjectInteractionTarget(
  ctx: ObjectInteractionContext,
  owner: EntityId,
  objectEntityId: EntityId,
): ObjectInteractionTarget | undefined {
  const object = ctx.world.getComponent(objectEntityId, "object");
  if (!object) {
    return undefined;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef) {
    return undefined;
  }

  const actorTile = tileOf(ctx.world, owner);
  const objectTile = tileOf(ctx.world, objectEntityId);
  if (!actorTile || !objectTile) {
    return undefined;
  }

  return { object, objectDef, actorTile, objectTile };
}

function createObjectOptionInvocation(
  target: ObjectInteractionTarget,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
  nooks?: readonly NookDef[],
): ObjectOptionInvocation {
  return {
    ...target,
    owner,
    intent,
    serverTime,
    ...(tick !== undefined ? { tick } : {}),
    ...(nooks !== undefined ? { nooks } : {}),
  };
}

function handleInspectOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  const text = invocation.objectDef.examine ?? "You see nothing special.";
  systemMessage(ctx.deltas, invocation.owner, text, invocation.serverTime);
  return true;
}

function handleReadOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  if (invocation.objectDef.text) {
    systemMessage(ctx.deltas, invocation.owner, invocation.objectDef.text, invocation.serverTime);
    return true;
  }
  if (invocation.objectDef.dialogueId) {
    const dialogue = ctx.registries.dialogue.get(invocation.objectDef.dialogueId);
    if (dialogue) {
      openDialogueNode(
        ctx,
        invocation.owner,
        dialogue,
        dialogue.root,
        invocation.objectDef.name,
        invocation.serverTime,
        invocation.tick,
        invocation.intent.objectEntityId,
      );
      return true;
    }
  }
  systemMessage(ctx.deltas, invocation.owner, "There is nothing to read.", invocation.serverTime);
  return true;
}

function handleEnterOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  if (invocation.objectDef.nookId && invocation.nooks) {
    const nook = invocation.nooks.find((n) => n.id === invocation.objectDef.nookId);
    if (nook) {
      const result = enterNook(
        { world: ctx.world, deltas: ctx.deltas },
        invocation.owner,
        nook,
        invocation.serverTime,
      );
      if (result.ok) {
        return true;
      }
      systemMessage(
        ctx.deltas,
        invocation.owner,
        result.reason ?? "You cannot enter.",
        invocation.serverTime,
      );
      return true;
    }
  }
  if (invocation.objectDef.transitionDestination) {
    const movement = ctx.world.getComponent(invocation.owner, "movement");
    ctx.world.setComponent(invocation.owner, "position", {
      entityId: invocation.owner,
      x: invocation.objectDef.transitionDestination.x,
      y: invocation.objectDef.transitionDestination.y,
      plane: invocation.objectDef.transitionDestination.plane,
    });
    ctx.world.setComponent(invocation.owner, "movement", {
      entityId: invocation.owner,
      mode: movement?.mode ?? "walk",
      path: [],
      ...(movement?.lastStepDirection !== undefined
        ? { lastStepDirection: movement.lastStepDirection }
        : {}),
    });
    ctx.deltas.markEntityUpdate(invocation.owner, {
      position: invocation.objectDef.transitionDestination,
      moveSpeed: "stationary",
    });
    ctx.deltas.markDebugPath(invocation.owner, []);
    return true;
  }
  systemMessage(ctx.deltas, invocation.owner, "You cannot enter that.", invocation.serverTime);
  return true;
}

function handleRingOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  ctx.deltas.markSound({ soundId: "bell_ring", tile: invocation.objectTile, volume: 1 });
  systemMessage(ctx.deltas, invocation.owner, "You ring the bell.", invocation.serverTime);
  return true;
}

function handleOpenOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handleDoorOpenIntent(
    {
      world: ctx.world,
      collision: ctx.collision,
      deltas: ctx.deltas,
      registries: ctx.registries,
      rng: ctx.rng,
    },
    invocation.owner,
    invocation.intent.objectEntityId,
    invocation.objectDef,
    invocation.serverTime,
    invocation.tick,
  );
}

function handlePrayOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handlePrayIntent(
    ctx,
    invocation.owner,
    invocation.intent,
    invocation.serverTime,
    invocation.tick,
  );
}

function handleSurveyOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handleSurveyIntent(
    ctx,
    invocation.owner,
    invocation.intent,
    invocation.serverTime,
    invocation.tick,
  );
}

function handleContractAcceptOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handleContractAcceptIntent(
    ctx,
    invocation.owner,
    invocation.intent,
    invocation.serverTime,
    invocation.tick,
  );
}

function handleTrappingOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handleTrappingIntent(
    ctx,
    invocation.owner,
    invocation.intent,
    invocation.serverTime,
    invocation.tick,
  );
}

function handleActivityOption(
  ctx: ObjectInteractionContext,
  invocation: ObjectOptionInvocation,
): boolean {
  return handleActivityIntent(
    ctx,
    invocation.owner,
    invocation.intent.objectEntityId,
    invocation.serverTime,
    invocation.tick,
  );
}

const OBJECT_OPTION_ROUTES = new Map<string, AdjacentObjectOptionRoute>([
  ["inspect", { kind: "adjacent", handler: handleInspectOption }],
  ["read", { kind: "adjacent", handler: handleReadOption }],
  ["enter", { kind: "adjacent", handler: handleEnterOption }],
  ["ring", { kind: "adjacent", handler: handleRingOption }],
  ["open", { kind: "adjacent", handler: handleOpenOption }],
  ["pray", { kind: "adjacent", handler: handlePrayOption }],
  ["survey", { kind: "adjacent", handler: handleSurveyOption }],
  ["accept", { kind: "adjacent", handler: handleContractAcceptOption }],
  ["activity", { kind: "adjacent", handler: handleActivityOption }],
]);

const SKILLING_OBJECT_ROUTE: ObjectOptionRoute = { kind: "skilling" };
const TRAPPING_OBJECT_ROUTE: AdjacentObjectOptionRoute = {
  kind: "adjacent",
  handler: handleTrappingOption,
};

function resolveObjectOptionRoute(actionId: string): ObjectOptionRoute | undefined {
  if (GATHER_ACTION_IDS.has(actionId)) {
    return SKILLING_OBJECT_ROUTE;
  }
  if (isTrappingAction(actionId)) {
    return TRAPPING_OBJECT_ROUTE;
  }
  if (PROCESS_ACTION_IDS.has(actionId)) {
    return SKILLING_OBJECT_ROUTE;
  }
  const route = OBJECT_OPTION_ROUTES.get(actionId);
  if (route) {
    return route;
  }
  return undefined;
}

function invokeAdjacentObjectOption(
  ctx: ObjectInteractionContext,
  route: AdjacentObjectOptionRoute,
  invocation: ObjectOptionInvocation,
): boolean {
  return route.handler(ctx, invocation);
}

export function handleBeginInteract(
  ctx: ObjectInteractionContext,
  action: ActionExecution,
  payload: BeginInteractPayload,
  serverTime: number,
  tick?: number,
): void {
  const owner = action.entry.owner;
  const route = resolveObjectOptionRoute(payload.actionId);
  if (!route || route.kind === "skilling") {
    ctx.actionQueue.cancel(owner, { id: action.entry.id });
    systemMessage(ctx.deltas, owner, "You cannot do that.", serverTime);
    return;
  }

  const target = loadObjectInteractionTarget(ctx, owner, payload.objectEntityId);
  if (!target) {
    ctx.actionQueue.cancel(owner, { id: action.entry.id });
    return;
  }
  if (chebyshev(target.actorTile, target.objectTile) > 1) {
    return;
  }

  ctx.actionQueue.cancel(owner, { id: action.entry.id });
  const result = invokeAdjacentObjectOption(
    ctx,
    route,
    createObjectOptionInvocation(
      target,
      owner,
      { actionId: payload.actionId, objectEntityId: payload.objectEntityId },
      serverTime,
      tick,
      ctx.nooks,
    ),
  );
  if (!result) {
    systemMessage(ctx.deltas, owner, "You cannot do that.", serverTime);
  }
}

export function handleObjectIntent(
  ctx: ObjectInteractionContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
  nooks?: readonly NookDef[],
): boolean {
  const route = resolveObjectOptionRoute(intent.actionId);
  if (!route) {
    return false;
  }
  if (route.kind === "skilling") {
    return handleObjectSkillingIntent(ctx, owner, intent, serverTime, tick);
  }

  const target = loadObjectInteractionTarget(ctx, owner, intent.objectEntityId);
  if (!target) {
    return false;
  }
  if (chebyshev(target.actorTile, target.objectTile) > 1) {
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      { dest: target.objectTile },
      tick !== undefined ? { tick } : {},
    );
    enqueueBeginInteract(ctx, owner, intent);
    return true;
  }

  return invokeAdjacentObjectOption(
    ctx,
    route,
    createObjectOptionInvocation(target, owner, intent, serverTime, tick, nooks),
  );
}
