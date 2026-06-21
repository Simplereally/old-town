import { z } from "zod";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const itemTransactionAuditEventSchema = z
  .object({
    tick: z.number().int().nonnegative(),
    characterId: z.string().min(1),
    itemId: z.string().min(1),
    quantity: z.number().int().positive(),
    reason: z.string().min(1),
    beforeQuantity: z.number().int().nonnegative().optional(),
    afterQuantity: z.number().int().nonnegative().optional(),
    /**
     * Optional dedupe key for economic mutations that must apply exactly once
     * (bank moves, trades, death resolution). When present, ledgers reject a
     * second write carrying the same key. See POC persistence subsystem item 7.
     */
    idempotencyKey: z.string().min(1).max(200).optional(),
    metadata: z.record(jsonValueSchema).default({}),
  })
  .strict();

export const itemTransactionAuditRecordSchema = itemTransactionAuditEventSchema
  .extend({
    id: z.number().int().positive(),
  })
  .strict();

export type ItemTransactionAuditEvent = z.infer<typeof itemTransactionAuditEventSchema>;
export type ItemTransactionAuditRecord = z.infer<typeof itemTransactionAuditRecordSchema>;

export function parseItemTransactionAuditEvent(input: unknown): ItemTransactionAuditEvent {
  return itemTransactionAuditEventSchema.parse(input);
}

export function parseItemTransactionAuditRecord(input: unknown): ItemTransactionAuditRecord {
  return itemTransactionAuditRecordSchema.parse(input);
}
