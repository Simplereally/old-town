/**
 * Day/night atmosphere controller (E47-S03).
 *
 * Presentation-only: drives clear color, fog, hemisphere light, and directional
 * sun from a shared phase derived from server/render time. Does not affect
 * gameplay truth.
 */
import {
  Color,
  type DirectionalLight,
  type Fog,
  type HemisphereLight,
  type WebGLRenderer,
} from "three";

/** Real-time milliseconds for one full presentation day cycle. */
export const ATMOSPHERE_DAY_MS = 20 * 60 * 1000;

export type AtmospherePhaseName = "dawn" | "day" | "dusk" | "night";

export interface AtmosphereSample {
  readonly phase01: number;
  readonly phaseName: AtmospherePhaseName;
  readonly clearColor: number;
  readonly fogColor: number;
  readonly skyColor: number;
  readonly groundColor: number;
  readonly sunColor: number;
  readonly hemisphereIntensity: number;
  readonly sunIntensity: number;
  readonly sunElevation: number;
}

interface AtmosphereKeyframes {
  readonly clear: number;
  readonly fog: number;
  readonly sky: number;
  readonly ground: number;
  readonly sun: number;
  readonly hemiIntensity: number;
  readonly sunIntensity: number;
  readonly sunElevation: number;
}

const KEYFRAMES: ReadonlyArray<{
  readonly at: number;
  readonly name: AtmospherePhaseName;
  readonly k: AtmosphereKeyframes;
}> = [
  {
    at: 0.0,
    name: "night",
    k: {
      clear: 0x1a2438,
      fog: 0x1a2438,
      sky: 0x2a3a58,
      ground: 0x1a2818,
      sun: 0xa0b0d0,
      hemiIntensity: 0.85,
      sunIntensity: 0.55,
      sunElevation: 0.15,
    },
  },
  {
    at: 0.2,
    name: "dawn",
    k: {
      clear: 0xc48a6a,
      fog: 0xc48a6a,
      sky: 0xffc8a0,
      ground: 0x3a4a2a,
      sun: 0xffd0a0,
      hemiIntensity: 1.4,
      sunIntensity: 1.6,
      sunElevation: 0.45,
    },
  },
  {
    at: 0.35,
    name: "day",
    k: {
      clear: 0x87ceeb,
      fog: 0x87ceeb,
      sky: 0xdcefff,
      ground: 0x4a6b3a,
      sun: 0xfff3df,
      hemiIntensity: 2.1,
      sunIntensity: 2.6,
      sunElevation: 1.0,
    },
  },
  {
    at: 0.7,
    name: "dusk",
    k: {
      clear: 0xb07050,
      fog: 0xb07050,
      sky: 0xffb080,
      ground: 0x3a4a28,
      sun: 0xffc090,
      hemiIntensity: 1.3,
      sunIntensity: 1.4,
      sunElevation: 0.4,
    },
  },
  {
    at: 0.85,
    name: "night",
    k: {
      clear: 0x1a2438,
      fog: 0x1a2438,
      sky: 0x2a3a58,
      ground: 0x1a2818,
      sun: 0xa0b0d0,
      hemiIntensity: 0.85,
      sunIntensity: 0.55,
      sunElevation: 0.15,
    },
  },
  {
    at: 1.0,
    name: "night",
    k: {
      clear: 0x1a2438,
      fog: 0x1a2438,
      sky: 0x2a3a58,
      ground: 0x1a2818,
      sun: 0xa0b0d0,
      hemiIntensity: 0.85,
      sunIntensity: 0.55,
      sunElevation: 0.15,
    },
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return (r << 16) | (g << 8) | bl;
}

/** Pure phase calculation — unit-testable without Three.js. */
export function sampleAtmosphere(
  serverTimeMs: number,
  dayMs = ATMOSPHERE_DAY_MS,
): AtmosphereSample {
  const phase01 = (((serverTimeMs % dayMs) + dayMs) % dayMs) / dayMs;
  let i = 0;
  while (i < KEYFRAMES.length - 1 && phase01 >= (KEYFRAMES[i + 1]?.at ?? 1)) {
    i++;
  }
  const first = KEYFRAMES[0];
  if (!first) {
    throw new Error("Atmosphere keyframes must not be empty");
  }
  const a = KEYFRAMES[i] ?? first;
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)] ?? a;
  const span = Math.max(0.0001, b.at - a.at);
  const t = Math.min(1, Math.max(0, (phase01 - a.at) / span));
  return {
    phase01,
    phaseName: t < 0.5 ? a.name : b.name,
    clearColor: lerpColor(a.k.clear, b.k.clear, t),
    fogColor: lerpColor(a.k.fog, b.k.fog, t),
    skyColor: lerpColor(a.k.sky, b.k.sky, t),
    groundColor: lerpColor(a.k.ground, b.k.ground, t),
    sunColor: lerpColor(a.k.sun, b.k.sun, t),
    hemisphereIntensity: lerp(a.k.hemiIntensity, b.k.hemiIntensity, t),
    sunIntensity: lerp(a.k.sunIntensity, b.k.sunIntensity, t),
    sunElevation: lerp(a.k.sunElevation, b.k.sunElevation, t),
  };
}

export interface AtmosphereControllerOptions {
  readonly renderer: WebGLRenderer;
  readonly sceneBackground: Color;
  readonly fog: Fog;
  readonly hemisphereLight: HemisphereLight;
  readonly directionalLight: DirectionalLight;
}

export class AtmosphereController {
  private readonly _renderer: WebGLRenderer;
  private readonly _background: Color;
  private readonly _fog: Fog;
  private readonly _hemi: HemisphereLight;
  private readonly _sun: DirectionalLight;
  private readonly _tmpClear = new Color();
  private readonly _tmpFog = new Color();
  private readonly _tmpSky = new Color();
  private readonly _tmpGround = new Color();
  private readonly _tmpSun = new Color();
  private _frozenPhase01: number | undefined;
  private _lastSample: AtmosphereSample | undefined;

  constructor(options: AtmosphereControllerOptions) {
    this._renderer = options.renderer;
    this._background = options.sceneBackground;
    this._fog = options.fog;
    this._hemi = options.hemisphereLight;
    this._sun = options.directionalLight;
  }

  get frozen(): boolean {
    return this._frozenPhase01 !== undefined;
  }

  get lastSample(): AtmosphereSample | undefined {
    return this._lastSample;
  }

  /** Freeze presentation at a phase in [0,1], or clear freeze with undefined. */
  setFrozenPhase(phase01: number | undefined): void {
    if (phase01 === undefined) {
      this._frozenPhase01 = undefined;
      return;
    }
    this._frozenPhase01 = ((phase01 % 1) + 1) % 1;
  }

  update(serverTimeMs: number): AtmosphereSample {
    const sample =
      this._frozenPhase01 !== undefined
        ? sampleAtmosphere(this._frozenPhase01 * ATMOSPHERE_DAY_MS)
        : sampleAtmosphere(serverTimeMs);
    this._apply(sample);
    this._lastSample = sample;
    return sample;
  }

  private _apply(sample: AtmosphereSample): void {
    this._tmpClear.setHex(sample.clearColor);
    this._tmpFog.setHex(sample.fogColor);
    this._tmpSky.setHex(sample.skyColor);
    this._tmpGround.setHex(sample.groundColor);
    this._tmpSun.setHex(sample.sunColor);

    this._renderer.setClearColor(this._tmpClear, 1);
    this._background.copy(this._tmpClear);
    this._fog.color.copy(this._tmpFog);

    this._hemi.color.copy(this._tmpSky);
    this._hemi.groundColor.copy(this._tmpGround);
    this._hemi.intensity = sample.hemisphereIntensity;

    this._sun.color.copy(this._tmpSun);
    this._sun.intensity = sample.sunIntensity;
    const elev = sample.sunElevation;
    this._sun.position.set(45 * elev + 10, 20 + 70 * elev, 30);
  }
}
