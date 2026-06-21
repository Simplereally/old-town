/**
 * Magic tier material colours (E41-S05).
 *
 * Uses the magic tier palette (Chalkmarked → Starfall) to recolor the
 * shaft/tip/bead regions of magic weapon meshes.
 */
import { MeshLambertMaterial } from "three";
import type { RenderMaterialFactory } from "../../../renderer/RenderResourceRegistry";
import { PALETTE } from "../../lowpoly";

/** Canonical magic tier order (Cobbled → Starfall). */
export const MAGIC_TIERS = [
  "cobbled",
  "chalkmarked",
  "tallowbound",
  "bellwax",
  "blacksalt",
  "warden_script",
  "greenwold",
  "gravebound",
  "blueglass",
  "carmine_ink",
  "argent_script",
  "crownvellum",
  "starfall",
] as const;

/** Magic tier → material colour mapping (from magic palette script/cloth region). */
const MAGIC_TIER_COLORS: Record<string, number> = {
  cobbled: PALETTE.deadWood,
  chalkmarked: 0xe8e0d0,
  tallowbound: 0xd4c8a0,
  bellwax: PALETTE.goldMetal,
  blacksalt: PALETTE.shadow,
  warden_script: 0x6a8aaa,
  greenwold: PALETTE.leafMid,
  gravebound: 0x4a4a3a,
  blueglass: 0x4a7aaa,
  carmine_ink: 0x8a3a3a,
  argent_script: PALETTE.silver,
  crownvellum: 0xc9b88a,
  starfall: 0x8ad0c0,
};

export function createMagicTierMaterial(tier: string): MeshLambertMaterial {
  const color = MAGIC_TIER_COLORS[tier] ?? PALETTE.barkMid;
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color, emissive, flatShading: true });
}

export function magicTierMaterialFactory(tier: string): RenderMaterialFactory {
  return () => createMagicTierMaterial(tier);
}
