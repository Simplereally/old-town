/**
 * Canonical action token (actionId) — the engine/wire vocabulary for interaction options.
 *
 * Durable terms:
 * - **label**: human-facing text, may contain spaces/hyphens/case, e.g. "Talk-to", "Pick up"
 * - **actionId**: engine/wire token, lowercase snake_case, 1–32 chars, e.g. "talk", "pickup", "woodcut"
 * - **option**: a content/menu row containing label, actionId, priority, distance rules
 *
 * ActionIds are domain/content vocabulary, not protocol primitives. They are used in:
 * - Content interaction option definitions (InteractionOptionDef.actionId)
 * - Command payloads (NpcIntent.actionId, ObjectIntent.actionId, etc.)
 * - Client context menu rows (ContextMenuOption.actionId)
 */
import { z } from "zod";

/** Lowercase snake_case token, 1–32 chars, must start with a letter. */
export const ACTION_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

/** Zod schema for validating actionIds. */
export const actionIdSchema = z
  .string()
  .regex(ACTION_ID_PATTERN, "must be a lowercase snake_case token (1-32 chars)");

/** Branded type for actionIds. */
export type ActionId = string & { readonly __brand: "ActionId" };

/** Validate and brand an actionId string. */
export function actionId(value: string): ActionId {
  if (!ACTION_ID_PATTERN.test(value)) {
    throw new Error(
      `Invalid actionId ${JSON.stringify(value)}: must match ${ACTION_ID_PATTERN} (lowercase snake_case, 1-32 chars)`,
    );
  }
  return value as ActionId;
}
