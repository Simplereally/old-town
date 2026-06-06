import type { ChunkData } from "@old-town/shared";
import { Group, Mesh, Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerrainLayer } from "./TerrainLayer";

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
}

function createBakedGroup(key: string): Group {
  const group = new Group();
  group.name = key;
  const mesh = new Mesh();
  group.add(mesh);
  return group;
}

describe("TerrainLayer", () => {
  let scene: Scene;
  let terrain: TerrainLayer;

  beforeEach(() => {
    scene = new Scene();
    terrain = new TerrainLayer({ scene });
  });

  it("starts with no chunks", () => {
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.rawChunkCount).toBe(0);
    expect(terrain.bakedChunkCount).toBe(0);
  });

  it("loads a raw chunk", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 0, underlayId: "grass", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.loadedChunkCount).toBe(1);
    expect(terrain.rawChunkCount).toBe(1);
    expect(terrain.bakedChunkCount).toBe(0);
  });

  it("unloads a raw chunk", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    terrain.unloadChunk("0:0:0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.rawChunkCount).toBe(0);
  });

  it("unloads raw chunks without disposing shared tile geometry", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    const group = scene.children[0];
    const mesh = group?.children[0];
    if (!(mesh instanceof Mesh)) throw new Error("Expected terrain mesh");
    const geometryDispose = vi.spyOn(mesh.geometry, "dispose");

    terrain.unloadChunk("0:0:0:0:0");

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(terrain.loadedChunkCount).toBe(0);
  });

  it("unloads all chunks for a region", () => {
    const chunk1 = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
    ]);
    const chunk2 = createChunk(1, 0, [
      { x: 8, y: 0, height: 0, underlayId: "grass", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk1);
    terrain.loadChunk("0:0:0", chunk2);
    terrain.unloadRegion("0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.rawChunkCount).toBe(0);
  });

  it("clears all chunks", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    terrain.clear();
    expect(terrain.loadedChunkCount).toBe(0);
  });

  it("replaces existing chunk on reload", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.loadedChunkCount).toBe(1);
  });

  it("renders water tiles with different material", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0, water: true },
    ]);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.loadedChunkCount).toBe(1);
  });

  it("disposes all resources", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    terrain.dispose();
    expect(terrain.loadedChunkCount).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Baked chunk path
  // ---------------------------------------------------------------------------

  it("adds a baked chunk", () => {
    const group = createBakedGroup("0:0:0:0:0");
    terrain.addBakedChunk("0:0:0:0:0", group);
    expect(terrain.loadedChunkCount).toBe(1);
    expect(terrain.bakedChunkCount).toBe(1);
    expect(terrain.rawChunkCount).toBe(0);
    expect(scene.children).toContain(group);
  });

  it("unloads a baked chunk", () => {
    const group = createBakedGroup("0:0:0:0:0");
    terrain.addBakedChunk("0:0:0:0:0", group);
    terrain.unloadChunk("0:0:0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.bakedChunkCount).toBe(0);
    expect(scene.children).not.toContain(group);
  });

  it("replaces existing baked chunk on re-add", () => {
    const group1 = createBakedGroup("0:0:0:0:0");
    const group2 = createBakedGroup("0:0:0:0:0");
    terrain.addBakedChunk("0:0:0:0:0", group1);
    terrain.addBakedChunk("0:0:0:0:0", group2);
    expect(terrain.loadedChunkCount).toBe(1);
    expect(scene.children).toContain(group2);
    expect(scene.children).not.toContain(group1);
  });

  it("replaces raw chunk with baked chunk", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.rawChunkCount).toBe(1);

    const group = createBakedGroup("0:0:0:0:0");
    terrain.addBakedChunk("0:0:0:0:0", group);
    expect(terrain.rawChunkCount).toBe(0);
    expect(terrain.bakedChunkCount).toBe(1);
  });

  it("replaces baked chunk with raw chunk", () => {
    const group = createBakedGroup("0:0:0:0:0");
    terrain.addBakedChunk("0:0:0:0:0", group);
    expect(terrain.bakedChunkCount).toBe(1);

    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.rawChunkCount).toBe(1);
    expect(terrain.bakedChunkCount).toBe(0);
  });

  it("unloads baked chunks for a region", () => {
    const group1 = createBakedGroup("0:0:0:0:0");
    const group2 = createBakedGroup("0:0:0:1:0");
    terrain.addBakedChunk("0:0:0:0:0", group1);
    terrain.addBakedChunk("0:0:0:1:0", group2);
    terrain.unloadRegion("0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.bakedChunkCount).toBe(0);
  });

  it("clears both raw and baked chunks", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    const group = createBakedGroup("0:0:0:1:0");
    terrain.addBakedChunk("0:0:0:1:0", group);
    terrain.clear();
    expect(terrain.loadedChunkCount).toBe(0);
    expect(terrain.rawChunkCount).toBe(0);
    expect(terrain.bakedChunkCount).toBe(0);
  });
});
