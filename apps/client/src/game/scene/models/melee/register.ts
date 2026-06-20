/**
 * Registration of melee weapon geometries + tier materials into the
 * RenderResourceRegistry (E41-S03).
 *
 * Called once at client load. Registers:
 * - 12 family geometry factories keyed by `model_{family}` (type: "prop").
 * - 13 tier material factories keyed by `melee_tier_{tier}` (type: "prop").
 *
 * The caller (ActorRenderer or GameEngine) resolves a weapon's model AssetId
 * → family → geometry, and tier → material, then attaches the mesh.
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { MELEE_FAMILIES } from "./index";
import { MELEE_TIERS, meleeTierMaterialFactory } from "./materials";

export function registerMeleeAssets(registry: RenderResourceRegistry): void {
  // Geometry factories: one per family, shared across all tiers.
  for (const family of MELEE_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  // Material factories: one per tier, shared across all families.
  for (const tier of MELEE_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "melee_weapon", materialId: tier },
      meleeTierMaterialFactory(tier),
    );
  }
}

/**
 * Resolve a melee model AssetId (e.g. `model_pennywrought_shortblade`) to its
 * family id. Returns `null` if the id is not a melee model.
 */
export function resolveMeleeFamily(modelAssetId: string): string | null {
  for (const family of MELEE_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) {
      return family.id;
    }
  }
  return null;
}

/**
 * Resolve a melee model AssetId to its tier. Returns `null` if not a melee model.
 */
export function resolveMeleeTier(modelAssetId: string): string | null {
  for (const tier of MELEE_TIERS) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return tier;
    }
  }
  return null;
}
