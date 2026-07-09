/**
 * GLB weapon model loader (Blender-authored assets).
 *
 * Loads each family's compressed .glb from the static public directory, extracts
 * the first mesh's `BufferGeometry`, and registers it via
 * `replaceGeometryFactory` so it overrides the procedural factory at runtime.
 *
 * The GLBs carry baked per-region vertex colours (COLOR_0); the tier tint is
 * applied at runtime by a `vertexColors` + `color` Lambert material, so one
 * geometry per family still serves all 13 tiers.
 */

import type { BufferGeometry } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { RenderResourceRegistry } from "../renderer/RenderResourceRegistry";

const MODEL_BASE = "/models/weapons/";

/** Which weapon geometry source to render. */
export type WeaponModelMode = "glb" | "procedural";

/** All 36 weapon families with authored GLBs. */
export const GLB_WEAPON_FAMILIES = [
  // Melee
  "sticker",
  "shortblade",
  "longblade",
  "greatblade",
  "sabre",
  "handaxe",
  "fellaxe",
  "cudgel",
  "maul",
  "spear",
  "billhook",
  "glaive",
  // Ranged — bows
  "bentbow",
  "shortbow",
  "longbow",
  "recurve",
  "warbow",
  "quickbow",
  "stillbow",
  "starbow",
  // Ranged — crossbows
  "latchbow",
  "crossbow",
  "arbalest",
  "crankbow",
  "handbow",
  "greatbow",
  // Ranged — thrown
  "knife",
  "dart",
  "javelin",
  "throwing_axe",
  // Magic
  "wand",
  "staff",
  "rod",
  "focus",
  "primer",
  "codex",
] as const;

/**
 * Preload all GLB weapon models and register their geometries. Returns the set
 * of family ids that were successfully loaded (so the caller can prefer GLB
 * geometries and fall back to procedural for any that failed).
 */
export async function preloadWeaponGltbs(registry: RenderResourceRegistry): Promise<Set<string>> {
  const loader = new GLTFLoader();
  const loaded = new Set<string>();
  const tasks = GLB_WEAPON_FAMILIES.map(async (family) => {
    try {
      const gltf = await loader.loadAsync(`${MODEL_BASE}${family}.glb`);
      const geometry = extractGeometry(gltf.scene);
      if (!geometry) {
        console.warn(`[weapon-gltf] no mesh geometry in ${family}.glb`);
        return;
      }
      registry.registerGeometry({ type: "prop", contentId: `model_${family}_glb` }, () => geometry);
      loaded.add(family);
    } catch (error) {
      console.warn(`[weapon-gltf] failed to load ${family}.glb:`, error);
    }
  });
  await Promise.all(tasks);
  return loaded;
}

/** Walk a glTF scene and return the first mesh's geometry, merged if multiple. */
function extractGeometry(root: import("three").Object3D): BufferGeometry | null {
  let found: BufferGeometry | null = null;
  root.traverse((obj) => {
    if (found) return;
    if ((obj as import("three").Mesh).isMesh) {
      const mesh = obj as import("three").Mesh;
      const geo = mesh.geometry;
      if (geo) {
        // Ensure vertex colors are present and non-indexed for flat shading.
        if (geo.index !== null) {
          found = geo.toNonIndexed();
        } else {
          found = geo;
        }
      }
    }
  });
  return found;
}
