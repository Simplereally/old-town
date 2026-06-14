/**
 * Content Reference Graph validation.
 *
 * Cross-reference validation is separated from schema validation and registry building
 * so the graph rules can grow independently as content kinds expand. The validator is
 * explicit and typed: no reflection, no magic.
 *
 * `validateContentGraph` receives the already-built registries and source map, and
 * returns issues for every dangling reference, broken dialogue link, or missing material.
 */

import type { Effect, Requirement } from "../content-schemas/common";
import type { ContentKind } from "./content-kind";
import type { ContentRegistries } from "./content-registries";

export interface ContentIssue {
  readonly path?: string | undefined;
  readonly id?: string | undefined;
  readonly pointer?: string | undefined;
  readonly dependency?: readonly string[] | undefined;
  readonly suggestion?: string | undefined;
  readonly message: string;
}

export interface ContentGraphValidationResult {
  readonly issues: ContentIssue[];
}

export function validateContentGraph(
  registries: ContentRegistries,
  sources: ReadonlyMap<string, string>,
): ContentGraphValidationResult {
  const issues: ContentIssue[] = [];

  const has = (kind: ContentKind, id: string): boolean =>
    registries[kind as keyof ContentRegistries].has(id);

  const sourcePath = (kind: ContentKind, id: string): string | undefined =>
    sources.get(`${kind}:${id}`);

  const pointerFromField = (field: string): string =>
    `/${field
      .replaceAll('"', "")
      .replaceAll(" ", "_")
      .split(".")
      .map((part) => part.replaceAll("~", "~0").replaceAll("/", "~1"))
      .join("/")}`;

  const requireRef = (
    refKind: ContentKind,
    refId: string,
    ownerKind: ContentKind,
    ownerId: string,
    field: string,
  ): void => {
    if (!has(refKind, refId)) {
      issues.push({
        path: sourcePath(ownerKind, ownerId),
        id: ownerId,
        pointer: pointerFromField(field),
        dependency: [`${ownerKind}:${ownerId}`, `${refKind}:${refId}`],
        suggestion: "create_or_fix_missing_reference",
        message: `${ownerKind} "${ownerId}" references missing ${refKind} "${refId}" (${field})`,
      });
    }
  };

  const checkEffects = (
    effects: readonly Effect[],
    ownerKind: ContentKind,
    ownerId: string,
    field: string,
  ): void => {
    for (const effect of effects) {
      switch (effect.kind) {
        case "add_item":
        case "remove_item":
          requireRef("item", effect.itemId, ownerKind, ownerId, `${field}.itemId`);
          break;
        case "add_xp":
          requireRef("skill", effect.skillId, ownerKind, ownerId, `${field}.skillId`);
          break;
        case "start_quest":
        case "complete_quest":
          requireRef("quest", effect.questId, ownerKind, ownerId, `${field}.questId`);
          break;
        default:
          break;
      }
    }
  };

  const checkRequirements = (
    requirements: readonly Requirement[],
    ownerKind: ContentKind,
    ownerId: string,
    field: string,
  ): void => {
    for (const req of requirements) {
      if (req.kind === "skill") {
        requireRef("skill", req.skillId, ownerKind, ownerId, `${field}.skillId`);
      } else if (req.kind === "item") {
        requireRef("item", req.itemId, ownerKind, ownerId, `${field}.itemId`);
      } else if (req.kind === "quest_stage") {
        requireRef("quest", req.questId, ownerKind, ownerId, `${field}.questId`);
      } else if (req.kind === "kill_count") {
        requireRef("quest", req.questId, ownerKind, ownerId, `${field}.questId`);
        requireRef("npc", req.npcId, ownerKind, ownerId, `${field}.npcId`);
      }
    }
  };

  for (const [id, def] of registries.resourceNode) {
    requireRef("item", def.outputItemId, "resourceNode", id, "outputItemId");
    requireRef("skill", def.skill, "resourceNode", id, "skill");
  }

  for (const [id, def] of registries.spell) {
    for (const cost of def.beadCosts) {
      requireRef("item", cost.itemId, "spell", id, "beadCosts.itemId");
    }
    if (def.effect.kind === "alchemy") {
      requireRef("item", def.effect.coinItemId, "spell", id, "effect.coinItemId");
    } else if (def.effect.kind === "enchant") {
      requireRef("item", def.effect.fromItemId, "spell", id, "effect.fromItemId");
      requireRef("item", def.effect.toItemId, "spell", id, "effect.toItemId");
    }
  }

  for (const [id, def] of registries.npc) {
    if (def.drops !== undefined) {
      requireRef("dropTable", def.drops, "npc", id, "drops");
    }
    if (def.dialogueId !== undefined) {
      requireRef("dialogue", def.dialogueId, "npc", id, "dialogueId");
    }
    if (def.trophyId !== undefined) {
      requireRef("item", def.trophyId, "npc", id, "trophyId");
    }
  }

  for (const [id, def] of registries.object) {
    if (def.resourceNodeId !== undefined) {
      requireRef("resourceNode", def.resourceNodeId, "object", id, "resourceNodeId");
    }
    if (def.dialogueId !== undefined) {
      requireRef("dialogue", def.dialogueId, "object", id, "dialogueId");
    }
  }

  for (const [id, def] of registries.processingRecipe) {
    requireRef("skill", def.skill, "processingRecipe", id, "skill");
    requireRef("item", def.inputItemId, "processingRecipe", id, "inputItemId");
    requireRef("item", def.successItemId, "processingRecipe", id, "successItemId");
    if (def.failureItemId !== undefined) {
      requireRef("item", def.failureItemId, "processingRecipe", id, "failureItemId");
    }
    for (const objectId of def.stationObjectIds) {
      requireRef("object", objectId, "processingRecipe", id, "stationObjectIds");
    }
    // recipeGroupId is a soft grouping identifier, not a cross-reference to a content definition
    // skip cross-reference validation for recipeGroupId
  }

  for (const [id, def] of registries.dropTable) {
    for (const entry of def.entries) {
      requireRef("item", entry.itemId, "dropTable", id, "entries.itemId");
      checkRequirements(entry.requirements, "dropTable", id, "entries.requirements");
    }
    for (const always of def.alwaysDrops) {
      requireRef("item", always.itemId, "dropTable", id, "alwaysDrops.itemId");
    }
  }

  for (const [id, def] of registries.quest) {
    checkRequirements(def.requirements, "quest", id, "requirements");
    checkEffects(def.rewards, "quest", id, "rewards");
    for (const stage of def.stages) {
      for (const objective of stage.objectives) {
        switch (objective.kind) {
          case "talk":
          case "kill":
            requireRef("npc", objective.npcId, "quest", id, `stage ${stage.stage}.objective.npcId`);
            break;
          case "gather":
          case "have_item":
            requireRef(
              "item",
              objective.itemId,
              "quest",
              id,
              `stage ${stage.stage}.objective.itemId`,
            );
            break;
          case "object":
            requireRef(
              "object",
              objective.objectId,
              "quest",
              id,
              `stage ${stage.stage}.objective.objectId`,
            );
            break;
          default:
            break;
        }
      }
      for (const trigger of stage.triggers) {
        checkEffects(trigger.effects, "quest", id, `stage ${stage.stage}.trigger`);
      }
    }
  }

  for (const [id, def] of registries.dialogue) {
    const nodeIds = new Set(def.nodes.map((node) => node.id));
    for (const node of def.nodes) {
      for (const option of node.playerOptions ?? []) {
        if (!nodeIds.has(option.next)) {
          issues.push({
            path: sourcePath("dialogue", id),
            id,
            pointer: `/nodes/${node.id}/playerOptions/next`,
            dependency: [`dialogue:${id}`, `dialogue-node:${option.next}`],
            suggestion: "fix_dialogue_next_node",
            message: `dialogue "${id}" option in node "${node.id}" links to missing node "${option.next}"`,
          });
        }
        checkRequirements(option.requirements, "dialogue", id, `node ${node.id}.option`);
        checkEffects(option.effects, "dialogue", id, `node ${node.id}.option`);
      }
      checkRequirements(node.requirements ?? [], "dialogue", id, `node ${node.id}`);
      checkEffects(node.effects, "dialogue", id, `node ${node.id}`);
    }
  }

  for (const [id, def] of registries.regionMap) {
    requireRef(
      "material",
      def.tiles.default.underlayId,
      "regionMap",
      id,
      "tiles.default.underlayId",
    );
    for (const override of def.tiles.overrides) {
      if (override.underlayId !== undefined) {
        requireRef("material", override.underlayId, "regionMap", id, "tile override.underlayId");
      }
      if (override.overlayId !== undefined) {
        requireRef("material", override.overlayId, "regionMap", id, "tile override.overlayId");
      }
    }
    for (const placed of def.objects) {
      requireRef("object", placed.objectId, "regionMap", id, "objects.objectId");
    }
    for (const spawn of def.npcSpawns) {
      requireRef("npc", spawn.npcId, "regionMap", id, "npcSpawns.npcId");
    }
    for (const spawn of def.groundItemSpawns) {
      requireRef("item", spawn.itemId, "regionMap", id, "groundItemSpawns.itemId");
    }
    for (const spawn of def.resourceNodeSpawns) {
      requireRef(
        "resourceNode",
        spawn.resourceNodeId,
        "regionMap",
        id,
        "resourceNodeSpawns.resourceNodeId",
      );
    }
    for (const spawn of def.playerSpawnPoints) {
      if (spawn.requiresQuest !== undefined) {
        requireRef(
          "quest",
          spawn.requiresQuest,
          "regionMap",
          id,
          "playerSpawnPoints.requiresQuest",
        );
      }
    }
    for (const spawn of def.deathRespawnPoints) {
      if (spawn.requiresQuest !== undefined) {
        requireRef(
          "quest",
          spawn.requiresQuest,
          "regionMap",
          id,
          "deathRespawnPoints.requiresQuest",
        );
      }
    }
  }

  for (const [id, def] of registries.shop) {
    for (const stock of def.stock) {
      requireRef("item", stock.itemId, "shop", id, "stock.itemId");
    }
  }

  for (const [id, def] of registries.serviceFee) {
    for (const cost of def.materialCost) {
      requireRef("item", cost.itemId, "serviceFee", id, "materialCost.itemId");
    }
    if (def.requiresQuest !== undefined) {
      requireRef("quest", def.requiresQuest, "serviceFee", id, "requiresQuest");
    }
  }

  for (const [id, def] of registries.statusEffect) {
    for (const cureItem of def.cureItems) {
      requireRef("item", cureItem, "statusEffect", id, "cureItems");
    }
  }

  for (const [id, def] of registries.item) {
    if (def.consumable?.statusEffectId !== undefined) {
      requireRef(
        "statusEffect",
        def.consumable.statusEffectId,
        "item",
        id,
        "consumable.statusEffectId",
      );
    }
    if (def.consumable?.curesStatus !== undefined) {
      requireRef("statusEffect", def.consumable.curesStatus, "item", id, "consumable.curesStatus");
    }
    if (def.consumable?.boostsSkill !== undefined) {
      requireRef(
        "skill",
        def.consumable.boostsSkill.skillId,
        "item",
        id,
        "consumable.boostsSkill.skillId",
      );
    }
  }

  for (const [id, def] of registries.contract) {
    for (const creatureId of def.targetCreatureIds) {
      requireRef("npc", creatureId, "contract", id, "targetCreatureIds");
    }
    for (const reward of def.rewardItems) {
      requireRef("item", reward.itemId, "contract", id, "rewardItems.itemId");
    }
    for (const xp of def.rewardXp) {
      requireRef("skill", xp.skillId, "contract", id, "rewardXp.skillId");
    }
    if (def.requiredQuest !== undefined) {
      requireRef("quest", def.requiredQuest, "contract", id, "requiredQuest");
    }
    // rewardReputation.factionId intentionally not validated here — factions are not a registered ContentKind
  }

  for (const [id, def] of registries.activity) {
    requireRef("skill", def.entryRequirement.skillId, "activity", id, "entryRequirement.skillId");
    for (const skillId of def.skills) {
      requireRef("skill", skillId, "activity", id, "skills");
    }
    for (const step of def.steps) {
      if (step.skillId !== undefined) {
        requireRef("skill", step.skillId, "activity", id, `steps.${step.id}.skillId`);
      }
      for (const xp of step.xpReward) {
        requireRef("skill", xp.skillId, "activity", id, `steps.${step.id}.xpReward.skillId`);
      }
      for (const input of step.inputs) {
        requireRef("item", input.itemId, "activity", id, `steps.${step.id}.inputs.itemId`);
      }
      for (const output of step.outputs) {
        requireRef("item", output.itemId, "activity", id, `steps.${step.id}.outputs.itemId`);
      }
    }
    for (const reward of def.rewards) {
      if (reward.skillId !== undefined) {
        requireRef("skill", reward.skillId, "activity", id, "rewards.skillId");
      }
      if (reward.itemId !== undefined) {
        requireRef("item", reward.itemId, "activity", id, "rewards.itemId");
      }
      if (reward.tokenId !== undefined) {
        requireRef("item", reward.tokenId, "activity", id, "rewards.tokenId");
      }
    }
    if (def.tokenId !== undefined) {
      requireRef("item", def.tokenId, "activity", id, "tokenId");
    }
    for (const sink of def.tokenSink) {
      requireRef("item", sink.itemId, "activity", id, "tokenSink.itemId");
    }
    for (const input of def.inputs) {
      requireRef("item", input.itemId, "activity", id, "inputs.itemId");
    }
    for (const output of def.outputs) {
      requireRef("item", output.itemId, "activity", id, "outputs.itemId");
    }
  }

  for (const [id, def] of registries.boss) {
    requireRef("npc", def.npcId, "boss", id, "npcId");
    requireRef("dropTable", def.dropTableId, "boss", id, "dropTableId");
    if (def.trophyId !== undefined) {
      requireRef("item", def.trophyId, "boss", id, "trophyId");
    }
    for (const uniqueDropId of def.uniqueDropIds) {
      requireRef("item", uniqueDropId, "boss", id, "uniqueDropIds");
    }
    checkRequirements(def.accessRequirements, "boss", id, "accessRequirements");
  }

  for (const [id, def] of registries.trail) {
    requireRef("statusEffect", def.buff, "trail", id, "buff");
  }

  return { issues };
}
