/**
 * Procedural accessory geometry factories (E41-S08).
 *
 * Only the 4 visible accessories (cape, amulet, belt, trophy) get worn 3D
 * models. Ring and charm are icon-only (too small to read in-world).
 */
import { BoxGeometry, type BufferGeometry, CylinderGeometry } from "three";
import { compose, PALETTE } from "../../lowpoly";

function capeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.48, 0.6, 0.04), color: PALETTE.clothBlue, y: 0.3, z: -0.18 },
  ]);
}

function amuletGeometry(): BufferGeometry {
  return compose([
    {
      geometry: new CylinderGeometry(0.16, 0.16, 0.02, 8),
      color: PALETTE.goldMetal,
      y: 0.0,
      rotX: Math.PI / 2,
    },
    {
      geometry: new CylinderGeometry(0.04, 0.04, 0.04, 6),
      color: PALETTE.goldMetal,
      y: 0.03,
      rotX: Math.PI / 2,
    },
  ]);
}

function beltGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.56, 0.08, 0.06), color: PALETTE.leather, y: 0.0, z: 0.18 },
    { geometry: new BoxGeometry(0.08, 0.1, 0.08), color: PALETTE.goldMetal, y: 0.0, z: 0.2 },
  ]);
}

function trophyGeometry(): BufferGeometry {
  return compose([
    {
      geometry: new CylinderGeometry(0.06, 0.08, 0.1, 6),
      color: PALETTE.goldMetal,
      y: 0.05,
      z: 0.18,
    },
    { geometry: new BoxGeometry(0.04, 0.06, 0.02), color: PALETTE.clothBlue, y: 0.12, z: 0.18 },
  ]);
}

export type AccessorySlot = "back" | "neck" | "waist" | "chest";

export interface AccessoryFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly slot: AccessorySlot;
}

export const ACCESSORY_FAMILIES: readonly AccessoryFamilySpec[] = [
  { id: "cape", factory: capeGeometry, slot: "back" },
  { id: "amulet", factory: amuletGeometry, slot: "neck" },
  { id: "belt", factory: beltGeometry, slot: "waist" },
  { id: "trophy", factory: trophyGeometry, slot: "chest" },
];

export const VISIBLE_ACCESSORY_IDS = ACCESSORY_FAMILIES.map((f) => f.id);

export function getAccessoryFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  return ACCESSORY_FAMILIES.find((f) => f.id === familyId)?.factory;
}

export function getAccessorySlot(familyId: string): AccessorySlot | undefined {
  return ACCESSORY_FAMILIES.find((f) => f.id === familyId)?.slot;
}
