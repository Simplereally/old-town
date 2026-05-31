import type { EntityId } from "@old-town/shared";
import { levelForXp } from "@old-town/shared";
import type { SkillsComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export interface SkillStateContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
}

export interface AddXpResult {
  readonly skillId: string;
  readonly oldLevel: number;
  readonly newLevel: number;
  readonly oldXp: number;
  readonly newXp: number;
  readonly levelUp: boolean;
}

export function addXp(
  ctx: SkillStateContext,
  entityId: EntityId,
  skillId: string,
  amount: number,
): AddXpResult | undefined {
  if (amount <= 0) {
    return undefined;
  }

  const skills = ctx.world.getComponent(entityId, "skills");
  if (!skills) {
    return undefined;
  }

  const skill = skills.skills[skillId];
  if (!skill) {
    return undefined;
  }

  const oldXp = skill.xp;
  const oldLevel = skill.level;
  const newXp = oldXp + amount;
  const newLevel = levelForXp(newXp);

  skill.xp = newXp;
  skill.level = newLevel;

  const levelUp = newLevel > oldLevel;

  ctx.deltas.markSkillDelta({ skillId, level: newLevel, xp: newXp });
  ctx.deltas.markXpDrop({ skillId, amount });

  return { skillId, oldLevel, newLevel, oldXp, newXp, levelUp };
}

export function getBaseLevel(skills: SkillsComponent, skillId: string): number {
  const skill = skills.skills[skillId];
  if (!skill) {
    return 1;
  }
  return skill.level;
}

export function getCurrentLevel(skills: SkillsComponent, skillId: string): number {
  const skill = skills.skills[skillId];
  if (!skill) {
    return 1;
  }
  return Math.max(1, skill.level + skill.boost - skill.drain);
}

export function maxHealthForHitpointsLevel(hitpointsLevel: number): number {
  return hitpointsLevel * 10;
}
