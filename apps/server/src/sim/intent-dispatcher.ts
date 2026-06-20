import type { ContentRegistries, EntityId, Rng } from "@old-town/shared";
import { handleDialogueUiIntent, handleNpcDialogueIntent } from "../dialogue/dialogue-engine";
import type { World } from "../ecs/world";
import { handleItemIntent, handleUnequipIntent, handleUseItemOnIntent } from "../items/item-actions";
import type { ItemAuditLog } from "../items/item-audit";
import { dispatchQuestEvent } from "../quests/quest-engine";
import { handleBankIntent } from "../systems/bank-system";
import type { ChatSystem } from "../systems/chat-system";
import { handleNpcCombatIntent } from "../systems/combat-system";
import type { ConsumableSystem } from "../systems/consumable-system";
import { handleContractBoardOpen } from "../systems/contract-system";
import { handleGroundItemIntent } from "../systems/ground-item-system";
import {
  type FootprintResolver,
  handleMoveIntent,
  processMovementPhase,
} from "../systems/movement-system";
import type { NookDef } from "../systems/nook-system";
import { handleObjectIntent } from "../systems/object-interaction-router";
import { handleServiceFeeIntent } from "../systems/service-fee-system";
import { handleShopIntent } from "../systems/shop-system";
import { handleRecipeSelect } from "../systems/skilling-system";
import { handleSpellIntent } from "../systems/spell-system";
import type { CollisionMap } from "../world/collision";
import type { ActionQueue } from "./action-queue";
import { ActionQueueType } from "./action-queue";
import { type BufferedIntent, type ConsumedCommandGroup, IntentKind } from "./command-buffer";
import type { DeltaAccumulator } from "./delta-accumulator";

export interface IntentDispatcherContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly actionQueue: ActionQueue;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
  readonly chatSystem: ChatSystem;
  readonly consumableSystem: ConsumableSystem;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly nooks?: readonly NookDef[] | undefined;
}

function emitSystemMessage(
  ctx: IntentDispatcherContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

/** System-reserved action IDs that are always valid for NPCs even if not in the def's options. */
const NPC_SYSTEM_ACTIONS = new Set(["attack", "talk", "examine", "walk_here"]);

/** System-reserved action IDs that are always valid for objects even if not in the def's options. */
const OBJECT_SYSTEM_ACTIONS = new Set(["examine", "walk_here"]);

/**
 * Authoritative validation that the client-sent actionId is a valid option for the targeted NPC.
 * Prevents a misbehaving client from invoking arbitrary actionIds not defined in content.
 */
function isValidNpcAction(
  ctx: IntentDispatcherContext,
  npcEntityId: EntityId,
  actionId: string,
): boolean {
  if (NPC_SYSTEM_ACTIONS.has(actionId)) {
    return true;
  }
  const npc = ctx.world.getComponent(npcEntityId, "npc");
  if (!npc) {
    return false;
  }
  const def = ctx.registries.npc.get(npc.npcId);
  if (!def) {
    return false;
  }
  return def.options.some((option) => option.actionId === actionId);
}

/**
 * Authoritative validation that the client-sent actionId is a valid option for the targeted object.
 * Prevents a misbehaving client from invoking arbitrary actionIds not defined in content.
 */
function isValidObjectAction(
  ctx: IntentDispatcherContext,
  objectEntityId: EntityId,
  actionId: string,
): boolean {
  if (OBJECT_SYSTEM_ACTIONS.has(actionId)) {
    return true;
  }
  const object = ctx.world.getComponent(objectEntityId, "object");
  if (!object) {
    return false;
  }
  const def = ctx.registries.object.get(object.objectId);
  if (!def) {
    return false;
  }
  return def.options.some((option) => option.actionId === actionId);
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
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
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
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
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

    case IntentKind.UseItemOn: {
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleUseItemOnIntent(
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
        ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
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
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (!isValidObjectAction(ctx, intent.payload.objectEntityId, intent.payload.actionId)) {
        emitSystemMessage(ctx, owner, "Nothing interesting happens.", serverTime);
        return;
      }
      const object = ctx.world.getComponent(intent.payload.objectEntityId, "object");
      if (handleObjectIntent(ctx, owner, intent.payload, serverTime, tick, ctx.nooks)) {
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
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (!isValidNpcAction(ctx, intent.payload.npcEntityId, intent.payload.actionId)) {
        emitSystemMessage(ctx, owner, "Nothing interesting happens.", serverTime);
        return;
      }
      if (intent.payload.actionId === "bank") {
        handleBankIntent(
          {
            world: ctx.world,
            collision: ctx.collision,
            deltas: ctx.deltas,
            registries: ctx.registries,
            itemAudit: ctx.itemAudit,
          },
          owner,
          { action: "open", targetEntityId: intent.payload.npcEntityId },
          tick,
          serverTime,
        );
        return;
      }
      if (intent.payload.actionId === "trade") {
        handleShopIntent(
          {
            world: ctx.world,
            collision: ctx.collision,
            deltas: ctx.deltas,
            registries: ctx.registries,
            itemAudit: ctx.itemAudit,
          },
          owner,
          { action: "open", targetEntityId: intent.payload.npcEntityId },
          tick,
          serverTime,
        );
        return;
      }
      if (intent.payload.actionId === "contract") {
        handleContractBoardOpen(
          {
            world: ctx.world,
            deltas: ctx.deltas,
            registries: ctx.registries,
            itemAudit: ctx.itemAudit,
          },
          owner,
          serverTime,
        );
        return;
      }
      if (
        handleServiceFeeIntent(
          {
            world: ctx.world,
            collision: ctx.collision,
            deltas: ctx.deltas,
            registries: ctx.registries,
            itemAudit: ctx.itemAudit,
          },
          owner,
          intent.payload,
          tick,
          serverTime,
        )
      ) {
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
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleBankIntent(
        {
          world: ctx.world,
          collision: ctx.collision,
          deltas: ctx.deltas,
          registries: ctx.registries,
          itemAudit: ctx.itemAudit,
        },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.ShopAction: {
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      handleShopIntent(
        {
          world: ctx.world,
          collision: ctx.collision,
          deltas: ctx.deltas,
          registries: ctx.registries,
          itemAudit: ctx.itemAudit,
        },
        owner,
        intent.payload,
        tick,
        serverTime,
      );
      return;
    }

    case IntentKind.GroundItem: {
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (handleGroundItemIntent(ctx, owner, intent.payload, tick, serverTime)) {
        return;
      }
      emitSystemMessage(ctx, owner, "Ground item interaction is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.Spell: {
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
      if (handleSpellIntent(ctx, owner, intent.payload, tick, serverTime)) {
        return;
      }
      emitSystemMessage(ctx, owner, "Spell casting is not yet implemented.", serverTime);
      return;
    }

    case IntentKind.RecipeSelect: {
      ctx.actionQueue.cancel(owner, { type: ActionQueueType.Weak });
      handleRecipeSelect(
        {
          world: ctx.world,
          collision: ctx.collision,
          deltas: ctx.deltas,
          registries: ctx.registries,
          actionQueue: ctx.actionQueue,
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

    case IntentKind.SetCombatStyle: {
      const combatant = ctx.world.getComponent(owner, "combatant");
      if (combatant) {
        ctx.world.setComponent(owner, "combatant", {
          ...combatant,
          combatStyle: intent.payload.style,
        });
      }
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
  ctx.consumableSystem.processConsumablePhase({
    world: ctx.world,
    deltas: ctx.deltas,
    registries: ctx.registries,
  });
}
