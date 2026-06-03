import {
  type ContentRegistries,
  createRng,
  type EntityId,
  type StatusEffectDef,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { CombatantComponent } from "../../ecs/components";
import { createWorld, type World } from "../../ecs/world";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { TickLoop, TickPhase } from "../../sim/tick-loop";
import { makeRegistries } from "../../test-support/registries";
import { CollisionMap } from "../../world/collision";
import { createRuntimeMap } from "../../world/runtime-map";
import {
  applyStatusEffect,
  cureByItem,
  cureStatusEffect,
  processStatusEffects,
  type StatusEffectContext,
} from "../status-system";

const POISON_DEF: StatusEffectDef = {
  id: "poison",
  name: "Poison",
  description: "Lose health over time.",
  durationTicks: 4,
  maxStacks: 3,
  effectType: "dot",
  statModifiers: [],
  cureItems: ["antidote"],
  damagePerTick: 2,
};

const BURN_DEF: StatusEffectDef = {
  id: "burn",
  name: "Burn",
  description: "On fire.",
  durationTicks: 3,
  maxStacks: 1,
  effectType: "dot",
  statModifiers: [],
  cureItems: [],
  damagePerTick: 3,
};

const FREEZE_DEF: StatusEffectDef = {
  id: "freeze",
  name: "Freeze",
  description: "Frozen solid.",
  durationTicks: 5,
  maxStacks: 1,
  effectType: "cc",
  statModifiers: [],
  cureItems: [],
};

const STRENGTH_BUFF_DEF: StatusEffectDef = {
  id: "strength_boost",
  name: "Strength Boost",
  description: "Stronger.",
  durationTicks: 4,
  maxStacks: 1,
  effectType: "buff",
  statModifiers: [{ stat: "strength", value: 5, mode: "add" }],
  cureItems: [],
};

const DEFENCE_DEBUFF_DEF: StatusEffectDef = {
  id: "defence_weaken",
  name: "Defence Weaken",
  description: "Weaker defence.",
  durationTicks: 3,
  maxStacks: 2,
  effectType: "debuff",
  statModifiers: [{ stat: "defence", value: -3, mode: "add" }],
  cureItems: [],
};

function registries(
  effects: readonly StatusEffectDef[] = [],
): ContentRegistries {
  return makeRegistries({
    statusEffect: new Map(effects.map((e) => [e.id, e])),
  });
}

function setup(
  combat: Partial<CombatantComponent> & { health: number; maxHealth: number },
  effects: readonly StatusEffectDef[] = [],
  waterTile = false,
): {
  ctx: StatusEffectContext;
  world: World;
  owner: EntityId;
  deltas: DeltaAccumulator;
  map: ReturnType<typeof createRuntimeMap>;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  const tile = { x: 0, y: 0, plane: 0 as const };
  map.tiles.set(tileKey(tile), {
    tile,
    height: 0,
    underlayId: "grass",
    collision: 0,
    water: waterTile,
    bridge: false,
  });
  const owner = world.createEntity();
  world.setComponent(owner, "position", { entityId: owner, x: 0, y: 0, plane: 0 });
  world.setComponent(owner, "movement", { entityId: owner, mode: "walk", path: [] });
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
  const deltas = new DeltaAccumulator();
  return {
    ctx: {
      world,
      deltas,
      registries: registries(effects),
      map,
    },
    world,
    owner,
    deltas,
    map,
  };
}

function setupWithWater(
  combat: Partial<CombatantComponent> & { health: number; maxHealth: number },
  effects: readonly StatusEffectDef[] = [],
): {
  ctx: StatusEffectContext;
  world: World;
  owner: EntityId;
  deltas: DeltaAccumulator;
} {
  const { ctx, world, owner, deltas } = setup(combat, effects, true);
  return { ctx, world, owner, deltas };
}

describe("applyStatusEffect", () => {
  it("applies a new status effect to an entity", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);

    applyStatusEffect(ctx, owner, "poison");

    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects).toBeDefined();
    expect(statusEffects!.effects).toHaveLength(1);
    expect(statusEffects!.effects[0]).toMatchObject({
      statusEffectId: "poison",
      stacks: 1,
      remainingTicks: 4,
    });
  });

  it("stacks an existing effect up to maxStacks", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);

    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "poison");

    const statusEffects = world.getComponent(owner, "statusEffects");
    expect(statusEffects!.effects[0]!.stacks).toBe(3);
  });

  it("refreshes duration when re-applied", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);

    applyStatusEffect(ctx, owner, "poison");
    const statusEffects = world.getComponent(owner, "statusEffects")!;
    statusEffects.effects[0]!.remainingTicks = 1;
    applyStatusEffect(ctx, owner, "poison");

    expect(statusEffects.effects[0]!.remainingTicks).toBe(4);
  });

  it("returns false for unknown status effect ids", () => {
    const { ctx, owner } = setup({ health: 10, maxHealth: 10 });
    const result = applyStatusEffect(ctx, owner, "unknown");
    expect(result).toBe(false);
  });
});

describe("cureStatusEffect", () => {
  it("removes an active effect by id", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    applyStatusEffect(ctx, owner, "poison");

    const cured = cureStatusEffect(ctx, owner, "poison");

    expect(cured).toBe(true);
    expect(world.getComponent(owner, "statusEffects")).toBeUndefined();
  });

  it("returns false when the effect is not present", () => {
    const { ctx, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    const cured = cureStatusEffect(ctx, owner, "poison");
    expect(cured).toBe(false);
  });

  it("restores base stats when a buff is cured", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [STRENGTH_BUFF_DEF]);
    applyStatusEffect(ctx, owner, "strength_boost");
    processStatusEffects(ctx, 1);

    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    cureStatusEffect(ctx, owner, "strength_boost");

    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(10);
  });
});

describe("cureByItem", () => {
  it("cures effects that list the item as a cure", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    applyStatusEffect(ctx, owner, "poison");

    const cured = cureByItem(ctx, owner, "antidote");

    expect(cured).toEqual(["poison"]);
    expect(world.getComponent(owner, "statusEffects")).toBeUndefined();
  });

  it("returns empty when no effects match the cure item", () => {
    const { ctx, owner } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    applyStatusEffect(ctx, owner, "poison");

    const cured = cureByItem(ctx, owner, "random_item");

    expect(cured).toEqual([]);
  });
});

describe("processStatusEffects — poison", () => {
  it("deals damage per tick and removes the effect after duration", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    applyStatusEffect(ctx, owner, "poison");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "damage" } },
    ]);

    processStatusEffects(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.health).toBe(6);

    processStatusEffects(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.health).toBe(4);

    processStatusEffects(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.health).toBe(2);

    // After 4 ticks, effect should be gone
    processStatusEffects(ctx, 5);
    expect(world.getComponent(owner, "combatant")?.health).toBe(2);
    expect(world.getComponent(owner, "statusEffects")).toBeUndefined();
  });

  it("scales damage with stacks", () => {
    const { ctx, world, owner } = setup({ health: 20, maxHealth: 20 }, [POISON_DEF]);
    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "poison");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(14); // 20 - (2 * 3)
  });
});

describe("processStatusEffects — burn", () => {
  it("deals periodic damage", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 }, [BURN_DEF]);
    applyStatusEffect(ctx, owner, "burn");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(7);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 3, type: "damage" } },
    ]);
  });

  it("reduces burn damage when the entity is on water", () => {
    const { ctx, world, owner, deltas } = setupWithWater(
      { health: 10, maxHealth: 10 },
      [BURN_DEF],
    );
    applyStatusEffect(ctx, owner, "burn");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(9);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 1, type: "damage" } },
    ]);
  });
});

describe("processStatusEffects — freeze", () => {
  it("blocks movement while frozen", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [FREEZE_DEF]);
    applyStatusEffect(ctx, owner, "freeze");

    processStatusEffects(ctx, 1);
    const movement = world.getComponent(owner, "movement");
    expect(movement?.blockedUntilTick).toBeGreaterThanOrEqual(2);
  });

  it("clears the movement path when frozen", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [FREEZE_DEF]);
    world.setComponent(owner, "movement", {
      entityId: owner,
      mode: "walk",
      path: [{ x: 1, y: 0, plane: 0 }],
    });
    applyStatusEffect(ctx, owner, "freeze");

    processStatusEffects(ctx, 1);
    const movement = world.getComponent(owner, "movement");
    expect(movement?.path).toHaveLength(0);
  });

  it("reduces freeze duration when fire damage is taken", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [FREEZE_DEF]);
    applyStatusEffect(ctx, owner, "freeze");
    world.getComponent(owner, "combatant")!.pendingHits = [
      {
        sourceId: 999 as EntityId,
        targetId: owner,
        applyTick: 1,
        style: "magic",
        attackRoll: 10,
        defenceRoll: 1,
        hitChance: 1,
        maxHit: 5,
        damage: 5,
        hitLanded: true,
      },
    ];

    processStatusEffects(ctx, 1);
    const statusEffects = world.getComponent(owner, "statusEffects");
    // 5 - 1 (fire) - 1 (tick) = 3 remaining after this tick decrements
    expect(statusEffects?.effects[0]?.remainingTicks).toBe(3);
  });
});

describe("processStatusEffects — buffs", () => {
  it("boosts combat stats while active", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [STRENGTH_BUFF_DEF]);
    applyStatusEffect(ctx, owner, "strength_boost");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffects(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffects(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    processStatusEffects(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);

    // After 4 ticks, effect expires
    processStatusEffects(ctx, 5);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(10);
    expect(world.getComponent(owner, "statusEffects")).toBeUndefined();
  });

  it("does not drop stats below 1", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [
      {
        ...DEFENCE_DEBUFF_DEF,
        statModifiers: [{ stat: "defence", value: -20, mode: "add" }],
      },
    ]);
    applyStatusEffect(ctx, owner, "defence_weaken");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(1);
  });
});

describe("processStatusEffects — debuffs", () => {
  it("reduces combat stats while active", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [DEFENCE_DEBUFF_DEF]);
    applyStatusEffect(ctx, owner, "defence_weaken");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    processStatusEffects(ctx, 2);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    processStatusEffects(ctx, 3);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(7);

    // After 3 ticks, effect expires
    processStatusEffects(ctx, 4);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(10);
  });

  it("stacks debuffs and combines the stat reductions", () => {
    const { ctx, world, owner } = setup({ health: 10, maxHealth: 10 }, [DEFENCE_DEBUFF_DEF]);
    applyStatusEffect(ctx, owner, "defence_weaken");
    applyStatusEffect(ctx, owner, "defence_weaken");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.defenceLevel).toBe(4); // 10 - 3*2
  });
});

describe("processStatusEffects — multiple concurrent effects", () => {
  it("handles poison and a buff at the same time", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 }, [
      POISON_DEF,
      STRENGTH_BUFF_DEF,
    ]);
    applyStatusEffect(ctx, owner, "poison");
    applyStatusEffect(ctx, owner, "strength_boost");

    processStatusEffects(ctx, 1);
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
    expect(world.getComponent(owner, "combatant")?.strengthLevel).toBe(15);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "damage" } },
    ]);
  });
});

describe("tick phase ordering", () => {
  it("runs status effects after damage resolution and before food heals", () => {
    const { ctx, world, owner, deltas } = setup({ health: 10, maxHealth: 10 }, [POISON_DEF]);
    const tickLoop = new TickLoop();

    applyStatusEffect(ctx, owner, "poison");

    // Phase 8: delayed hit deals 5 -> health 5
    tickLoop.registerPhase(TickPhase.DamageResolutionEvents, () => {
      const combatant = world.getComponent(owner, "combatant");
      if (combatant) {
        combatant.health -= 5;
        deltas.markHitsplat({ entityId: owner, hitsplat: { amount: 5, type: "damage" } });
      }
    });

    // Phase 9: status effects (poison) -> health 3
    tickLoop.registerPhase(TickPhase.StatusEffects, () => {
      processStatusEffects(ctx, tickLoop.currentTick);
    });

    // Phase 10: food heal 5 -> health 8
    tickLoop.registerPhase(TickPhase.FoodPotionPrayerStatChanges, () => {
      const combatant = world.getComponent(owner, "combatant");
      if (combatant) {
        const before = combatant.health;
        const after = Math.min(combatant.maxHealth, before + 5);
        combatant.health = after;
        deltas.markHitsplat({ entityId: owner, hitsplat: { amount: after - before, type: "heal" } });
      }
    });

    tickLoop.runOneTick();
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
  });
});
