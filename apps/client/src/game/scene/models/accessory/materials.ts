/**
 * Accessory band material colours (E41-S08).
 */
import { MeshLambertMaterial } from "three";
import type { RenderMaterialFactory } from "../../../renderer/RenderResourceRegistry";
import { PALETTE } from "../../lowpoly";

export const ACCESSORY_TIERS = [
  "cobbled",
  "threadbare",
  "waxed",
  "bellstruck",
  "blacksealed",
  "warden_issued",
  "greenwold",
  "gravebound",
  "blueglass",
  "carmine",
  "argent",
  "crown",
  "starfall",
] as const;

const ACCESSORY_COLORS: Record<string, number> = {
  cobbled: PALETTE.deadWood,
  threadbare: PALETTE.clothBrown,
  waxed: 0x7a6a4a,
  bellstruck: 0x6a6a8a,
  blacksealed: PALETTE.shadow,
  warden_issued: 0x4a6a4a,
  greenwold: PALETTE.leafMid,
  gravebound: 0x4a4a3a,
  blueglass: 0x4a7aaa,
  carmine: 0x8a3a3a,
  argent: PALETTE.silver,
  crown: PALETTE.goldMetal,
  starfall: 0x8ad0c0,
};

export function createAccessoryTierMaterial(tier: string): MeshLambertMaterial {
  const color = ACCESSORY_COLORS[tier] ?? PALETTE.clothBlue;
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

export function accessoryTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createAccessoryTierMaterial(tier);
}
