/**
 * Zod schema for the content registry HTTP response served by the server's
 * `/api/content` endpoint. Reuses the per-kind definition schemas from
 * `content-schemas/` and wraps each in a `Record<string, DefSchema>`.
 *
 * The top-level object is `.strict()` so a missing or extra registry key is
 * caught immediately (protocol drift between server and client content shape).
 */
import { z } from "zod";
import { contractDefSchema } from "../content-schemas/contract";
import { dialogueDefSchema } from "../content-schemas/dialogue";
import { itemDefSchema } from "../content-schemas/item";
import { materialDefSchema } from "../content-schemas/material";
import { npcDefSchema } from "../content-schemas/npc";
import { objectDefSchema } from "../content-schemas/object";
import { questDefSchema } from "../content-schemas/quest";
import { skillDefSchema } from "../content-schemas/skill";
import { spellDefSchema } from "../content-schemas/spell";

export const contentClientRegistriesSchema = z
  .object({
    item: z.record(z.string(), itemDefSchema),
    npc: z.record(z.string(), npcDefSchema),
    object: z.record(z.string(), objectDefSchema),
    skill: z.record(z.string(), skillDefSchema),
    spell: z.record(z.string(), spellDefSchema),
    quest: z.record(z.string(), questDefSchema),
    dialogue: z.record(z.string(), dialogueDefSchema),
    contract: z.record(z.string(), contractDefSchema),
    material: z.record(z.string(), materialDefSchema),
  })
  .strict();

export type ContentClientRegistries = z.infer<typeof contentClientRegistriesSchema>;
