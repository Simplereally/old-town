/**
 * Combat level calculation (POC_SPEC §13.3).
 *
 * OSRS-like formula shape with Old Town skill names. Pure and shared so the server
 * (authoritative `combatant.combatLevel`) and the client (hover / right-click level
 * display and colouring) agree exactly. Missing or non-positive skills count as 1.
 *
 *   base  = 0.25 * (defence + hitpoints + floor(prayer / 2))
 *   melee = 0.325 * (attack + strength)
 *   range = 0.325 * (floor(ranged / 2) + ranged)
 *   mage  = 0.325 * (floor(magic / 2) + magic)
 *   level = floor(base + max(melee, range, mage))
 */
export interface CombatLevelInput {
  readonly attack?: number;
  readonly strength?: number;
  readonly defence?: number;
  readonly hitpoints?: number;
  readonly magic?: number;
  readonly prayer?: number;
  readonly ranged?: number;
}

export function combatLevelFromLevels(levels: CombatLevelInput): number {
  const lvl = (value: number | undefined): number => (value && value > 0 ? value : 1);
  const attack = lvl(levels.attack);
  const strength = lvl(levels.strength);
  const defence = lvl(levels.defence);
  const hitpoints = lvl(levels.hitpoints);
  const magic = lvl(levels.magic);
  const prayer = lvl(levels.prayer);
  const ranged = lvl(levels.ranged);

  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * (Math.floor(ranged / 2) + ranged);
  const mage = 0.325 * (Math.floor(magic / 2) + magic);

  return Math.floor(base + Math.max(melee, range, mage));
}

/**
 * Combat level text colours (OSRS "Choose Option" / overhead level colouring).
 *
 * The colour of an NPC's combat-level label is determined by the signed
 * difference `npcLevel - playerLevel` (positive = NPC is higher):
 *
 *   diff <= -10  Deep Green      #00ff00
 *   -9 .. -6     Light Green     #40ff00
 *   -5 .. -1     Yellow-Green    #80ff00
 *   0            True Yellow     #ffff00
 *   1 .. 5       Yellow-Orange   #ffc000
 *   6 .. 10      Light Orange    #ff8000
 *   11 .. 20     Dark Orange     #ff4000
 *   21 .. 50     Red-Orange      #ff2000
 *   diff >= 51   Deep Red        #ff0000
 *
 * Pure and shared so the client context-menu renderer and any server-side
 * gating logic agree on the same thresholds.
 */
export const COMBAT_LEVEL_COLORS = {
  deepGreen: "#00ff00",
  lightGreen: "#40ff00",
  yellowGreen: "#80ff00",
  yellow: "#ffff00",
  yellowOrange: "#ffc000",
  lightOrange: "#ff8000",
  darkOrange: "#ff4000",
  redOrange: "#ff2000",
  deepRed: "#ff0000",
} as const;

/**
 * Return the CSS colour for an NPC's combat-level label given the player's
 * combat level. Falls back to plain yellow when either level is missing.
 */
export function combatLevelColor(
  playerLevel: number | undefined,
  npcLevel: number | undefined,
): string {
  if (playerLevel === undefined || npcLevel === undefined) {
    return COMBAT_LEVEL_COLORS.yellow;
  }
  const diff = npcLevel - playerLevel;
  if (diff <= -10) return COMBAT_LEVEL_COLORS.deepGreen;
  if (diff <= -6) return COMBAT_LEVEL_COLORS.lightGreen;
  if (diff <= -1) return COMBAT_LEVEL_COLORS.yellowGreen;
  if (diff === 0) return COMBAT_LEVEL_COLORS.yellow;
  if (diff <= 5) return COMBAT_LEVEL_COLORS.yellowOrange;
  if (diff <= 10) return COMBAT_LEVEL_COLORS.lightOrange;
  if (diff <= 20) return COMBAT_LEVEL_COLORS.darkOrange;
  if (diff <= 50) return COMBAT_LEVEL_COLORS.redOrange;
  return COMBAT_LEVEL_COLORS.deepRed;
}
