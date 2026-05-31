/**
 * Content schema package. One validation entry point ({@link contentSchemas}) maps each
 * content kind to its Zod schema; the loader/validator (E02-S02) picks a schema by the
 * file's directory. All inferred TypeScript types are exported alongside the schemas.
 */

export * from "./animation";
export * from "./common";
export * from "./dialogue";
export * from "./drop-table";
export * from "./item";
export * from "./material";
export * from "./npc";
export * from "./object";
export * from "./processing-recipe";
export * from "./quest";
export * from "./region-map";
export * from "./resource-node";
export * from "./skill";
export * from "./spell";

import type { z } from "zod";
import { animationDefSchema } from "./animation";
import { dialogueDefSchema } from "./dialogue";
import { dropTableDefSchema } from "./drop-table";
import { itemDefSchema } from "./item";
import { materialDefSchema } from "./material";
import { npcDefSchema } from "./npc";
import { objectDefSchema } from "./object";
import { processingRecipeDefSchema } from "./processing-recipe";
import { questDefSchema } from "./quest";
import { regionMapDefSchema } from "./region-map";
import { resourceNodeDefSchema } from "./resource-node";
import { skillDefSchema } from "./skill";
import { spellDefSchema } from "./spell";

/**
 * The single content-schema entry point: every content definition kind mapped to the
 * schema that validates it.
 */
export const contentSchemas = {
  item: itemDefSchema,
  npc: npcDefSchema,
  object: objectDefSchema,
  processingRecipe: processingRecipeDefSchema,
  skill: skillDefSchema,
  resourceNode: resourceNodeDefSchema,
  spell: spellDefSchema,
  dropTable: dropTableDefSchema,
  quest: questDefSchema,
  dialogue: dialogueDefSchema,
  regionMap: regionMapDefSchema,
  material: materialDefSchema,
  animation: animationDefSchema,
} as const;

/** Discriminator for a content definition kind. */
export type ContentKind = keyof typeof contentSchemas;

/** The schema object type for a given kind. */
export type ContentSchema<K extends ContentKind> = (typeof contentSchemas)[K];

/** The validated/inferred definition type for a given kind. */
export type ContentDef<K extends ContentKind> = z.infer<ContentSchema<K>>;
