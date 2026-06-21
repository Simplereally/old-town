/**
 * Registration of ranged + magic armour geometries + tier materials (E41-S07).
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { getMagicArmourSlot, MAGIC_ARMOUR_FAMILIES } from "../armour-magic";
import { MAGIC_TIERS, magicTierMaterialFactory } from "../magic/materials";
import { getRangedArmourSlot, RANGED_ARMOUR_FAMILIES } from "./index";
import { RANGED_ARMOUR_TIERS, rangedArmourTierMaterialFactory } from "./materials";

export function registerRangedMagicArmourAssets(registry: RenderResourceRegistry): void {
  // Ranged armour geometries
  for (const family of RANGED_ARMOUR_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  // Magic armour geometries
  for (const family of MAGIC_ARMOUR_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  // Ranged armour tier materials
  for (const tier of RANGED_ARMOUR_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "armour_ranged", materialId: tier },
      rangedArmourTierMaterialFactory(tier),
    );
  }

  // Magic armour reuses magic weapon tier materials
  for (const tier of MAGIC_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "armour_magic", materialId: tier },
      magicTierMaterialFactory(tier),
    );
  }
}

/** Resolve a ranged or magic armour model AssetId to its family id. */
export function resolveRangedMagicArmourFamily(modelAssetId: string): string | null {
  for (const family of RANGED_ARMOUR_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) return family.id;
  }
  for (const family of MAGIC_ARMOUR_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) return family.id;
  }
  return null;
}

/** Resolve a ranged or magic armour model AssetId to its tier and palette type. */
export function resolveRangedMagicArmourTier(
  modelAssetId: string,
): { tier: string; palette: "ranged" | "magic" } | null {
  const family = resolveRangedMagicArmourFamily(modelAssetId);
  if (!family) return null;

  const isRanged = RANGED_ARMOUR_FAMILIES.some((f) => f.id === family);
  const tiers = isRanged ? RANGED_ARMOUR_TIERS : MAGIC_TIERS;

  for (const tier of tiers) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return { tier, palette: isRanged ? "ranged" : "magic" };
    }
  }
  return null;
}

/** Get the body slot for a ranged or magic armour family. */
export function getRangedMagicArmourSlot(familyId: string): string | undefined {
  return getRangedArmourSlot(familyId) ?? getMagicArmourSlot(familyId);
}
