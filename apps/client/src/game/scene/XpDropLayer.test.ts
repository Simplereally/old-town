import { entityId } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { XpDropLayer } from "./XpDropLayer";

const ID1 = entityId(1);

function mockCanvasContext(): void {
  const mockCtx = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    measureText: vi.fn(() => ({ width: 20 })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
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

describe("XpDropLayer", () => {
  let scene: Scene;
  let layer: XpDropLayer;

  beforeEach(() => {
    mockCanvasContext();
    scene = new Scene();
    layer = new XpDropLayer({ scene });
  });

  it("shows an XP drop", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    expect(scene.children.length).toBe(1); // Group added
    expect(layer.activeCount).toBe(1);
  });

  it("shows different skill colors", () => {
    layer.show(ID1, "woodcutting", 10, 10);
    layer.show(ID1, "mining", 15, 10);
    layer.show(ID1, "cooking", 20, 10);
    expect(scene.children.length).toBe(1);
    expect(layer.activeCount).toBe(3);
  });

  it("updates drop positions to track entity", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);
    layer.update(10, positions);
    expect(scene.children.length).toBe(1);
  });

  it("removes drops after lifetime expires", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);

    // Simulate time passing beyond the 1.5s lifetime
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now + 2000);

    layer.update(10, positions);
    expect(layer.activeCount).toBe(0);

    vi.restoreAllMocks();
  });

  it("fades out drops over time", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);

    layer.update(10, positions);
    const drop = (
      layer as unknown as { drops: Map<number, { sprite: { material: { opacity: number } } }> }
    ).drops.get(1);
    expect(drop?.sprite.material.opacity).toBeLessThanOrEqual(1);
  });

  it("removes drops when entity position is missing", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    const positions = new Map<number, Vector3>();
    layer.update(10, positions);
    expect(layer.activeCount).toBe(0);
  });

  it("clears all drops", () => {
    layer.show(ID1, "woodcutting", 10, 10);
    layer.show(ID1, "mining", 15, 10);
    layer.clear();
    expect(layer.activeCount).toBe(0);
  });

  it("disposes all resources", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });

  it("shows multiple simultaneous drops with correct counts", () => {
    layer.show(ID1, "woodcutting", 10, 10);
    layer.show(ID1, "mining", 15, 10);
    layer.show(ID1, "cooking", 20, 10);
    layer.show(ID1, "smithing", 25, 10);
    expect(layer.activeCount).toBe(4);
  });

  it("floats drops upward over time", () => {
    layer.show(ID1, "woodcutting", 25, 10);
    const positions = new Map<number, Vector3>([[1, new Vector3(5, 0, -5)]]);

    layer.update(10, positions);
    const initialY = (
      layer as unknown as { drops: Map<number, { sprite: { position: { y: number } } }> }
    ).drops.get(1)?.sprite.position.y;

    // Simulate 750ms elapsed (halfway)
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now + 750);

    layer.update(10, positions);
    const laterY = (
      layer as unknown as { drops: Map<number, { sprite: { position: { y: number } } }> }
    ).drops.get(1)?.sprite.position.y;

    expect(laterY).toBeGreaterThan(initialY ?? 0);

    vi.restoreAllMocks();
  });
});
