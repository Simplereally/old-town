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
import type { ContentKind, Effect, Requirement } from "../content-schemas";
import type { ContentRegistries } from "./content-registry";

export interface ContentIssue {
  readonly path?: string | undefined;
  readonly id?: string | undefined;
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
        message: `${ownerKind} "${ownerId}" references missing ${refKind} "${refId}" (${field})`,
      });
    }
  };

  const checkEffects = (effects: readonly Effect[], ownerId: string, field: string): void => {
    for (const effect of effects) {
      switch (effect.kind) {
        case "add_item":
        case "remove_item":
          requireRef("item", effect.itemId, "quest", ownerId, `${field}.itemId`);
          break;
        case "add_xp":
          requireRef("skill", effect.skillId, "quest", ownerId, `${field}.skillId`);
          break;
        case "start_quest":
        case "complete_quest":
          requireRef("quest", effect.questId, "quest", ownerId, `${field}.questId`);
          break;
        default:
          break;
      }
    }
  };

  const checkRequirements = (
    requirements: readonly Requirement[],
    ownerId: string,
    field: string,
  ): void => {
    for (const req of requirements) {
      if (req.kind === "skill") {
        requireRef("skill", req.skillId, "quest", ownerId, `${field}.skillId`);
      } else if (req.kind === "item") {
        requireRef("item", req.itemId, "quest", ownerId, `${field}.itemId`);
      } else if (req.kind === "quest_stage") {
        requireRef("quest", req.questId, "quest", ownerId, `${field}.questId`);
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
  }

  for (const [id, def] of registries.dropTable) {
    for (const entry of def.entries) {
      requireRef("item", entry.itemId, "dropTable", id, "entries.itemId");
    }
    for (const always of def.alwaysDrops) {
      requireRef("item", always.itemId, "dropTable", id, "alwaysDrops.itemId");
    }
  }

  for (const [id, def] of registries.quest) {
    checkRequirements(def.requirements, id, "requirements");
    checkEffects(def.rewards, id, "rewards");
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
        checkEffects(trigger.effects, id, `stage ${stage.stage}.trigger`);
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
            message: `dialogue "${id}" option in node "${node.id}" links to missing node "${option.next}"`,
          });
        }
        checkRequirements(option.requirements, id, `node ${node.id}.option`);
        checkEffects(option.effects, id, `node ${node.id}.option`);
      }
      checkEffects(node.effects, id, `node ${node.id}`);
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
  }

  return { issues };
}
