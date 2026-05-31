import { OrthographicCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { describe, expect, it } from "vitest";
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

  it("follows a target position", () => {
    const { controller } = createController();
    const target = new Vector3(5, 0, 5);
    controller.followTarget(target);
    expect(controller.controls.target.x).toBe(5);
    expect(controller.controls.target.z).toBe(5);
  });

  it("sets zoom limits", () => {
    const { controller, controls } = createController();
    controller.setZoomLimits(0.5, 3);
    expect(controls.minZoom).toBe(0.5);
    expect(controls.maxZoom).toBe(3);
  });
});
