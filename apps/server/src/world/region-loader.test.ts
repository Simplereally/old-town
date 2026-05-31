import { CollisionFlag, entityId, REGION_SIZE, type RegionMapDef, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { loadAllRegionMapsIntoWorld, loadRegionMapIntoWorld } from "./region-loader";
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
    expect(summaries.reduce((sum, s) => sum + s.objectCount, 0)).toBe(38);
    expect(summaries.reduce((sum, s) => sum + s.npcCount, 0)).toBe(42);
    expect(summaries.reduce((sum, s) => sum + s.groundItemCount, 0)).toBe(1);
    expect(summaries.reduce((sum, s) => sum + s.resourceNodeCount, 0)).toBe(6);
    expect(summaries.reduce((sum, s) => sum + s.triggerCount, 0)).toBe(23);
  });

  it("instantiates runtime entities while preserving content ids", async () => {
    const { world } = await loadSeedRegion();

    expect(world.componentCount("object")).toBe(38);
    expect(world.componentCount("resourceNode")).toBe(6);
    expect(world.componentCount("npc")).toBe(42);
    expect(world.componentCount("groundItem")).toBe(1);

    const firstObject = world.getComponent(entityId(0), "object");
    expect(firstObject?.entityId).toBe(0);
    expect(firstObject?.objectId).toBe("oldroad_signpost");
    expect(firstObject?.objectId).not.toBe(String(firstObject?.entityId));

    const firstNpc = world.getComponent(entityId(19), "npc");
    expect(firstNpc?.npcId).toBe("stray_dog");
    expect(world.getComponent(entityId(19), "actor")?.name).toBe("Stray Dog");

    const firstGroundItem = world.getComponent(entityId(59), "groundItem");
    expect(firstGroundItem).toMatchObject({ itemId: "pennywrought_pickaxe", quantity: 1 });
  });

  it("loads maps deterministically", async () => {
    const first = await loadSeedRegion();
    const second = await loadSeedRegion();

    expect(first.world.componentEntries("object")).toEqual(second.world.componentEntries("object"));
    expect(first.world.componentEntries("npc")).toEqual(second.world.componentEntries("npc"));
    expect(Array.from(first.map.tiles.entries())).toEqual(Array.from(second.map.tiles.entries()));
  });

  it("loads edited tile fields exported by the world editor", async () => {
    const content = await loadContent("content");
    if (!content.ok) {
      throw new Error(content.issues.map((issue) => issue.message).join("; "));
    }
    const world = createWorld();
    const map = createRuntimeMap();
    const editedRegion: RegionMapDef = {
      region: { rx: 4, ry: 5, plane: 0 },
      tiles: {
        default: {
          height: 1,
          underlayId: "grass",
          collision: 0,
          water: true,
          bridge: false,
          zoneId: "default_zone",
        },
        overrides: [
          {
            x: 2,
            y: 3,
            height: 7,
            underlayId: "oldroad_slabs",
            collision: CollisionFlag.BLOCK_EAST,
            water: false,
            bridge: true,
            zoneId: "edited_zone",
          },
        ],
      },
      objects: [{ objectId: "oldroad_signpost", x: 4, y: 5, rotation: 2 }],
      npcSpawns: [{ npcId: "stray_dog", x: 6, y: 7, wanderRadius: 3 }],
      groundItemSpawns: [{ itemId: "coin", quantity: 9, x: 8, y: 9 }],
      triggers: [{ id: "edited_trigger", x: 10, y: 11, width: 2, height: 3, tag: "edited_zone" }],
    };

    const summary = loadRegionMapIntoWorld(world, map, content.registries, editedRegion);

    expect(summary).toMatchObject({
      objectCount: 1,
      npcCount: 1,
      groundItemCount: 1,
      triggerCount: 1,
    });
    expect(
      map.tiles.get(tileKey({ x: 4 * REGION_SIZE + 2, y: 5 * REGION_SIZE + 3, plane: 0 })),
    ).toMatchObject({
      height: 7,
      underlayId: "oldroad_slabs",
      collision: CollisionFlag.BLOCK_EAST,
      water: false,
      bridge: true,
      zoneId: "edited_zone",
    });
    expect(
      map.tiles.get(tileKey({ x: 4 * REGION_SIZE, y: 5 * REGION_SIZE, plane: 0 })),
    ).toMatchObject({
      water: true,
      zoneId: "default_zone",
    });
    expect(world.componentCount("object")).toBe(1);
    expect(world.componentCount("npc")).toBe(1);
    expect(world.componentCount("groundItem")).toBe(1);
    expect(map.triggers.get("edited_trigger")).toMatchObject({
      width: 2,
      height: 3,
      tag: "edited_zone",
    });
  });
});
