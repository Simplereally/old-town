/**
 * Pure content validation and registry building. Takes already-loaded JSON (the fs read
 * happens in the caller — the content-validator CLI or the server boot loader) and:
 *   1. validates each definition against its Zod schema,
 *   2. indexes definitions into per-kind registries, detecting duplicate ids,
 *   3. validates cross-references between registries (drop items, bead costs, NPC drop
 *      tables, quest/dialogue references, map placements, etc.).
 *
 * No filesystem access here, so this module stays usable from any environment.
 */
import type { ZodError } from "zod";
import {
  type AnimationDef,
  type ContentKind,
  contentSchemas,
  type DialogueDef,
  type DropTableDef,
  type ItemDef,
  type MaterialDef,
  type NpcDef,
  type ObjectDef,
  type ProcessingRecipeDef,
  type QuestDef,
  type RegionMapDef,
  type ResourceNodeDef,
  type SkillDef,
  type SpellDef,
} from "../content-schemas";
import { validateContentGraph } from "./content-references";

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
  readonly processingRecipe: ReadonlyMap<string, ProcessingRecipeDef>;
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
  "processingRecipe",
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
  const registries: ContentRegistries = {
    item: maps.get("item") as Map<string, ItemDef>,
    npc: maps.get("npc") as Map<string, NpcDef>,
    object: maps.get("object") as Map<string, ObjectDef>,
    processingRecipe: maps.get("processingRecipe") as Map<string, ProcessingRecipeDef>,
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

  const graphResult = validateContentGraph(registries, sources);
  issues.push(...graphResult.issues);

  return { ok: issues.length === 0, issues, registries };
}
