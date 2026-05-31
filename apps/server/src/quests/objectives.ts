import type { EntityId, Objective, QuestDef, QuestStage } from "@old-town/shared";
import type { World } from "../ecs/world";
import { hasItem } from "../items/inventory";
import {
  getBooleanVar,
  getNumberVar,
  questKillCountVarKey,
  questObjectVarKey,
  questTalkVarKey,
} from "../vars/player-vars";

export function areObjectivesComplete(
  world: World,
  playerId: EntityId,
  quest: QuestDef,
  stage: QuestStage,
): boolean {
  return stage.objectives.every((objective) =>
    isObjectiveComplete(world, playerId, quest, objective),
  );
}

export function isObjectiveComplete(
  world: World,
  playerId: EntityId,
  quest: QuestDef,
  objective: Objective,
): boolean {
  switch (objective.kind) {
    case "talk":
      return getBooleanVar(world, playerId, questTalkVarKey(quest, objective.npcId));
    case "gather":
    case "have_item": {
      const inventory = world.getComponent(playerId, "inventory");
      return inventory ? hasItem(inventory, objective.itemId, objective.quantity) : false;
    }
    case "kill":
      return (
        getNumberVar(world, playerId, questKillCountVarKey(quest, objective.npcId)) >=
        objective.count
      );
    case "object":
      return getBooleanVar(
        world,
        playerId,
        questObjectVarKey(quest, objective.objectId, objective.option),
      );
  }
}
