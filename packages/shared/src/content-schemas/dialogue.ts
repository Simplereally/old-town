/** Dialogue graph definitions (POC_SPEC §18.4). */
import { z } from "zod";
import { contentIdSchema, effectSchema, requirementSchema } from "./common";

/** A player response branch within a dialogue node. */
export const dialogueOptionSchema = z
  .object({
    text: z.string().min(1),
    /** Id of the node this option leads to (validated to exist within the graph). */
    next: z.string().min(1),
    requirements: z.array(requirementSchema).default([]),
    effects: z.array(effectSchema).default([]),
  })
  .strict();

/** A single dialogue node: NPC text and/or player options, with optional effects. */
export const dialogueNodeSchema = z
  .object({
    id: z.string().min(1),
    npcText: z.string().min(1).optional(),
    requirements: z.array(requirementSchema).default([]),
    playerOptions: z.array(dialogueOptionSchema).optional(),
    effects: z.array(effectSchema).default([]),
  })
  .strict();

export const dialogueDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1).optional(),
    /** Id of the entry node. */
    root: z.string().min(1),
    nodes: z.array(dialogueNodeSchema).min(1),
  })
  .strict()
  .refine((d) => d.nodes.some((n) => n.id === d.root), {
    message: "dialogue root must reference an existing node id",
  });

export type DialogueOption = z.infer<typeof dialogueOptionSchema>;
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;
export type DialogueDef = z.infer<typeof dialogueDefSchema>;
