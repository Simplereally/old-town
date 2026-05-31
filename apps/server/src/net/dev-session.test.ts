import {
  ACTIVE_SCENE_SIZE,
  CHARACTER_SNAPSHOT_VERSION,
  type CharacterSnapshot,
  PROTOCOL_VERSION,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { aggregateBonuses } from "../items/equipment";
import { MemoryPersistenceAdapter, type PersistenceAdapter } from "../persistence";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap } from "../world/runtime-map";
import { DEV_SPAWN_TILE, DevSessionManager } from "./dev-session";

async function setup(persistence?: PersistenceAdapter) {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, content.registries);
  return {
    world,
    registries: content.registries,
    manager: new DevSessionManager(world, map, content.registries, persistence),
  };
}

describe("DevSessionManager", () => {
  it("creates two independent dev player sessions with full-state bootstraps", async () => {
    const { world, manager } = await setup();

    const first = await manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 7, 4_200);
    const second = await manager.bootstrap({ id: "session-2", characterId: "dev-b" }, 8, 4_800);

    expect(first.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(first.tick).toBe(7);
    expect(first.worldConstants?.activeSceneSize).toBe(ACTIVE_SCENE_SIZE);
    expect(first.selfEntityId).not.toBe(second.selfEntityId);
    expect(second.entities.map((entity) => entity.entityId)).toEqual(
      expect.arrayContaining([first.selfEntityId, second.selfEntityId]),
    );
    expect(second.entities.map((entity) => entity.kind)).toEqual(
      expect.arrayContaining(["object", "npc", "ground_item", "player"]),
    );
    expect(world.getComponent(first.selfEntityId, "position")).toMatchObject(DEV_SPAWN_TILE);
    expect(world.getComponent(first.selfEntityId, "player")?.sessionId).toBe("session-1");
  });

  it("seeds inventory, equipment, skills, and visible region loads", async () => {
    const { world, manager } = await setup();

    const fullState = await manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 0, 0);

    expect(fullState.inventory).toEqual({
      containerId: `inventory:${fullState.selfEntityId}`,
      changes: [
        { slot: 0, itemId: "pennywrought_axe", quantity: 1, uid: 1 },
        { slot: 1, itemId: "pennywrought_pickaxe", quantity: 1, uid: 2 },
        { slot: 2, itemId: "bread", quantity: 5, uid: 3 },
        { slot: 3, itemId: "raw_fish", quantity: 5, uid: 4 },
        { slot: 4, itemId: "ember_bead", quantity: 20, uid: 5 },
        { slot: 5, itemId: "gust_bead", quantity: 20, uid: 6 },
        { slot: 6, itemId: "wit_bead", quantity: 20, uid: 7 },
        { slot: 7, itemId: "writ_bead", quantity: 20, uid: 8 },
      ],
    });
    const skillIds = fullState.skills?.map((skill) => skill.skillId) ?? [];
    expect(skillIds).toEqual([...skillIds].toSorted());
    expect(skillIds).toEqual(
      expect.arrayContaining([
        "attack",
        "cooking",
        "defence",
        "hitpoints",
        "magic",
        "mining",
        "strength",
        "woodcutting",
      ]),
    );
    const equipment = world.getComponent(fullState.selfEntityId, "equipment");
    expect(equipment?.slots).toEqual({});
    expect(equipment?.bonuses.slashAttack).toBe(0);
    const regionLoads = fullState.regionLoads ?? [];
    expect(regionLoads.length).toBe(4);
    expect(regionLoads.map((r) => r.regionId).sort()).toEqual(["0:0:0", "0:1:0", "1:0:0", "1:1:0"]);
  });

  it("hides private ground items from full-state bootstraps until reveal", async () => {
    const { world, manager } = await setup();
    const owner = await manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 0, 0);
    const groundItem = world.createEntity();
    world.setComponent(groundItem, "position", {
      entityId: groundItem,
      ...DEV_SPAWN_TILE,
    });
    world.setComponent(groundItem, "groundItem", {
      entityId: groundItem,
      itemId: "coin",
      quantity: 3,
      ownerId: owner.selfEntityId,
      publicAtTick: 10,
      despawnTick: 100,
    });

    const hidden = await manager.bootstrap({ id: "session-2", characterId: "dev-b" }, 9, 5_400);
    const publicState = await manager.bootstrap(
      { id: "session-3", characterId: "dev-c" },
      10,
      6_000,
    );

    expect(hidden.entities.some((entity) => entity.entityId === groundItem)).toBe(false);
    expect(publicState.entities.some((entity) => entity.entityId === groundItem)).toBe(true);
  });

  it("destroys dev entities on disconnect", async () => {
    const { world, manager } = await setup();
    const session = { id: "session-1", characterId: "dev-a" };
    const fullState = await manager.bootstrap(session, 0, 0);

    await manager.remove(session);

    expect(world.isAlive(fullState.selfEntityId)).toBe(false);
    expect(manager.getEntityId(session)).toBeUndefined();
  });

  it("saves and reloads persisted character core state", async () => {
    const persistence = new MemoryPersistenceAdapter();
    const { world, manager, registries } = await setup(persistence);
    const session = { id: "session-1", characterId: "dev-a" };
    const fullState = await manager.bootstrap(session, 2, 1_200);
    const playerId = fullState.selfEntityId;

    world.setComponent(playerId, "position", { entityId: playerId, x: 44, y: 46, plane: 0 });
    const combatant = world.getComponent(playerId, "combatant");
    expect(combatant).toBeDefined();
    if (combatant) {
      world.setComponent(playerId, "combatant", { ...combatant, health: 7, maxHealth: 10 });
    }
    const skills = world.getComponent(playerId, "skills");
    expect(skills).toBeDefined();
    if (skills) {
      skills.skills.cooking = { level: 2, xp: 90, boost: 1, drain: 0 };
    }
    const inventory = world.getComponent(playerId, "inventory");
    expect(inventory).toBeDefined();
    if (inventory) {
      inventory.slots[8] = { itemId: "coin", quantity: 123, uid: 9 };
      inventory.nextUid = 10;
    }
    const equipment = world.getComponent(playerId, "equipment");
    expect(equipment).toBeDefined();
    if (equipment) {
      equipment.slots.weapon = "pennywrought_shortblade";
      equipment.bonuses = aggregateBonuses(equipment, registries.item);
    }
    world.setComponent(playerId, "vars", {
      entityId: playerId,
      values: {
        "quest.smoke_over_old_town.stage": 40,
        "quest.smoke_over_old_town.completed": false,
        "quest.points": 1,
        "unlock.bakery_range": true,
      },
    });

    await manager.remove(session, 9_000);

    const saved = await persistence.loadCharacter("dev-a");
    expect(saved).toMatchObject({
      characterId: "dev-a",
      savedAt: 9_000,
      position: { x: 44, y: 46, plane: 0 },
      hitpoints: { health: 7, maxHealth: 10 },
      skills: { cooking: { level: 2, xp: 90, boost: 1, drain: 0 } },
      equipment: { slots: { weapon: "pennywrought_shortblade" } },
      vars: {
        "quest.smoke_over_old_town.stage": 40,
        "quest.smoke_over_old_town.completed": false,
        "quest.points": 1,
        "unlock.bakery_range": true,
      },
    });
    expect(saved?.inventory.slots).toContainEqual({
      slot: 8,
      itemId: "coin",
      quantity: 123,
      uid: 9,
    });

    const reconnect = { id: "session-2", characterId: "dev-a" };
    const reloaded = await manager.bootstrap(reconnect, 10, 6_000);
    const reloadedId = reloaded.selfEntityId;
    expect(world.getComponent(reloadedId, "position")).toMatchObject({ x: 44, y: 46, plane: 0 });
    expect(world.getComponent(reloadedId, "combatant")).toMatchObject({ health: 7, maxHealth: 10 });
    expect(world.getComponent(reloadedId, "skills")?.skills.cooking).toEqual({
      level: 2,
      xp: 90,
      boost: 1,
      drain: 0,
    });
    expect(world.getComponent(reloadedId, "inventory")?.slots[8]).toEqual({
      itemId: "coin",
      quantity: 123,
      uid: 9,
    });
    expect(world.getComponent(reloadedId, "equipment")?.slots.weapon).toBe(
      "pennywrought_shortblade",
    );
    expect(world.getComponent(reloadedId, "equipment")?.bonuses.slashAttack).toBe(5);
    expect(world.getComponent(reloadedId, "vars")?.values).toMatchObject({
      "quest.smoke_over_old_town.stage": 40,
      "quest.points": 1,
      "unlock.bakery_range": true,
    });
  });

  it("rejects invalid loaded snapshots without creating a player entity", async () => {
    const invalidSnapshot = {
      version: CHARACTER_SNAPSHOT_VERSION + 1,
      characterId: "dev-a",
    } as unknown as CharacterSnapshot;
    const persistence: PersistenceAdapter = {
      kind: "memory",
      enabled: true,
      loadCharacter: async () => invalidSnapshot,
      saveCharacter: async () => undefined,
      recordItemTransaction: async () => undefined,
      recentItemTransactions: async () => [],
    };
    const { world, manager } = await setup(persistence);
    const baseline = world.aliveEntityCount();
    const session = { id: "session-1", characterId: "dev-a" };

    await expect(manager.bootstrap(session, 0, 0)).rejects.toThrow();

    expect(world.aliveEntityCount()).toBe(baseline);
    expect(manager.getEntityId(session)).toBeUndefined();
  });
});
