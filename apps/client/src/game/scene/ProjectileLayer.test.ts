import type { TileCoord } from "@old-town/shared";
import { GAME_TICK_MS } from "@old-town/shared";
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
    layer.spawn("proj1", START, END, 1, 3);
    expect(scene.children.length).toBeGreaterThan(0);
    expect(layer.activeProjectiles).toBe(1);
  });

  it("removes a projectile", () => {
    layer.spawn("proj1", START, END, 1, 3);
    layer.remove("proj1");
    expect(scene.children.length).toBe(1); // Group remains in scene
    expect(layer.activeProjectiles).toBe(0);
  });

  it("clears all projectiles", () => {
    layer.spawn("proj1", START, END, 1, 3);
    layer.spawn("proj2", START, END, 2, 4);
    layer.clear();
    expect(scene.children.length).toBe(1); // Group remains in scene
    expect(layer.activeProjectiles).toBe(0);
  });

  it("updates projectile positions using server time", () => {
    layer.spawn("proj1", START, END, 1, 3);
    layer.update(1 * GAME_TICK_MS);
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it("auto-removes projectiles after duration", () => {
    layer.spawn("proj1", START, END, 1, 3);
    layer.update(3 * GAME_TICK_MS);
    expect(scene.children.length).toBe(1);
    expect(layer.activeProjectiles).toBe(0);
  });

  it("disposes all resources", () => {
    layer.spawn("proj1", START, END, 1, 3);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });

  it("reuses meshes after spawn/remove cycles", () => {
    layer.spawn("proj1", START, END, 1, 3);
    const poolSizeBefore = layer.poolSize;
    layer.remove("proj1");
    layer.spawn("proj2", START, END, 1, 3);
    expect(layer.poolSize).toBe(poolSizeBefore);
  });

  it("exposes pool stats", () => {
    layer.spawn("proj1", START, END, 1, 3);
    expect(layer.activeProjectiles).toBe(1);
    expect(layer.poolSize).toBeGreaterThanOrEqual(1);
  });
});
