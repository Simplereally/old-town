/**
 * Procedural magic armour geometry factories (E41-S07).
 *
 * One factory per slot. Cloth/robe shapes sized to fit the humanoid body part.
 * The tier material recolors the cloth.
 */
import { BoxGeometry, type BufferGeometry, CylinderGeometry } from "three";
import { compose, PALETTE } from "../../lowpoly";

function cowlGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.4, 0.34, 0.38), color: PALETTE.clothBlue, y: 0.17 },
  ]);
}

function robeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.56, 0.6, 0.38), color: PALETTE.clothBlue, y: 0.3 },
    { geometry: new CylinderGeometry(0.3, 0.34, 0.2, 6), color: PALETTE.clothBlue, y: 0.08 },
  ]);
}

function wrapsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.clothBlue, x: -0.13, y: 0.25 },
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.clothBlue, x: 0.13, y: 0.25 },
  ]);
}

function cuffsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.16, 0.2, 0.2), color: PALETTE.clothBlue, x: -0.34, y: 0.1 },
    { geometry: new BoxGeometry(0.16, 0.2, 0.2), color: PALETTE.clothBlue, x: 0.34, y: 0.1 },
  ]);
}

function softshoesGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.12, 0.3), color: PALETTE.clothBlue, x: -0.13, y: 0.06 },
    { geometry: new BoxGeometry(0.22, 0.12, 0.3), color: PALETTE.clothBlue, x: 0.13, y: 0.06 },
  ]);
}

function charmwardGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.16, 0.28, 0.04), color: PALETTE.clothBlue, y: 0.14 },
    {
      geometry: new CylinderGeometry(0.05, 0.05, 0.06, 6),
      color: PALETTE.goldMetal,
      y: 0.14,
      z: 0.03,
      rotX: Math.PI / 2,
    },
  ]);
}

export type ArmourSlot = "head" | "body" | "legs" | "feet" | "hands" | "shield";

export interface MagicArmourFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly slot: ArmourSlot;
}

export const MAGIC_ARMOUR_FAMILIES: readonly MagicArmourFamilySpec[] = [
  { id: "cowl", factory: cowlGeometry, slot: "head" },
  { id: "robe", factory: robeGeometry, slot: "body" },
  { id: "wraps", factory: wrapsGeometry, slot: "legs" },
  { id: "cuffs", factory: cuffsGeometry, slot: "hands" },
  { id: "softshoes", factory: softshoesGeometry, slot: "feet" },
  { id: "charmward", factory: charmwardGeometry, slot: "shield" },
];

export function getMagicArmourFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  return MAGIC_ARMOUR_FAMILIES.find((f) => f.id === familyId)?.factory;
}

export function getMagicArmourSlot(familyId: string): ArmourSlot | undefined {
  return MAGIC_ARMOUR_FAMILIES.find((f) => f.id === familyId)?.slot;
}
