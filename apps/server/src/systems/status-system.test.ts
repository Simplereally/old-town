import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  applyStatusEffect,
  cureByItem,
  cureStatusEffect,
  processStatusEffects,
} from "./status-system";

const POISON_DEF: import("@old-town/shared").StatusEffectDef = {
  id: "poison",
  name: "Poison",
  description: "Lose health over time.",
  durationTicks: 3,
  maxStacks: 1,
  effectType: "dot",
  statModifiers: [],
  cureItems: ["antidote"],
};

const STRENGTH_BOOST_DEF: import("@old-town/shared").StatusEffectDef = {
  id: "strength_boost",
  name: "Strength Boost",
  description: "Increased melee damage.",
  durationTicks: 5,
  maxStacks: 1,
  effectType: "buff",
  statModifiers: [{ stat: "meleeStrength", value: 5, mode: "add" }],
  cureItems: [],
};

const STUN_DEF: import("@old-town/shared").StatusEffectDef = {
  id: "stun",
  name: "Stun",
  description: "Unable to move or attack.",
  durationTicks: 2,
  maxStacks: 1,
  effectType: "cc",
  statModifiers: [],
  cureItems: [],
};

function addCombatant(world: World, health = 50): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x: 0, y: 0, plane: 0 });
  world.setComponent(entityId, "combatant", {
    entityId,
    health,
    maxHealth: 100,
    attackLevel: 10,
    strengthLevel: 10,
    defenceLevel: 10,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 10,
    eatBlockedUntilTick: 0,
    dead: false,
    respawnTick: 0,
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    statusEffect: new Map([
      [POISON_DEF.id, POISON_DEF],
      [STRENGTH_BOOST_DEF.id, STRENGTH_BOOST_DEF],
      [STUN_DEF.id, STUN_DEF],
    ]),
  });
  const ctx = {
    world,
    deltas,
    registries,
  };
  return { ctx, world, deltas };
}

describe("applyStatusEffect", () => {
  it("applies a new status effect", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    const applied = applyStatusEffect(ctx, entity, "poison");

    expect(applied).toBe(true);
    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.effects.length).toBe(1);
    expect(statusEffects?.effects[0]).toMatchObject({
      statusEffectId: "poison",
      stacks: 1,
      remainingTicks: 3,
    });
  });

  it("stacks up to maxStacks when re-applied", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    applyStatusEffect(ctx, entity, "strength_boost");
    applyStatusEffect(ctx, entity, "strength_boost");

    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.effects[0]?.stacks).toBe(1); // maxStacks is 1
  });

  it("refreshes duration when re-applied", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    applyStatusEffect(ctx, entity, "poison");
    const statusEffects = world.getComponent(entity, "statusEffects");
    if (statusEffects?.effects[0]) {
      statusEffects.effects[0].remainingTicks = 1;
      world.setComponent(entity, "statusEffects", statusEffects);
    }
    applyStatusEffect(ctx, entity, "poison");

    const updated = world.getComponent(entity, "statusEffects");
    expect(updated?.effects[0]?.remainingTicks).toBe(3);
  });

  it("returns false when effect definition does not exist", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    const applied = applyStatusEffect(ctx, entity, "nonexistent");

    expect(applied).toBe(false);
  });

  it("captures base stats for combatants", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    applyStatusEffect(ctx, entity, "strength_boost");

    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.baseStrengthLevel).toBe(10);
    expect(statusEffects?.baseAttackLevel).toBe(10);
    expect(statusEffects?.baseDefenceLevel).toBe(10);
  });

  it("accepts sourceEntityId and durationOverride", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    const source = world.createEntity();

    const applied = applyStatusEffect(ctx, entity, "poison", source, 10);

    expect(applied).toBe(true);
    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.effects[0]?.sourceEntityId).toBe(source);
    expect(statusEffects?.effects[0]?.remainingTicks).toBe(10);
  });
});

describe("cureStatusEffect", () => {
  it("removes a specific status effect", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison");
    applyStatusEffect(ctx, entity, "strength_boost");

    const cured = cureStatusEffect(ctx, entity, "poison");

    expect(cured).toBe(true);
    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.effects.length).toBe(1);
    expect(statusEffects?.effects[0]?.statusEffectId).toBe("strength_boost");
  });

  it("returns false when effect is not present", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);

    const cured = cureStatusEffect(ctx, entity, "poison");

    expect(cured).toBe(false);
  });

  it("removes component when all effects are cured", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison");

    cureStatusEffect(ctx, entity, "poison");

    expect(world.getComponent(entity, "statusEffects")).toBeUndefined();
  });
});

describe("cureByItem", () => {
  it("cures effects matching the cure item", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison");
    applyStatusEffect(ctx, entity, "strength_boost");

    const cured = cureByItem(ctx, entity, "antidote");

    expect(cured).toEqual(["poison"]);
    const statusEffects = world.getComponent(entity, "statusEffects");
    expect(statusEffects?.effects[0]?.statusEffectId).toBe("strength_boost");
  });

  it("returns empty array when no effects match", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "strength_boost");

    const cured = cureByItem(ctx, entity, "antidote");

    expect(cured).toEqual([]);
  });

  it("removes component when all effects are cured by item", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison");

    cureByItem(ctx, entity, "antidote");

    expect(world.getComponent(entity, "statusEffects")).toBeUndefined();
  });
});

describe("processStatusEffects", () => {
  it("applies dot damage each tick", () => {
    const { ctx, world, deltas } = setup();
    const entity = addCombatant(world, 50);
    applyStatusEffect(ctx, entity, "poison");

    processStatusEffects(ctx, 1);

    const combatant = world.getComponent(entity, "combatant");
    expect(combatant?.health).toBe(48);
    const state = deltas.peek();
    expect(state.hitsplats?.length).toBeGreaterThan(0);
  });

  it("reduces remainingTicks each tick", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison");

    processStatusEffects(ctx, 1);
    const afterFirst = world.getComponent(entity, "statusEffects");
    expect(afterFirst?.effects[0]?.remainingTicks).toBe(2);

    processStatusEffects(ctx, 2);
    const afterSecond = world.getComponent(entity, "statusEffects");
    expect(afterSecond?.effects[0]?.remainingTicks).toBe(1);
  });

  it("removes expired effects after ticks", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "poison", undefined, 1);

    processStatusEffects(ctx, 1);
    // Effect expired this tick; component is kept empty for one tick
    expect(world.getComponent(entity, "statusEffects")?.effects).toEqual([]);

    processStatusEffects(ctx, 2);
    // Now component is fully removed
    expect(world.getComponent(entity, "statusEffects")).toBeUndefined();
  });

  it("applies freeze movement block", () => {
    const { ctx, world, deltas } = setup();
    const entity = addCombatant(world);
    world.setComponent(entity, "movement", {
      entityId: entity,
      mode: "walk",
      path: [],
    });
    applyStatusEffect(ctx, entity, "stun");

    processStatusEffects(ctx, 1);

    const movement = world.getComponent(entity, "movement");
    expect(movement?.blockedUntilTick).toBe(2);
    const state = deltas.peek();
    expect(state.entityUpdates?.[0]?.changes?.overheadText).toBe("Frozen");
  });

  it("does not kill combatant with dot", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world, 1);
    applyStatusEffect(ctx, entity, "poison");

    processStatusEffects(ctx, 1);

    const combatant = world.getComponent(entity, "combatant");
    expect(combatant?.health).toBe(0);
    expect(combatant?.dead).toBe(false);
  });

  it("recomputes combat stats for buffs", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "strength_boost");

    processStatusEffects(ctx, 1);

    const combatant = world.getComponent(entity, "combatant");
    expect(combatant?.strengthLevel).toBe(15);
  });

  it("restores base stats when effect expires", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world);
    applyStatusEffect(ctx, entity, "strength_boost", undefined, 1);

    processStatusEffects(ctx, 1);
    processStatusEffects(ctx, 2);

    const combatant = world.getComponent(entity, "combatant");
    expect(combatant?.strengthLevel).toBe(10);
  });

  it("handles multiple effects on same entity", () => {
    const { ctx, world } = setup();
    const entity = addCombatant(world, 50);
    applyStatusEffect(ctx, entity, "poison");
    applyStatusEffect(ctx, entity, "strength_boost");

    processStatusEffects(ctx, 1);

    const combatant = world.getComponent(entity, "combatant");
    expect(combatant?.health).toBe(48);
    expect(combatant?.strengthLevel).toBe(15);
  });
});
