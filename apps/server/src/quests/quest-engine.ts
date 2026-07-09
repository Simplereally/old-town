import type { ContentRegistries, EntityId, QuestDef, QuestStage } from "@old-town/shared";
import type { World } from "../ecs/world";
import { count } from "../items/inventory";
import type { ItemAuditLog, ItemAuditMetadata } from "../items/item-audit";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  getBooleanVar,
  getQuestStage,
  incrementVar,
  questAreaVarKey,
  questCompletedVarKey,
  questKillCountVarKey,
  questObjectVarKey,
  questTalkVarKey,
  setQuestStage,
  setVar,
} from "../vars/player-vars";
import { applyEffects, completeQuest } from "./effects";
import { areObjectivesComplete } from "./objectives";
import { meetsAllRequirements } from "./requirements";

export type QuestEvent =
  | { readonly kind: "dialogue"; readonly npcId: string }
  | { readonly kind: "item_gained"; readonly itemId: string; readonly quantity: number }
  | { readonly kind: "item_removed"; readonly itemId: string; readonly quantity: number }
  | { readonly kind: "npc_killed"; readonly npcId: string }
  | { readonly kind: "object_interacted"; readonly objectId: string; readonly option: string }
  | { readonly kind: "skill_xp_gained"; readonly skillId: string; readonly amount: number }
  | { readonly kind: "area_entered"; readonly areaId: string; readonly tag?: string };

export interface QuestEngineContext {
  readonly world: World;
  readonly registries: ContentRegistries;
  readonly deltas: DeltaAccumulator;
  readonly itemAudit?: ItemAuditLog | undefined;
  readonly itemAuditMetadata?: ItemAuditMetadata | undefined;
}

export interface QuestDispatchResult {
  readonly progressedQuestIds: readonly string[];
}

export function dispatchQuestEvent(
  ctx: QuestEngineContext,
  playerId: EntityId,
  event: QuestEvent,
  serverTime: number,
  tick?: number,
): QuestDispatchResult {
  recordEventProgress(ctx, playerId, event);
  const progressedQuestIds: string[] = [];

  for (const quest of ctx.registries.quest.values()) {
    if (isQuestCompleted(ctx, playerId, quest)) {
      continue;
    }
    const stage = currentQuestStage(ctx, playerId, quest);
    if (!stage || stage.stage === 0) {
      continue;
    }
    if (!areObjectivesComplete(ctx.world, playerId, quest, stage)) {
      continue;
    }
    if (completeStage(ctx, playerId, quest, stage, serverTime, tick)) {
      progressedQuestIds.push(quest.id);
    }
  }

  return { progressedQuestIds };
}

export function processQuestTriggers(
  ctx: QuestEngineContext,
  serverTime: number,
  tick?: number,
): QuestDispatchResult {
  const progressedQuestIds: string[] = [];

  for (const playerId of ctx.world.entityIdsWith("player")) {
    for (const quest of ctx.registries.quest.values()) {
      if (isQuestCompleted(ctx, playerId, quest)) {
        continue;
      }
      const stage = currentQuestStage(ctx, playerId, quest);
      if (!stage || stage.stage === 0) {
        continue;
      }
      if (!areObjectivesComplete(ctx.world, playerId, quest, stage)) {
        continue;
      }
      if (completeStage(ctx, playerId, quest, stage, serverTime, tick)) {
        progressedQuestIds.push(quest.id);
      }
    }
  }

  return { progressedQuestIds };
}

function recordEventProgress(ctx: QuestEngineContext, playerId: EntityId, event: QuestEvent): void {
  for (const quest of ctx.registries.quest.values()) {
    if (isQuestCompleted(ctx, playerId, quest)) {
      continue;
    }
    const stage = currentQuestStage(ctx, playerId, quest);
    if (!stage || stage.stage === 0) {
      continue;
    }

    for (const objective of stage.objectives) {
      switch (event.kind) {
        case "dialogue":
          if (objective.kind === "talk" && objective.npcId === event.npcId) {
            setVar(ctx, playerId, questTalkVarKey(quest, event.npcId), true);
            if (objective.progressVar) {
              setVar(ctx, playerId, objective.progressVar, true);
            }
          }
          break;
        case "npc_killed":
          if (objective.kind === "kill" && objective.npcId === event.npcId) {
            const killCount = incrementVar(ctx, playerId, questKillCountVarKey(quest, event.npcId));
            if (objective.progressVar) {
              setVar(ctx, playerId, objective.progressVar, killCount);
            }
          }
          break;
        case "object_interacted":
          if (
            objective.kind === "object" &&
            objective.objectId === event.objectId &&
            objective.option === event.option &&
            meetsAllRequirements(ctx, playerId, objective.requirements ?? [])
          ) {
            setVar(ctx, playerId, questObjectVarKey(quest, event.objectId, event.option), true);
            if (objective.progressVar) {
              setVar(ctx, playerId, objective.progressVar, true);
            }
          }
          break;
        case "area_entered":
          setVar(ctx, playerId, questAreaVarKey(quest, event.areaId), true);
          break;
        case "item_gained":
        case "item_removed":
          if (
            (objective.kind === "gather" || objective.kind === "have_item") &&
            objective.itemId === event.itemId &&
            objective.progressVar
          ) {
            const inventory = ctx.world.getComponent(playerId, "inventory");
            setVar(
              ctx,
              playerId,
              objective.progressVar,
              inventory ? count(inventory, objective.itemId) : 0,
            );
          }
          break;
        case "skill_xp_gained":
          break;
      }
    }
  }
}

function completeStage(
  ctx: QuestEngineContext,
  playerId: EntityId,
  quest: QuestDef,
  stage: QuestStage,
  serverTime: number,
  tick?: number,
): boolean {
  let nextStage: QuestStage | undefined;
  for (const candidate of quest.stages) {
    if (candidate.stage <= stage.stage) continue;
    if (nextStage === undefined || candidate.stage < nextStage.stage) {
      nextStage = candidate;
    }
  }
  if (!nextStage) {
    const result = completeQuest(ctx, playerId, quest.id, serverTime, tick);
    if (result.applied) {
      runStageTriggers(ctx, playerId, quest, stage, "stage_complete", serverTime, tick);
    }
    return result.applied;
  }
  runStageTriggers(ctx, playerId, quest, stage, "stage_complete", serverTime, tick);
  setQuestStage(ctx, playerId, quest, nextStage.stage);
  runStageTriggers(ctx, playerId, quest, nextStage, "stage_enter", serverTime, tick);
  return true;
}

function runStageTriggers(
  ctx: QuestEngineContext,
  playerId: EntityId,
  quest: QuestDef,
  stage: QuestStage,
  triggerType: "stage_enter" | "stage_complete",
  serverTime: number,
  tick?: number,
): void {
  for (const trigger of stage.triggers) {
    if (trigger.on === triggerType) {
      applyEffects(
        {
          ...ctx,
          itemAuditMetadata: {
            ...(ctx.itemAuditMetadata ?? {}),
            questId: quest.id,
            stage: stage.stage,
            triggerType,
          },
        },
        playerId,
        trigger.effects,
        serverTime,
        tick,
      );
    }
  }
}

function currentQuestStage(
  ctx: Pick<QuestEngineContext, "world">,
  playerId: EntityId,
  quest: QuestDef,
): QuestStage | undefined {
  const stage = getQuestStage(ctx.world, playerId, quest);
  return quest.stages.find((candidate) => candidate.stage === stage);
}

function isQuestCompleted(ctx: QuestEngineContext, playerId: EntityId, quest: QuestDef): boolean {
  return getBooleanVar(ctx.world, playerId, questCompletedVarKey(quest));
}
