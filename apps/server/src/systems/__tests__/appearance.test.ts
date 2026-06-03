import type { EntityId, ItemDef } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { createWorld } from "../../ecs/world";
import { createEquipment } from "../../items/equipment";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import {
  clearAppearanceCache,
  computeAppearance,
  processAppearanceUpdates,
  recalculateAppearance,
} from "../appearance-system";

function makeActor(id: EntityId, name: string, appearanceId: string) {
  return {
    entityId: id,
    name,
    level: 1,
    appearanceId,
  };
}

function makeItems(): Map<string, ItemDef> {
  const map = new Map<string, ItemDef>();
  map.set("bronze_helm", {
    id: "bronze_helm",
    name: "Bronze helm",
    stackable: false,
    tradeable: true,
    examine: "A bronze helmet.",
    icon: "icon_bronze_helm",
    model: "model_bronze_helm",
    value: 1,
    options: ["wear"],
    tags: [],
    equipment: {
      slot: "head",
      bonuses: {},
      requirements: [],
    },
  });
  map.set("iron_sword", {
    id: "iron_sword",
    name: "Iron sword",
    stackable: false,
    tradeable: true,
    examine: "An iron sword.",
    icon: "icon_iron_sword",
    model: "model_iron_sword",
    value: 1,
    options: ["wield"],
    tags: [],
    equipment: {
      slot: "weapon",
      bonuses: {},
      requirements: [],
    },
  });
  map.set("leather_body", {
    id: "leather_body",
    name: "Leather body",
    stackable: false,
    tradeable: true,
    examine: "A leather body.",
    icon: "icon_leather_body",
    model: "model_leather_body",
    value: 1,
    options: ["wear"],
    tags: [],
    equipment: {
      slot: "body",
      bonuses: {},
      requirements: [],
    },
  });
  map.set("colored_cape", {
    id: "colored_cape",
    name: "Colored cape",
    stackable: false,
    tradeable: true,
    examine: "A colorful cape.",
    icon: "icon_colored_cape",
    value: 1,
    options: ["wear"],
    tags: [],
    visualIdentity: {
      primary: "16711680",
      secondary: "65280",
    },
    equipment: {
      slot: "cape",
      bonuses: {},
      requirements: [],
    },
  });
  return map;
}

describe("appearance-system", () => {
  const items = makeItems();

  beforeEach(() => {
    clearAppearanceCache();
  });

  it("returns base actor appearance when no equipment is worn", () => {
    const id = entityId(1);
    const equipment = createEquipment(id);
    const actor = makeActor(id, "Test", "dev_player");
    const appearance = computeAppearance(actor, equipment, items);
    expect(appearance.bodyId).toBe("dev_player");
    expect(appearance.colors).toBeUndefined();
    expect(appearance.name).toBe("Test");
  });

  it("includes body-slot item model in bodyId", () => {
    const id = entityId(1);
    const equipment = createEquipment(id);
    equipment.slots.body = "leather_body";
    const actor = makeActor(id, "Test", "dev_player");
    const appearance = computeAppearance(actor, equipment, items);
    expect(appearance.bodyId).toBe("dev_player|body:model_leather_body");
  });

  it("appends all equipped item models to bodyId in canonical slot order", () => {
    const id = entityId(1);
    const equipment = createEquipment(id);
    equipment.slots.head = "bronze_helm";
    equipment.slots.weapon = "iron_sword";
    const actor = makeActor(id, "Test", "dev_player");
    const appearance = computeAppearance(actor, equipment, items);
    expect(appearance.bodyId).toBe("dev_player|head:model_bronze_helm|weapon:model_iron_sword");
  });

  it("derives colors from visualIdentity numeric values", () => {
    const id = entityId(1);
    const equipment = createEquipment(id);
    equipment.slots.cape = "colored_cape";
    const actor = makeActor(id, "Test", "dev_player");
    const appearance = computeAppearance(actor, equipment, items);
    expect(appearance.colors).toEqual([16711680, 65280]);
  });

  it("emits appearance update on first recalculate", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    world.setComponent(player, "equipment", createEquipment(player));
    const deltas = new DeltaAccumulator();

    recalculateAppearance({ world, deltas, items }, player);

    const entityUpdates = deltas.peek().entityUpdates;
    expect(entityUpdates).toHaveLength(1);
    expect(entityUpdates[0]?.changes.appearance?.bodyId).toBe("dev_player");
  });

  it("does not emit redundant appearance updates", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    world.setComponent(player, "equipment", createEquipment(player));
    const deltas = new DeltaAccumulator();

    recalculateAppearance({ world, deltas, items }, player);
    recalculateAppearance({ world, deltas, items }, player);

    const entityUpdates = deltas.peek().entityUpdates;
    expect(entityUpdates).toHaveLength(1);
  });

  it("emits update when equipment changes", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    const equipment = createEquipment(player);
    world.setComponent(player, "equipment", equipment);
    const deltas = new DeltaAccumulator();

    recalculateAppearance({ world, deltas, items }, player);
    expect(deltas.peek().entityUpdates).toHaveLength(1);
    expect(deltas.peek().entityUpdates[0]?.changes.appearance?.bodyId).toBe("dev_player");

    equipment.slots.body = "leather_body";
    recalculateAppearance({ world, deltas, items }, player);

    const entityUpdates = deltas.peek().entityUpdates;
    expect(entityUpdates).toHaveLength(1);
    expect(entityUpdates[0]?.changes.appearance?.bodyId).toBe("dev_player|body:model_leather_body");
  });

  it("emits update when equipment is removed", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    const equipment = createEquipment(player);
    equipment.slots.body = "leather_body";
    world.setComponent(player, "equipment", equipment);
    const deltas = new DeltaAccumulator();

    recalculateAppearance({ world, deltas, items }, player);
    expect(deltas.peek().entityUpdates).toHaveLength(1);
    expect(deltas.peek().entityUpdates[0]?.changes.appearance?.bodyId).toBe(
      "dev_player|body:model_leather_body",
    );

    delete equipment.slots.body;
    recalculateAppearance({ world, deltas, items }, player);

    const entityUpdates = deltas.peek().entityUpdates;
    expect(entityUpdates).toHaveLength(1);
    expect(entityUpdates[0]?.changes.appearance?.bodyId).toBe("dev_player");
  });

  it("processes all entities with equipment in the tick phase", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();

    const p1 = world.createEntity();
    world.setComponent(p1, "actor", makeActor(p1, "One", "dev_player"));
    world.setComponent(p1, "equipment", createEquipment(p1));

    const p2 = world.createEntity();
    world.setComponent(p2, "actor", makeActor(p2, "Two", "dev_player"));
    world.setComponent(p2, "equipment", createEquipment(p2));

    processAppearanceUpdates({ world, deltas, items });

    const entityUpdates = deltas.peek().entityUpdates;
    expect(entityUpdates).toHaveLength(2);
    expect(entityUpdates.map((u) => u.entityId).toSorted()).toEqual([p1, p2].toSorted());
  });

  it("clears cache for removed entities and skips them", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();

    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    world.setComponent(player, "equipment", createEquipment(player));

    processAppearanceUpdates({ world, deltas, items });
    expect(deltas.peek().entityUpdates).toHaveLength(1);

    world.destroyEntity(player);
    processAppearanceUpdates({ world, deltas, items });
    expect(deltas.peek().entityUpdates).toHaveLength(1);
  });

  it("broadcasts appearance payload in delta accumulator", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();

    const player = world.createEntity();
    world.setComponent(player, "actor", makeActor(player, "Test", "dev_player"));
    const equipment = createEquipment(player);
    equipment.slots.head = "bronze_helm";
    equipment.slots.body = "leather_body";
    world.setComponent(player, "equipment", equipment);

    processAppearanceUpdates({ world, deltas, items });

    const update = deltas.peek().entityUpdates[0];
    expect(update).toBeDefined();
    expect(update?.entityId).toBe(player);
    expect(update?.changes.appearance).toBeDefined();
    expect(update?.changes.appearance?.bodyId).toBe(
      "dev_player|head:model_bronze_helm|body:model_leather_body",
    );
    expect(update?.changes.appearance?.name).toBe("Test");
  });
});
