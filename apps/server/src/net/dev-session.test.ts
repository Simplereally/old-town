import { ACTIVE_SCENE_SIZE, PROTOCOL_VERSION } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap } from "../world/runtime-map";
import { DEV_SPAWN_TILE, DevSessionManager } from "./dev-session";

function setup() {
  const content = loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, content.registries);
  return { world, manager: new DevSessionManager(world, map, content.registries) };
}

describe("DevSessionManager", () => {
  it("creates two independent dev player sessions with full-state bootstraps", () => {
    const { world, manager } = setup();

    const first = manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 7, 4_200);
    const second = manager.bootstrap({ id: "session-2", characterId: "dev-b" }, 8, 4_800);

    expect(first.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(first.tick).toBe(7);
    expect(first.worldConstants?.activeSceneSize).toBe(ACTIVE_SCENE_SIZE);
    expect(first.selfEntityId).not.toBe(second.selfEntityId);
    expect(second.entities.map((entity) => entity.entityId)).toEqual([
      first.selfEntityId,
      second.selfEntityId,
    ]);
    expect(world.stores.position.get(first.selfEntityId)).toMatchObject(DEV_SPAWN_TILE);
    expect(world.stores.player.get(first.selfEntityId)?.sessionId).toBe("session-1");
  });

  it("seeds inventory, equipment, skills, and visible region loads", () => {
    const { world, manager } = setup();

    const fullState = manager.bootstrap({ id: "session-1", characterId: "dev-a" }, 0, 0);

    expect(fullState.inventory).toEqual({
      containerId: `inventory:${fullState.selfEntityId}`,
      changes: [
        { slot: 0, itemId: "pennywrought_axe", quantity: 1 },
        { slot: 1, itemId: "pennywrought_pickaxe", quantity: 1 },
      ],
    });
    expect(fullState.skills?.map((skill) => skill.skillId)).toEqual([
      "attack",
      "cooking",
      "defence",
      "hitpoints",
      "magic",
      "mining",
      "strength",
      "woodcutting",
    ]);
    expect(world.stores.equipment.get(fullState.selfEntityId)?.slots).toHaveProperty("slot_0");
    expect(fullState.regionLoads).toEqual([
      { region: { rx: 0, ry: 0, plane: 0 }, regionId: "0:0:0" },
    ]);
  });

  it("destroys dev entities on disconnect", () => {
    const { world, manager } = setup();
    const session = { id: "session-1", characterId: "dev-a" };
    const fullState = manager.bootstrap(session, 0, 0);

    manager.remove(session);

    expect(world.isAlive(fullState.selfEntityId)).toBe(false);
    expect(manager.getEntityId(session)).toBeUndefined();
  });
});
