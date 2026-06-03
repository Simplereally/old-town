import type { EntityId, ObjectDef, ObjectIntent, Rng, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { openDialogueNode } from "../dialogue/dialogue-engine";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { handleMoveIntent } from "./movement-system";
import type { ResourceNodeContext } from "./resource-node-system";
import { handleObjectSkillingIntent } from "./skilling-system";
import { handlePrayIntent } from "./favour-system";
import { handleTrappingIntent, isTrappingAction } from "./trapping-system";
import { handleSurveyIntent } from "./cartography-system";
import { handleContractAcceptIntent } from "./contract-system";
import { enterNook, type NookDef } from "./nook-system";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";

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
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

const GATHER_ACTION_IDS = new Set(["chop", "woodcut", "mine", "fish"]);
const PROCESS_ACTION_IDS = new Set(["cook", "use", "smelt", "smith", "craft", "fire", "weave", "tan", "dye", "mix"]);

function needsBeginInteract(actionId: string): boolean {
  return !GATHER_ACTION_IDS.has(actionId) && !PROCESS_ACTION_IDS.has(actionId);
}

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
  ctx.actionRuntime.enqueue({
    id: `begin-interact:${owner}`,
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
}

function handleObjectInteract(
  ctx: ObjectInteractionContext,
  owner: EntityId,
  intent: ObjectIntent,
  object: { readonly objectId: string },
  objectDef: ObjectDef,
  objectTile: TileCoord,
  serverTime: number,
  tick?: number,
  nooks?: readonly NookDef[],
): boolean {
  switch (intent.actionId) {
    case "inspect": {
      const text = objectDef.examine ?? "You see nothing special.";
      systemMessage(ctx.deltas, owner, text, serverTime);
      return true;
    }
    case "read": {
      if (objectDef.text) {
        systemMessage(ctx.deltas, owner, objectDef.text, serverTime);
        return true;
      }
      if (objectDef.dialogueId) {
        const dialogue = ctx.registries.dialogue.get(objectDef.dialogueId);
        if (dialogue) {
          openDialogueNode(
            ctx,
            owner,
            dialogue,
            dialogue.root,
            objectDef.name,
            serverTime,
            tick,
            intent.objectEntityId,
          );
          return true;
        }
      }
      systemMessage(ctx.deltas, owner, "There is nothing to read.", serverTime);
      return true;
    }
    case "enter": {
      if (objectDef.nookId && nooks) {
        const nook = nooks.find((n) => n.id === objectDef.nookId);
        if (nook) {
          const result = enterNook({ world: ctx.world, deltas: ctx.deltas }, owner, nook, serverTime);
          if (result.ok) {
            return true;
          }
          systemMessage(ctx.deltas, owner, result.reason ?? "You cannot enter.", serverTime);
          return true;
        }
      }
      if (objectDef.transitionDestination) {
        const movement = ctx.world.getComponent(owner, "movement");
        ctx.world.setComponent(owner, "position", {
          entityId: owner,
          x: objectDef.transitionDestination.x,
          y: objectDef.transitionDestination.y,
          plane: objectDef.transitionDestination.plane,
        });
        ctx.world.setComponent(owner, "movement", {
          entityId: owner,
          mode: movement?.mode ?? "walk",
          path: [],
          ...(movement?.lastStepDirection !== undefined
            ? { lastStepDirection: movement.lastStepDirection }
            : {}),
        });
        ctx.deltas.markEntityUpdate(owner, {
          position: objectDef.transitionDestination,
          moveSpeed: "stationary",
        });
        ctx.deltas.markDebugPath(owner, []);
        return true;
      }
      systemMessage(ctx.deltas, owner, "You cannot enter that.", serverTime);
      return true;
    }
    case "ring": {
      ctx.deltas.markSound({ soundId: "bell_ring", tile: objectTile, volume: 1 });
      systemMessage(ctx.deltas, owner, "You ring the bell.", serverTime);
      return true;
    }
    case "pray": {
      return handlePrayIntent(ctx, owner, intent, serverTime, tick);
    }
    case "survey": {
      return handleSurveyIntent(ctx, owner, intent, serverTime, tick);
    }
    case "accept": {
      return handleContractAcceptIntent(ctx, owner, intent, serverTime, tick);
    }
    default:
      if (isTrappingAction(intent.actionId)) {
        return handleTrappingIntent(ctx, owner, intent, serverTime, tick);
      }
      return false;
  }
}

export function handleBeginInteract(
  ctx: ObjectInteractionContext,
  action: ActionExecution,
  payload: BeginInteractPayload,
  serverTime: number,
  tick?: number,
): void {
  const owner = action.entry.owner;
  const object = ctx.world.getComponent(payload.objectEntityId, "object");
  if (!object) {
    ctx.actionRuntime.cancel(owner, { id: action.entry.id });
    return;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef) {
    ctx.actionRuntime.cancel(owner, { id: action.entry.id });
    return;
  }

  const actorTile = tileOf(ctx.world, owner);
  const objectTile = tileOf(ctx.world, payload.objectEntityId);
  if (!actorTile || !objectTile) {
    ctx.actionRuntime.cancel(owner, { id: action.entry.id });
    return;
  }

  if (chebyshev(actorTile, objectTile) > 1) {
    return;
  }

  ctx.actionRuntime.cancel(owner, { id: action.entry.id });
  const result = handleObjectInteract(
    ctx,
    owner,
    { actionId: payload.actionId, objectEntityId: payload.objectEntityId },
    object,
    objectDef,
    objectTile,
    serverTime,
    tick,
    ctx.nooks,
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
  if (GATHER_ACTION_IDS.has(intent.actionId) || PROCESS_ACTION_IDS.has(intent.actionId)) {
    return handleObjectSkillingIntent(ctx, owner, intent, serverTime, tick);
  }

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
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      { dest: objectTile },
      tick !== undefined ? { tick } : {},
    );
    if (needsBeginInteract(intent.actionId)) {
      enqueueBeginInteract(ctx, owner, intent);
    }
    return true;
  }

  return handleObjectInteract(ctx, owner, intent, object, objectDef, objectTile, serverTime, tick, nooks);
}
