/**
 * Procedural melee armour geometry factories (E41-S06).
 *
 * One factory per slot. Each builds a low-poly mesh sized to fit the
 * humanoid body part it covers. The tier material recolors the metal.
 */
import { BoxGeometry, type BufferGeometry, CylinderGeometry } from "three";
import { compose, PALETTE } from "../../lowpoly";

function helmGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.38, 0.3, 0.36), color: PALETTE.steel, y: 0.15 },
    { geometry: new BoxGeometry(0.36, 0.04, 0.34), color: PALETTE.bronze, y: 0.02 },
  ]);
}

function greathelmGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.42, 0.38, 0.4), color: PALETTE.steel, y: 0.19 },
    { geometry: new BoxGeometry(0.16, 0.08, 0.04), color: PALETTE.shadow, y: 0.18, z: 0.18 },
    { geometry: new BoxGeometry(0.4, 0.04, 0.38), color: PALETTE.bronze, y: 0.02 },
  ]);
}

function harnessGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.56, 0.5, 0.38), color: PALETTE.steel, y: 0.25 },
    { geometry: new BoxGeometry(0.54, 0.06, 0.36), color: PALETTE.bronze, y: 0.48 },
  ]);
}

function hauberkGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.54, 0.56, 0.36), color: PALETTE.iron, y: 0.28 },
    { geometry: new CylinderGeometry(0.14, 0.16, 0.12, 6), color: PALETTE.iron, y: 0.5 },
  ]);
}

function platecoatGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.62, 0.6, 0.42), color: PALETTE.steel, y: 0.3 },
    { geometry: new BoxGeometry(0.6, 0.08, 0.4), color: PALETTE.bronze, y: 0.56 },
    { geometry: new BoxGeometry(0.58, 0.5, 0.06), color: PALETTE.bronze, y: 0.3, z: 0.18 },
  ]);
}

function chaussesGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.steel, x: -0.13, y: 0.25 },
    { geometry: new BoxGeometry(0.22, 0.5, 0.26), color: PALETTE.steel, x: 0.13, y: 0.25 },
  ]);
}

function sabatonsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.22, 0.16, 0.3), color: PALETTE.steel, x: -0.13, y: 0.08 },
    { geometry: new BoxGeometry(0.22, 0.16, 0.3), color: PALETTE.steel, x: 0.13, y: 0.08 },
  ]);
}

function gauntletsGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.16, 0.18, 0.2), color: PALETTE.steel, x: -0.34, y: 0.09 },
    { geometry: new BoxGeometry(0.16, 0.18, 0.2), color: PALETTE.steel, x: 0.34, y: 0.09 },
  ]);
}

function wardGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.36, 0.5, 0.06), color: PALETTE.steel, y: 0.25 },
    { geometry: new BoxGeometry(0.34, 0.06, 0.05), color: PALETTE.bronze, y: 0.48 },
    {
      geometry: new CylinderGeometry(0.06, 0.06, 0.08, 6),
      color: PALETTE.bronze,
      y: 0.25,
      z: 0.05,
      rotX: Math.PI / 2,
    },
  ]);
}

export type ArmourSlot = "head" | "body" | "legs" | "feet" | "hands" | "shield";

export interface ArmourFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly slot: ArmourSlot;
}

export const ARMOUR_FAMILIES: readonly ArmourFamilySpec[] = [
  { id: "helm", factory: helmGeometry, slot: "head" },
  { id: "greathelm", factory: greathelmGeometry, slot: "head" },
  { id: "harness", factory: harnessGeometry, slot: "body" },
  { id: "hauberk", factory: hauberkGeometry, slot: "body" },
  { id: "platecoat", factory: platecoatGeometry, slot: "body" },
  { id: "chausses", factory: chaussesGeometry, slot: "legs" },
  { id: "sabatons", factory: sabatonsGeometry, slot: "feet" },
  { id: "gauntlets", factory: gauntletsGeometry, slot: "hands" },
  { id: "ward", factory: wardGeometry, slot: "shield" },
];

export const ARMOUR_FAMILY_IDS = ARMOUR_FAMILIES.map((f) => f.id);

export function getArmourFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  const spec = ARMOUR_FAMILIES.find((f) => f.id === familyId);
  return spec?.factory;
}

export function getArmourSlot(familyId: string): ArmourSlot | undefined {
  return ARMOUR_FAMILIES.find((f) => f.id === familyId)?.slot;
}
