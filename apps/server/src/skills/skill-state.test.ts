import { describe, expect, it } from "vitest";
import type { SkillsComponent } from "../ecs/components";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { computeCombatLevel } from "./combat-level";
import {
  addXp,
  boostSkill,
  getBaseLevel,
  getCurrentLevel,
  maxHealthForHitpointsLevel,
  restoreSkill,
  syncCombatantLevelsFromSkills,
} from "./skill-state";

function skill(skills: SkillsComponent, id: string) {
  const state = skills.skills[id];
  if (!state) throw new Error(`Missing skill: ${id}`);
  return state;
}

function setupSkills() {
  const world = createWorld();
  const owner = world.createEntity();
  world.setComponent(owner, "skills", {
    entityId: owner,
    skills: {
      attack: { level: 1, xp: 0, boost: 0, drain: 0 },
      strength: { level: 1, xp: 0, boost: 0, drain: 0 },
      defence: { level: 1, xp: 0, boost: 0, drain: 0 },
      hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      magic: { level: 1, xp: 0, boost: 0, drain: 0 },
      woodcutting: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  const deltas = new DeltaAccumulator();
  const skills = world.getComponent(owner, "skills");
  if (!skills) throw new Error("setupSkills: skills component missing");
  return { world, owner, deltas, skills };
}

function setupCombatant() {
  const { world, owner, deltas, skills } = setupSkills();
  world.setComponent(owner, "combatant", {
    entityId: owner,
    health: 10,
    maxHealth: 10,
    attackLevel: 1,
    strengthLevel: 1,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
  });
  return { world, owner, deltas, skills };
}

describe("addXp", () => {
  it("adds XP to a skill and updates the level", () => {
    const { world, owner, deltas, skills } = setupSkills();
    const result = addXp({ world, deltas }, owner, "woodcutting", 100);

    expect(result).toBeDefined();
    if (result) {
      expect(result.skillId).toBe("woodcutting");
      expect(result.oldXp).toBe(0);
      expect(result.newXp).toBe(100);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.levelUp).toBe(true);
    }

    const s = skill(skills, "woodcutting");
    expect(s.xp).toBe(100);
    expect(s.level).toBe(2);
  });

  it("does not level-up when XP is below the next threshold", () => {
    const { world, owner, deltas } = setupSkills();
    const result = addXp({ world, deltas }, owner, "woodcutting", 50);

    expect(result).toBeDefined();
    if (result) {
      expect(result.levelUp).toBe(false);
      expect(result.newLevel).toBe(1);
    }
  });

  it("does not double-fire level-up for the same XP change", () => {
    const { world, owner, deltas } = setupSkills();
    const first = addXp({ world, deltas }, owner, "woodcutting", 100);
    expect(first).toBeDefined();
    if (first) {
      expect(first.levelUp).toBe(true);
      expect(first.newLevel).toBe(2);
    }

    const second = addXp({ world, deltas }, owner, "woodcutting", 10);
    expect(second).toBeDefined();
    if (second) {
      expect(second.levelUp).toBe(false);
      expect(second.newLevel).toBe(2);
    }
  });

  it("emits skill delta and XP drop on the accumulator", () => {
    const { world, owner, deltas } = setupSkills();
    addXp({ world, deltas }, owner, "woodcutting", 100);

    const dirty = deltas.peek();
    expect(dirty.skillDelta).toEqual([
      { skillId: "woodcutting", level: 2, xp: 100, effectiveLevel: 2 },
    ]);
    expect(dirty.xpDrops).toEqual([{ skillId: "woodcutting", amount: 100 }]);
    expect(dirty.levelUps).toEqual([{ skillId: "woodcutting", newLevel: 2 }]);
  });

  it("does not emit a level-up packet below the next threshold", () => {
    const { world, owner, deltas } = setupSkills();

    addXp({ world, deltas }, owner, "woodcutting", 50);

    expect(deltas.peek().levelUps).toBeUndefined();
  });

  it("accumulates fractional XP amounts (OSRS hitpoints XP is 1.33/damage)", () => {
    const { world, owner, deltas, skills } = setupSkills();
    // Simulates hitpoints XP from a 3-damage hit at 1.33 per damage = 3.99.
    const result = addXp({ world, deltas }, owner, "hitpoints", 3 * 1.33);

    expect(result).toBeDefined();
    if (result) {
      expect(result.newXp).toBeCloseTo(3.99, 10);
    }
    expect(skill(skills, "hitpoints").xp).toBeCloseTo(3.99, 10);

    const dirty = deltas.peek();
    expect(dirty.xpDrops).toEqual([{ skillId: "hitpoints", amount: 3.99 }]);
  });

  it("accepts small fractional XP amounts", () => {
    const { world, owner, deltas, skills } = setupSkills();
    const result = addXp({ world, deltas }, owner, "hitpoints", 0.5);
    expect(result).toBeDefined();
    expect(skill(skills, "hitpoints").xp).toBe(0.5);
  });

  it("recalculates max health and combat level when hitpoints levels up", () => {
    const { world, owner, deltas } = setupCombatant();

    addXp({ world, deltas }, owner, "hitpoints", 100);

    const combatant = world.getComponent(owner, "combatant");
    expect(combatant?.health).toBe(10);
    expect(combatant?.maxHealth).toBe(20);
    expect(combatant?.combatLevel).toBe(computeCombatLevel(world, owner));
    expect(deltas.peek().entityUpdates[0]?.changes.healthBar).toEqual({
      current: 10,
      max: 20,
    });
  });

  it("syncs melee roll levels and combat level when a combat skill levels up", () => {
    const { world, owner, deltas } = setupCombatant();
    const beforeCombatLevel = world.getComponent(owner, "combatant")?.combatLevel ?? 0;

    addXp({ world, deltas }, owner, "attack", 13_034_431);

    const combatant = world.getComponent(owner, "combatant");
    expect(combatant?.attackLevel).toBe(99);
    expect(combatant?.combatLevel).toBeGreaterThan(beforeCombatLevel);
    expect(combatant?.combatLevel).toBe(computeCombatLevel(world, owner));
  });

  it("returns undefined for non-positive XP", () => {
    const { world, owner, deltas } = setupSkills();
    expect(addXp({ world, deltas }, owner, "woodcutting", 0)).toBeUndefined();
    expect(addXp({ world, deltas }, owner, "woodcutting", -5)).toBeUndefined();
  });

  it("returns undefined for missing skill", () => {
    const { world, owner, deltas } = setupSkills();
    expect(addXp({ world, deltas }, owner, "nonexistent", 100)).toBeUndefined();
  });

  it("returns undefined for missing skills component", () => {
    const world = createWorld();
    const owner = world.createEntity();
    const deltas = new DeltaAccumulator();
    expect(addXp({ world, deltas }, owner, "woodcutting", 100)).toBeUndefined();
  });
});

describe("getBaseLevel", () => {
  it("returns the stored level for a skill", () => {
    const { skills } = setupSkills();
    expect(getBaseLevel(skills, "woodcutting")).toBe(1);
  });

  it("returns 1 for a missing skill", () => {
    const { skills } = setupSkills();
    expect(getBaseLevel(skills, "nonexistent")).toBe(1);
  });
});

describe("getCurrentLevel", () => {
  it("returns base level when no boost or drain", () => {
    const { skills } = setupSkills();
    expect(getCurrentLevel(skills, "woodcutting")).toBe(1);
  });

  it("adds boost", () => {
    const { skills } = setupSkills();
    skill(skills, "woodcutting").boost = 3;
    expect(getCurrentLevel(skills, "woodcutting")).toBe(4);
  });

  it("subtracts drain", () => {
    const { skills } = setupSkills();
    skill(skills, "woodcutting").drain = 2;
    expect(getCurrentLevel(skills, "woodcutting")).toBe(1);
  });

  it("clamps to minimum of 1", () => {
    const { skills } = setupSkills();
    skill(skills, "woodcutting").drain = 5;
    expect(getCurrentLevel(skills, "woodcutting")).toBe(1);
  });

  it("combines boost and drain", () => {
    const { skills } = setupSkills();
    skill(skills, "woodcutting").boost = 5;
    skill(skills, "woodcutting").drain = 2;
    expect(getCurrentLevel(skills, "woodcutting")).toBe(4);
  });
});

describe("restoreSkill", () => {
  it("reduces skill drain by the given amount", () => {
    const { world, owner, deltas, skills } = setupSkills();
    skill(skills, "strength").drain = 5;

    const result = restoreSkill({ world, deltas }, owner, "strength", 3);

    expect(result).toBe(true);
    expect(skill(skills, "strength").drain).toBe(2);
  });

  it("clamps drain to 0 and does not go negative", () => {
    const { world, owner, deltas, skills } = setupSkills();
    skill(skills, "strength").drain = 2;

    const result = restoreSkill({ world, deltas }, owner, "strength", 5);

    expect(result).toBe(true);
    expect(skill(skills, "strength").drain).toBe(0);
  });

  it("returns false when skill is not drained", () => {
    const { world, owner, deltas } = setupSkills();
    expect(restoreSkill({ world, deltas }, owner, "strength", 3)).toBe(false);
  });

  it("returns false for non-positive restore amount", () => {
    const { world, owner, deltas, skills } = setupSkills();
    skill(skills, "strength").drain = 5;
    expect(restoreSkill({ world, deltas }, owner, "strength", 0)).toBe(false);
    expect(restoreSkill({ world, deltas }, owner, "strength", -3)).toBe(false);
  });

  it("returns false for missing skills component", () => {
    const world = createWorld();
    const owner = world.createEntity();
    const deltas = new DeltaAccumulator();
    expect(restoreSkill({ world, deltas }, owner, "strength", 3)).toBe(false);
  });

  it("returns false for missing skill", () => {
    const { world, owner, deltas } = setupSkills();
    expect(restoreSkill({ world, deltas }, owner, "nonexistent", 3)).toBe(false);
  });

  it("emits a skill delta when drain is restored", () => {
    const { world, owner, deltas, skills } = setupSkills();
    skill(skills, "strength").drain = 5;
    restoreSkill({ world, deltas }, owner, "strength", 3);

    const dirty = deltas.peek();
    expect(dirty.skillDelta).toEqual([{ skillId: "strength", level: 1, xp: 0, effectiveLevel: 1 }]);
  });
});

describe("maxHealthForHitpointsLevel", () => {
  it("returns 10 for level 1", () => {
    expect(maxHealthForHitpointsLevel(1)).toBe(10);
  });

  it("returns 50 for level 5", () => {
    expect(maxHealthForHitpointsLevel(5)).toBe(50);
  });

  it("returns 990 for level 99", () => {
    expect(maxHealthForHitpointsLevel(99)).toBe(990);
  });
});

describe("syncCombatantLevelsFromSkills", () => {
  it("writes boosted skill levels onto the combatant component", () => {
    const { world, owner, deltas, skills } = setupCombatant();
    skill(skills, "attack").level = 5;
    boostSkill({ world, deltas }, owner, "attack", 3);

    expect(world.getComponent(owner, "combatant")?.attackLevel).toBe(8);
  });

  it("writes restored (de-drained) strength onto the combatant component", () => {
    const { world, owner, deltas, skills } = setupCombatant();
    skill(skills, "strength").level = 10;
    skill(skills, "strength").drain = 4;
    syncCombatantLevelsFromSkills(world, owner);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(6);

    restoreSkill({ world, deltas }, owner, "strength", 4);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(10);
  });

  it("is a no-op when there is no combatant component", () => {
    const { world, owner } = setupSkills();
    expect(() => syncCombatantLevelsFromSkills(world, owner)).not.toThrow();
  });
});

describe("computeCombatLevel", () => {
  it("returns 1 for a level-1 character", () => {
    const { world, owner } = setupCombatant();
    expect(computeCombatLevel(world, owner)).toBe(1);
  });

  it("rises with combat skills", () => {
    const { world, owner, skills } = setupCombatant();
    skill(skills, "attack").level = 10;
    skill(skills, "strength").level = 10;
    skill(skills, "defence").level = 10;
    skill(skills, "hitpoints").level = 10;

    expect(computeCombatLevel(world, owner)).toBe(11);
  });

  it("uses the dominant combat style", () => {
    const { world, owner, skills } = setupCombatant();
    skill(skills, "magic").level = 40;
    skill(skills, "attack").level = 10;
    skill(skills, "strength").level = 10;

    expect(computeCombatLevel(world, owner)).toBe(20);
  });

  it("returns 3 for missing combatant or skills", () => {
    const world = createWorld();
    const owner = world.createEntity();
    expect(computeCombatLevel(world, owner)).toBe(3);
  });
});
