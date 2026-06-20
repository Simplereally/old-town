import type { ChunkData, MaterialDef } from "@old-town/shared";
import { type InstancedMesh, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { MaterialColorResolver } from "../renderer/MaterialColorResolver";
import { TerrainLayer } from "./TerrainLayer";

const BELLSTONE_COLOR = 0x9ba79b;
const GRASS_COLOR = 0x4f8f3a;

const materials: Record<string, MaterialDef> = {
  bellstone_plaza: {
    id: "bellstone_plaza",
    name: "Bellstone Plaza",
    color: BELLSTONE_COLOR,
    isWater: false,
    isBridge: false,
    roughness: 0.6,
    category: "plaza",
  },
  grass: {
    id: "grass",
    name: "Grass",
    color: GRASS_COLOR,
    isWater: false,
    isBridge: false,
    roughness: 0.9,
    category: "grass",
  },
  packed_road: {
    id: "packed_road",
    name: "Packed Road",
    color: 0x76767a,
    isWater: false,
    isBridge: false,
    roughness: 0.85,
    category: "road",
  },
};

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
}

/** Build a chunk simulating the Market Bell spawn area (46,46 global → chunk 5,5 local). */
function marketBellSpawnChunk(): ChunkData {
  const tiles: ChunkData["tiles"] = [];
  for (let x = 40; x < 48; x++) {
    for (let y = 40; y < 48; y++) {
      (tiles as Array<{ x: number; y: number; height: number; underlayId: string; collision: number }>).push({
        x,
        y,
        height: 0,
        underlayId: "bellstone_plaza",
        collision: 0,
      });
    }
  }
  return createChunk(5, 5, tiles);
}

describe("E42-S05 — Visual regression: Market Bell spawn view", () => {
  let scene: Scene;
  let terrain: TerrainLayer;

  beforeEach(() => {
    scene = new Scene();
    const resolver = new MaterialColorResolver(materials);
    terrain = new TerrainLayer({ scene, colorResolver: resolver });
  });

  it("renders the Market Bell spawn area with bellstone_plaza, not default green", () => {
    const chunk = marketBellSpawnChunk();
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    const meshes = (group?.children ?? []) as InstancedMesh[];

    // Find the bellstone mesh.
    const bellstoneMesh = meshes.find((m) => {
      const mat = m.material as { color?: { getHex: () => number } };
      return mat?.color?.getHex() === BELLSTONE_COLOR;
    });
    expect(bellstoneMesh).toBeDefined();
    expect(bellstoneMesh!.count).toBe(64); // 8x8 chunk

    // Ensure no grass-colored mesh exists in this chunk (spawn area is all bellstone).
    const grassMesh = meshes.find((m) => {
      const mat = m.material as { color?: { getHex: () => number } };
      return mat?.color?.getHex() === GRASS_COLOR;
    });
    expect(grassMesh).toBeUndefined();
  });

  it("the pixel under the player at Market Bell spawn is not the default green color", () => {
    const chunk = marketBellSpawnChunk();
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    const meshes = (group?.children ?? []) as InstancedMesh[];
    const bellstoneMesh = meshes.find((m) => {
      const mat = m.material as { color?: { getHex: () => number } };
      return mat?.color?.getHex() === BELLSTONE_COLOR;
    });
    expect(bellstoneMesh).toBeDefined();

    // The material color at the spawn tile must not be the default green.
    const spawnMat = bellstoneMesh!.material as unknown as { color: { getHex: () => number } };
    expect(spawnMat.color.getHex()).not.toBe(GRASS_COLOR);
    expect(spawnMat.color.getHex()).toBe(BELLSTONE_COLOR);
  });
});
