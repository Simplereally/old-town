/**
 * Registration of accessory geometries + tier materials (E41-S08).
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { ACCESSORY_FAMILIES, getAccessorySlot } from "./index";
import { ACCESSORY_TIERS, accessoryTierMaterialFactory } from "./materials";

export function registerAccessoryAssets(registry: RenderResourceRegistry): void {
  for (const family of ACCESSORY_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  for (const tier of ACCESSORY_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "accessory", materialId: tier },
      accessoryTierMaterialFactory(tier),
    );
  }
}

/** Resolve an accessory model AssetId to its family id. */
export function resolveAccessoryFamily(modelAssetId: string): string | null {
  for (const family of ACCESSORY_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) {
      return family.id;
    }
  }
  return null;
}

/** Resolve an accessory model AssetId to its tier. */
export function resolveAccessoryTier(modelAssetId: string): string | null {
  const family = resolveAccessoryFamily(modelAssetId);
  if (!family) return null;

  for (const tier of ACCESSORY_TIERS) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return tier;
    }
  }
  return null;
}

export { getAccessorySlot };
