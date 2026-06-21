/**
 * Runtime validation for client → server commands. Every command the server accepts
 * passes through {@link parseClientCommand}. Schemas are `.strict()` so a client cannot
 * smuggle extra fields (e.g. authoritative state like xp/hp/position) past validation,
 * and the discriminated union rejects unknown command types.
 */
import { z } from "zod";
import { combatStyleModeSchema, combatStyleSchema } from "../content-schemas/common";
import { actionIdSchema } from "../content/action-id";
import { type ClientCommand, ClientCommandType } from "./commands";
import type { ParseResult } from "./parse-result";
import {
  clientTickHintSchema,
  commandIdSchema,
  entityIdSchema,
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
  z.object({ objectEntityId: entityIdSchema, actionId: actionIdSchema }).strict(),
);

const npcOptionCommandSchema = command(
  ClientCommandType.NpcOption,
  z.object({ npcEntityId: entityIdSchema, actionId: actionIdSchema }).strict(),
);

const itemOptionCommandSchema = command(
  ClientCommandType.ItemOption,
  z.object({ itemUid: z.number().int().nonnegative(), actionId: actionIdSchema }).strict(),
);

const useItemOnCommandSchema = command(
  ClientCommandType.UseItemOn,
  z.object({ itemUid: z.number().int().nonnegative(), target: spellTargetSchema }).strict(),
);

const groundItemOptionCommandSchema = command(
  ClientCommandType.GroundItemOption,
  z.object({ groundItemEntityId: entityIdSchema, actionId: actionIdSchema }).strict(),
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

const bankActionCommandSchema = command(
  ClientCommandType.BankAction,
  z
    .object({
      action: z.enum(["deposit", "withdraw", "open", "close"]),
      itemUid: z.number().int().nonnegative().optional(),
      quantity: z.number().int().nonnegative().optional(),
    })
    .strict(),
);

const shopActionCommandSchema = command(
  ClientCommandType.ShopAction,
  z
    .object({
      action: z.enum(["buy", "sell", "open", "close"]),
      itemId: z.string().min(1).max(64).optional(),
      quantity: z.number().int().nonnegative().optional(),
    })
    .strict(),
);

const recipeSelectCommandSchema = command(
  ClientCommandType.RecipeSelect,
  z
    .object({
      recipeId: z.string().min(1).max(64),
      stationEntityId: entityIdSchema,
    })
    .strict(),
);

const setCombatStyleCommandSchema = command(
  ClientCommandType.SetCombatStyle,
  z.object({ style: combatStyleSchema, mode: combatStyleModeSchema.optional() }).strict(),
);

const setPrayerCommandSchema = command(
  ClientCommandType.SetPrayer,
  z.object({ prayerId: z.string().min(1).max(64), active: z.boolean() }).strict(),
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
  useItemOnCommandSchema,
  groundItemOptionCommandSchema,
  castSpellCommandSchema,
  chatCommandSchema,
  uiActionCommandSchema,
  bankActionCommandSchema,
  shopActionCommandSchema,
  recipeSelectCommandSchema,
  setCombatStyleCommandSchema,
  setPrayerCommandSchema,
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
