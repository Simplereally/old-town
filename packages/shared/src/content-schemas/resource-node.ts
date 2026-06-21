/** Resource (gathering) node definitions (POC_SPEC §15.4, §15.5). */
import { z } from "zod";
import { contentIdSchema, positiveInt } from "./common";

export const resourceNodeDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    /** Skill exercised (content id, e.g. "woodcutting", "mining"). */
    skill: contentIdSchema,
    requiredLevel: positiveInt,
    baseXp: z.number().nonnegative(),
    actionTicks: positiveInt,
    /** Chance per successful action that the node depletes (0..1). */
    depletionChance: z.number().min(0).max(1),
    respawnTicks: positiveInt,
    /** Tool tags that satisfy this node (e.g. ["axe"], ["pickaxe"]). */
    toolTags: z.array(z.string().min(1)).min(1),
    outputItemId: contentIdSchema,
    // Success-formula tuning (POC_SPEC §15.5); sensible defaults if omitted.
    baseChance: z.number().min(0).max(1).default(0.2),
    levelScale: z.number().min(0).default(0.005),
    /** How many output items per success (default 1). */
    outputQuantity: positiveInt.default(1),
    /** Presentational transform sent while this runtime node is depleted. */
    depletedTransformId: contentIdSchema.optional(),
    /** Runtime collision state while depleted. Defaults to non-blocking stumps/empty veins. */
    depletedBlocksMovement: z.boolean().optional(),
    depletedBlocksLineOfSight: z.boolean().optional(),
  })
  .strict()
  .refine((n) => n.requiredLevel >= 1, { message: "requiredLevel must be >= 1" });

export type ResourceNodeDef = z.infer<typeof resourceNodeDefSchema>;
