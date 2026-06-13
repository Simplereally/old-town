import { describe, expect, it } from "vitest";
import type { ActiveEffect, CombatantComponent, StatusEffectComponent } from "../ecs/components";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  applyStatusEffect,
  cureStatusEffect,
  processStatusEffectTick,
  type StatusEffectContext,
} from "./status-effect-system";

function setup(combat?: Partial<CombatantComponent> & { health: number; maxHealth: number }) {
  const world = createWorld();
  const owner = world.createEntity();
  if (combat) {
    world.setComponent(owner, "combatant", {
      entityId: owner,
      attackLevel: 10,
      strengthLevel: 10,
      defenceLevel: 10,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
      ...combat,
    });
  }
  const deltas = new DeltaAccumulator();
  const ctx: StatusEffectContext = { world, deltas };
  return { world, owner, deltas, ctx };
}

describe("applyStatusEffect", () => {
  it("applies a new effect to an entity", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4, damagePerTick: 2 });

    const component = world.getComponent(owner, "statusEffect");
    expect(component).toBeDefined();
    expect(component?.activeEffects).toHaveLength(1);
    expect(component?.activeEffects[0]).toMatchObject({
      effectId: "poison",
      durationTicks: 4,
      damagePerTick: 2,
    });
  });

  it("refreshes duration when re-applied", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4 });
    const component = world.getComponent(owner, "statusEffect");
    expect(component).toBeDefined();
    const effect = (component as StatusEffectComponent).activeEffects[0];
    expect(effect).toBeDefined();
    (effect as ActiveEffect).durationTicks = 1;
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4 });

    expect((component as StatusEffectComponent).activeEffects[0]?.durationTicks).toBe(4);
  });

  it("captures base stats when applying a buff", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, {
      effectId: "strength_boost",
      durationTicks: 4,
      statModifiers: { strength: 5 },
    });

    const component = world.getComponent(owner, "statusEffect");
    expect(component?.baseStats).toEqual({
      attackLevel: 10,
      strengthLevel: 10,
      defenceLevel: 10,
    });
  });
});

describe("cureStatusEffect", () => {
  it("removes an active effect by id", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4 });

    const cured = cureStatusEffect(ctx, owner, "poison");
    expect(cured).toBe(true);
    expect(world.getComponent(owner, "statusEffect")).toBeUndefined();
  });

  it("returns false when the effect is not present", () => {
    const { ctx, owner } = setup({ health: 10, maxHealth: 10 });
    const cured = cureStatusEffect(ctx, owner, "poison");
    expect(cured).toBe(false);
  });

  it("restores base stats when a buff is cured", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, {
      effectId: "strength_boost",
      durationTicks: 4,
      statModifiers: { strength: 5 },
    });
    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    cureStatusEffect(ctx, owner, "strength_boost");
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(10);
  });
});

describe("processStatusEffectTick — DOT", () => {
  it("deals damage per tick and removes the effect after duration", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4, damagePerTick: 2 });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "damage" } },
    ]);

    processStatusEffectTick(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.health).toBe(6);

    processStatusEffectTick(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.health).toBe(4);

    processStatusEffectTick(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.health).toBe(2);

    // After 4 ticks, effect should be gone
    processStatusEffectTick(ctx, 5);
    expect(world.getComponent(owner, "combatant")?.health).toBe(2);
    expect(world.getComponent(owner, "statusEffect")).toBeUndefined();
  });
});

describe("processStatusEffectTick — HOT", () => {
  it("restores health per tick", () => {
    const { ctx, world, owner, deltas } = setup({ health: 4, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "regen", durationTicks: 2, healPerTick: 3 });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(7);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 3, type: "heal" } },
    ]);

    processStatusEffectTick(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.health).toBe(10);

    // After 2 ticks, effect should be gone
    processStatusEffectTick(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.health).toBe(10);
    expect(world.getComponent(owner, "statusEffect")).toBeUndefined();
  });
});

describe("processStatusEffectTick — buffs", () => {
  it("boosts combat stats while active", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, {
      effectId: "strength_boost",
      durationTicks: 4,
      statModifiers: { strength: 5 },
    });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffectTick(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffectTick(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffectTick(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    // After 4 ticks, effect expires
    processStatusEffectTick(ctx, 5);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(10);
    expect(world.getComponent(owner, "statusEffect")).toBeUndefined();
  });

  it("does not drop stats below 1", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, {
      effectId: "weakness",
      durationTicks: 2,
      statModifiers: { defence: -20 },
    });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(1);
  });
});

describe("processStatusEffectTick — debuffs", () => {
  it("reduces combat stats while active", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, {
      effectId: "defence_weaken",
      durationTicks: 3,
      statModifiers: { defence: -3 },
    });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    processStatusEffectTick(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    processStatusEffectTick(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    // After 3 ticks, effect expires
    processStatusEffectTick(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(10);
  });
});

describe("processStatusEffectTick — multiple concurrent effects", () => {
  it("handles poison and a buff at the same time", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 4, damagePerTick: 2 });
    applyStatusEffect(ctx, owner, {
      effectId: "strength_boost",
      durationTicks: 4,
      statModifiers: { strength: 5 },
    });

    processStatusEffectTick(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "damage" } },
    ]);
  });
});

describe("delta emission", () => {
  it("emits statusEffects in entity update", () => {
    const { ctx, owner, deltas } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 2, damagePerTick: 2 });

    processStatusEffectTick(ctx, 1);
    const update = deltas.peek().entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.statusEffects).toEqual([
      { effectId: "poison", durationTicks: 1, damagePerTick: 2 },
    ]);
  });

  it("emits empty statusEffects when effect expires", () => {
    const { ctx, owner, deltas } = setup({ health: 10, maxHealth: 10 });
    applyStatusEffect(ctx, owner, { effectId: "poison", durationTicks: 1, damagePerTick: 2 });

    processStatusEffectTick(ctx, 1);
    const update = deltas.peek().entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.statusEffects).toEqual([]);
  });
});
