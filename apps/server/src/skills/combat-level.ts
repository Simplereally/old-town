import type { EntityId } from "@old-town/shared";
import type { World } from "../ecs/world";

/**
 * Combat level calculation (POC_SPEC §13.3).
 *
 * Uses the OSRS-like formula shape with Old Town skill names:
 *   base = 0.25 * (defence + hitpoints + floor(prayer / 2))
 *   melee = 0.325 * (attack + strength)
 *   range = 0.325 * (floor(ranged / 2) + ranged)
 *   mage = 0.325 * (floor(magic / 2) + magic)
 *   combatLevel = floor(base + max(melee, range, mage))
 *
 * For POC, prayer and ranged may not exist in the skill registry yet; missing skills are
 * treated as level 1.
 */
export function computeCombatLevel(world: World, entityId: EntityId): number {
  const skills = world.getComponent(entityId, "skills");
  const combatant = world.getComponent(entityId, "combatant");

  if (!skills || !combatant) {
    return 3;
  }

  const getSkillLevel = (id: string): number => {
    const state = skills.skills[id];
    return state?.level ?? 1;
  };

  const attack = getSkillLevel("attack");
  const strength = getSkillLevel("strength");
  const defence = getSkillLevel("defence");
  const hitpoints = getSkillLevel("hitpoints");
  const magic = getSkillLevel("magic");
  const prayer = getSkillLevel("prayer");
  const ranged = getSkillLevel("ranged");

  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * (Math.floor(ranged / 2) + ranged);
  const mage = 0.325 * (Math.floor(magic / 2) + magic);

  return Math.floor(base + Math.max(melee, range, mage));
}
