/**
 * Registration of magic weapon geometries + tier materials into the
 * RenderResourceRegistry (E41-S05).
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { MAGIC_FAMILIES } from "./index";
import { MAGIC_TIERS, magicTierMaterialFactory } from "./materials";

export function registerMagicAssets(registry: RenderResourceRegistry): void {
  for (const family of MAGIC_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  for (const tier of MAGIC_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "magic_weapon", materialId: tier },
      magicTierMaterialFactory(tier),
    );
  }
}

/** Resolve a magic model AssetId to its family id. */
export function resolveMagicFamily(modelAssetId: string): string | null {
  for (const family of MAGIC_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) {
      return family.id;
    }
  }
  return null;
}

/** Resolve a magic model AssetId to its tier. */
export function resolveMagicTier(modelAssetId: string): string | null {
  const family = resolveMagicFamily(modelAssetId);
  if (!family) return null;

  for (const tier of MAGIC_TIERS) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return tier;
    }
  }
  return null;
}
