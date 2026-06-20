/**
 * Registration of ranged/thrown weapon geometries + tier materials into the
 * RenderResourceRegistry (E41-S04).
 *
 * Registers:
 * - 18 family geometry factories keyed by `model_{family}` (type: "prop").
 * - 13 ranged tier materials (bows/knives/darts) keyed by `ranged_tier_{tier}`.
 * - 13 melee metal tier materials (crossbows/javelins/throwing axes) keyed by
 *   `melee_tier_{tier}` (reuses the melee material registry from S03).
 */
import type { RenderResourceRegistry } from "../../../renderer/RenderResourceRegistry";
import { MELEE_TIERS } from "../melee/materials";
import { RANGED_FAMILIES } from "./index";
import { crossbowTierMaterialFactory, RANGED_TIERS, rangedTierMaterialFactory } from "./materials";

export function registerRangedAssets(registry: RenderResourceRegistry): void {
  // Geometry factories: one per family
  for (const family of RANGED_FAMILIES) {
    registry.registerGeometry({ type: "prop", contentId: `model_${family.id}` }, family.factory);
  }

  // Ranged tier materials (bows, knives, darts)
  for (const tier of RANGED_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "ranged_weapon", materialId: tier },
      rangedTierMaterialFactory(tier),
    );
  }

  // Melee metal tier materials for crossbows/javelins/throwing axes
  // (these reuse the same melee tier material keys from S03, but we register
  // crossbow-specific ones too in case the palette diverges later)
  for (const tier of MELEE_TIERS) {
    registry.registerMaterial(
      { type: "prop", contentId: "crossbow_weapon", materialId: tier },
      crossbowTierMaterialFactory(tier),
    );
  }
}

/**
 * Resolve a ranged model AssetId to its family id.
 * Returns `null` if the id is not a ranged model.
 */
export function resolveRangedFamily(modelAssetId: string): string | null {
  for (const family of RANGED_FAMILIES) {
    if (modelAssetId.endsWith(`_${family.id}`)) {
      return family.id;
    }
  }
  return null;
}

/**
 * Resolve a ranged model AssetId to its tier. Handles both ranged and melee
 * metal tier naming. Returns `null` if not a ranged model.
 */
export function resolveRangedTier(
  modelAssetId: string,
): { tier: string; palette: "ranged" | "melee" } | null {
  const family = resolveRangedFamily(modelAssetId);
  if (!family) return null;

  const spec = RANGED_FAMILIES.find((f) => f.id === family);
  if (!spec) return null;

  // Bows + knives + darts use ranged tier palette
  // Crossbows + javelins + throwing axes use melee metal tier palette
  const useRangedPalette = spec.category === "bow" || family === "knife" || family === "dart";
  const tiers = useRangedPalette ? RANGED_TIERS : MELEE_TIERS;

  for (const tier of tiers) {
    if (modelAssetId.startsWith(`model_${tier}_`)) {
      return { tier, palette: useRangedPalette ? "ranged" : "melee" };
    }
  }
  return null;
}
