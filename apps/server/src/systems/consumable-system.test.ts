import { describe, expect, it } from "vitest";
import type { CombatantComponent } from "../ecs/components";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { TickLoop, TickPhase } from "../sim/tick-loop";
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
  return { world, owner, deltas, consumables };
}

describe("ConsumableSystem.processConsumablePhase", () => {
  it("restores HP up to max and emits a heal hitsplat plus a refreshed health bar", () => {
    const { world, owner, deltas, consumables } = setup({ health: 4, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas });

    expect(world.getComponent(owner, "combatant")?.health).toBe(9);
    const dirty = deltas.peek();
    expect(dirty.hitsplats).toEqual([{ entityId: owner, hitsplat: { amount: 5, type: "heal" } }]);
    const update = dirty.entityUpdates.find((u) => u.entityId === owner);
    expect(update?.changes.healthBar).toEqual({ current: 9, max: 10 });
  });

  it("never overheals beyond max HP — the hitsplat shows only the amount restored", () => {
    const { world, owner, deltas, consumables } = setup({ health: 8, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas });

    expect(world.getComponent(owner, "combatant")?.health).toBe(10);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: owner, hitsplat: { amount: 2, type: "heal" } },
    ]);
  });

  it("emits nothing when the actor is already at full health", () => {
    const { world, owner, deltas, consumables } = setup({ health: 10, maxHealth: 10 });
    consumables.enqueueHeal(owner, 5);
    consumables.processConsumablePhase({ world, deltas });

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
    const { world, owner, deltas, consumables } = setup({ health: 1, maxHealth: 10 });
    consumables.enqueueHeal(owner, 3);
    consumables.processConsumablePhase({ world, deltas });
    consumables.processConsumablePhase({ world, deltas }); // no-op: queue already drained

    expect(world.getComponent(owner, "combatant")?.health).toBe(4);
    expect(consumables.pendingCount).toBe(0);
  });

  it("no-ops for an entity without a combatant", () => {
    const { world, owner, deltas, consumables } = setup();
    consumables.enqueueHeal(owner, 5);
    expect(() => consumables.processConsumablePhase({ world, deltas })).not.toThrow();
    expect(deltas.peek().hitsplats).toBeUndefined();
  });
});

describe("tick-phase priority: damage resolves before food heals", () => {
  // POC_SPEC §13.9 / §9.1: FoodPotionPrayerStatChanges (phase 9) runs strictly after
  // DamageResolutionEvents (phase 8). A hit that resolves on the same tick as an eat must
  // therefore land *before* the heal. We register a stand-in damage handler (combat is E10)
  // and assert the final HP reflects damage-then-heal, not heal-then-damage.
  it("applies a same-tick pending hit before the queued heal", () => {
    const { world, owner, deltas, consumables } = setup({ health: 10, maxHealth: 10 });
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
      consumables.processConsumablePhase({ world, deltas });
    });

    consumables.enqueueHeal(owner, 5);
    tickLoop.runOneTick();

    // 8 proves damage-then-heal. Heal-then-damage would have left 3 (10+5 capped, then -7).
    expect(world.getComponent(owner, "combatant")?.health).toBe(8);
  });
});
