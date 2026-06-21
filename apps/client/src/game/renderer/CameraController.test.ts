import { OrthographicCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { describe, expect, it, vi } from "vitest";
import { CameraController } from "./CameraController";

function createController(): {
  camera: OrthographicCamera;
  controls: OrbitControls;
  controller: CameraController;
} {
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
  const canvas = document.createElement("canvas");
  const controls = new OrbitControls(camera, canvas);
  const controller = new CameraController({ camera, controls, canvas });
  return { camera, controls, controller };
}

function dispatchArrow(key: string): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

function dispatchKeyUp(key: string): void {
  document.dispatchEvent(new KeyboardEvent("keyup", { key }));
}

describe("CameraController", () => {
  it("starts in isometric mode", () => {
    const { controller } = createController();
    expect(controller.isometricAngle).toBe(true);
  });

  it("can toggle free rotation", () => {
    const { controller } = createController();
    controller.setIsometricAngle(false);
    expect(controller.isometricAngle).toBe(false);
  });

  it("can toggle back to isometric", () => {
    const { controller } = createController();
    controller.setIsometricAngle(false);
    controller.setIsometricAngle(true);
    expect(controller.isometricAngle).toBe(true);
  });

  it("updates camera aspect on resize", () => {
    const { camera, controller } = createController();
    controller.updateAspect(800, 600);
    expect(camera.left).toBeLessThan(0);
    expect(camera.right).toBeGreaterThan(0);
  });

  it("follows a target position, moving the camera to preserve offset", () => {
    const { camera, controller } = createController();
    const target1 = new Vector3(5, 0, 5);
    controller.followTarget(target1);
    expect(controller.controls.target.x).toBe(5);
    expect(controller.controls.target.z).toBe(5);

    // Moving the target should move the camera by the same delta.
    const camPosBefore = camera.position.clone();
    const target2 = new Vector3(10, 0, 15);
    controller.followTarget(target2);
    const expectedDelta = new Vector3(5, 0, 10); // target2 - target1
    expect(camera.position.x).toBeCloseTo(camPosBefore.x + expectedDelta.x);
    expect(camera.position.z).toBeCloseTo(camPosBefore.z + expectedDelta.z);
  });

  it("sets zoom limits", () => {
    const { controller, controls } = createController();
    controller.setZoomLimits(0.5, 3);
    expect(controls.minZoom).toBe(0.5);
    expect(controls.maxZoom).toBe(3);
  });

  it("disables all mouse-driven camera control", () => {
    const { controls } = createController();
    expect(controls.mouseButtons.LEFT).toBeNull();
    expect(controls.mouseButtons.MIDDLE).toBeNull();
    expect(controls.mouseButtons.RIGHT).toBeNull();
  });

  it("rotates camera via held arrow keys", () => {
    const { controls, controller } = createController();
    controller.setIsometricAngle(false); // ensure enableRotate is true
    const rotateLeft = vi.spyOn(controls, "rotateLeft");
    const rotateUp = vi.spyOn(controls, "rotateUp");
    const dt = 0.016;

    // keydown alone does not rotate — rotation happens in update().
    dispatchArrow("ArrowLeft");
    expect(rotateLeft).not.toHaveBeenCalled();

    controller.update(dt);
    expect(rotateLeft).toHaveBeenCalledTimes(1);
    const leftStep = rotateLeft.mock.calls.at(-1)?.[0] ?? 0;
    expect(leftStep).toBeGreaterThan(0);

    // Holding continues to rotate on subsequent update() calls.
    controller.update(dt);
    expect(rotateLeft).toHaveBeenCalledTimes(2);

    dispatchKeyUp("ArrowLeft");
    controller.update(dt);
    expect(rotateLeft).toHaveBeenCalledTimes(2); // no further rotation

    dispatchArrow("ArrowRight");
    controller.update(dt);
    expect(rotateLeft).toHaveBeenLastCalledWith(-leftStep);

    dispatchKeyUp("ArrowRight");
    dispatchArrow("ArrowUp");
    controller.update(dt);
    expect(rotateUp).toHaveBeenLastCalledWith(leftStep);

    dispatchKeyUp("ArrowUp");
    dispatchArrow("ArrowDown");
    controller.update(dt);
    expect(rotateUp).toHaveBeenLastCalledWith(-leftStep);
  });

  it("does not rotate via arrow keys when rotation is locked", () => {
    const { controls, controller } = createController();
    controller.setIsometricAngle(true); // locks rotation (enableRotate = false)
    const rotateLeft = vi.spyOn(controls, "rotateLeft");
    const rotateUp = vi.spyOn(controls, "rotateUp");

    dispatchArrow("ArrowLeft");
    controller.update(0.016);
    dispatchArrow("ArrowUp");
    controller.update(0.016);
    expect(rotateLeft).not.toHaveBeenCalled();
    expect(rotateUp).not.toHaveBeenCalled();
  });

  it("clears held keys on window blur", () => {
    const { controls, controller } = createController();
    controller.setIsometricAngle(false);
    const rotateLeft = vi.spyOn(controls, "rotateLeft");

    dispatchArrow("ArrowLeft");
    controller.update(0.016);
    expect(rotateLeft).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("blur"));
    controller.update(0.016);
    expect(rotateLeft).toHaveBeenCalledTimes(1); // no rotation after blur
  });
});
