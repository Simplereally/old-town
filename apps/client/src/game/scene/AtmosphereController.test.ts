import type { WebGLRenderer } from "three";
import { Color, DirectionalLight, Fog, HemisphereLight, Scene, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { ATMOSPHERE_DAY_MS, AtmosphereController, sampleAtmosphere } from "./AtmosphereController";
import { BlobShadowLayer } from "./BlobShadowLayer";

describe("sampleAtmosphere", () => {
  it("returns day values near midday phase", () => {
    const midday = sampleAtmosphere(ATMOSPHERE_DAY_MS * 0.5);
    expect(midday.phaseName).toBe("day");
    expect(midday.clearColor).toBe(midday.fogColor);
    expect(midday.sunIntensity).toBeGreaterThan(2);
  });

  it("returns night values near midnight phase", () => {
    const night = sampleAtmosphere(ATMOSPHERE_DAY_MS * 0.95);
    expect(night.phaseName).toBe("night");
    expect(night.clearColor).toBe(night.fogColor);
    expect(night.sunIntensity).toBeLessThan(1);
  });

  it("changes light and fog coherently across the cycle", () => {
    const dawn = sampleAtmosphere(ATMOSPHERE_DAY_MS * 0.22);
    const day = sampleAtmosphere(ATMOSPHERE_DAY_MS * 0.45);
    const dusk = sampleAtmosphere(ATMOSPHERE_DAY_MS * 0.72);
    expect(dawn.clearColor).toBe(dawn.fogColor);
    expect(day.clearColor).toBe(day.fogColor);
    expect(dusk.clearColor).toBe(dusk.fogColor);
    expect(new Set([dawn.clearColor, day.clearColor, dusk.clearColor]).size).toBeGreaterThan(1);
    expect(day.hemisphereIntensity).toBeGreaterThan(dawn.hemisphereIntensity);
  });
});

describe("AtmosphereController", () => {
  it("applies coherent clear/fog/light updates and supports freeze", () => {
    const scene = new Scene();
    const background = new Color(0x87ceeb);
    scene.background = background;
    const fog = new Fog(0x87ceeb, 75, 150);
    scene.fog = fog;
    const hemi = new HemisphereLight(0xffffff, 0x000000, 1);
    const sun = new DirectionalLight(0xffffff, 1);
    const renderer = {
      setClearColor: vi.fn(),
    } as unknown as WebGLRenderer;

    const controller = new AtmosphereController({
      renderer,
      sceneBackground: background,
      fog,
      hemisphereLight: hemi,
      directionalLight: sun,
    });

    const day = controller.update(ATMOSPHERE_DAY_MS * 0.45);
    expect(day.phaseName).toBe("day");
    expect(fog.color.getHex()).toBe(day.fogColor);
    expect(background.getHex()).toBe(day.clearColor);
    expect(hemi.intensity).toBeCloseTo(day.hemisphereIntensity, 5);
    expect(sun.intensity).toBeCloseTo(day.sunIntensity, 5);

    controller.setFrozenPhase(0.95);
    const frozen = controller.update(ATMOSPHERE_DAY_MS * 0.45);
    expect(controller.frozen).toBe(true);
    expect(frozen.phaseName).toBe("night");
  });
});

describe("BlobShadowLayer", () => {
  it("creates and disposes shadows with actors", () => {
    const scene = new Scene();
    const layer = new BlobShadowLayer({ scene });
    const pos = new Vector3(1, 0, 2);
    layer.ensure(1, pos);
    expect(layer.count).toBe(1);
    layer.syncActors(new Map([[2, new Vector3(3, 0, 4)]]));
    expect(layer.count).toBe(1);
    layer.ensureObject(10, 5, 6);
    expect(layer.count).toBe(2);
    layer.dispose();
    expect(layer.count).toBe(0);
  });
});
