import { OrthographicCamera, Vector3 } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TilePicker } from "./TilePicker";

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  canvas.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    toJSON: () => ({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
    }),
  }));
  return canvas;
}

function createOrthographicCamera(): OrthographicCamera {
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
  camera.position.set(10, 10, 10);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

describe("TilePicker", () => {
  let camera: OrthographicCamera;
  let canvas: HTMLCanvasElement;
  let picker: TilePicker;

  beforeEach(() => {
    camera = createOrthographicCamera();
    canvas = createMockCanvas();
    picker = new TilePicker({ camera, canvas });
  });

  it("has a raycaster and ground plane", () => {
    expect(picker.raycaster).toBeDefined();
    expect(picker.groundPlane).toBeDefined();
  });

  it("converts screen center to a ground point", () => {
    const ground = picker.screenToGroundPoint(400, 300);
    expect(ground).not.toBeNull();
    expect(ground).toBeInstanceOf(Vector3);
  });

  it("converts screen center to tile coordinates", () => {
    const tile = picker.screenToTile(400, 300);
    expect(tile).not.toBeNull();
    if (tile) {
      expect(typeof tile.x).toBe("number");
      expect(typeof tile.y).toBe("number");
    }
  });

  it("returns a tile for coordinates outside the canvas (ray extends infinitely)", () => {
    const tile = picker.screenToTile(1200, 900);
    expect(tile).not.toBeNull();
    if (tile) {
      expect(typeof tile.x).toBe("number");
      expect(typeof tile.y).toBe("number");
    }
  });

  it("returns consistent tile for the same screen position", () => {
    const tile1 = picker.screenToTile(200, 200);
    const tile2 = picker.screenToTile(200, 200);
    expect(tile1).toEqual(tile2);
  });
});
