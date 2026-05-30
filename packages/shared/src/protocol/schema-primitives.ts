/**
 * Reusable Zod schema fragments for wire validation. Shared by command schemas
 * (C2S) and, later, packet schemas (S2C). Keeping these in one place ensures the
 * server and client validate identical shapes.
 */
import { z } from "zod";

/** A vertical plane, 0..3. */
export const planeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

/** An integer tile coordinate. `.strict()` rejects extra fields. */
export const tileCoordSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
    plane: planeSchema,
  })
  .strict();

/** A runtime entity id (non-negative integer). */
export const entityIdSchema = z.number().int().nonnegative();

/** A client-assigned command id used for dedupe (non-negative integer). */
export const commandIdSchema = z.number().int().nonnegative();

/** An advisory client tick hint (non-negative integer). */
export const clientTickHintSchema = z.number().int().nonnegative();

/**
 * An interaction option verb (the label of a content-defined option, e.g. "chop",
 * "mine", "attack", "talk"). Engine-level vocabulary; the concrete behavior is resolved
 * by the server from content. Constrained to a short lowercase snake token.
 */
export const interactionOptionSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,31}$/, "must be a lowercase snake_case verb (1-32 chars)");
