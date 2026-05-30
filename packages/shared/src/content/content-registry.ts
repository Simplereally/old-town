/**
 * Pure content validation and registry building. Takes already-loaded JSON (the fs read
 * happens in the caller — the content-validator CLI or the server boot loader) and:
 *   1. validates each definition against its Zod schema,
 *   2. indexes definitions into per-kind registries, detecting duplicate ids,
 *   3. validates cross-references between registries (drop items, rune costs, NPC drop
 *      tables, quest/dialogue references, map placements, etc.).
 *
 * No filesystem access here, so this module stays usable from any environment.
 */
import type { ZodError } from "zod";
import {
  type AnimationDef,
  type ContentKind,
  type DialogueDef,
  type DropTableDef,
  type Effect,
  type ItemDef,
  type MaterialDef,
  type NpcDef,
  type ObjectDef,
  type QuestDef,
  type RegionMapDef,
  type Requirement,
  type ResourceNodeDef,
  type SkillDef,
  type SpellDef,
  contentSchemas,
} from "../content-schemas";

/** A single content file's parsed JSON, tagged with the kind its directory implies. */
export interface LoadedContentFile {
  readonly path: string;
  readonly kind: ContentKind;
  readonly data: unknown;
}

/** A validation problem, with file path and id context where available. */
export interface ContentIssue {
  readonly path?: string | undefined;
  readonly id?: string | undefined;
  readonly message: string;
}

/** Typed per-kind registries keyed by content id (region maps keyed by `rx:ry:plane`). */
export interface ContentRegistries {
  readonly item: ReadonlyMap<string, ItemDef>;
  readonly npc: ReadonlyMap<string, NpcDef>;
  readonly object: ReadonlyMap<string, ObjectDef>;
  readonly skill: ReadonlyMap<string, SkillDef>;
  readonly resourceNode: ReadonlyMap<string, ResourceNodeDef>;
  readonly spell: ReadonlyMap<string, SpellDef>;
  readonly dropTable: ReadonlyMap<string, DropTableDef>;
  readonly quest: ReadonlyMap<string, QuestDef>;
  readonly dialogue: ReadonlyMap<string, DialogueDef>;
  readonly regionMap: ReadonlyMap<string, RegionMapDef>;
  readonly material: ReadonlyMap<string, MaterialDef>;
  readonly animation: ReadonlyMap<string, AnimationDef>;
}

export interface ContentValidationResult {
  readonly ok: boolean;
  readonly issues: ContentIssue[];
  readonly registries: ContentRegistries;
}

const CONTENT_KINDS: readonly ContentKind[] = [
  "item",
  "npc",
  "object",
  "skill",
  "resourceNode",
  "spell",
  "dropTable",
  "quest",
  "dialogue",
  "regionMap",
  "material",
  "animation",
];

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${where}${issue.message}`;
    })
    .join("; ");
}

function idOfDef(kind: ContentKind, def: unknown): string {
  if (kind === "regionMap") {
    const region = (def as RegionMapDef).region;
    return `${region.rx}:${region.ry}:${region.plane}`;
  }
  return (def as { id: string }).id;
}

/** Validate loaded content and build registries. */
export function validateContent(files: readonly LoadedContentFile[]): ContentValidationResult {
  const issues: ContentIssue[] = [];
  const maps = new Map<ContentKind, Map<string, unknown>>();
  const sources = new Map<string, string>(); // `${kind}:${id}` -> file path
  for (const kind of CONTENT_KINDS) {
    maps.set(kind, new Map());
  }

  // --- Schema validation + indexing -------------------------------------------------
  for (const file of files) {
    const schema = contentSchemas[file.kind];
    const registry = maps.get(file.kind);
    if (!registry) {
      continue;
    }
    const entries = Array.isArray(file.data) ? file.data : [file.data];
    for (const entry of entries) {
      const result = schema.safeParse(entry);
      if (!result.success) {
        issues.push({ path: file.path, message: formatZodError(result.error) });
        continue;
      }
      const def = result.data;
      const id = idOfDef(file.kind, def);
      const key = `${file.kind}:${id}`;
      if (registry.has(id)) {
        issues.push({
          path: file.path,
          id,
          message: `duplicate ${file.kind} id "${id}" (already defined in ${sources.get(key)})`,
        });
        continue;
      }
      registry.set(id, def);
      sources.set(key, file.path);
    }
  }

  // --- Cross-reference validation ---------------------------------------------------
  const has = (kind: ContentKind, id: string): boolean => maps.get(kind)?.has(id) ?? false;

  const requireRef = (
    refKind: ContentKind,
    refId: string,
    ownerKind: ContentKind,
    ownerId: string,
    field: string,
  ): void => {
    if (!has(refKind, refId)) {
      issues.push({
        path: sources.get(`${ownerKind}:${ownerId}`),
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

  for (const [id, def] of maps.get("resourceNode") as Map<string, ResourceNodeDef>) {
    requireRef("item", def.outputItemId, "resourceNode", id, "outputItemId");
    requireRef("skill", def.skill, "resourceNode", id, "skill");
  }

  for (const [id, def] of maps.get("spell") as Map<string, SpellDef>) {
    for (const cost of def.runeCosts) {
      requireRef("item", cost.itemId, "spell", id, "runeCosts.itemId");
    }
    if (def.effect.kind === "alchemy") {
      requireRef("item", def.effect.coinItemId, "spell", id, "effect.coinItemId");
    } else if (def.effect.kind === "enchant") {
      requireRef("item", def.effect.fromItemId, "spell", id, "effect.fromItemId");
      requireRef("item", def.effect.toItemId, "spell", id, "effect.toItemId");
    }
  }

  for (const [id, def] of maps.get("npc") as Map<string, NpcDef>) {
    if (def.drops !== undefined) {
      requireRef("dropTable", def.drops, "npc", id, "drops");
    }
    if (def.dialogueId !== undefined) {
      requireRef("dialogue", def.dialogueId, "npc", id, "dialogueId");
    }
  }

  for (const [id, def] of maps.get("object") as Map<string, ObjectDef>) {
    if (def.resourceNodeId !== undefined) {
      requireRef("resourceNode", def.resourceNodeId, "object", id, "resourceNodeId");
    }
    if (def.dialogueId !== undefined) {
      requireRef("dialogue", def.dialogueId, "object", id, "dialogueId");
    }
  }

  for (const [id, def] of maps.get("dropTable") as Map<string, DropTableDef>) {
    for (const entry of def.entries) {
      requireRef("item", entry.itemId, "dropTable", id, "entries.itemId");
    }
    for (const always of def.alwaysDrops) {
      requireRef("item", always.itemId, "dropTable", id, "alwaysDrops.itemId");
    }
  }

  for (const [id, def] of maps.get("quest") as Map<string, QuestDef>) {
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

  for (const [id, def] of maps.get("dialogue") as Map<string, DialogueDef>) {
    const nodeIds = new Set(def.nodes.map((node) => node.id));
    for (const node of def.nodes) {
      for (const option of node.playerOptions ?? []) {
        if (!nodeIds.has(option.next)) {
          issues.push({
            path: sources.get(`dialogue:${id}`),
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

  for (const [id, def] of maps.get("regionMap") as Map<string, RegionMapDef>) {
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

  const registries: ContentRegistries = {
    item: maps.get("item") as Map<string, ItemDef>,
    npc: maps.get("npc") as Map<string, NpcDef>,
    object: maps.get("object") as Map<string, ObjectDef>,
    skill: maps.get("skill") as Map<string, SkillDef>,
    resourceNode: maps.get("resourceNode") as Map<string, ResourceNodeDef>,
    spell: maps.get("spell") as Map<string, SpellDef>,
    dropTable: maps.get("dropTable") as Map<string, DropTableDef>,
    quest: maps.get("quest") as Map<string, QuestDef>,
    dialogue: maps.get("dialogue") as Map<string, DialogueDef>,
    regionMap: maps.get("regionMap") as Map<string, RegionMapDef>,
    material: maps.get("material") as Map<string, MaterialDef>,
    animation: maps.get("animation") as Map<string, AnimationDef>,
  };

  return { ok: issues.length === 0, issues, registries };
}
