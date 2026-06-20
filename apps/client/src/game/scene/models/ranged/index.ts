/**
 * Procedural ranged/thrown weapon geometry factories (E41-S04).
 *
 * One factory per family. Bows are a thin arc limb + string; crossbows are a
 * prod + stock + mechanism; thrown are small blade + shaft. All low-poly,
 * sized to the humanoid hand.
 */
import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  TorusGeometry,
} from "three";
import { compose, PALETTE, type Part } from "../../lowpoly";

// --- Bows (8) ---

function bowLimbPart(height: number, thickness: number, y: number): Part {
  return {
    geometry: new TorusGeometry(height / 2, thickness, 4, 8, Math.PI),
    color: PALETTE.barkMid,
    y,
    rotZ: 0,
  };
}

function bowStringPart(height: number, y: number): Part {
  return {
    geometry: new CylinderGeometry(0.008, 0.008, height, 3),
    color: PALETTE.highlight,
    x: -height / 2,
    y,
  };
}

function bowGripPart(y: number): Part {
  return {
    geometry: new CylinderGeometry(0.04, 0.04, 0.16, 6),
    color: PALETTE.barkDark,
    y,
  };
}

function makeBow(height: number, limbThickness: number): () => BufferGeometry {
  return () =>
    compose([
      bowLimbPart(height, limbThickness, height / 2),
      bowStringPart(height, height / 2),
      bowGripPart(height / 2),
      {
        geometry: new CylinderGeometry(0.03, 0.03, 0.02, 6),
        color: PALETTE.bronze,
        y: height / 2 - 0.1,
      },
    ]);
}

const bentbowGeometry = makeBow(0.7, 0.025);
const shortbowGeometry = makeBow(0.8, 0.03);
const longbowGeometry = makeBow(1.1, 0.03);
const recurveGeometry = makeBow(0.85, 0.028);
const warbowGeometry = makeBow(1.0, 0.045);
const quickbowGeometry = makeBow(0.72, 0.022);
const stillbowGeometry = makeBow(1.05, 0.025);
const starbowGeometry = makeBow(1.15, 0.03);

// --- Crossbows (6) ---

function makeCrossbow(prodWidth: number, stockHeight: number): () => BufferGeometry {
  return () =>
    compose([
      // Stock
      {
        geometry: new BoxGeometry(0.08, stockHeight, 0.06),
        color: PALETTE.barkDark,
        y: stockHeight / 2,
      },
      // Prod (horizontal bow part)
      {
        geometry: new CylinderGeometry(0.03, 0.03, prodWidth, 6),
        color: PALETTE.barkMid,
        y: stockHeight * 0.8,
        rotZ: Math.PI / 2,
      },
      // String
      {
        geometry: new CylinderGeometry(0.008, 0.008, 0.12, 3),
        color: PALETTE.highlight,
        x: 0,
        y: stockHeight * 0.8 - 0.06,
      },
      // Mechanism
      { geometry: new BoxGeometry(0.06, 0.04, 0.05), color: PALETTE.bronze, y: stockHeight * 0.65 },
    ]);
}

const latchbowGeometry = makeCrossbow(0.5, 0.4);
const crossbowGeometry = makeCrossbow(0.6, 0.45);
const arbalestGeometry = makeCrossbow(0.7, 0.5);
const crankbowGeometry = makeCrossbow(0.6, 0.45);
const handbowGeometry = makeCrossbow(0.4, 0.3);
const greatbowGeometry = makeCrossbow(0.85, 0.55);

// --- Thrown (4) ---

function knifeGeometry(): BufferGeometry {
  return compose([
    { geometry: new ConeGeometry(0.04, 0.12, 4), color: PALETTE.steel, y: 0.2 },
    { geometry: new CylinderGeometry(0.03, 0.03, 0.1, 6), color: PALETTE.barkMid, y: 0.09 },
    { geometry: new ConeGeometry(0.03, 0.04, 4), color: PALETTE.bronze, y: 0.02 },
  ]);
}

function dartGeometry(): BufferGeometry {
  return compose([
    { geometry: new ConeGeometry(0.03, 0.08, 4), color: PALETTE.steel, y: 0.22 },
    { geometry: new CylinderGeometry(0.015, 0.015, 0.2, 5), color: PALETTE.barkLight, y: 0.08 },
    { geometry: new ConeGeometry(0.04, 0.06, 3), color: PALETTE.clothRed, y: -0.04, rotX: Math.PI },
  ]);
}

function javelinGeometry(): BufferGeometry {
  return compose([
    { geometry: new ConeGeometry(0.05, 0.14, 4), color: PALETTE.steel, y: 0.3 },
    { geometry: new CylinderGeometry(0.025, 0.025, 0.4, 6), color: PALETTE.barkLight, y: 0.03 },
    { geometry: new ConeGeometry(0.05, 0.08, 3), color: PALETTE.clothRed, y: -0.2, rotX: Math.PI },
  ]);
}

function throwingAxeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.14, 0.1, 0.04), color: PALETTE.steel, y: 0.2, x: 0.05 },
    { geometry: new CylinderGeometry(0.025, 0.025, 0.2, 6), color: PALETTE.barkMid, y: 0.12 },
  ]);
}

export interface RangedFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly twoHanded: boolean;
  readonly category: "bow" | "crossbow" | "thrown";
}

export const RANGED_FAMILIES: readonly RangedFamilySpec[] = [
  // Bows
  { id: "bentbow", factory: bentbowGeometry, twoHanded: true, category: "bow" },
  { id: "shortbow", factory: shortbowGeometry, twoHanded: true, category: "bow" },
  { id: "longbow", factory: longbowGeometry, twoHanded: true, category: "bow" },
  { id: "recurve", factory: recurveGeometry, twoHanded: true, category: "bow" },
  { id: "warbow", factory: warbowGeometry, twoHanded: true, category: "bow" },
  { id: "quickbow", factory: quickbowGeometry, twoHanded: true, category: "bow" },
  { id: "stillbow", factory: stillbowGeometry, twoHanded: true, category: "bow" },
  { id: "starbow", factory: starbowGeometry, twoHanded: true, category: "bow" },
  // Crossbows
  { id: "latchbow", factory: latchbowGeometry, twoHanded: true, category: "crossbow" },
  { id: "crossbow", factory: crossbowGeometry, twoHanded: true, category: "crossbow" },
  { id: "arbalest", factory: arbalestGeometry, twoHanded: true, category: "crossbow" },
  { id: "crankbow", factory: crankbowGeometry, twoHanded: true, category: "crossbow" },
  { id: "handbow", factory: handbowGeometry, twoHanded: false, category: "crossbow" },
  { id: "greatbow", factory: greatbowGeometry, twoHanded: true, category: "crossbow" },
  // Thrown
  { id: "knife", factory: knifeGeometry, twoHanded: false, category: "thrown" },
  { id: "dart", factory: dartGeometry, twoHanded: false, category: "thrown" },
  { id: "javelin", factory: javelinGeometry, twoHanded: false, category: "thrown" },
  { id: "throwing_axe", factory: throwingAxeGeometry, twoHanded: false, category: "thrown" },
];

export const RANGED_FAMILY_IDS = RANGED_FAMILIES.map((f) => f.id);

export function getRangedFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  const spec = RANGED_FAMILIES.find((f) => f.id === familyId);
  return spec?.factory;
}
