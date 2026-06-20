import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface RegionMapFile {
  region: { rx: number; ry: number; plane: number };
  tiles: {
    default: { height: number; underlayId: string; collision: number };
    overrides: Array<{
      x: number;
      y: number;
      underlayId?: string;
      overlayId?: string;
      collision?: number;
      water?: boolean;
      bridge?: boolean;
      height?: number;
    }>;
  };
  objects: Array<{ objectId: string; x: number; y: number; rotation?: number }>;
  npcSpawns: Array<{ npcId: string; x: number; y: number; wanderRadius?: number }>;
  groundItemSpawns: Array<{ itemId: string; quantity: number; x: number; y: number }>;
  triggers: Array<{ id: string; x: number; y: number; width: number; height: number; tag?: string }>;
  resourceNodeSpawns: Array<{
    resourceNodeId: string;
    x: number;
    y: number;
    respawnTicks: number;
    initialDepletion: boolean;
  }>;
  playerSpawnPoints: Array<{ x: number; y: number; plane: number; spawnType: string }>;
  deathRespawnPoints: Array<{ x: number; y: number; plane: number; respawnType: string }>;
}

const MAPS_DIR = join(import.meta.dirname, "..", "..", "..", "..", "content", "maps");

async function loadMap(rx: number, ry: number): Promise<RegionMapFile> {
  const path = join(MAPS_DIR, `old-town-${rx}-${ry}-0.json`);
  return JSON.parse(await readFile(path, "utf-8")) as RegionMapFile;
}

describe("E42-S05 — Runtime map JSON loadable by client", () => {
  const regionCoords: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];

  it("all 4 region map files parse without errors", async () => {
    const maps = await Promise.all(regionCoords.map(([rx, ry]) => loadMap(rx, ry)));
    expect(maps.length).toBe(4);
    for (const map of maps) {
      expect(map.region).toBeDefined();
      expect(map.tiles).toBeDefined();
      expect(map.tiles.default.underlayId).toBe("grass");
      expect(Array.isArray(map.tiles.overrides)).toBe(true);
      expect(Array.isArray(map.objects)).toBe(true);
      expect(Array.isArray(map.npcSpawns)).toBe(true);
      expect(Array.isArray(map.triggers)).toBe(true);
    }
  });

  it("region 0:0:0 has player spawn points", async () => {
    const map = await loadMap(0, 0);
    expect(map.playerSpawnPoints.length).toBeGreaterThan(0);
    const spawn = map.playerSpawnPoints[0]!;
    expect(spawn.spawnType).toBe("default");
    expect(spawn.plane).toBe(0);
  });

  it("region 0:0:0 has death respawn points", async () => {
    const map = await loadMap(0, 0);
    expect(map.deathRespawnPoints.length).toBeGreaterThan(0);
    const respawn = map.deathRespawnPoints[0]!;
    expect(respawn.respawnType).toBe("nearest");
    expect(respawn.plane).toBe(0);
  });

  it("all maps have resource node spawns", async () => {
    const maps = await Promise.all(regionCoords.map(([rx, ry]) => loadMap(rx, ry)));
    const totalResourceNodes = maps.reduce((sum, m) => sum + m.resourceNodeSpawns.length, 0);
    expect(totalResourceNodes).toBeGreaterThan(0);
  });

  it("at least one map has water and bridge tiles", async () => {
    const maps = await Promise.all(regionCoords.map(([rx, ry]) => loadMap(rx, ry)));
    let hasWater = false;
    let hasBridge = false;
    for (const map of maps) {
      for (const override of map.tiles.overrides) {
        if (override.water) hasWater = true;
        if (override.bridge) hasBridge = true;
      }
    }
    expect(hasWater).toBe(true);
    expect(hasBridge).toBe(true);
  });

  it("all underlayIds in overrides are non-empty strings", async () => {
    const maps = await Promise.all(regionCoords.map(([rx, ry]) => loadMap(rx, ry)));
    for (const map of maps) {
      for (const override of map.tiles.overrides) {
        if (override.underlayId !== undefined) {
          expect(override.underlayId.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("all object IDs are non-empty strings", async () => {
    const maps = await Promise.all(regionCoords.map(([rx, ry]) => loadMap(rx, ry)));
    for (const map of maps) {
      for (const obj of map.objects) {
        expect(obj.objectId.length).toBeGreaterThan(0);
      }
    }
  });
});
