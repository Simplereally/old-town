/**
 * Ranged armour tier material colours (E41-S07).
 */
import { MeshLambertMaterial } from "three";
import type { RenderMaterialFactory } from "../../../renderer/RenderResourceRegistry";
import { PALETTE } from "../../lowpoly";

export const RANGED_ARMOUR_TIERS = [
  "cobbled",
  "patchhide",
  "boghide",
  "bellhide",
  "blackscale",
  "wardenhide",
  "greenwold",
  "graveskin",
  "blueglass_scale",
  "carmine_hide",
  "argentweave",
  "crownhide",
  "starfall_hide",
] as const;

const RANGED_ARMOUR_COLORS: Record<string, number> = {
  cobbled: PALETTE.deadWood,
  patchhide: PALETTE.leather,
  boghide: 0x4a3a2a,
  bellhide: 0x8a6a3a,
  blackscale: PALETTE.shadow,
  wardenhide: 0x4a6a4a,
  greenwold: PALETTE.leafMid,
  graveskin: 0x4a4a3a,
  blueglass_scale: 0x4a7aaa,
  carmine_hide: 0x8a4a3a,
  argentweave: PALETTE.silver,
  crownhide: 0xc9b88a,
  starfall_hide: 0x8ad0c0,
};

export function createRangedArmourTierMaterial(tier: string): MeshLambertMaterial {
  const color = RANGED_ARMOUR_COLORS[tier] ?? PALETTE.leather;
  const emissive = tier === "starfall_hide" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

export function rangedArmourTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createRangedArmourTierMaterial(tier);
}
