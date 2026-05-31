import { entityId, REGION_SIZE } from "@old-town/shared";
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
    const { summaries } = await loadSeedRegion();

    expect(summaries.length).toBe(4);
    expect(summaries.map((s) => s.regionId).sort()).toEqual(["0:0:0", "0:1:0", "1:0:0", "1:1:0"]);
    expect(summaries.reduce((sum, s) => sum + s.tileCount, 0)).toBe(4 * REGION_SIZE * REGION_SIZE);
    expect(summaries.reduce((sum, s) => sum + s.objectCount, 0)).toBe(32);
    expect(summaries.reduce((sum, s) => sum + s.npcCount, 0)).toBe(42);
    expect(summaries.reduce((sum, s) => sum + s.groundItemCount, 0)).toBe(1);
    expect(summaries.reduce((sum, s) => sum + s.triggerCount, 0)).toBe(23);
  });

  it("instantiates runtime entities while preserving content ids", async () => {
    const { world } = await loadSeedRegion();

    expect(world.componentCount("object")).toBe(32);
    expect(world.componentCount("npc")).toBe(42);
    expect(world.componentCount("groundItem")).toBe(1);

    const firstObject = world.getComponent(entityId(0), "object");
    expect(firstObject?.entityId).toBe(0);
    expect(firstObject?.objectId).toBe("oldroad_signpost");
    expect(firstObject?.objectId).not.toBe(String(firstObject?.entityId));

    const firstNpc = world.getComponent(entityId(19), "npc");
    expect(firstNpc?.npcId).toBe("stray_dog");
    expect(world.getComponent(entityId(19), "actor")?.name).toBe("Stray Dog");

    const firstGroundItem = world.getComponent(entityId(56), "groundItem");
    expect(firstGroundItem).toMatchObject({ itemId: "pennywrought_pickaxe", quantity: 1 });
  });

  it("loads maps deterministically", async () => {
    const first = await loadSeedRegion();
    const second = await loadSeedRegion();

    expect(first.world.componentEntries("object")).toEqual(second.world.componentEntries("object"));
    expect(first.world.componentEntries("npc")).toEqual(second.world.componentEntries("npc"));
    expect(Array.from(first.map.tiles.entries())).toEqual(Array.from(second.map.tiles.entries()));
  });
});
