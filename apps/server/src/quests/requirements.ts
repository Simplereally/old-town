import type { ContentRegistries, EntityId, Requirement } from "@old-town/shared";
import type { World } from "../ecs/world";
import { hasItem } from "../items/inventory";
import { getCurrentLevel } from "../skills/skill-state";
import {
  compareVarRequirement,
  getNumberVar,
  meetsQuestStageRequirement,
  questKillCountVarKey,
} from "../vars/player-vars";

export interface RequirementContext {
  readonly world: World;
  readonly registries: ContentRegistries;
}

export function meetsRequirement(
  ctx: RequirementContext,
  entityId: EntityId,
  requirement: Requirement,
): boolean {
  switch (requirement.kind) {
    case "skill": {
      const skills = ctx.world.getComponent(entityId, "skills");
      return skills ? getCurrentLevel(skills, requirement.skillId) >= requirement.level : false;
    }
    case "item": {
      const inventory = ctx.world.getComponent(entityId, "inventory");
      return inventory ? hasItem(inventory, requirement.itemId, requirement.quantity) : false;
    }
    case "quest_stage":
      return meetsQuestStageRequirement(ctx.world, entityId, requirement, ctx.registries.quest);
    case "kill_count": {
      const quest = ctx.registries.quest.get(requirement.questId) ?? requirement.questId;
      return (
        getNumberVar(ctx.world, entityId, questKillCountVarKey(quest, requirement.npcId)) >=
        requirement.count
      );
    }
    case "var":
      return compareVarRequirement(ctx.world, entityId, requirement);
  }
}

export function meetsAllRequirements(
  ctx: RequirementContext,
  entityId: EntityId,
  requirements: readonly Requirement[],
): boolean {
  return requirements.every((requirement) => meetsRequirement(ctx, entityId, requirement));
}
