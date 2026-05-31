import { REGION_SIZE, entityId, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { loadAllRegionMapsIntoWorld } from "./region-loader";
import { createRuntimeMap } from "./runtime-map";

async function loadSeedRegion() {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  const summaries = loadAllRegionMapsIntoWorld(world, map, content.registries);
  return { world, map, summaries };
}

describe("region loader", () => {
  it("loads the seed 64x64 region terrain", async () => {
    const { map, summaries } = await loadSeedRegion();

    expect(summaries).toEqual([
      {
        regionId: "0:0:0",
        tileCount: REGION_SIZE * REGION_SIZE,
        objectCount: 13,
        npcCount: 7,
        groundItemCount: 2,
        resourceNodeCount: 7,
        triggerCount: 5,
      },
    ]);
    expect(map.tiles.size).toBe(REGION_SIZE * REGION_SIZE);
    expect(map.tiles.get(tileKey({ x: 30, y: 30, plane: 0 }))?.underlayId).toBe("wood_floor");
    expect(map.tiles.get(tileKey({ x: 29, y: 28, plane: 0 }))?.underlayId).toBe("dirt_path");
    expect(map.tiles.get(tileKey({ x: 27, y: 27, plane: 0 }))?.zoneId).toBe("village");
  });

  it("instantiates runtime entities while preserving content ids", async () => {
    const { world } = await loadSeedRegion();

    expect(world.stores.object.size).toBe(13);
    expect(world.stores.npc.size).toBe(7);
    expect(world.stores.groundItem.size).toBe(2);
    expect(world.stores.resourceNode.size).toBe(7);

    const firstObject = world.stores.object.get(entityId(0));
    expect(firstObject?.entityId).toBe(0);
    expect(firstObject?.objectId).toBe("quest_oven");
    expect(firstObject?.objectId).not.toBe(String(firstObject?.entityId));

    const firstNpc = world.stores.npc.get(entityId(13));
    expect(firstNpc?.npcId).toBe("baker");
    expect(world.stores.actor.get(entityId(13))?.name).toBe("Baker");

    const firstGroundItem = world.stores.groundItem.get(entityId(20));
    expect(firstGroundItem).toMatchObject({ itemId: "pennywrought_axe", quantity: 1 });
  });

  it("loads maps deterministically", async () => {
    const first = await loadSeedRegion();
    const second = await loadSeedRegion();

    expect(Array.from(first.world.stores.object.entries())).toEqual(
      Array.from(second.world.stores.object.entries()),
    );
    expect(Array.from(first.world.stores.npc.entries())).toEqual(
      Array.from(second.world.stores.npc.entries()),
    );
    expect(Array.from(first.map.tiles.entries())).toEqual(Array.from(second.map.tiles.entries()));
  });
});
