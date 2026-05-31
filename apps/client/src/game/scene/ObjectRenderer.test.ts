import { entityId } from "@old-town/shared";
import type { TileCoord } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectRenderer } from "./ObjectRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);
const ID999 = entityId(999);

describe("ObjectRenderer", () => {
  let scene: Scene;
  let renderer: ObjectRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ObjectRenderer({ scene });
  });

  it("starts with no objects", () => {
    expect(renderer.objectCount).toBe(0);
  });

  it("spawns an object", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    expect(renderer.objectCount).toBe(1);
  });

  it("removes an object", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.remove(ID1);
    expect(renderer.objectCount).toBe(0);
  });

  it("replaces object on duplicate spawn", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID1, TILE, "rock_copper");
    expect(renderer.objectCount).toBe(1);
  });

  it("clears all objects", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, TILE, "rock_copper");
    renderer.clear();
    expect(renderer.objectCount).toBe(0);
  });

  it("updates object rotation", () => {
    renderer.spawn(ID1, TILE, "door_wood");
    renderer.updateTransform(ID1, 1);
    expect(renderer.objectCount).toBe(1);
  });

  it("handles remove of non-existent object gracefully", () => {
    renderer.remove(ID999);
    expect(renderer.objectCount).toBe(0);
  });

  it("disposes all resources", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, TILE, "rock_copper");
    renderer.dispose();
    expect(renderer.objectCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });
});
