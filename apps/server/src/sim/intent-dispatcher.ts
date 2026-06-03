import type { ContentRegistries, EntityId, Rng } from "@old-town/shared";
import { handleDialogueUiIntent, handleNpcDialogueIntent } from "../dialogue/dialogue-engine";
import type { World } from "../ecs/world";
import { handleItemIntent, handleUnequipIntent } from "../items/item-actions";
import type { ItemAuditLog } from "../items/item-audit";
import { dispatchQuestEvent } from "../quests/quest-engine";
import { handleBankIntent } from "../systems/bank-system";
import type { ChatSystem } from "../systems/chat-system";
import { handleNpcCombatIntent } from "../systems/combat-system";
import type { ConsumableSystem } from "../systems/consumable-system";
import { handleGroundItemIntent } from "../systems/ground-item-system";
import {
  type FootprintResolver,
  handleMoveIntent,
  processMovementPhase,
} from "../systems/movement-system";
import { handleObjectIntent } from "../systems/object-interaction-router";
import { handleRecipeSelect } from "../systems/skilling-system";
import { handleShopIntent } from "../systems/shop-system";
import { handleSpellIntent } from "../systems/spell-system";
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
  readonly itemAudit?: ItemAuditLog | undefined;
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
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleMoveIntent(
        { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
        owner,
        {
          dest: intent.payload.dest,
        },
        { tick },
      );
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
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleItemIntent(
        {
          world: ctx.world,
          deltas: ctx.deltas,
          items: ctx.registries.item,
          consumables: ctx.consumableSystem,
          itemAudit: ctx.itemAudit,
        },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.UiAction: {
      if (handleDialogueUiIntent(ctx, owner, intent.payload, serverTime, tick)) {
        return;
      }
      if (intent.payload.action === "unequip" && intent.payload.value !== undefined) {
        ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
        ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
        handleUnequipIntent(
          {
            world: ctx.world,
            deltas: ctx.deltas,
            items: ctx.registries.item,
            consumables: ctx.consumableSystem,
            itemAudit: ctx.itemAudit,
          },
          owner,
          intent.payload.value,
          tick,
          serverTime,
        );
      }
      return;
    }

    case IntentKind.Object: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      const object = ctx.world.getComponent(intent.payload.objectEntityId, "object");
      if (handleObjectIntent(ctx, owner, intent.payload, serverTime, tick)) {
        if (object) {
          dispatchQuestEvent(
            ctx,
            owner,
            {
              kind: "object_interacted",
              objectId: object.objectId,
              option: intent.payload.actionId,
            },
            serverTime,
            tick,
          );
        }
        return;
      }
      if (object) {
        const result = dispatchQuestEvent(
          ctx,
          owner,
          {
            kind: "object_interacted",
            objectId: object.objectId,
            option: intent.payload.actionId,
          },
          serverTime,
          tick,
        );
        if (result.progressedQuestIds.length > 0) {
          return;
        }
      }
      emitSystemMessage(ctx, owner, "Object interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Npc: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (intent.payload.actionId === "bank") {
        handleBankIntent(
          { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas, registries: ctx.registries, itemAudit: ctx.itemAudit },
          owner,
          { action: "open", targetEntityId: intent.payload.npcEntityId },
          tick,
          serverTime,
        );
        return;
      }
      if (intent.payload.actionId === "trade") {
        handleShopIntent(
          { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas, registries: ctx.registries, itemAudit: ctx.itemAudit },
          owner,
          { action: "open", targetEntityId: intent.payload.npcEntityId },
          tick,
          serverTime,
        );
        return;
      }
      if (handleNpcDialogueIntent(ctx, owner, intent.payload, serverTime, tick)) {
        return;
      }
      if (handleNpcCombatIntent(ctx, owner, intent.payload, serverTime, tick)) {
        return;
      }
      emitSystemMessage(ctx, owner, "NPC interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.BankAction: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleBankIntent(
        { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas, registries: ctx.registries, itemAudit: ctx.itemAudit },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.ShopAction: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleShopIntent(
        { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas, registries: ctx.registries, itemAudit: ctx.itemAudit },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.GroundItem: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (handleGroundItemIntent(ctx, owner, intent.payload, tick, serverTime)) {
        return;
      }
      emitSystemMessage(ctx, owner, "Ground item interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Spell: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (handleSpellIntent(ctx, owner, intent.payload, tick, serverTime)) {
        return;
      }
      emitSystemMessage(ctx, owner, "Spell casting is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.RecipeSelect: {
      ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
      handleRecipeSelect(
        {
          world: ctx.world,
          collision: ctx.collision,
          deltas: ctx.deltas,
          registries: ctx.registries,
          actionRuntime: ctx.actionRuntime,
          rng: ctx.rng,
        },
        owner,
        intent.payload.stationEntityId,
        intent.payload.recipeId,
        serverTime,
        tick,
      );
      return;
    }

    case IntentKind.Ping: {
      return;
    }
  }
}

export function dispatchMovementPhase(
  ctx: IntentDispatcherContext,
  tick: number,
  footprint?: FootprintResolver,
): void {
  processMovementPhase(
    { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
    tick,
    footprint,
  );
}

export function dispatchConsumablePhase(ctx: IntentDispatcherContext): void {
  ctx.consumableSystem.processConsumablePhase({ world: ctx.world, deltas: ctx.deltas });
}
