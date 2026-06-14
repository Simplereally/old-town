/**
 * Maps the top-level content directory name to the content kind it holds. Shared so the
 * server boot loader and the content-validator CLI agree on the on-disk layout
 * (POC_SPEC §19.1).
 */
import type { ContentKind } from "../content-schemas";

export const CONTENT_DIR_KINDS: Readonly<Record<string, ContentKind>> = {
  items: "item",
  npcs: "npc",
  objects: "object",
  "processing-recipes": "processingRecipe",
  skills: "skill",
  "resource-nodes": "resourceNode",
  spells: "spell",
  quests: "quest",
  dialogue: "dialogue",
  drops: "dropTable",
  maps: "regionMap",
  materials: "material",
  animations: "animation",
  shops: "shop",
  banks: "bank",
  "service-fees": "serviceFee",
  "status-effects": "statusEffect",
  contracts: "contract",
  activities: "activity",
  bosses: "boss",
  trails: "trail",
  charters: "charter",
  properties: "property",
};

/** Resolve the content kind for a top-level content directory name, if known. */
export function kindForContentDir(dir: string): ContentKind | undefined {
  return CONTENT_DIR_KINDS[dir];
}
