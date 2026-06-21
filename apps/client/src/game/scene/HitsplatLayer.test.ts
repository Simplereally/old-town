import { entityId, GAME_TICK_MS } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HitsplatLayer } from "./HitsplatLayer";

const ID1 = entityId(1);
const ID2 = entityId(2);

function mockCanvasContext(): void {
  const mockCtx = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    strokeStyle: "",
    lineWidth: 0,
    measureText: vi.fn(() => ({ width: 20 })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
  };
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = originalCreateElement(tagName);
      canvas.getContext = vi.fn((type: string) => {
        if (type === "2d") return mockCtx as unknown as CanvasRenderingContext2D;
        return null;
      }) as unknown as typeof canvas.getContext;
      return canvas;
    }
    return originalCreateElement(tagName);
  }) as typeof document.createElement;
}

describe("HitsplatLayer", () => {
  let scene: Scene;
  let layer: HitsplatLayer;

  beforeEach(() => {
    mockCanvasContext();
    scene = new Scene();
    layer = new HitsplatLayer({ scene });
  });

  it("shows a damage hitsplat", () => {
    layer.show(ID1, 5, "damage", 10);
    expect(scene.children.length).toBe(1); // Group added
    expect(layer.activeHitsplats).toBe(1);
  });

  it("shows different hit types", () => {
    layer.show(ID1, 5, "damage", 10);
    layer.show(ID1, 3, "heal", 10);
    layer.show(ID1, 0, "block", 10);
    layer.show(ID1, 2, "poison", 10);
    expect(scene.children.length).toBe(1); // Group added
    expect(layer.activeHitsplats).toBe(4);
  });

  it("updates hitsplat positions using server time", () => {
    layer.show(ID1, 5, "damage", 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(10, 10 * GAME_TICK_MS, positions);
    expect(scene.children.length).toBe(1);
  });

  it("removes hitsplats after lifetime ticks", () => {
    layer.show(ID1, 5, "damage", 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(10, 10 * GAME_TICK_MS, positions);
    expect(scene.children[0]?.children.length).toBe(1);
    layer.update(12, 12 * GAME_TICK_MS, positions);
    expect(scene.children[0]?.children.length).toBe(0);
    expect(layer.activeHitsplats).toBe(0);
  });

  it("clears all hitsplats", () => {
    layer.show(ID1, 5, "damage", 10);
    layer.show(ID2, 3, "heal", 10);
    layer.clear();
    expect(scene.children[0]?.children.length).toBe(0);
    expect(layer.activeHitsplats).toBe(0);
  });

  it("fades out hitsplats over time", () => {
    layer.show(ID1, 5, "damage", 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(10, 10 * GAME_TICK_MS, positions);
    const hitsplat = (
      layer as unknown as { hitsplats: Map<number, { material: { opacity: number } }> }
    ).hitsplats.get(1);
    expect(hitsplat?.material.opacity).toBeLessThanOrEqual(1);
  });

  it("disposes all resources", () => {
    layer.show(ID1, 5, "damage", 10);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });

  it("reuses sprites after spawn/remove cycles", () => {
    layer.show(ID1, 5, "damage", 10);
    const poolSizeBefore = layer.poolSize;
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(12, 12 * GAME_TICK_MS, positions);
    layer.show(ID2, 3, "heal", 12);
    expect(layer.poolSize).toBe(poolSizeBefore);
  });

  it("exposes pool stats", () => {
    layer.show(ID1, 5, "damage", 10);
    expect(layer.activeHitsplats).toBe(1);
    expect(layer.poolSize).toBeGreaterThanOrEqual(1);
  });
});
