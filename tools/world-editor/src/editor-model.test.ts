import { CollisionFlag, type RegionMapDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  addPlacement,
  applyTilePatch,
  assertRegionBounds,
  cloneRegion,
  deletePlacement,
  duplicatePlacement,
  exportRegionJson,
  materialHex,
  movePlacement,
  parseExportedRegion,
  regionKey,
  rotateObjectPlacement,
  summarizeRegion,
  tileAt,
  uniqueTriggerId,
} from "./editor-model";

const region: RegionMapDef = {
  region: { rx: 2, ry: -1, plane: 0 },
  tiles: {
    default: { height: 0, underlayId: "grass", collision: 0 },
    overrides: [{ x: 3, y: 4, height: 2, underlayId: "road", collision: 16, water: true }],
  },
  objects: [{ objectId: "dry_tree", x: 3, y: 4, rotation: 1 }],
  npcSpawns: [{ npcId: "stray_dog", x: 5, y: 6, wanderRadius: 2 }],
  groundItemSpawns: [{ itemId: "coin", quantity: 3, x: 7, y: 8 }],
  triggers: [{ id: "market", x: 1, y: 1, width: 4, height: 5 }],
  resourceNodeSpawns: [],
  playerSpawnPoints: [],
  deathRespawnPoints: [],
  contractSpawns: [],
};

describe("world editor model helpers", () => {
  it("merges sparse tile overrides onto region defaults", () => {
    expect(tileAt(region, 0, 0)).toMatchObject({
      x: 0,
      y: 0,
      height: 0,
      underlayId: "grass",
      collision: 0,
      water: false,
    });
    expect(tileAt(region, 3, 4)).toMatchObject({
      x: 3,
      y: 4,
      height: 2,
      underlayId: "road",
      collision: 16,
      water: true,
    });
  });

  it("exports RegionMapDef JSON that parses back through the shared schema", () => {
    const json = exportRegionJson(region);

    expect(parseExportedRegion(json)).toEqual(region);
    expect(cloneRegion(region)).toEqual(region);
    expect(regionKey(region)).toBe("2:-1:0");
    expect(summarizeRegion(region)).toMatchObject({
      key: "2:-1:0",
      label: "Region 2, -1, plane 0",
    });
  });

  it("normalizes material colors and region bounds", () => {
    expect(
      materialHex({
        id: "grass",
        name: "Grass",
        color: 0x4f8f3a,
        isWater: false,
        isBridge: false,
        roughness: 0.8,
        category: "grass",
      }),
    ).toBe("#4f8f3a");
    expect(materialHex(undefined)).toBe("#1d2b20");
    expect(assertRegionBounds(0, 63)).toBe(true);
    expect(assertRegionBounds(64, 0)).toBe(false);
  });

  it("applies sparse tile patches and removes overrides when they match defaults", () => {
    const edited = cloneRegion(region);

    applyTilePatch(edited, 1, 2, {
      height: 3,
      underlayId: "road",
      overlayId: "ash",
      collision: CollisionFlag.BLOCK_FULL,
      water: true,
      bridge: true,
      zoneId: "market_bell",
    });

    expect(tileAt(edited, 1, 2)).toMatchObject({
      height: 3,
      underlayId: "road",
      overlayId: "ash",
      collision: CollisionFlag.BLOCK_FULL,
      water: true,
      bridge: true,
      zoneId: "market_bell",
    });

    applyTilePatch(edited, 1, 2, {
      height: 0,
      underlayId: "grass",
      overlayId: null,
      collision: 0,
      water: false,
      bridge: false,
      zoneId: null,
    });

    expect(edited.tiles.overrides.some((override) => override.x === 1 && override.y === 2)).toBe(
      false,
    );
  });

  it("rejects runtime-only collision bits in tile patches", () => {
    const edited = cloneRegion(region);

    expect(() =>
      applyTilePatch(edited, 1, 2, { collision: CollisionFlag.OCCUPIED_PLAYER }),
    ).toThrow(/runtime-only/);
  });

  it("adds, moves, rotates, duplicates, and deletes object placements", () => {
    const edited = cloneRegion(region);
    const selection = addPlacement(edited, {
      kind: "object",
      value: { objectId: "oak_tree", x: 10, y: 11, rotation: 0 },
    });

    movePlacement(edited, selection, 12, 13);
    rotateObjectPlacement(edited, selection);
    expect(edited.objects[selection.index]).toMatchObject({ x: 12, y: 13, rotation: 1 });

    const duplicate = duplicatePlacement(edited, selection);
    expect(edited.objects[duplicate.index]).toMatchObject({ objectId: "oak_tree", x: 13, y: 13 });

    deletePlacement(edited, selection);
    expect(edited.objects.some((object) => object.x === 12 && object.y === 13)).toBe(false);
  });

  it("places NPCs, ground items, and bounded triggers with stable data", () => {
    const edited = cloneRegion(region);

    const npc = addPlacement(edited, {
      kind: "npc",
      value: { npcId: "stray_dog", x: 20, y: 21, wanderRadius: 4 },
    });
    const item = addPlacement(edited, {
      kind: "groundItem",
      value: { itemId: "coin", quantity: 12, x: 22, y: 23 },
    });
    const trigger = addPlacement(edited, {
      kind: "trigger",
      value: {
        id: uniqueTriggerId(edited, "market"),
        x: 24,
        y: 25,
        width: 3,
        height: 4,
        tag: "safe",
      },
    });

    expect(edited.npcSpawns[npc.index]).toMatchObject({ npcId: "stray_dog", wanderRadius: 4 });
    expect(edited.groundItemSpawns[item.index]).toMatchObject({ itemId: "coin", quantity: 12 });
    expect(edited.triggers[trigger.index]).toMatchObject({
      id: "market_2",
      x: 24,
      y: 25,
      width: 3,
      height: 4,
      tag: "safe",
    });
    expect(parseExportedRegion(exportRegionJson(edited))).toEqual(edited);
  });
});
