import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectRenderer } from "./ObjectRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);
const _ID3 = entityId(3);
const ID999 = entityId(999);

describe("ObjectRenderer instancing", () => {
  let scene: Scene;
  let renderer: ObjectRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ObjectRenderer({ scene });
  });

  it("spawns 100 objects of same archetype into one bucket", () => {
    for (let i = 0; i < 100; i++) {
      renderer.spawn(entityId(i + 1), { x: i % 64, y: 5, plane: 0 }, "tree_oak");
    }
    expect(renderer.objectCount).toBe(100);
    const group = scene.children[0];
    expect(group).toBeDefined();
    expect(group?.children.length).toBe(1);
    const mesh = group?.children[0] as import("three").InstancedMesh;
    expect(mesh).toBeDefined();
    expect(mesh.count).toBe(0); // before flush
    renderer.flush(1);
    expect(mesh.count).toBe(100);
  });

  it("removing object releases slot and does not leak raycast metadata", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, TILE, "tree_oak");
    renderer.flush(1);
    renderer.remove(ID1);

    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(1);
    const mesh = targets[0];
    expect(mesh).toBeDefined();
    const instanceMap = (mesh as import("three").InstancedMesh).userData.instanceMap as {
      entityId: number;
      defId: string;
    }[];
    expect(instanceMap).toBeDefined();

    // ID1 should be gone from instanceMap
    const found = instanceMap.find((m) => m && m.entityId === ID1);
    expect(found).toBeUndefined();

    // ID2 should still be there
    const found2 = instanceMap.find((m) => m && m.entityId === ID2);
    expect(found2).toBeDefined();
    expect(found2?.defId).toBe("tree_oak");
  });

  it("transform to different archetype releases old slot and acquires new bucket slot", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.flush(1);
    renderer.transform(ID1, "rock_copper");

    expect(renderer.objectCount).toBe(1);
    const group = scene.children[0];
    expect(group).toBeDefined();
    // tree and rock are different archetypes => two buckets
    expect(group?.children.length).toBe(2);

    // Check raycast metadata: ID1 must be in the rock bucket
    let foundId1 = false;
    for (const mesh of renderer.getRaycastTargets()) {
      const map = mesh.userData.instanceMap as { entityId: number; defId: string }[];
      for (const meta of map) {
        if (meta && meta.entityId === ID1) {
          foundId1 = true;
          expect(meta.defId).toBe("rock_copper");
        }
      }
    }
    expect(foundId1).toBe(true);
  });

  it("bucket flush is deferred to render frame, not inside spawn", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    const group = scene.children[0];
    expect(group).toBeDefined();
    const mesh = group?.children[0] as import("three").InstancedMesh;
    expect(mesh.count).toBe(0); // no flush yet
    renderer.flush(1);
    expect(mesh.count).toBe(1);
  });

  it("picking still identifies object entity ids and def ids", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, { x: 6, y: 5, plane: 0 }, "tree_oak");
    renderer.flush(1);

    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(1);
    const mesh = targets[0];
    expect(mesh).toBeDefined();
    const instanceMap = (mesh as import("three").InstancedMesh).userData.instanceMap as {
      entityId: number;
      defId: string;
    }[];
    expect(instanceMap).toBeDefined();

    const meta1 = instanceMap.find((m) => m && m.entityId === ID1);
    expect(meta1).toBeDefined();
    expect(meta1?.defId).toBe("tree_oak");

    const meta2 = instanceMap.find((m) => m && m.entityId === ID2);
    expect(meta2).toBeDefined();
    expect(meta2?.defId).toBe("tree_oak");
  });

  it("clear removes all objects and flushes", () => {
    for (let i = 0; i < 10; i++) {
      renderer.spawn(entityId(i + 1), { x: i, y: 5, plane: 0 }, "tree_oak");
    }
    renderer.flush(1);
    expect(renderer.objectCount).toBe(10);
    renderer.clear();
    expect(renderer.objectCount).toBe(0);
    const targets = renderer.getRaycastTargets();
    for (const mesh of targets) {
      expect(mesh.count).toBe(0);
    }
  });

  it("dispose removes all buckets and resources", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID2, TILE, "rock_copper");
    renderer.flush(1);
    renderer.dispose();
    expect(renderer.objectCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it("setRegionVisible hides whole buckets without destroying slots", () => {
    renderer.spawn(ID1, { x: 0, y: 0, plane: 0 }, "tree_oak");
    renderer.spawn(ID2, { x: 65, y: 5, plane: 0 }, "tree_oak");
    renderer.flush(1);
    // Two different regions => two buckets
    expect(renderer.getRaycastTargets().length).toBe(2);

    renderer.setRegionVisible("0:0:0", false);
    const targets = renderer.getRaycastTargets();
    expect(targets[0]?.visible).toBe(false);
    expect(targets[1]?.visible).toBe(true);
  });

  it("updateTransform writes rotation to bucket", () => {
    renderer.spawn(ID1, TILE, "door_wood");
    renderer.updateTransform(ID1, 1);
    renderer.flush(1);
    expect(renderer.objectCount).toBe(1);
    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(1);
  });

  it("duplicate spawn replaces existing object", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.spawn(ID1, TILE, "rock_copper");
    expect(renderer.objectCount).toBe(1);
    renderer.flush(1);
    const targets = renderer.getRaycastTargets();
    let found = false;
    for (const mesh of targets) {
      const map = mesh.userData.instanceMap as { entityId: number; defId: string }[];
      for (const meta of map) {
        if (meta && meta.entityId === ID1) {
          found = true;
          expect(meta.defId).toBe("rock_copper");
        }
      }
    }
    expect(found).toBe(true);
  });

  it("handles remove of non-existent object gracefully", () => {
    renderer.remove(ID999);
    expect(renderer.objectCount).toBe(0);
  });

  it("does not dispose shared geometry/material on remove", () => {
    renderer.spawn(ID1, TILE, "tree_oak");
    renderer.flush(1);
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
    expect(geometry.uuid).toBeDefined();
    expect((material as import("three").MeshLambertMaterial).uuid).toBeDefined();
  });
});
