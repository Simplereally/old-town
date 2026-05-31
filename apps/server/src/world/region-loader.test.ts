import { entityId, REGION_SIZE, tileKey } from "@old-town/shared";
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

    expect(world.componentCount("object")).toBe(13);
    expect(world.componentCount("npc")).toBe(7);
    expect(world.componentCount("groundItem")).toBe(2);
    expect(world.componentCount("resourceNode")).toBe(7);

    const firstObject = world.getComponent(entityId(0), "object");
    expect(firstObject?.entityId).toBe(0);
    expect(firstObject?.objectId).toBe("quest_oven");
    expect(firstObject?.objectId).not.toBe(String(firstObject?.entityId));

    const firstNpc = world.getComponent(entityId(13), "npc");
    expect(firstNpc?.npcId).toBe("mara_bellkeeper");
    expect(world.getComponent(entityId(13), "actor")?.name).toBe("Mara Bellkeeper");

    const firstGroundItem = world.getComponent(entityId(20), "groundItem");
    expect(firstGroundItem).toMatchObject({ itemId: "pennywrought_axe", quantity: 1 });
  });

  it("loads maps deterministically", async () => {
    const first = await loadSeedRegion();
    const second = await loadSeedRegion();

    expect(first.world.componentEntries("object")).toEqual(second.world.componentEntries("object"));
    expect(first.world.componentEntries("npc")).toEqual(second.world.componentEntries("npc"));
    expect(Array.from(first.map.tiles.entries())).toEqual(Array.from(second.map.tiles.entries()));
  });
});
