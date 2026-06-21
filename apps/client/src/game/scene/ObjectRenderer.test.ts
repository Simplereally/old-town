import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("transforms object render definition in place", () => {
    renderer.spawn(ID1, TILE, "dry_tree");
    renderer.transform(ID1, "dry_tree_depleted");
    const group = scene.children[0];
    const mesh = group?.children[0] as import("three").Mesh | undefined;
    expect(renderer.objectCount).toBe(1);
    expect(mesh?.userData.instanceMap[0].defId).toBe("dry_tree_depleted");
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

  it("reuses meshes from pool when spawning same defId", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    const group = scene.children[0];
    const meshBefore = group?.children[0];
    renderer.remove(ID1);
    renderer.spawn(ID2, TILE, "tree_oak");
    const meshAfter = group?.children[0];
    expect(meshAfter).toBe(meshBefore);
  });

  it("does not dispose shared geometry/material on remove", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    const group = scene.children[0];
    const mesh = group?.children[0] as import("three").Mesh | undefined;
    const geometry = mesh?.geometry;
    const material = mesh?.material;
    if (!geometry || !material) throw new Error("Expected object mesh");
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material as import("three").MeshLambertMaterial, "dispose");

    renderer.remove(ID1);

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(geometry?.uuid).toBeDefined();
    expect((material as import("three").MeshLambertMaterial | undefined)?.uuid).toBeDefined();
  });

  it("spawns multiple objects with shared geometry", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, TILE, "tree_oak");
    const group = scene.children[0];
    // Same archetype + region + layer => single bucket mesh
    expect(group?.children.length).toBe(1);
    const mesh = group?.children[0] as import("three").Mesh | undefined;
    expect(renderer.objectCount).toBe(2);
    expect(mesh).toBeDefined();
  });
});
