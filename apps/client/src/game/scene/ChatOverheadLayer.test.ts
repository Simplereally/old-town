import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatOverheadLayer } from "./ChatOverheadLayer";

function mockCanvasContext(): void {
  const mockCtx = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    measureText: vi.fn(() => ({ width: 80 })),
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

describe("ChatOverheadLayer", () => {
  let scene: Scene;
  let layer: ChatOverheadLayer;

  beforeEach(() => {
    mockCanvasContext();
    scene = new Scene();
    layer = new ChatOverheadLayer({ scene });
  });

  it("starts with no bubbles", () => {
    expect(layer.bubbleCount).toBe(0);
  });

  it("shows a chat bubble for an entity", () => {
    const pos = new Vector3(1, 0, -1);
    layer.show(1, "Hello!", pos);
    expect(layer.bubbleCount).toBe(1);
  });

  it("updates bubble position to follow actor", () => {
    const pos = new Vector3(1, 0, -1);
    layer.show(1, "Hello!", pos);

    const newPos = new Vector3(2, 0, -2);
    const positions = new Map<number, Vector3>();
    positions.set(1, newPos);
    layer.update(positions);

    // Bubble should be at new position + 1.5 Y offset
    expect(scene.children.length).toBe(1);
    const sprite = scene.children[0] as import("three").Sprite;
    expect(sprite.position.x).toBe(2);
    expect(sprite.position.z).toBe(-2);
    expect(sprite.position.y).toBe(1.5);
  });

  it("removes a bubble by entity ID", () => {
    const pos = new Vector3(1, 0, -1);
    layer.show(1, "Hello!", pos);
    layer.remove(1);
    expect(layer.bubbleCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it("clears all bubbles", () => {
    layer.show(1, "Hello!", new Vector3(1, 0, -1));
    layer.show(2, "Hi!", new Vector3(2, 0, -2));
    layer.clear();
    expect(layer.bubbleCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it("disposes all resources", () => {
    layer.show(1, "Hello!", new Vector3(1, 0, -1));
    layer.dispose();
    expect(layer.bubbleCount).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it("replaces existing bubble for same entity", () => {
    layer.show(1, "First", new Vector3(1, 0, -1));
    layer.show(1, "Second", new Vector3(1, 0, -1));
    expect(layer.bubbleCount).toBe(1);
  });

  it("fades out bubbles after duration", () => {
    const pos = new Vector3(1, 0, -1);
    layer.show(1, "Hello!", pos);

    // Fast-forward time by overriding performance.now
    const originalNow = performance.now;
    let fakeTime = 0;
    Object.defineProperty(performance, "now", {
      value: () => fakeTime,
      writable: true,
    });

    layer.show(1, "Hello!", pos);
    fakeTime = 5000; // Past the 4000ms duration
    const positions = new Map<number, Vector3>();
    positions.set(1, pos);
    layer.update(positions);

    expect(layer.bubbleCount).toBe(0);

    // Restore
    Object.defineProperty(performance, "now", {
      value: originalNow,
      writable: true,
    });
  });
});
