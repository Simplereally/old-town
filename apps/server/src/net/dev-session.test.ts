import { ACTIVE_SCENE_SIZE, PROTOCOL_VERSION } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap } from "../world/runtime-map";
import { DEV_SPAWN_TILE, DevSessionManager } from "./dev-session";

async function setup() {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, content.registries);
  return { world, manager: new DevSessionManager(world, map, content.registries) };
}

describe("DevSessionManager", () => {
  it("creates two independent dev player sessions with full-state bootstraps", async () => {
    const { world, manager } = await setup();

    const first = manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 7, 4_200);
    const second = manager.bootstrap({ id: "session-2", characterId: "dev-b" }, 8, 4_800);

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

    const fullState = manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 0, 0);

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
    const owner = manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 0, 0);
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

    const hidden = manager.bootstrap({ id: "session-2", characterId: "dev-b" }, 9, 5_400);
    const publicState = manager.bootstrap({ id: "session-3", characterId: "dev-c" }, 10, 6_000);

    expect(hidden.entities.some((entity) => entity.entityId === groundItem)).toBe(false);
    expect(publicState.entities.some((entity) => entity.entityId === groundItem)).toBe(true);
  });

  it("destroys dev entities on disconnect", async () => {
    const { world, manager } = await setup();
    const session = { id: "session-1", characterId: "dev-a" };
    const fullState = manager.bootstrap(session, 0, 0);

    manager.remove(session);

    expect(world.isAlive(fullState.selfEntityId)).toBe(false);
    expect(manager.getEntityId(session)).toBeUndefined();
  });
});
