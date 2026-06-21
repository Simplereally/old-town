/**
 * Melee tier material colours (E41-S03).
 *
 * One colour per tier, derived from the melee tier palette `blade` region.
 * These are the material colours that recolour the weapon mesh — the geometry
 * is shared per family, the material varies per tier.
 */
import { MeshLambertMaterial } from "three";
import type { RenderMaterialFactory } from "../../../renderer/RenderResourceRegistry";
import { PALETTE } from "../../lowpoly";

/** Canonical melee tier order (Cobbled → Starfall). */
export const MELEE_TIERS = [
  "cobbled",
  "pennywrought",
  "pig_iron",
  "bellmetal",
  "blackbar",
  "wardensteel",
  "greenwold",
  "graveiron",
  "blueglass",
  "carmine_steel",
  "argent",
  "crownsteel",
  "starfall",
] as const;

/** Tier → material colour mapping (from melee palette blade/head region). */
const TIER_COLORS: Record<string, number> = {
  cobbled: PALETTE.iron,
  pennywrought: PALETTE.copper,
  pig_iron: PALETTE.stoneDark,
  bellmetal: PALETTE.goldMetal,
  blackbar: PALETTE.shadow,
  wardensteel: 0x6a8aaa,
  greenwold: PALETTE.leafMid,
  graveiron: 0x4a4a5a,
  blueglass: 0x4a7aaa,
  carmine_steel: 0x8a3a3a,
  argent: PALETTE.silver,
  crownsteel: PALETTE.goldMetal,
  starfall: 0x8ad0c0,
};

/**
 * Create a shared melee tier material. Uses `MeshLambertMaterial` (asset-baking
 * contract §12: no custom ShaderMaterial). Starfall gets a subtle emissive hint.
 */
export function createMeleeTierMaterial(tier: string): MeshLambertMaterial {
  const color = TIER_COLORS[tier] ?? PALETTE.steel;
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

/** Factory function for the registry. */
export function meleeTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createMeleeTierMaterial(tier);
}
