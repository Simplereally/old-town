import { Scene, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { SelectionRingLayer } from "./SelectionRingLayer";

describe("SelectionRingLayer", () => {
  it("shows a persistent selection distinct from hover defaults", () => {
    const scene = new Scene();
    const layer = new SelectionRingLayer({ scene });
    expect(layer.visible).toBe(false);
    layer.select(42, new Vector3(1, 0, 2), 0.05);
    expect(layer.visible).toBe(true);
    expect(layer.selectedEntityId).toBe(42);
    layer.clear();
    expect(layer.visible).toBe(false);
    expect(layer.selectedEntityId).toBeUndefined();
    layer.dispose();
  });

  it("updates selection when a new entity is selected", () => {
    const scene = new Scene();
    const layer = new SelectionRingLayer({ scene });
    layer.select(1, new Vector3(0, 0, 0));
    layer.select(2, new Vector3(3, 0, 4));
    expect(layer.selectedEntityId).toBe(2);
    layer.dispose();
  });
});
