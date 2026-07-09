import type { ChunkData, MaterialDef } from "@old-town/shared";
import { type InstancedMesh, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { MaterialColorResolver } from "../renderer/MaterialColorResolver";
import { TerrainLayer } from "./TerrainLayer";

const materials: Record<string, MaterialDef> = {
  grass: {
    id: "grass",
    name: "Grass",
    color: 0x4f8f3a,
    isWater: false,
    isBridge: false,
    roughness: 0.9,
    category: "grass",
  },
  bellstone_plaza: {
    id: "bellstone_plaza",
    name: "Bellstone Plaza",
    color: 0x9ba79b,
    isWater: false,
    isBridge: false,
    roughness: 0.6,
    category: "plaza",
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
  water: {
    id: "water",
    name: "Water",
    color: 0x4a90d9,
    isWater: true,
    isBridge: false,
    roughness: 0.1,
    category: "water",
  },
};

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
}

/** Generate an 8x8 chunk with mixed materials simulating a real district boundary. */
function mixedChunk(cx: number, cy: number): ChunkData {
  const tiles: Array<{
    x: number;
    y: number;
    height: number;
    underlayId: string;
    collision: number;
    water?: boolean;
  }> = [];
  for (let dx = 0; dx < 8; dx++) {
    for (let dy = 0; dy < 8; dy++) {
      const x = cx * 8 + dx;
      const y = cy * 8 + dy;
      let underlayId = "grass";
      if (dx < 4 && dy < 4) underlayId = "bellstone_plaza";
      else if (dx >= 4 && dy < 4) underlayId = "packed_road";
      tiles.push({ x, y, height: 0, underlayId, collision: 0 });
    }
  }
  return createChunk(cx, cy, tiles);
}

describe("E42-S05 — Terrain performance budget", () => {
  let scene: Scene;
  let terrain: TerrainLayer;

  beforeEach(() => {
    scene = new Scene();
    const resolver = new MaterialColorResolver(materials);
    terrain = new TerrainLayer({ scene, colorResolver: resolver });
  });

  it("uses at most 1 draw call per material per chunk (InstancedMesh batching)", () => {
    const chunk = mixedChunk(0, 0);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    const meshes = (group?.children ?? []) as InstancedMesh[];

    // Count meshes per material color — each material should have exactly 1 InstancedMesh.
    const colorCounts = new Map<number, number>();
    for (const mesh of meshes) {
      const mat = mesh.material as unknown as { color: { getHex: () => number } };
      const hex = mat.color.getHex();
      colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
    }

    for (const [, count] of colorCounts) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it("total terrain draw calls for 4 chunks stay within budget (< 50)", () => {
    // Load 4 chunks with mixed materials.
    for (let i = 0; i < 4; i++) {
      const chunk = mixedChunk(i, 0);
      terrain.loadChunk(`0:0:0`, chunk);
    }

    let totalDrawCalls = 0;
    for (const child of scene.children) {
      const group = child as unknown as { children: unknown[] };
      const meshes = (group?.children ?? []) as InstancedMesh[];
      totalDrawCalls += meshes.length;
    }

    // Budget: < 50 total terrain draw calls for the active scene.
    expect(totalDrawCalls).toBeLessThan(50);
  });

  it("water adds at most 1 additional draw call per chunk", () => {
    const tiles: Array<{
      x: number;
      y: number;
      height: number;
      underlayId: string;
      collision: number;
      water?: boolean;
    }> = [];
    for (let dx = 0; dx < 8; dx++) {
      for (let dy = 0; dy < 8; dy++) {
        const isWater = dx >= 4;
        tiles.push({
          x: dx,
          y: dy,
          height: 0,
          underlayId: isWater ? "water" : "grass",
          collision: 0,
          ...(isWater ? { water: true } : {}),
        });
      }
    }
    const chunk = createChunk(0, 0, tiles);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    const meshes = (group?.children ?? []) as InstancedMesh[];

    // Should have: 1 grass mesh + 1 water mesh = 2 total.
    expect(meshes.length).toBe(2);
  });
});
