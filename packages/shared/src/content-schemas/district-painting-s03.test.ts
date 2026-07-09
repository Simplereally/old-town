import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface TileOverride {
  x: number;
  y: number;
  underlayId: string;
  collision?: number;
}

interface RegionMapFile {
  region: { rx: number; ry: number; plane: number };
  tiles: {
    default: { underlayId: string };
    overrides: TileOverride[];
  };
}

interface Trigger {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tag?: string;
}

interface FullRegionMapFile extends RegionMapFile {
  triggers: Trigger[];
}

const MAPS_DIR = join(import.meta.dirname, "..", "..", "..", "..", "content", "maps");

const DISTRICT_MATERIALS: Record<string, string> = {
  market_bell: "bellstone_plaza",
  counting_house: "wood_floor",
  foundry_row: "soot_cobble",
  lath_yard: "chalk_flagstone",
  patch_lane: "patch_grass",
  chalkhouse_court: "chalk_flagstone",
  warden_steps: "packed_road",
  shrine_hearth: "stone_floor",
  river_stoop: "river_mud",
  oldroad_gate: "oldroad_slabs",
  gravegate: "grave_soil",
  sootcellar: "dark_cellar_floor",
  north_quarry_road: "quarry_grit",
};

async function loadMap(rx: number, ry: number): Promise<FullRegionMapFile> {
  const path = join(MAPS_DIR, `old-town-${rx}-${ry}-0.json`);
  return JSON.parse(await readFile(path, "utf-8")) as FullRegionMapFile;
}

/** Build a lookup map of (x,y) → underlayId from overrides. */
function buildTileMap(overrides: TileOverride[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const o of overrides) {
    map.set(`${o.x}:${o.y}`, o.underlayId);
  }
  return map;
}

describe("E42-S03 — District material painting and transitions", () => {
  it("each district trigger box contains at least one tile with the expected material", async () => {
    const maps = await Promise.all([loadMap(0, 0), loadMap(1, 0), loadMap(0, 1), loadMap(1, 1)]);

    const allTriggers = maps.flatMap((m) =>
      m.triggers.map((t) => ({ ...t, rx: m.region.rx, ry: m.region.ry })),
    );

    const failures: string[] = [];

    for (const [districtId, expectedMaterial] of Object.entries(DISTRICT_MATERIALS)) {
      const triggers = allTriggers.filter((t) => t.tag === districtId || t.id === districtId);
      if (triggers.length === 0) {
        failures.push(`No trigger found for district: ${districtId}`);
        continue;
      }

      // Check if any tile within the trigger boxes has the expected material.
      let found = false;
      for (const trigger of triggers) {
        const map = maps.find((m) => m.region.rx === trigger.rx && m.region.ry === trigger.ry);
        if (!map) continue;
        const tileMap = buildTileMap(map.tiles.overrides);
        for (let dx = 0; dx < trigger.width; dx++) {
          for (let dy = 0; dy < trigger.height; dy++) {
            const tile = tileMap.get(`${trigger.x + dx}:${trigger.y + dy}`);
            if (tile === expectedMaterial) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      if (!found) {
        failures.push(
          `District "${districtId}" trigger box has no tile with expected material "${expectedMaterial}"`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it("transition border materials appear in the generated maps", async () => {
    const maps = await Promise.all([loadMap(0, 0), loadMap(1, 0), loadMap(0, 1), loadMap(1, 1)]);

    const allMaterials = new Set<string>();
    for (const map of maps) {
      for (const override of map.tiles.overrides) {
        allMaterials.add(override.underlayId);
      }
    }

    const expectedTransitions = [
      "grass_to_bellstone",
      "grass_to_soot_cobble",
      "grass_to_chalk_flagstone",
      "grass_to_packed_road",
      "grass_to_stone_floor",
    ];

    for (const transitionId of expectedTransitions) {
      expect(
        allMaterials.has(transitionId),
        `Transition material "${transitionId}" should appear in maps`,
      ).toBe(true);
    }
  });

  it("each district material appears at least once across all maps", async () => {
    const maps = await Promise.all([loadMap(0, 0), loadMap(1, 0), loadMap(0, 1), loadMap(1, 1)]);

    const allMaterials = new Set<string>();
    for (const map of maps) {
      for (const override of map.tiles.overrides) {
        allMaterials.add(override.underlayId);
      }
    }

    for (const [districtId, material] of Object.entries(DISTRICT_MATERIALS)) {
      expect(
        allMaterials.has(material),
        `District "${districtId}" material "${material}" should appear in maps`,
      ).toBe(true);
    }
  });
});
