import type { EntityId } from "@old-town/shared";
import { levelForXp } from "@old-town/shared";
import type { SkillState, SkillsComponent } from "../ecs/components";
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

export function getEffectiveLevel(skill: SkillState): number {
  return Math.max(1, skill.level + skill.boost - skill.drain);
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

  ctx.deltas.markSkillDelta({
    skillId,
    level: newLevel,
    xp: newXp,
    effectiveLevel: getEffectiveLevel(skill),
  });
  ctx.deltas.markXpDrop({ skillId, amount });

  return { skillId, oldLevel, newLevel, oldXp, newXp, levelUp };
}

export function deductXp(
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
  const newXp = Math.max(0, oldXp - amount);
  const newLevel = levelForXp(newXp);

  skill.xp = newXp;
  skill.level = newLevel;

  const levelUp = newLevel > oldLevel;

  ctx.deltas.markSkillDelta({
    skillId,
    level: newLevel,
    xp: newXp,
    effectiveLevel: getEffectiveLevel(skill),
  });
  ctx.deltas.markXpDrop({ skillId, amount: -amount });

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

export function boostSkill(
  ctx: SkillStateContext,
  entityId: EntityId,
  skillId: string,
  amount: number,
): boolean {
  if (amount <= 0) {
    return false;
  }

  const skills = ctx.world.getComponent(entityId, "skills");
  if (!skills) {
    return false;
  }

  const skill = skills.skills[skillId];
  if (!skill) {
    return false;
  }

  skill.boost = amount;
  skill.drain = 0; // A fresh boost overrides any existing drain

  ctx.deltas.markSkillDelta({
    skillId,
    level: skill.level,
    xp: skill.xp,
    effectiveLevel: getEffectiveLevel(skill),
  });

  return true;
}

export function maxHealthForHitpointsLevel(hitpointsLevel: number): number {
  return hitpointsLevel * 10;
}
