/** Quest definitions (POC_SPEC §18.3, §18.5). Quests are data: requirements, vars,
 *  stages, objectives, triggers, and rewards — never hardcoded classes. */
import { z } from "zod";
import {
  contentIdSchema,
  effectSchema,
  nonNegInt,
  playerVarValueSchema,
  positiveInt,
  requirementSchema,
} from "./common";

const progressVarSchema = z.string().min(1).optional();

/** A measurable goal within a quest stage. */
export const objectiveSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("talk"), npcId: contentIdSchema, progressVar: progressVarSchema })
    .strict(),
  z
    .object({
      kind: z.literal("gather"),
      itemId: contentIdSchema,
      quantity: positiveInt,
      progressVar: progressVarSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("kill"),
      npcId: contentIdSchema,
      count: positiveInt,
      progressVar: progressVarSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("object"),
      objectId: contentIdSchema,
      option: z.string().min(1),
      progressVar: progressVarSchema,
      requirements: z.array(requirementSchema).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("have_item"),
      itemId: contentIdSchema,
      quantity: positiveInt,
      progressVar: progressVarSchema,
    })
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

/** A content-declared player variable owned by a quest. */
export const questVariableSchema = z
  .object({
    key: z.string().min(1),
    initialValue: playerVarValueSchema,
  })
  .strict();

export type QuestVariable = z.infer<typeof questVariableSchema>;

export const questDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    questPoints: positiveInt,
    requirements: z.array(requirementSchema).default([]),
    /** Var key namespacing the quest's stage/progress variables. */
    varPrefix: z.string().min(1),
    /** Explicit variables initialized and mutated by content-driven quest effects/objectives. */
    variables: z.array(questVariableSchema).optional(),
    stages: z.array(questStageSchema).min(1),
    /** Effects applied once on completion (items, XP, unlocks). */
    rewards: z.array(effectSchema).default([]),
  })
  .strict()
  .refine((q) => q.stages.some((s) => s.stage === 0), {
    message: "quest must define a stage 0 (not started)",
  })
  .superRefine((quest, ctx) => {
    const stages = new Set<number>();
    let previousStage = -1;
    for (const [index, stage] of quest.stages.entries()) {
      if (stages.has(stage.stage)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate quest stage ${stage.stage}`,
          path: ["stages", index, "stage"],
        });
      }
      if (stage.stage <= previousStage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "quest stages must be ordered by increasing stage number",
          path: ["stages", index, "stage"],
        });
      }
      stages.add(stage.stage);
      previousStage = stage.stage;
    }

    const variableInitialValues = new Map<string, z.infer<typeof playerVarValueSchema>>();
    for (const [index, variable] of (quest.variables ?? []).entries()) {
      if (variableInitialValues.has(variable.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate quest variable ${variable.key}`,
          path: ["variables", index, "key"],
        });
      }
      variableInitialValues.set(variable.key, variable.initialValue);
    }

    for (const [stageIndex, stage] of quest.stages.entries()) {
      for (const [objectiveIndex, objective] of stage.objectives.entries()) {
        if (objective.progressVar && !variableInitialValues.has(objective.progressVar)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `objective progressVar ${objective.progressVar} is not declared by the quest`,
            path: ["stages", stageIndex, "objectives", objectiveIndex, "progressVar"],
          });
        }
        if (objective.progressVar) {
          const initialValue = variableInitialValues.get(objective.progressVar);
          const expectedType =
            objective.kind === "talk" || objective.kind === "object" ? "boolean" : "number";
          if (initialValue !== undefined && typeof initialValue !== expectedType) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${objective.kind} objective progressVar must initialize as ${expectedType}`,
              path: ["stages", stageIndex, "objectives", objectiveIndex, "progressVar"],
            });
          }
        }
      }
    }
  });

export type QuestDef = z.infer<typeof questDefSchema>;
