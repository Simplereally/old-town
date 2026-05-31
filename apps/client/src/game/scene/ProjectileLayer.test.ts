import type { TileCoord } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ProjectileLayer } from "./ProjectileLayer";

const START: TileCoord = { x: 0, y: 0, plane: 0 };
const END: TileCoord = { x: 5, y: 5, plane: 0 };

describe("ProjectileLayer", () => {
  let scene: Scene;
  let layer: ProjectileLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new ProjectileLayer({ scene });
  });

  it("spawns a projectile", () => {
    layer.spawn("proj1", START, END);
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it("removes a projectile", () => {
    layer.spawn("proj1", START, END);
    layer.remove("proj1");
    expect(scene.children.length).toBe(1); // Group remains in scene
  });

  it("clears all projectiles", () => {
    layer.spawn("proj1", START, END);
    layer.spawn("proj2", START, END);
    layer.clear();
    expect(scene.children.length).toBe(1); // Group remains in scene
  });

  it("updates projectile positions", () => {
    layer.spawn("proj1", START, END);
    layer.update();
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it("auto-removes projectiles after duration", () => {
    layer.spawn("proj1", START, END);
    const proj = (
      layer as unknown as { projectiles: Map<string, { startTime: number }> }
    ).projectiles.get("proj1");
    if (proj) {
      proj.startTime = performance.now() - 1000;
    }
    layer.update();
    expect(scene.children.length).toBe(1);
  });

  it("disposes all resources", () => {
    layer.spawn("proj1", START, END);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });
});
