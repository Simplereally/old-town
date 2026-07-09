/**
 * GLB weapon tier materials.
 *
 * Blender-authored GLB geometries carry baked per-region vertex colours
 * (COLOR_0). These materials enable `vertexColors: true` and set the tier tint
 * as `material.color`, so the final rendered colour is `vertexColor × tierTint` —
 * one geometry per family still serves all 13 tiers, same as the procedural path.
 */
import { MeshLambertMaterial } from "three";
import type { RenderResourceRegistry } from "../../renderer/RenderResourceRegistry";
import { PALETTE } from "../lowpoly";
import { MAGIC_TIERS } from "./magic/materials";
import { MELEE_TIERS } from "./melee/materials";
import { RANGED_TIERS } from "./ranged/materials";

/** Melee tier → tint colour (mirrors melee/materials.ts TIER_COLORS). */
const MELEE_TINT: Record<string, number> = {
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

/** Ranged tier → tint colour (mirrors ranged/materials.ts RANGED_TIER_COLORS). */
const RANGED_TINT: Record<string, number> = {
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

/** Magic tier → tint colour (mirrors magic/materials.ts MAGIC_TIER_COLORS). */
const MAGIC_TINT: Record<string, number> = {
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

function createGlbMaterial(tint: number, tier: string): MeshLambertMaterial {
  const emissive = tier === "starfall" ? 0x102a28 : 0x000000;
  return new MeshLambertMaterial({ color: tint, emissive, vertexColors: true, flatShading: true });
}

/** Register GLB tier materials for all three ladders. */
export function registerGlbWeaponMaterials(registry: RenderResourceRegistry): void {
  for (const tier of MELEE_TIERS) {
    const tint = MELEE_TINT[tier] ?? PALETTE.steel;
    registry.registerMaterial(
      { type: "prop", contentId: "melee_weapon_glb", materialId: tier },
      () => createGlbMaterial(tint, tier),
    );
  }
  for (const tier of RANGED_TIERS) {
    const tint = RANGED_TINT[tier] ?? PALETTE.barkMid;
    registry.registerMaterial(
      { type: "prop", contentId: "ranged_weapon_glb", materialId: tier },
      () => createGlbMaterial(tint, tier),
    );
  }
  for (const tier of MELEE_TIERS) {
    const tint = MELEE_TINT[tier] ?? PALETTE.steel;
    registry.registerMaterial(
      { type: "prop", contentId: "crossbow_weapon_glb", materialId: tier },
      () => createGlbMaterial(tint, tier),
    );
  }
  for (const tier of MAGIC_TIERS) {
    const tint = MAGIC_TINT[tier] ?? PALETTE.barkMid;
    registry.registerMaterial(
      { type: "prop", contentId: "magic_weapon_glb", materialId: tier },
      () => createGlbMaterial(tint, tier),
    );
  }
}
