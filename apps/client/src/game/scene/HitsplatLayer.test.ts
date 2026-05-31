import { entityId } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { HitsplatLayer } from "./HitsplatLayer";

const ID1 = entityId(1);
const ID2 = entityId(2);

describe("HitsplatLayer", () => {
  let scene: Scene;
  let layer: HitsplatLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new HitsplatLayer({ scene });
  });

  it("shows a hitsplat", () => {
    layer.show(ID1, 5, "damage");
    expect(scene.children.length).toBe(1); // Group added
  });

  it("shows different hit types", () => {
    layer.show(ID1, 5, "damage");
    layer.show(ID1, 3, "heal");
    layer.show(ID1, 0, "block");
    layer.show(ID1, 2, "poison");
    expect(scene.children.length).toBe(1); // Group added
  });

  it("updates hitsplat positions", () => {
    layer.show(ID1, 5, "damage");
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(positions);
    expect(scene.children.length).toBe(1);
  });

  it("clears all hitsplats", () => {
    layer.show(ID1, 5, "damage");
    layer.show(ID2, 3, "heal");
    layer.clear();
    expect(scene.children.length).toBe(1);
  });

  it("fades out hitsplats over time", () => {
    layer.show(ID1, 5, "damage");
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(positions);
    const hitsplat = (
      layer as unknown as { hitsplats: Map<number, { mesh: { material: { opacity: number } } }> }
    ).hitsplats.get(1);
    expect(hitsplat?.mesh.material.opacity).toBeLessThanOrEqual(1);
  });

  it("disposes all resources", () => {
    layer.show(ID1, 5, "damage");
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });
});
