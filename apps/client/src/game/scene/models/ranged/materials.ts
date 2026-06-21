/**
 * Ranged tier material colours (E41-S04).
 *
 * Bows + thrown knives/darts use the ranged tier palette (organic).
 * Crossbows + thrown javelins/throwing axes use the melee metal tier palette.
 */
import { MeshLambertMaterial } from "three";
import type { RenderMaterialFactory } from "../../../renderer/RenderResourceRegistry";
import { PALETTE } from "../../lowpoly";

/** Canonical ranged tier order (Cobbled → Starfall). */
export const RANGED_TIERS = [
  "cobbled",
  "lathwood",
  "bogwood",
  "bellhorn",
  "blackstring",
  "warden_yew",
  "greenwold",
  "gravebent",
  "blueglass",
  "carmine_ash",
  "argentwood",
  "crownhorn",
  "starfall",
] as const;

/** Ranged tier → material colour mapping (from ranged palette limb region). */
const RANGED_TIER_COLORS: Record<string, number> = {
  cobbled: PALETTE.deadWood,
  lathwood: PALETTE.barkLight,
  bogwood: 0x4a3a2a,
  bellhorn: 0x8a6a3a,
  blackstring: PALETTE.shadow,
  warden_yew: 0x6a8a4a,
  greenwold: PALETTE.leafMid,
  gravebent: 0x4a4a3a,
  blueglass: 0x4a7aaa,
  carmine_ash: 0x8a4a3a,
  argentwood: PALETTE.silver,
  crownhorn: PALETTE.goldMetal,
  starfall: 0x8ad0c0,
};

/** Melee metal tier → material colour (reused for crossbows). */
const MELEE_TIER_COLORS: Record<string, number> = {
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
 * Create a shared ranged tier material. Uses `MeshLambertMaterial` (no custom
 * ShaderMaterial per asset-baking contract §12). Starfall gets a subtle emissive.
 */
export function createRangedTierMaterial(tier: string): MeshLambertMaterial {
  const color = RANGED_TIER_COLORS[tier] ?? PALETTE.barkMid;
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

/** Create a shared melee metal tier material (for crossbows). */
export function createCrossbowTierMaterial(tier: string): MeshLambertMaterial {
  const color = MELEE_TIER_COLORS[tier] ?? PALETTE.steel;
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

export function rangedTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createRangedTierMaterial(tier);
}

export function crossbowTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createCrossbowTierMaterial(tier);
}
