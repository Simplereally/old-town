import type { EntityId } from "@old-town/shared";
import { levelForXp } from "@old-town/shared";
import type { CombatantComponent, SkillState, SkillsComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

const MELEE_COMBAT_SKILLS = new Set(["attack", "strength", "defence"]);

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

/**
 * Sync the combatant's melee stat levels from the skill-derived current levels
 * (base + boost - drain). Melee rolls read `combatant.attackLevel/strengthLevel/
 * defenceLevel`, so without this sync potion boosts and drains never reach the
 * accuracy/strength/max-hit maths.
 *
 * When status effects are active, `status-system` captures a `baseAttackLevel` and
 * recomputes `combatant.attackLevel = base + statusMods` each tick. In that case we
 * update the captured base (so the next status recompute picks up the new boosted
 * base) instead of writing `combatant` directly — otherwise the status recompute
 * would overwrite our write with a stale base.
 */
export function syncCombatantLevelsFromSkills(world: World, entityId: EntityId): void {
  const skills = world.getComponent(entityId, "skills");
  const combatant = world.getComponent(entityId, "combatant");
  if (!skills || !combatant) {
    return;
  }
  const attack = getCurrentLevel(skills, "attack");
  const strength = getCurrentLevel(skills, "strength");
  const defence = getCurrentLevel(skills, "defence");

  const statusEffects = world.getComponent(entityId, "statusEffects");
  if (statusEffects) {
    if (statusEffects.baseAttackLevel !== undefined) {
      statusEffects.baseAttackLevel = attack;
    }
    if (statusEffects.baseStrengthLevel !== undefined) {
      statusEffects.baseStrengthLevel = strength;
    }
    if (statusEffects.baseDefenceLevel !== undefined) {
      statusEffects.baseDefenceLevel = defence;
    }
    return;
  }

  const next: CombatantComponent = {
    ...combatant,
    attackLevel: attack,
    strengthLevel: strength,
    defenceLevel: defence,
  };
  world.setComponent(entityId, "combatant", next);
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

  if (MELEE_COMBAT_SKILLS.has(skillId)) {
    syncCombatantLevelsFromSkills(ctx.world, entityId);
  }

  return true;
}

export function restoreSkill(
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

  if (skill.drain <= 0) {
    return false;
  }

  skill.drain = Math.max(0, skill.drain - amount);

  ctx.deltas.markSkillDelta({
    skillId,
    level: skill.level,
    xp: skill.xp,
    effectiveLevel: getEffectiveLevel(skill),
  });

  if (MELEE_COMBAT_SKILLS.has(skillId)) {
    syncCombatantLevelsFromSkills(ctx.world, entityId);
  }

  return true;
}

export function maxHealthForHitpointsLevel(hitpointsLevel: number): number {
  return hitpointsLevel * 10;
}
