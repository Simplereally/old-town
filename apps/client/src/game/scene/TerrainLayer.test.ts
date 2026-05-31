import type { ChunkData } from "@old-town/shared";
import { Mesh, Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerrainLayer } from "./TerrainLayer";

function createChunk(cx: number, cy: number, tiles: ChunkData["tiles"]): ChunkData {
  return { cx, cy, tiles };
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
  });

  it("loads a chunk", () => {
    const chunk = createChunk(0, 0, [
      { x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 },
      { x: 1, y: 0, height: 0, underlayId: "grass", collision: 0 },
    ]);
    terrain.loadChunk("0:0:0", chunk);
    expect(terrain.loadedChunkCount).toBe(1);
  });

  it("unloads a chunk", () => {
    const chunk = createChunk(0, 0, [{ x: 0, y: 0, height: 0, underlayId: "grass", collision: 0 }]);
    terrain.loadChunk("0:0:0", chunk);
    terrain.unloadChunk("0:0:0:0:0");
    expect(terrain.loadedChunkCount).toBe(0);
  });

  it("unloads chunks without disposing shared tile geometry", () => {
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
});
