import type { EntityId, ObjectIntent, Rng, TileCoord } from "@old-town/shared";
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

export interface ObjectInteractionContext extends ResourceNodeContext {
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
}

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
const PROCESS_ACTION_IDS = new Set([
  "cook", "use", "smith", "smelt", "craft", "fire", "weave", "tan", "dye", "mix",
]);

export function handleObjectIntent(
  ctx: ObjectInteractionContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
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
    return true;
  }

  switch (intent.actionId) {
    case "inspect": {
      const text = objectDef.examine ?? "You see nothing special.";
      systemMessage(ctx.deltas, owner, text, serverTime);
      return true;
    }
    case "read": {
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
