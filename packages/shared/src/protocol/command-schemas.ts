/**
 * Runtime validation for client → server commands. Every command the server accepts
 * passes through {@link parseClientCommand}. Schemas are `.strict()` so a client cannot
 * smuggle extra fields (e.g. authoritative state like xp/hp/position) past validation,
 * and the discriminated union rejects unknown command types.
 */
import { z } from "zod";
import { type ClientCommand, ClientCommandType } from "./commands";
import type { ParseResult } from "./parse-result";
import {
  clientTickHintSchema,
  commandIdSchema,
  entityIdSchema,
  interactionOptionSchema,
  tileCoordSchema,
} from "./schema-primitives";

const spellTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("entity"), entityId: entityIdSchema }).strict(),
  z.object({ kind: z.literal("tile"), tile: tileCoordSchema }).strict(),
  z.object({ kind: z.literal("none") }).strict(),
]);

function command<T extends z.ZodTypeAny>(type: ClientCommandType, payload: T) {
  return z
    .object({
      type: z.literal(type),
      commandId: commandIdSchema,
      clientTickHint: clientTickHintSchema.optional(),
      payload,
    })
    .strict();
}

const moveClickCommandSchema = command(
  ClientCommandType.MoveClick,
  z.object({ dest: tileCoordSchema }).strict(),
);

const objectOptionCommandSchema = command(
  ClientCommandType.ObjectOption,
  z.object({ objectEntityId: entityIdSchema, option: interactionOptionSchema }).strict(),
);

const npcOptionCommandSchema = command(
  ClientCommandType.NpcOption,
  z.object({ npcEntityId: entityIdSchema, option: interactionOptionSchema }).strict(),
);

const itemOptionCommandSchema = command(
  ClientCommandType.ItemOption,
  z.object({ itemUid: z.number().int().nonnegative(), option: interactionOptionSchema }).strict(),
);

const castSpellCommandSchema = command(
  ClientCommandType.CastSpell,
  z.object({ spellId: z.string().min(1).max(64), target: spellTargetSchema }).strict(),
);

const chatCommandSchema = command(
  ClientCommandType.Chat,
  z.object({ text: z.string().min(1).max(256) }).strict(),
);

const uiActionCommandSchema = command(
  ClientCommandType.UiAction,
  z
    .object({
      action: z.string().min(1).max(64),
      targetId: z.string().min(1).max(64).optional(),
      value: z.number().int().optional(),
    })
    .strict(),
);

const pingCommandSchema = command(
  ClientCommandType.Ping,
  z.object({ clientTimeMs: z.number().int().nonnegative() }).strict(),
);

/** Validates any client → server command. */
export const clientCommandSchema = z.discriminatedUnion("type", [
  moveClickCommandSchema,
  objectOptionCommandSchema,
  npcOptionCommandSchema,
  itemOptionCommandSchema,
  castSpellCommandSchema,
  chatCommandSchema,
  uiActionCommandSchema,
  pingCommandSchema,
]);

/**
 * Validate untrusted input as a {@link ClientCommand}. Returns a discriminated result
 * rather than throwing, so the transport layer can reject malformed commands cleanly.
 */
export function parseClientCommand(raw: unknown): ParseResult<ClientCommand> {
  const result = clientCommandSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  // Brands are compile-time only; the validated shape matches ClientCommand at runtime.
  return { ok: true, value: result.data as unknown as ClientCommand };
}
