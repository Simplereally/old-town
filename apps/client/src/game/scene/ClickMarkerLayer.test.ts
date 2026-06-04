import { GAME_TICK_MS, type TileCoord } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ClickMarkerLayer } from "./ClickMarkerLayer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };

describe("ClickMarkerLayer", () => {
  let scene: Scene;
  let layer: ClickMarkerLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new ClickMarkerLayer({ scene });
  });

  it("shows a click marker", () => {
    layer.show(TILE, 0);
    expect(scene.children.length).toBeGreaterThan(0);
    expect(layer.activeCount).toBe(1);
  });

  it("removes a click marker", () => {
    const id = layer.show(TILE, 0);
    layer.remove(id);
    expect(layer.activeCount).toBe(0);
  });

  it("fades and removes markers after duration", () => {
    layer.show(TILE, 0);
    layer.update(0);
    expect(layer.activeCount).toBe(1);
    layer.update(1500);
    expect(layer.activeCount).toBe(0);
  });

  it("reuses meshes after show/remove cycles", () => {
    layer.show(TILE, 0);
    const poolSizeBefore = layer.poolSize;
    layer.update(1500);
    layer.show(TILE, 2000);
    expect(layer.poolSize).toBe(poolSizeBefore);
  });

  it("does not create new geometry per click", () => {
    layer.show(TILE, 0);
    layer.show(TILE, 100);
    layer.show(TILE, 200);
    expect(layer.poolSize).toBeLessThanOrEqual(4);
  });

  it("disposes all resources", () => {
    layer.show(TILE, 0);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });
});
