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
import type { ContentKind } from "../content/content-kind";
import type { ActivityDef } from "../content-schemas/activity";
import type { AnimationDef } from "../content-schemas/animation";
import type { BankDef } from "../content-schemas/bank";
import type { BossDef } from "../content-schemas/boss";
import type { CharterDef } from "../content-schemas/charter";
import type { ContractDef } from "../content-schemas/contract";
import type { DialogueDef } from "../content-schemas/dialogue";
import type { DropTableDef } from "../content-schemas/drop-table";
import type { ItemDef } from "../content-schemas/item";
import type { MaterialDef } from "../content-schemas/material";
import type { NpcDef } from "../content-schemas/npc";
import type { ObjectDef } from "../content-schemas/object";
import type { PrayerDef } from "../content-schemas/prayer";
import type { ProcessingRecipeDef } from "../content-schemas/processing-recipe";
import type { PropertyDef } from "../content-schemas/property";
import type { QuestDef } from "../content-schemas/quest";
import type { RegionMapDef } from "../content-schemas/region-map";
import type { ResourceNodeDef } from "../content-schemas/resource-node";
import { contentSchemas } from "../content-schemas/schemas";
import type { ServiceFeeDef } from "../content-schemas/service-fee";
import type { ShopDef } from "../content-schemas/shop";
import type { SkillDef } from "../content-schemas/skill";
import type { SpellDef } from "../content-schemas/spell";
import type { StatusEffectDef } from "../content-schemas/status-effect";
import type { TrailDef } from "../content-schemas/trail";
import { validateContentGraph } from "./content-references";
import type { ContentRegistries } from "./content-registries";

export type { ContentRegistries } from "./content-registries";

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
  readonly pointer?: string | undefined;
  readonly dependency?: readonly string[] | undefined;
  readonly suggestion?: string | undefined;
  readonly message: string;
}

export interface ContentValidationResult {
  readonly ok: boolean;
  readonly issues: ContentIssue[];
  readonly registries: ContentRegistries;
  readonly sources: ReadonlyMap<string, string>;
}

const CONTENT_KINDS: readonly ContentKind[] = [
  "item",
  "npc",
  "object",
  "prayer",
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
  "shop",
  "bank",
  "serviceFee",
  "statusEffect",
  "contract",
  "property",
  "charter",
  "activity",
  "boss",
  "trail",
];

function jsonPointer(path: readonly (string | number)[]): string {
  if (path.length === 0) {
    return "/";
  }
  return `/${path.map((segment) => String(segment).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
}

function rawIdOfDef(kind: ContentKind, def: unknown): string | undefined {
  if (kind === "regionMap") {
    const region = (def as Partial<RegionMapDef>).region;
    if (
      region &&
      typeof region.rx === "number" &&
      typeof region.ry === "number" &&
      typeof region.plane === "number"
    ) {
      return `${region.rx}:${region.ry}:${region.plane}`;
    }
    return undefined;
  }
  const id = (def as { readonly id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
}

function schemaIssues(error: ZodError, file: LoadedContentFile, entry: unknown): ContentIssue[] {
  return error.issues.map((issue) => ({
    path: file.path,
    id: rawIdOfDef(file.kind, entry),
    pointer: jsonPointer(issue.path),
    dependency: [file.kind],
    suggestion: "fix_schema",
    message: issue.message,
  }));
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
        issues.push(...schemaIssues(result.error, file, entry));
        continue;
      }
      const def = result.data;
      const id = idOfDef(file.kind, def);
      const key = `${file.kind}:${id}`;
      if (registry.has(id)) {
        issues.push({
          path: file.path,
          id,
          pointer: "/id",
          dependency: [`${file.kind}:${id}`, sources.get(key) ?? "(unknown source)"],
          suggestion: "rename_or_remove_duplicate_id",
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
    prayer: maps.get("prayer") as Map<string, PrayerDef>,
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
    shop: maps.get("shop") as Map<string, ShopDef>,
    bank: maps.get("bank") as Map<string, BankDef>,
    serviceFee: maps.get("serviceFee") as Map<string, ServiceFeeDef>,
    statusEffect: maps.get("statusEffect") as Map<string, StatusEffectDef>,
    contract: maps.get("contract") as Map<string, ContractDef>,
    property: maps.get("property") as Map<string, PropertyDef>,
    charter: maps.get("charter") as Map<string, CharterDef>,
    activity: maps.get("activity") as Map<string, ActivityDef>,
    boss: maps.get("boss") as Map<string, BossDef>,
    trail: maps.get("trail") as Map<string, TrailDef>,
  };

  const graphResult = validateContentGraph(registries, sources);
  issues.push(...graphResult.issues);

  return { ok: issues.length === 0, issues, registries, sources };
}
