import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { GridOverlay } from "./GridOverlay";

describe("GridOverlay", () => {
  let scene: Scene;
  let overlay: GridOverlay;

  beforeEach(() => {
    scene = new Scene();
    overlay = new GridOverlay({ scene });
  });

  it("starts hidden", () => {
    expect(overlay.visible).toBe(false);
  });

  it("can be toggled visible", () => {
    overlay.toggle();
    expect(overlay.visible).toBe(true);
  });

  it("can be toggled back to hidden", () => {
    overlay.toggle();
    overlay.toggle();
    expect(overlay.visible).toBe(false);
  });

  it("can be set visible directly", () => {
    overlay.visible = true;
    expect(overlay.visible).toBe(true);
  });

  it("has a grid in the scene", () => {
    const grids = scene.children.filter((c) => c.type === "GridHelper");
    expect(grids.length).toBe(1);
  });

  it("disposes cleanly", () => {
    overlay.toggle();
    overlay.dispose();
    expect(scene.children.length).toBe(0);
  });
});
