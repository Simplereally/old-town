/**
 * Registration of melee armour geometries + tier materials (E41-S06).
 *
 * Reuses the melee metal tier materials from S03 (same palette ladder).
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { MELEE_TIERS, meleeTierMaterialFactory } from "../melee/materials";
import { ARMOUR_FAMILIES } from "./index";

export function registerArmourAssets(registry: RenderResourceRegistry): void {
  for (const family of ARMOUR_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  // Reuse melee tier materials for armour (same metal palette)
  for (const tier of MELEE_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "armour_melee", materialId: tier },
      meleeTierMaterialFactory(tier),
    );
  }
}

/** Resolve an armour model AssetId to its family id. */
export function resolveArmourFamily(modelAssetId: string): string | null {
  for (const family of ARMOUR_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) {
      return family.id;
    }
  }
  return null;
}

/** Resolve an armour model AssetId to its tier. */
export function resolveArmourTier(modelAssetId: string): string | null {
  const family = resolveArmourFamily(modelAssetId);
  if (!family) return null;

  for (const tier of MELEE_TIERS) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return tier;
    }
  }
  return null;
}
