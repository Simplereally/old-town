import type { ChunkData, MaterialDef } from "@old-town/shared";
import { type InstancedMesh, Matrix4, Scene } from "three";
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
  water: {
    id: "water",
    name: "Water",
    color: 0x4a90d9,
    isWater: true,
    isBridge: false,
    roughness: 0.1,
    category: "water",
  },
  oldroad_slabs: {
    id: "oldroad_slabs",
    name: "Oldroad Slabs",
    color: 0x7d8a6d,
    isWater: false,
    isBridge: false,
    roughness: 0.7,
    category: "road",
  },
};

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
}

describe("E42-S04 — Water, bridge, and elevation rendering", () => {
  let scene: Scene;
  let terrain: TerrainLayer;

  beforeEach(() => {
    scene = new Scene();
    const resolver = new MaterialColorResolver(materials);
    terrain = new TerrainLayer({ scene, colorResolver: resolver });
  });

  it("renders water tiles as a separate InstancedMesh", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 0, underlayId: "water", collision: 0, water: true },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    const meshes = (group?.children ?? []) as InstancedMesh[];
    // At least one mesh for grass + one for water.
    expect(meshes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders bridge tiles as a separate InstancedMesh", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 0, underlayId: "oldroad_slabs", collision: 0, bridge: true },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    const meshes = (group?.children ?? []) as InstancedMesh[];
    // Grass mesh + bridge mesh.
    expect(meshes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders elevated tiles at higher Y positions", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 2, underlayId: "grass", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    // Find the grass InstancedMesh and check positions.
    const meshes = (group?.children ?? []) as InstancedMesh[];
    const grassMesh = meshes.find((m) => m.count === 2);
    expect(grassMesh).toBeDefined();
    if (grassMesh) {
      const mat0 = new Matrix4();
      const mat1 = new Matrix4();
      grassMesh.getMatrixAt(0, mat0);
      grassMesh.getMatrixAt(1, mat1);
      // The elevated tile (index 1) should have a higher Y position.
      const pos0 = mat0.elements[13];
      const pos1 = mat1.elements[13];
      expect(pos1).toBeGreaterThan(pos0);
    }
  });

  it("renders cliff faces for height differences between adjacent tiles", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 1, underlayId: "grass", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    const meshes = (group?.children ?? []) as InstancedMesh[];
    // Should have grass mesh + cliff mesh (at least 2 meshes).
    expect(meshes.length).toBeGreaterThanOrEqual(2);
    // The cliff mesh should have at least 1 instance.
    const cliffMesh = meshes.find((m) => {
      const mat = m.material as { color?: { getHex: () => number } };
      return mat?.color?.getHex() === 0x4a4a4a;
    });
    expect(cliffMesh).toBeDefined();
    expect(cliffMesh!.count).toBeGreaterThanOrEqual(1);
  });
});
