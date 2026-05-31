import type { ContentRegistries, EntityId, Rng } from "@old-town/shared";
import type { World } from "../ecs/world";
import { handleItemIntent, handleUnequipIntent } from "../items/item-actions";
import type { ChatSystem } from "../systems/chat-system";
import type { ConsumableSystem } from "../systems/consumable-system";
import { handleObjectSkillingIntent } from "../systems/skilling-system";
import { handleMoveIntent, processMovementPhase } from "../systems/movement-system";
import type { CollisionMap } from "../world/collision";
import { ActionQueueType } from "./action-queue";
import type { ActionRuntime } from "./action-runtime";
import { type BufferedIntent, type ConsumedCommandGroup, IntentKind } from "./command-buffer";
import type { DeltaAccumulator } from "./delta-accumulator";

export interface IntentDispatcherContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly actionRuntime: ActionRuntime;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
  readonly chatSystem: ChatSystem;
  readonly consumableSystem: ConsumableSystem;
}

function emitSystemMessage(
  ctx: IntentDispatcherContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

export function dispatchIntentGroup(
  ctx: IntentDispatcherContext,
  group: ConsumedCommandGroup,
  tick: number,
  serverTime: number,
): void {
  for (const intent of group.intents) {
    dispatchSingleIntent(ctx, group.ownerEntityId, intent, tick, serverTime);
  }
}

function dispatchSingleIntent(
  ctx: IntentDispatcherContext,
  owner: EntityId,
  intent: BufferedIntent,
  tick: number,
  serverTime: number,
): void {
  switch (intent.kind) {
    case IntentKind.Move: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      handleMoveIntent({ world: ctx.world, collision: ctx.collision, deltas: ctx.deltas }, owner, {
        dest: intent.payload.dest,
      });
      return;
    }

    case IntentKind.Chat: {
      ctx.chatSystem.submit(
        { world: ctx.world, deltas: ctx.deltas },
        owner,
        { text: intent.payload.text },
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.Item: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      handleItemIntent(
        {
          world: ctx.world,
          deltas: ctx.deltas,
          items: ctx.registries.item,
          consumables: ctx.consumableSystem,
        },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.UiAction: {
      if (intent.payload.action === "unequip" && intent.payload.value !== undefined) {
        ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
        handleUnequipIntent(
          {
            world: ctx.world,
            deltas: ctx.deltas,
            items: ctx.registries.item,
            consumables: ctx.consumableSystem,
          },
          owner,
          intent.payload.value,
          serverTime,
        );
      }
      return;
    }

    case IntentKind.Object: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      if (handleObjectSkillingIntent(ctx, owner, intent.payload, serverTime)) {
        return;
      }
      emitSystemMessage(ctx, owner, "Object interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Npc: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      emitSystemMessage(ctx, owner, "NPC interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.GroundItem: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      emitSystemMessage(ctx, owner, "Ground item interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Spell: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      emitSystemMessage(ctx, owner, "Spell casting is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Ping: {
      return;
    }
  }
}

export function dispatchMovementPhase(ctx: IntentDispatcherContext, tick: number): void {
  processMovementPhase({ world: ctx.world, collision: ctx.collision, deltas: ctx.deltas }, tick);
}

export function dispatchConsumablePhase(ctx: IntentDispatcherContext): void {
  ctx.consumableSystem.processConsumablePhase({ world: ctx.world, deltas: ctx.deltas });
}
