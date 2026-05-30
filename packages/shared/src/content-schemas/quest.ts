/** Quest definitions (POC_SPEC §18.3, §18.5). Quests are data: requirements, vars,
 *  stages, objectives, triggers, and rewards — never hardcoded classes. */
import { z } from "zod";
import { contentIdSchema, effectSchema, nonNegInt, positiveInt, requirementSchema } from "./common";

/** A measurable goal within a quest stage. */
export const objectiveSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("talk"), npcId: contentIdSchema }).strict(),
  z.object({ kind: z.literal("gather"), itemId: contentIdSchema, quantity: positiveInt }).strict(),
  z.object({ kind: z.literal("kill"), npcId: contentIdSchema, count: positiveInt }).strict(),
  z
    .object({ kind: z.literal("object"), objectId: contentIdSchema, option: z.string().min(1) })
    .strict(),
  z
    .object({ kind: z.literal("have_item"), itemId: contentIdSchema, quantity: positiveInt })
    .strict(),
]);

export type Objective = z.infer<typeof objectiveSchema>;

/** A side effect fired when a stage is entered or completed. */
export const triggerSchema = z
  .object({
    on: z.enum(["stage_enter", "stage_complete"]),
    effects: z.array(effectSchema).default([]),
  })
  .strict();

export type Trigger = z.infer<typeof triggerSchema>;

export const questStageSchema = z
  .object({
    stage: nonNegInt,
    journalText: z.string().min(1),
    objectives: z.array(objectiveSchema).default([]),
    triggers: z.array(triggerSchema).default([]),
  })
  .strict();

export type QuestStage = z.infer<typeof questStageSchema>;

export const questDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    questPoints: positiveInt,
    requirements: z.array(requirementSchema).default([]),
    /** Var key namespacing the quest's stage/progress variables. */
    varPrefix: z.string().min(1),
    stages: z.array(questStageSchema).min(1),
    /** Effects applied once on completion (items, XP, unlocks). */
    rewards: z.array(effectSchema).default([]),
  })
  .strict()
  .refine((q) => q.stages.some((s) => s.stage === 0), {
    message: "quest must define a stage 0 (not started)",
  });

export type QuestDef = z.infer<typeof questDefSchema>;
