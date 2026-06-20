/**
 * Procedural ranged armour geometry factories (E41-S07).
 *
 * One factory per slot. Hide/cloth/leather shapes sized to fit the humanoid
 * body part. The tier material recolors the hide.
 */
import { BoxGeometry, type BufferGeometry, CylinderGeometry } from "three";
import { compose, PALETTE } from "../../lowpoly";

function coifGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.38, 0.32, 0.36), color: PALETTE.leather, y: 0.16 },
  ]);
}

function jerkinGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.54, 0.52, 0.36), color: PALETTE.leather, y: 0.26 },
  ]);
}

function chapsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.leather, x: -0.13, y: 0.25 },
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.leather, x: 0.13, y: 0.25 },
  ]);
}

function vambracesGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.16, 0.2, 0.2), color: PALETTE.leather, x: -0.34, y: 0.1 },
    { geometry: new BoxGeometry(0.16, 0.2, 0.2), color: PALETTE.leather, x: 0.34, y: 0.1 },
  ]);
}

function treadsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.14, 0.3), color: PALETTE.leather, x: -0.13, y: 0.07 },
    { geometry: new BoxGeometry(0.22, 0.14, 0.3), color: PALETTE.leather, x: 0.13, y: 0.07 },
  ]);
}

function bucklerGeometry(): BufferGeometry {
  return compose([
    {
      geometry: new CylinderGeometry(0.18, 0.18, 0.04, 10),
      color: PALETTE.leather,
      y: 0.15,
      rotX: Math.PI / 2,
    },
    {
      geometry: new CylinderGeometry(0.04, 0.04, 0.06, 6),
      color: PALETTE.bronze,
      y: 0.15,
      rotX: Math.PI / 2,
    },
  ]);
}

export type ArmourSlot = "head" | "body" | "legs" | "feet" | "hands" | "shield";

export interface RangedArmourFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly slot: ArmourSlot;
}

export const RANGED_ARMOUR_FAMILIES: readonly RangedArmourFamilySpec[] = [
  { id: "coif", factory: coifGeometry, slot: "head" },
  { id: "jerkin", factory: jerkinGeometry, slot: "body" },
  { id: "chaps", factory: chapsGeometry, slot: "legs" },
  { id: "vambraces", factory: vambracesGeometry, slot: "hands" },
  { id: "treads", factory: treadsGeometry, slot: "feet" },
  { id: "buckler", factory: bucklerGeometry, slot: "shield" },
];

export function getRangedArmourFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  return RANGED_ARMOUR_FAMILIES.find((f) => f.id === familyId)?.factory;
}

export function getRangedArmourSlot(familyId: string): ArmourSlot | undefined {
  return RANGED_ARMOUR_FAMILIES.find((f) => f.id === familyId)?.slot;
}
