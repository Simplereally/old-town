import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { GroundItemLayer } from "./GroundItemLayer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

describe("GroundItemLayer", () => {
  let scene: Scene;
  let layer: GroundItemLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new GroundItemLayer({ scene });
  });

  it("starts with no items", () => {
    expect(layer.itemCount).toBe(0);
  });

  it("spawns an item", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    expect(layer.itemCount).toBe(1);
  });

  it("removes an item", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    layer.remove(ID1);
    expect(layer.itemCount).toBe(0);
  });

  it("replaces item on duplicate spawn", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    layer.spawn(ID1, TILE, "gem", 1);
    expect(layer.itemCount).toBe(1);
  });

  it("clears all items", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    layer.spawn(ID2, TILE, "gem", 1);
    layer.clear();
    expect(layer.itemCount).toBe(0);
  });

  it("reuses meshes after spawn/remove cycles", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    const poolSizeBefore = layer.poolSize;
    layer.remove(ID1);
    layer.spawn(ID2, TILE, "gem", 1);
    expect(layer.poolSize).toBe(poolSizeBefore);
  });

  it("preserves raycast targets", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    layer.spawn(ID2, TILE, "gem", 1);
    const targets = layer.getRaycastTargets();
    expect(targets.length).toBe(2);
    expect(targets[0]?.name).toBe("item_1");
    expect(targets[1]?.name).toBe("item_2");
  });

  it("exposes pool stats", () => {
    layer.spawn(ID1, TILE, "coin", 1);
    expect(layer.itemCount).toBe(1);
    expect(layer.poolSize).toBeGreaterThanOrEqual(1);
  });
});
