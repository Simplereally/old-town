/**
 * Pure mapping between {@link CharacterSnapshot} and the `character_state` row shape.
 *
 * `character_state` is the doc's "compact snapshot" table: hot lookup columns
 * (world/position/hitpoints) plus JSONB sub-objects for the rest, all carrying an optimistic
 * `version`. Keeping the conversion pure and side-effect free means the row mapping — where the
 * real bug risk lives — is unit tested without a database.
 */
import {
  type CharacterSnapshot,
  type CombatStyle,
  combatStyleSchema,
  parseCharacterSnapshot,
} from "@old-town/shared";

/** Column values written to / read from a `character_state` row (snake_case at the SQL edge). */
export interface CharacterStateColumns {
  readonly worldId: string;
  readonly tileX: number;
  readonly tileY: number;
  readonly plane: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly combatStyle: CombatStyle | null;
  readonly skills: CharacterSnapshot["skills"];
  readonly inventory: CharacterSnapshot["inventory"];
  readonly equipment: CharacterSnapshot["equipment"];
  readonly bank: CharacterSnapshot["bank"];
  readonly questVars: CharacterSnapshot["vars"];
  readonly savedAt: number;
}

/** Project a validated snapshot onto the `character_state` columns for a given world. */
export function snapshotToStateColumns(
  snapshot: CharacterSnapshot,
  worldId: string,
): CharacterStateColumns {
  const validated = parseCharacterSnapshot(snapshot);
  return {
    worldId,
    tileX: validated.position.x,
    tileY: validated.position.y,
    plane: validated.position.plane,
    health: validated.hitpoints.health,
    maxHealth: validated.hitpoints.maxHealth,
    combatStyle: validated.combatStyle ?? null,
    skills: validated.skills,
    inventory: validated.inventory,
    equipment: validated.equipment,
    bank: validated.bank,
    questVars: validated.vars,
    savedAt: validated.savedAt,
  };
}

/**
 * Rebuild a snapshot from a loaded `character_state` row. JSONB columns arrive already parsed
 * from the driver; the result is run back through the snapshot schema so a corrupt row fails
 * loudly at load rather than silently corrupting live ECS state.
 */
export function stateRowToSnapshot(characterId: string, row: CharacterStateRow): CharacterSnapshot {
  const combatStyle = parseOptionalCombatStyle(row.combat_style);
  return parseCharacterSnapshot({
    version: 1,
    characterId,
    savedAt: toInt(row.saved_at),
    position: {
      x: toInt(row.tile_x),
      y: toInt(row.tile_y),
      plane: toInt(row.plane),
    },
    hitpoints: {
      health: toInt(row.health),
      maxHealth: toInt(row.max_health),
    },
    ...(combatStyle ? { combatStyle } : {}),
    skills: asJson(row.skills),
    inventory: asJson(row.inventory),
    equipment: asJson(row.equipment),
    bank: asJson(row.bank),
    vars: asJson(row.quest_vars),
  });
}

/** Raw `character_state` row as returned by the driver. JSONB columns are pre-parsed. */
export interface CharacterStateRow {
  readonly [column: string]: unknown;
  readonly version: unknown;
  readonly content_version: unknown;
  readonly world_id: unknown;
  readonly tile_x: unknown;
  readonly tile_y: unknown;
  readonly plane: unknown;
  readonly health: unknown;
  readonly max_health: unknown;
  readonly combat_style: unknown;
  readonly skills: unknown;
  readonly inventory: unknown;
  readonly equipment: unknown;
  readonly bank: unknown;
  readonly quest_vars: unknown;
  readonly saved_at: unknown;
}

function parseOptionalCombatStyle(value: unknown): CombatStyle | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return combatStyleSchema.parse(value);
}

function toInt(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  // node-postgres returns bigint columns as strings to avoid precision loss.
  if (typeof value === "string" && value.trim() !== "") {
    return Number.parseInt(value, 10);
  }
  throw new TypeError(`Expected an integer column value, received ${typeof value}`);
}

function asJson<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}
