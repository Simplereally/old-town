/**
 * Persisted render-side preferences (separate from input settings).
 *
 * Currently only holds the weapon model source toggle ("glb" vs "procedural"),
 * stored under its own localStorage key so it can evolve independently of the
 * input settings schema version.
 */
import type { WeaponModelMode } from "../scene/WeaponGltfLoader";

const RENDER_SETTINGS_KEY = "old-town-render-settings";
const RENDER_SETTINGS_VERSION = 1;

export interface RenderSettings {
  weaponModels: WeaponModelMode;
}

const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  weaponModels: "glb",
};

export function loadRenderSettings(): RenderSettings {
  try {
    const raw = localStorage.getItem(RENDER_SETTINGS_KEY);
    if (!raw) return DEFAULT_RENDER_SETTINGS;
    const parsed = JSON.parse(raw) as { v?: number } & Partial<RenderSettings>;
    if (parsed.v !== RENDER_SETTINGS_VERSION) return DEFAULT_RENDER_SETTINGS;
    return {
      weaponModels: parsed.weaponModels ?? DEFAULT_RENDER_SETTINGS.weaponModels,
    };
  } catch {
    return DEFAULT_RENDER_SETTINGS;
  }
}

export function saveRenderSettings(settings: RenderSettings): void {
  try {
    localStorage.setItem(
      RENDER_SETTINGS_KEY,
      JSON.stringify({ v: RENDER_SETTINGS_VERSION, ...settings }),
    );
  } catch {
    // Ignore storage errors (e.g. private mode quota).
  }
}
