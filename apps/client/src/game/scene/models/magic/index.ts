/**
 * Procedural magic weapon geometry factories (E41-S05).
 *
 * One factory per family. Wands are thin cylinders + bead spheres; staves are
 * tall cylinders + crowns; rods are staves with blade caps; foci are discs;
 * primers/codices are small book boxes. All low-poly, sized to the hand.
 */
import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
} from "three";
import { compose, PALETTE } from "../../lowpoly";

function wandGeometry(): BufferGeometry {
  return compose([
    { geometry: new CylinderGeometry(0.02, 0.025, 0.4, 6), color: PALETTE.barkMid, y: 0.2 },
    { geometry: new IcosahedronGeometry(0.05, 0), color: PALETTE.bronze, y: 0.42 },
    { geometry: new IcosahedronGeometry(0.035, 0), color: PALETTE.goldMetal, y: 0.42 },
  ]);
}

function staffGeometry(): BufferGeometry {
  return compose([
    { geometry: new CylinderGeometry(0.03, 0.035, 1.2, 6), color: PALETTE.barkMid, y: 0.6 },
    { geometry: new ConeGeometry(0.08, 0.12, 5), color: PALETTE.bronze, y: 1.22 },
    { geometry: new IcosahedronGeometry(0.06, 0), color: PALETTE.goldMetal, y: 1.28 },
  ]);
}

function rodGeometry(): BufferGeometry {
  return compose([
    { geometry: new CylinderGeometry(0.035, 0.04, 1.0, 6), color: PALETTE.barkMid, y: 0.5 },
    { geometry: new ConeGeometry(0.06, 0.1, 4), color: PALETTE.steel, y: 1.02 },
    { geometry: new IcosahedronGeometry(0.05, 0), color: PALETTE.goldMetal, y: 1.08 },
  ]);
}

function focusGeometry(): BufferGeometry {
  return compose([
    {
      geometry: new CylinderGeometry(0.12, 0.12, 0.04, 12),
      color: PALETTE.bronze,
      y: 0.15,
      rotX: Math.PI / 2,
    },
    {
      geometry: new CylinderGeometry(0.1, 0.1, 0.02, 12),
      color: PALETTE.highlight,
      y: 0.15,
      rotX: Math.PI / 2,
    },
  ]);
}

function primerGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.14, 0.18, 0.04), color: PALETTE.barkDark, y: 0.15 },
    { geometry: new BoxGeometry(0.12, 0.16, 0.02), color: PALETTE.clothCream, y: 0.15, z: 0.01 },
    {
      geometry: new CylinderGeometry(0.025, 0.025, 0.02, 8),
      color: PALETTE.goldMetal,
      y: 0.15,
      z: 0.03,
      rotX: Math.PI / 2,
    },
  ]);
}

function codexGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.18, 0.22, 0.05), color: PALETTE.shadow, y: 0.18 },
    { geometry: new BoxGeometry(0.16, 0.2, 0.03), color: PALETTE.clothCream, y: 0.18, z: 0.01 },
    {
      geometry: new CylinderGeometry(0.035, 0.035, 0.02, 8),
      color: PALETTE.goldMetal,
      y: 0.18,
      z: 0.04,
      rotX: Math.PI / 2,
    },
  ]);
}

export type MagicWeaponSlot = "main" | "off" | "twoHanded";

export interface MagicFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly twoHanded: boolean;
  readonly offHand: boolean;
  readonly slot: MagicWeaponSlot;
}

export const MAGIC_FAMILIES: readonly MagicFamilySpec[] = [
  { id: "wand", factory: wandGeometry, twoHanded: false, offHand: false, slot: "main" },
  { id: "staff", factory: staffGeometry, twoHanded: true, offHand: false, slot: "twoHanded" },
  { id: "rod", factory: rodGeometry, twoHanded: true, offHand: false, slot: "twoHanded" },
  { id: "focus", factory: focusGeometry, twoHanded: false, offHand: true, slot: "off" },
  { id: "primer", factory: primerGeometry, twoHanded: false, offHand: false, slot: "main" },
  { id: "codex", factory: codexGeometry, twoHanded: false, offHand: false, slot: "main" },
];

export const MAGIC_FAMILY_IDS = MAGIC_FAMILIES.map((f) => f.id);

export function getMagicFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  const spec = MAGIC_FAMILIES.find((f) => f.id === familyId);
  return spec?.factory;
}
