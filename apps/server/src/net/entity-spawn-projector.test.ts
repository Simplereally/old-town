import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { createEquipment } from "../items/equipment";
import { createInventory } from "../items/inventory";
import { projectEntity, projectWorldEntities, spawnKind } from "./entity-spawn-projector";

function setup() {
  const world = createWorld();
  return { world };
}

describe("EntitySpawnProjector", () => {
  it("projects a player with position, actor, and combatant", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "position", { entityId, x: 10, y: 20, plane: 0 });
    world.setComponent(entityId, "player", {
      entityId,
      accountId: "dev",
      sessionId: "s1",
      interestRadius: 64,
    });
    world.setComponent(entityId, "actor", {
      entityId,
      name: "Hero",
      level: 5,
      appearanceId: "dev_player",
    });
    world.setComponent(entityId, "combatant", {
      entityId,
      health: 50,
      maxHealth: 100,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });

    const spawn = projectEntity(world, entityId);
    expect(spawn).toEqual({
      entityId,
      kind: "player",
      tile: { x: 10, y: 20, plane: 0 },
      moveSpeed: "stationary",
      appearance: { name: "Hero", bodyId: "dev_player" },
      healthBar: { current: 50, max: 100 },
    });
  });

  it("projects an NPC with defId", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "position", { entityId, x: 5, y: 5, plane: 0 });
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: "town_guard",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 3,
    });

    const spawn = projectEntity(world, entityId);
    expect(spawn).toEqual({
      entityId,
      kind: "npc",
      tile: { x: 5, y: 5, plane: 0 },
      defId: "town_guard",
      moveSpeed: "stationary",
    });
  });

  it("projects an object with defId", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "position", { entityId, x: 3, y: 3, plane: 0 });
    world.setComponent(entityId, "object", {
      entityId,
      objectId: "oak_tree",
      facing: 0,
      variant: 0,
    });

    const spawn = projectEntity(world, entityId);
    expect(spawn).toEqual({
      entityId,
      kind: "object",
      tile: { x: 3, y: 3, plane: 0 },
      defId: "oak_tree",
    });
  });

  it("projects a ground item with itemId and quantity", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "position", { entityId, x: 7, y: 7, plane: 0 });
    world.setComponent(entityId, "groundItem", {
      entityId,
      itemId: "bronze_sword",
      quantity: 1,
    });

    const spawn = projectEntity(world, entityId);
    expect(spawn).toEqual({
      entityId,
      kind: "ground_item",
      tile: { x: 7, y: 7, plane: 0 },
      defId: "bronze_sword",
      quantity: 1,
    });
  });

  it("returns undefined for dead entity", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.destroyEntity(entityId);
    expect(projectEntity(world, entityId)).toBeUndefined();
  });

  it("returns undefined for entity without position", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "object", {
      entityId,
      objectId: "oak_tree",
      facing: 0,
      variant: 0,
    });
    expect(projectEntity(world, entityId)).toBeUndefined();
  });

  it("projects all alive entities in world", () => {
    const { world } = setup();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "dev",
      sessionId: "s1",
      interestRadius: 64,
    });
    world.setComponent(player, "actor", {
      entityId: player,
      name: "Hero",
      level: 1,
      appearanceId: "dev",
    });
    world.setComponent(player, "inventory", createInventory(player, "inv", 28));
    world.setComponent(player, "equipment", createEquipment(player));

    const npc = world.createEntity();
    world.setComponent(npc, "position", { entityId: npc, x: 1, y: 1, plane: 0 });
    world.setComponent(npc, "npc", {
      entityId: npc,
      npcId: "guard",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
    });

    const object = world.createEntity();
    world.setComponent(object, "position", { entityId: object, x: 2, y: 2, plane: 0 });
    world.setComponent(object, "object", {
      entityId: object,
      objectId: "tree",
      facing: 0,
      variant: 0,
    });

    const item = world.createEntity();
    world.setComponent(item, "position", { entityId: item, x: 3, y: 3, plane: 0 });
    world.setComponent(item, "groundItem", {
      entityId: item,
      itemId: "coin",
      quantity: 5,
    });

    const result = projectWorldEntities(world);
    expect(result.spawns).toHaveLength(4);
    expect(result.spawns.map((s) => s.kind)).toContain("player");
    expect(result.spawns.map((s) => s.kind)).toContain("npc");
    expect(result.spawns.map((s) => s.kind)).toContain("object");
    expect(result.spawns.map((s) => s.kind)).toContain("ground_item");
    expect(result.skipped).toEqual([]);
  });

  it("skips entities missing position", () => {
    const { world } = setup();
    const entityId = world.createEntity();
    world.setComponent(entityId, "player", {
      entityId,
      accountId: "dev",
      sessionId: "s1",
      interestRadius: 64,
    });

    const result = projectWorldEntities(world);
    expect(result.spawns).toHaveLength(0);
    expect(result.skipped).toContain(entityId);
  });

  it("spawnKind returns correct kind", () => {
    const { world } = setup();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "dev",
      sessionId: "s1",
      interestRadius: 64,
    });
    expect(spawnKind(world, player)).toBe("player");

    const npc = world.createEntity();
    world.setComponent(npc, "position", { entityId: npc, x: 0, y: 0, plane: 0 });
    world.setComponent(npc, "npc", {
      entityId: npc,
      npcId: "goblin",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 2,
    });
    expect(spawnKind(world, npc)).toBe("npc");

    const object = world.createEntity();
    world.setComponent(object, "position", { entityId: object, x: 0, y: 0, plane: 0 });
    world.setComponent(object, "object", {
      entityId: object,
      objectId: "tree",
      facing: 0,
      variant: 0,
    });
    expect(spawnKind(world, object)).toBe("object");

    const item = world.createEntity();
    world.setComponent(item, "position", { entityId: item, x: 0, y: 0, plane: 0 });
    world.setComponent(item, "groundItem", {
      entityId: item,
      itemId: "coin",
      quantity: 1,
    });
    expect(spawnKind(world, item)).toBe("ground_item");

    const bare = world.createEntity();
    world.setComponent(bare, "position", { entityId: bare, x: 0, y: 0, plane: 0 });
    expect(spawnKind(world, bare)).toBeUndefined();
  });
});
