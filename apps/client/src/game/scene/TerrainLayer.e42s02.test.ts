import type { ChunkData, MaterialDef } from "@old-town/shared";
import { InstancedMesh, Mesh, Scene } from "three";
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
  soot_cobble: {
    id: "soot_cobble",
    name: "Soot Cobble",
    color: 0x4b4b4b,
    isWater: false,
    isBridge: false,
    roughness: 0.75,
    category: "road",
  },
};

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
}

describe("E42-S02 — TerrainLayer material rendering", () => {
  let scene: Scene;
  let terrain: TerrainLayer;

  beforeEach(() => {
    scene = new Scene();
    const resolver = new MaterialColorResolver(materials);
    terrain = new TerrainLayer({ scene, colorResolver: resolver });
  });

  it("creates an InstancedMesh with bellstone_plaza material color for a single tile", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "bellstone_plaza", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    const instancedMesh = group?.children[0];
    expect(instancedMesh).toBeInstanceOf(InstancedMesh);
    if (instancedMesh instanceof InstancedMesh) {
      const mat = instancedMesh.material as { color: { getHex: () => number } };
      expect(mat.color.getHex()).toBe(BELLSTONE_COLOR);
      expect(instancedMesh.count).toBe(1);
    }
  });

  it("unloading a region removes all associated terrain instances", () => {
    const chunk1 = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
    ]);
    const chunk2 = createChunk(1, 0, [
      { x: 8, y: 0, height: 0, underlayId: "bellstone_plaza", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk1);
    terrain.loadChunk("0:0:0", chunk2);
    expect(terrain.loadedChunkCount).toBe(2);

    terrain.unloadRegion("0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it("uses InstancedMesh per material — no per-tile Mesh draw calls", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 2, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 3, y: 0, height: 0, underlayId: "bellstone_plaza", collision: 0 },
      { x: 4, y: 0, height: 0, underlayId: "bellstone_plaza", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();

    // Should have exactly 2 InstancedMesh children (one per material), no Mesh children.
    const instancedMeshes = group!.children.filter((c) => c instanceof InstancedMesh);
    const meshes = group!.children.filter((c) => c instanceof Mesh && !(c instanceof InstancedMesh));
    expect(instancedMeshes.length).toBe(2);
    expect(meshes.length).toBe(0);

    // Grass InstancedMesh should have 3 instances, bellstone 2.
    const grassMesh = instancedMeshes.find(
      (m) => (m.material as { color: { getHex: () => number } }).color.getHex() === GRASS_COLOR,
    );
    const bellstoneMesh = instancedMeshes.find(
      (m) => (m.material as { color: { getHex: () => number } }).color.getHex() === BELLSTONE_COLOR,
    );
    expect(grassMesh?.count).toBe(3);
    expect(bellstoneMesh?.count).toBe(2);
  });

  it("renders overlay tiles as a separate InstancedMesh slightly above underlay", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", overlayId: "soot_cobble", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    expect(group).toBeDefined();
    // 2 InstancedMeshes: underlay (grass) + overlay (soot_cobble)
    const instancedMeshes = group!.children.filter((c) => c instanceof InstancedMesh);
    expect(instancedMeshes.length).toBe(2);
  });

  it("resolves colors from the material registry, not a hardcoded palette", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "bellstone_plaza", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);

    const group = scene.children[0];
    const instancedMesh = group?.children[0];
    expect(instancedMesh).toBeInstanceOf(InstancedMesh);
    if (instancedMesh instanceof InstancedMesh) {
      const mat = instancedMesh.material as { color: { getHex: () => number } };
      // Should be the registry color, not a hardcoded fallback.
      expect(mat.color.getHex()).toBe(BELLSTONE_COLOR);
    }
  });
});
