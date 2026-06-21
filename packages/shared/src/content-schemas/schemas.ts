import type { z } from "zod";
import type { ContentKind } from "../content/content-kind";
import { activityDefSchema } from "./activity";
import { animationDefSchema } from "./animation";
import { bankDefSchema } from "./bank";
import { bossDefSchema } from "./boss";
import { charterDefSchema } from "./charter";
import { contractDefSchema } from "./contract";
import { dialogueDefSchema } from "./dialogue";
import { dropTableDefSchema } from "./drop-table";
import { itemDefSchema } from "./item";
import { materialDefSchema } from "./material";
import { npcDefSchema } from "./npc";
import { objectDefSchema } from "./object";
import { prayerDefSchema } from "./prayer";
import { processingRecipeDefSchema } from "./processing-recipe";
import { propertyDefSchema } from "./property";
import { questDefSchema } from "./quest";
import { regionMapDefSchema } from "./region-map";
import { resourceNodeDefSchema } from "./resource-node";
import { serviceFeeDefSchema } from "./service-fee";
import { shopDefSchema } from "./shop";
import { skillDefSchema } from "./skill";
import { spellDefSchema } from "./spell";
import { statusEffectDefSchema } from "./status-effect";
import { trailDefSchema } from "./trail";

/**
 * The single content-schema entry point: every content definition kind mapped to the
 * schema that validates it.
 */
export const contentSchemas = {
  item: itemDefSchema,
  npc: npcDefSchema,
  object: objectDefSchema,
  prayer: prayerDefSchema,
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
  shop: shopDefSchema,
  bank: bankDefSchema,
  serviceFee: serviceFeeDefSchema,
  statusEffect: statusEffectDefSchema,
  contract: contractDefSchema,
  property: propertyDefSchema,
  charter: charterDefSchema,
  activity: activityDefSchema,
  boss: bossDefSchema,
  trail: trailDefSchema,
} as const satisfies Record<ContentKind, z.ZodTypeAny>;

/** The schema object type for a given kind. */
export type ContentSchema<K extends ContentKind> = (typeof contentSchemas)[K];

/** The validated/inferred definition type for a given kind. */
export type ContentDef<K extends ContentKind> = z.infer<ContentSchema<K>>;
