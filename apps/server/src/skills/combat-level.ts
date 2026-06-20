import { combatLevelFromLevels, type EntityId } from "@old-town/shared";
import type { World } from "../ecs/world";

/**
 * Combat level for a live entity (POC_SPEC §13.3). Reads the entity's skill levels and
 * delegates the maths to the shared {@link combatLevelFromLevels} so the server and the
 * client display agree. Entities without skills/combatant components default to 3.
 */
export function computeCombatLevel(world: World, entityId: EntityId): number {
  const skills = world.getComponent(entityId, "skills");
  const combatant = world.getComponent(entityId, "combatant");

  if (!skills || !combatant) {
    return 3;
  }

  const getSkillLevel = (id: string): number => skills.skills[id]?.level ?? 1;

  return combatLevelFromLevels({
    attack: getSkillLevel("attack"),
    strength: getSkillLevel("strength"),
    defence: getSkillLevel("defence"),
    hitpoints: getSkillLevel("hitpoints"),
    magic: getSkillLevel("magic"),
    prayer: getSkillLevel("prayer"),
    ranged: getSkillLevel("ranged"),
  });
}
