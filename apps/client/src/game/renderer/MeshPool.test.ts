import { BoxGeometry, MeshBasicMaterial, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { MeshPool } from "../renderer/MeshPool";

describe("MeshPool", () => {
  let scene: Scene;
  let pool: MeshPool;

  beforeEach(() => {
    scene = new Scene();
    pool = new MeshPool({
      geometry: new BoxGeometry(1, 1, 1),
      material: new MeshBasicMaterial({ color: 0xff0000 }),
      initialSize: 2,
    });
  });

  it("acquires a mesh from the pool", () => {
    const mesh = pool.acquire();
    expect(mesh).toBeDefined();
    expect(pool.activeCount).toBe(1);
    expect(mesh.visible).toBe(true);
  });

  it("releases a mesh back to the pool", () => {
    const mesh = pool.acquire();
    pool.release(mesh);
    expect(pool.activeCount).toBe(0);
    expect(mesh.visible).toBe(false);
  });

  it("grows the pool when all meshes are in use", () => {
    const _mesh1 = pool.acquire();
    const _mesh2 = pool.acquire();
    expect(pool.poolSize).toBe(2);
    const _mesh3 = pool.acquire();
    expect(pool.poolSize).toBe(3);
    expect(pool.activeCount).toBe(3);
  });

  it("reuses released meshes", () => {
    const mesh1 = pool.acquire();
    pool.release(mesh1);
    const mesh2 = pool.acquire();
    expect(mesh2).toBe(mesh1);
    expect(pool.poolSize).toBe(2);
  });

  it("removes mesh from parent on release", () => {
    const mesh = pool.acquire();
    scene.add(mesh);
    expect(mesh.parent).toBe(scene);
    pool.release(mesh);
    expect(mesh.parent).toBeNull();
  });

  it("resets mesh transform on release", () => {
    const mesh = pool.acquire();
    mesh.position.set(10, 20, 30);
    mesh.rotation.set(1, 2, 3);
    mesh.scale.set(2, 2, 2);
    pool.release(mesh);
    expect(mesh.position.x).toBe(0);
    expect(mesh.position.y).toBe(0);
    expect(mesh.position.z).toBe(0);
    expect(mesh.rotation.x).toBe(0);
    expect(mesh.rotation.y).toBe(0);
    expect(mesh.rotation.z).toBe(0);
    expect(mesh.scale.x).toBe(1);
    expect(mesh.scale.y).toBe(1);
    expect(mesh.scale.z).toBe(1);
  });

  it("ignores release of already-released mesh", () => {
    const mesh = pool.acquire();
    pool.release(mesh);
    pool.release(mesh);
    expect(pool.activeCount).toBe(0);
  });

  it("ignores release of unknown mesh", () => {
    const otherPool = new MeshPool({
      geometry: new BoxGeometry(1, 1, 1),
      material: new MeshBasicMaterial({ color: 0x00ff00 }),
      initialSize: 1,
    });
    const otherMesh = otherPool.acquire();
    pool.release(otherMesh);
    expect(pool.activeCount).toBe(0);
    otherPool.dispose();
  });

  it("disposes all internal state", () => {
    const mesh = pool.acquire();
    pool.release(mesh);
    pool.dispose();
    expect(pool.poolSize).toBe(0);
    expect(pool.activeCount).toBe(0);
  });

  it("does not grow beyond maxSize", () => {
    const smallPool = new MeshPool({
      geometry: new BoxGeometry(1, 1, 1),
      material: new MeshBasicMaterial({ color: 0x0000ff }),
      initialSize: 1,
      maxSize: 2,
    });
    expect(smallPool.acquire()).toBeDefined();
    expect(smallPool.acquire()).toBeDefined();
    expect(smallPool.acquire()).toBeNull();
    expect(smallPool.poolSize).toBe(2);
    smallPool.dispose();
  });

  it("shares geometry and material across pooled meshes", () => {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const sharedPool = new MeshPool({
      geometry,
      material,
      initialSize: 2,
    });
    const mesh1 = sharedPool.acquire();
    const mesh2 = sharedPool.acquire();
    expect(mesh1.geometry).toBe(geometry);
    expect(mesh2.geometry).toBe(geometry);
    expect(mesh1.material).toBe(material);
    expect(mesh2.material).toBe(material);
    sharedPool.dispose();
  });
});
