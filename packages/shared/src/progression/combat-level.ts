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
