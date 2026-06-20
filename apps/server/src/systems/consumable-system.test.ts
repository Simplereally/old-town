import { describe, expect, it } from "vitest";
import type { CombatantComponent } from "../ecs/components";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { TickLoop, TickPhase } from "../sim/tick-loop";
import { makeRegistries } from "../test-support/registries";
import { ConsumableSystem } from "./consumable-system";

function setup(combat?: Partial<CombatantComponent> & { health: number; maxHealth: number }) {
  const world = createWorld();
  const owner = world.createEntity();
  if (combat) {
    world.setComponent(owner, "combatant", {
      entityId: owner,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
      ...combat,
    });
  }
  const deltas = new DeltaAccumulator();
  const consumables = new ConsumableSystem();
  const registries = makeRegistries();
  return { world, owner, deltas, consumables, registries };
}

function setupWithSkills(
  combat?: Partial<CombatantComponent> & { health: number; maxHealth: number },
) {
  const { world, owner, deltas, consumables, registries } = setup(combat);
  world.setComponent(owner, "skills", {
    entityId: owner,
    skills: {
      strength: { level: 5, xp: 0, boost: 0, drain: 0 },
    },
  });
  return { world, owner, deltas, consumables, registries };
}

function setupWithStatusEffects(
  combat?: Partial<CombatantComponent> & { health: number; maxHealth: number },
) {
  const { world, owner, deltas, consumables, registries } = setup(combat);
  world.setComponent(owner, "statusEffects", {
    entityId: owner,
    effects: [],
  });
  return { world, owner, deltas, consumables, registries };
}

describe("ConsumableSystem.processConsumablePhase", () => {
  it("restores HP up to max and emits a heal hitsplat plus a refreshed health bar", () => {
    const { world, owner, deltas, consumables, registries } = setup({ health: 4, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas, registries });

    expect(world.getComponent(owner, "combatant")?.health).toBe(9);
    const dirty = deltas.peek();
    expect(dirty.hitsplats).toEqual([{ entityId: owner, hitsplat: { amount: 5, type: "heal" } }]);
    const update = dirty.entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.healthBar).toEqual({ current: 9, max: 10 });
  });

  it("never overheals beyond max HP — the hitsplat shows only the amount restored", () => {
    const { world, owner, deltas, consumables, registries } = setup({ health: 8, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas, registries });

    expect(world.getComponent(owner, "combatant")?.health).toBe(10);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "heal" } },
    ]);
  });

  it("emits nothing when the actor is already at full health", () => {
    const { world, owner, deltas, consumables, registries } = setup({ health: 10, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas, registries });

    expect(world.getComponent(owner, "combatant")?.health).toBe(10);
    const dirty = deltas.peek();
    expect(dirty.hitsplats).toBeUndefined();
    expect(dirty.entityUpdates).toHaveLength(0);
  });

  it("ignores a non-positive heal without queueing it", () => {
    const { owner, consumables } = setup({ health: 4, maxHealth: 10 });
    consumables.enqueueHeal(owner, 0);
    expect(consumables.pendingCount).toBe(0);
  });

  it("drains the queue so a heal is applied exactly once", () => {
    const { world, owner, deltas, consumables, registries } = setup({ health: 1, maxHealth: 10 });
    consumables.enqueueHeal(owner, 3);
    consumables.processConsumablePhase({ world, deltas, registries });
    consumables.processConsumablePhase({ world, deltas, registries }); // no-op: queue already drained

    expect(world.getComponent(owner, "combatant")?.health).toBe(4);
    expect(consumables.pendingCount).toBe(0);
  });

  it("no-ops for an entity without a combatant", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueHeal(owner, 5);
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
    expect(deltas.peek().hitsplats).toBeUndefined();
  });
});

describe("tick-phase priority: damage resolves before food heals", () => {
  // POC_SPEC §13.9 / §9.1: FoodPotionPrayerStatChanges (phase 9) runs strictly after
  // DamageResolutionEvents (phase 8). A hit that resolves on the same tick as an eat must
  // therefore land *before* the heal. We register a stand-in damage handler (combat is E10)
  // and assert the final HP reflects damage-then-heal, not heal-then-damage.
  it("applies a same-tick pending hit before the queued heal", () => {
    const { world, owner, deltas, consumables, registries } = setup({ health: 10, maxHealth: 10 });
    const tickLoop = new TickLoop();

    // Phase 8: a delayed hit deals 7 -> health 3.
    tickLoop.registerPhase(TickPhase.DamageResolutionEvents, () => {
      const combatant = world.getComponent(owner, "combatant");
      if (combatant) {
        combatant.health -= 7;
        deltas.markHitsplat({ entityId: owner, hitsplat: { amount: 7, type: "damage" } });
      }
    });
    // Phase 9: the heal of 5 applies to the *post-damage* health -> min(10, 3 + 5) = 8.
    tickLoop.registerPhase(TickPhase.FoodPotionPrayerStatChanges, () => {
      consumables.processConsumablePhase({ world, deltas, registries });
    });

    consumables.enqueueHeal(owner, 5);
    tickLoop.runOneTick();

    // 8 proves damage-then-heal. Heal-then-damage would have left 3 (10+5 capped, then -7).
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
  });
});

describe("ConsumableSystem.enqueueCure", () => {
  it("cures a status effect when processed", () => {
    const { world, owner, deltas, consumables, registries } = setupWithStatusEffects();
    const statusEffectId = "poison";
    world.setComponent(owner, "statusEffects", {
      entityId: owner,
      effects: [{ statusEffectId, stacks: 1, remainingTicks: 10 }],
    });

    consumables.enqueueCure(owner, statusEffectId);
    consumables.processConsumablePhase({ world, deltas, registries });

    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects).toBeUndefined();
    expect(consumables.pendingCureCount).toBe(0);
  });

  it("no-ops when entity has no status effects component", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueCure(owner, "poison");
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
  });
});

describe("ConsumableSystem.enqueueApplyStatus", () => {
  it("applies a status effect when processed", () => {
    const { world, owner, deltas, consumables, registries } = setupWithStatusEffects();
    const statusEffectId = "strength_potion";
    const statusEffectDef = {
      id: statusEffectId,
      name: "Strength Potion",
      type: "buff",
      durationTicks: 10,
      effect: { skillId: "strength", boostAmount: 5 },
    };
    (registries as any).statusEffect.set(statusEffectId, statusEffectDef);

    consumables.enqueueApplyStatus(owner, statusEffectId);
    consumables.processConsumablePhase({ world, deltas, registries });

    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects?.effects.some((e) => e.statusEffectId === statusEffectId)).toBe(true);
    expect(consumables.pendingApplyStatusCount).toBe(0);
  });

  it("no-ops when entity has no status effects component", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueApplyStatus(owner, "strength_potion");
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
  });
});

describe("ConsumableSystem.enqueueBoost", () => {
  it("boosts a skill when processed", () => {
    const { world, owner, deltas, consumables, registries } = setupWithSkills();
    consumables.enqueueBoost(owner, "strength", 3);
    consumables.processConsumablePhase({ world, deltas, registries });

    const skills = world.getComponent(owner, "skills");
    expect(skills?.skills.strength?.boost).toBe(3);
    expect(consumables.pendingBoostCount).toBe(0);
  });

  it("ignores a non-positive boost without queueing it", () => {
    const { owner, consumables } = setupWithSkills();
    consumables.enqueueBoost(owner, "strength", 0);
    expect(consumables.pendingBoostCount).toBe(0);
  });

  it("no-ops when entity has no skills component", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueBoost(owner, "strength", 3);
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
  });
});

describe("ConsumableSystem.enqueueRestore", () => {
  it("restores skill drain when processed", () => {
    const { world, owner, deltas, consumables, registries } = setupWithSkills();
    const skills = world.getComponent(owner, "skills");
    expect(skills).toBeDefined();
    if (!skills) return;
    skills.skills.strength!.drain = 5;

    consumables.enqueueRestore(owner, "strength", 3);
    consumables.processConsumablePhase({ world, deltas, registries });

    expect(skills.skills.strength?.drain).toBe(2);
    expect(consumables.pendingRestoreCount).toBe(0);
  });

  it("ignores a non-positive restore without queueing it", () => {
    const { owner, consumables } = setupWithSkills();
    consumables.enqueueRestore(owner, "strength", 0);
    expect(consumables.pendingRestoreCount).toBe(0);
  });

  it("no-ops when entity has no skills component", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueRestore(owner, "strength", 3);
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
  });
});

describe("ConsumableSystem.enqueueRemoveStatus", () => {
  it("removes a status effect when processed", () => {
    const { world, owner, deltas, consumables, registries } = setupWithStatusEffects();
    const statusEffectId = "stun";
    world.setComponent(owner, "statusEffects", {
      entityId: owner,
      effects: [{ statusEffectId, stacks: 1, remainingTicks: 10 }],
    });

    consumables.enqueueRemoveStatus(owner, statusEffectId);
    consumables.processConsumablePhase({ world, deltas, registries });

    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects).toBeUndefined();
    expect(consumables.pendingRemoveStatusCount).toBe(0);
  });

  it("no-ops when entity has no status effects component", () => {
    const { world, owner, deltas, consumables, registries } = setup();
    consumables.enqueueRemoveStatus(owner, "stun");
    expect(() => consumables.processConsumablePhase({ world, deltas, registries })).not.toThrow();
  });
});

describe("ConsumableSystem.processConsumablePhase — mixed effects", () => {
  it("applies heal, cure, boost, and apply status in the same tick", () => {
    const { world, owner, deltas, consumables, registries } = setupWithStatusEffects({
      health: 5,
      maxHealth: 10,
    });
    const statusEffectDef = {
      id: "strength_potion",
      name: "Strength Potion",
      type: "buff",
      durationTicks: 10,
      effect: { skillId: "strength", boostAmount: 5 },
    };
    (registries as any).statusEffect.set("strength_potion", statusEffectDef);
    world.setComponent(owner, "skills", {
      entityId: owner,
      skills: {
        strength: { level: 5, xp: 0, boost: 0, drain: 0 },
      },
    });
    world.setComponent(owner, "statusEffects", {
      entityId: owner,
      effects: [{ statusEffectId: "poison", stacks: 1, remainingTicks: 10 }],
    });

    consumables.enqueueHeal(owner, 3);
    consumables.enqueueCure(owner, "poison");
    consumables.enqueueApplyStatus(owner, "strength_potion");
    consumables.enqueueBoost(owner, "strength", 2);
    consumables.processConsumablePhase({ world, deltas, registries });

    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects?.effects.some((e) => e.statusEffectId === "strength_potion")).toBe(true);
    expect(statusEffects?.effects.some((e) => e.statusEffectId === "poison")).toBe(false);
    const skills = world.getComponent(owner, "skills");
    expect(skills?.skills.strength?.boost).toBe(2);
  });

  it("applies restore and remove_status in the same tick", () => {
    const { world, owner, deltas, consumables, registries } = setupWithStatusEffects();
    world.setComponent(owner, "skills", {
      entityId: owner,
      skills: {
        strength: { level: 5, xp: 0, boost: 0, drain: 5 },
      },
    });
    world.setComponent(owner, "statusEffects", {
      entityId: owner,
      effects: [{ statusEffectId: "stun", stacks: 1, remainingTicks: 10 }],
    });

    consumables.enqueueRestore(owner, "strength", 3);
    consumables.enqueueRemoveStatus(owner, "stun");
    consumables.processConsumablePhase({ world, deltas, registries });

    const skills = world.getComponent(owner, "skills");
    expect(skills?.skills.strength?.drain).toBe(2);
    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects).toBeUndefined();
  });
});
