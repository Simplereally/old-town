/** Trail definitions for Oldroad trails and hidden paths. */
import { z } from "zod";
import { contentIdSchema, nonNegInt } from "./common";

export const trailDefSchema = z
  .object({
    id: contentIdSchema,
    name: z.string().min(1),
    startTile: z.object({
      x: z.number().int(),
      y: z.number().int(),
      plane: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
    }),
    endTile: z.object({
      x: z.number().int(),
      y: z.number().int(),
      plane: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
    }),
    hidden: z.boolean().default(false),
    discoveryRadius: nonNegInt.default(3),
    buff: contentIdSchema,
    shortcutSpeed: z.union([nonNegInt, z.undefined()]).optional(),
  })
  .strict();

export type TrailDef = z.infer<typeof trailDefSchema>;
