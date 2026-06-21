import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  clearAppearanceCache,
  computeAppearance,
  recalculateAppearance,
} from "./appearance-system";

const HELMET_DEF = {
  id: "iron_helmet",
  name: "Iron Helmet",
  stackable: false,
  tradeable: true,
  examine: "A sturdy iron helmet.",
  icon: "icon_iron_helmet",
  value: 50,
  weight: 1.5,
  options: ["wear"],
  tags: [],
  equipment: {
    slot: "head" as const,
    bonuses: {},
    requirements: [],
  },
  model: "model_iron_helmet",
  visualIdentity: {
    color1: "100",
    color2: "200",
  },
};

const SWORD_DEF = {
  id: "iron_sword",
  name: "Iron Sword",
  stackable: false,
  tradeable: true,
  examine: "A sharp iron sword.",
  icon: "icon_iron_sword",
  value: 100,
  weight: 2.0,
  options: ["wield"],
  tags: [],
  equipment: {
    slot: "weapon" as const,
    bonuses: {},
    requirements: [],
  },
  model: "model_iron_sword",
};

const ITEMS: ReadonlyMap<string, import("@old-town/shared").ItemDef> = new Map([
  [HELMET_DEF.id, HELMET_DEF as import("@old-town/shared").ItemDef],
  [SWORD_DEF.id, SWORD_DEF as import("@old-town/shared").ItemDef],
]);

function must<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${label}`);
  }
  return value;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const entityId = world.createEntity();
  world.setComponent(entityId, "actor", {
    entityId,
    name: "TestPlayer",
    level: 1,
    appearanceId: "dev_player",
  });
  world.setComponent(entityId, "equipment", {
    entityId,
    slots: {},
    bonuses: {},
  });
  return { world, deltas, entityId };
}

describe("computeAppearance", () => {
  it("returns base appearance when no equipment", () => {
    const { world, entityId } = setup();
    const actor = must(world.getComponent(entityId, "actor"), "actor");
    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");

    const appearance = computeAppearance(actor, equipment, ITEMS);

    expect(appearance.bodyId).toBe("dev_player");
    expect(appearance.name).toBe("TestPlayer");
    expect(appearance.colors).toBeUndefined();
  });

  it("includes equipment model in bodyId", () => {
    const { world, entityId } = setup();
    const actor = must(world.getComponent(entityId, "actor"), "actor");
    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");
    equipment.slots.weapon = "iron_sword";

    const appearance = computeAppearance(actor, equipment, ITEMS);

    expect(appearance.bodyId).toBe("dev_player|weapon:model_iron_sword");
  });

  it("includes visual identity colors from equipment", () => {
    const { world, entityId } = setup();
    const actor = must(world.getComponent(entityId, "actor"), "actor");
    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");
    equipment.slots.head = "iron_helmet";

    const appearance = computeAppearance(actor, equipment, ITEMS);

    expect(appearance.colors).toEqual([100, 200]);
  });

  it("ignores unknown equipment items", () => {
    const { world, entityId } = setup();
    const actor = must(world.getComponent(entityId, "actor"), "actor");
    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");
    equipment.slots.weapon = "nonexistent_item";

    const appearance = computeAppearance(actor, equipment, ITEMS);

    expect(appearance.bodyId).toBe("dev_player");
  });
});

describe("recalculateAppearance", () => {
  it("emits delta when appearance changes", () => {
    const { world, deltas, entityId } = setup();
    clearAppearanceCache();
    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");
    equipment.slots.weapon = "iron_sword";
    world.setComponent(entityId, "equipment", equipment);

    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(1);
    expect(state.entityUpdates[0]?.changes?.appearance?.bodyId).toBe(
      "dev_player|weapon:model_iron_sword",
    );
  });

  it("does not emit delta when appearance is unchanged", () => {
    const { world, deltas, entityId } = setup();
    clearAppearanceCache();
    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);
    deltas.consume(0, 0);
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(0);
  });

  it("emits delta after equipment changes", () => {
    const { world, deltas, entityId } = setup();
    clearAppearanceCache();
    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);
    deltas.consume(0, 0);

    const equipment = must(world.getComponent(entityId, "equipment"), "equipment");
    equipment.slots.weapon = "iron_sword";
    world.setComponent(entityId, "equipment", equipment);
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(1);
  });

  it("does nothing when actor is missing", () => {
    const { world, deltas } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "equipment", {
      entityId,
      slots: {},
      bonuses: {},
    });
    clearAppearanceCache();

    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(0);
  });
});

describe("clearAppearanceCache", () => {
  it("clears cache for a specific entity", () => {
    const { world, deltas, entityId } = setup();
    clearAppearanceCache();
    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);
    deltas.consume(0, 0);
    clearAppearanceCache(entityId);
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(1);
  });

  it("clears cache for all entities", () => {
    const { world, deltas, entityId } = setup();
    clearAppearanceCache();
    const ctx = { world, deltas, items: ITEMS };
    recalculateAppearance(ctx, entityId);
    deltas.consume(0, 0);
    clearAppearanceCache();
    recalculateAppearance(ctx, entityId);

    const state = deltas.peek();
    expect(state.entityUpdates.length).toBe(1);
  });
});
