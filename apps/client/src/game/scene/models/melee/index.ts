/**
 * Procedural melee weapon geometry factories (E41-S03).
 *
 * One factory per family. Each builds a low-poly `BufferGeometry` using the
 * shared `compose` toolkit — blade/head box, crossguard, grip cylinder, pommel —
 * sized to the humanoid hand. Reach weapons (spear, billhook, glaive) use
 * longer shafts. Tier recolors the material, not the geometry, so a single
 * geometry per family serves all 13 tiers.
 */
import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry } from "three";
import { compose, PALETTE, type Part } from "../../lowpoly";

// Humanoid hand scale: weapons are sized to look right in a ~1.5m humanoid hand.
const GRIP_R = 0.04;
const GRIP_H_1H = 0.22;
const GRIP_H_2H = 0.42;
const GRIP_H_POLE = 1.1;
const POMMEL_R = 0.05;

function gripPart(height: number, y: number): Part {
  return {
    geometry: new CylinderGeometry(GRIP_R, GRIP_R, height, 6),
    color: PALETTE.barkMid,
    y,
  };
}

function pommelPart(y: number): Part {
  return {
    geometry: new CylinderGeometry(POMMEL_R, POMMEL_R, 0.04, 6),
    color: PALETTE.bronze,
    y,
  };
}

function guardPart(width: number, y: number): Part {
  return {
    geometry: new BoxGeometry(width, 0.04, 0.06),
    color: PALETTE.bronze,
    y,
  };
}

// --- 1H blade factories ---

function stickerGeometry(): BufferGeometry {
  return compose([
    { geometry: new ConeGeometry(0.05, 0.22, 4), color: PALETTE.steel, y: 0.33, rotX: 0 },
    guardPart(0.12, 0.22),
    gripPart(GRIP_H_1H, 0.11),
    pommelPart(0.0),
  ]);
}

function shortbladeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.05, 0.3, 0.02), color: PALETTE.steel, y: 0.37 },
    guardPart(0.16, 0.22),
    gripPart(GRIP_H_1H, 0.11),
    pommelPart(0.0),
  ]);
}

function longbladeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.05, 0.42, 0.02), color: PALETTE.steel, y: 0.43 },
    guardPart(0.18, 0.22),
    gripPart(GRIP_H_1H, 0.11),
    pommelPart(0.0),
  ]);
}

function sabreGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.04, 0.36, 0.02), color: PALETTE.steel, y: 0.4, rotZ: 0.15 },
    guardPart(0.16, 0.22),
    gripPart(GRIP_H_1H, 0.11),
    pommelPart(0.0),
  ]);
}

// --- 2H blade factories ---

function greatbladeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.07, 0.56, 0.025), color: PALETTE.steel, y: 0.5 },
    guardPart(0.24, 0.22),
    gripPart(GRIP_H_2H, 0.0),
    pommelPart(-0.22),
  ]);
}

// --- Axe factories ---

function handaxeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.12, 0.1, 0.04), color: PALETTE.steel, y: 0.3, x: 0.06 },
    gripPart(0.32, 0.16),
    pommelPart(0.0),
  ]);
}

function fellaxeGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.2, 0.14, 0.05), color: PALETTE.steel, y: 0.34, x: 0.08 },
    guardPart(0.1, 0.22),
    gripPart(GRIP_H_2H, 0.0),
    pommelPart(-0.22),
  ]);
}

// --- Blunt factories ---

function cudgelGeometry(): BufferGeometry {
  return compose([
    { geometry: new CylinderGeometry(0.08, 0.06, 0.12, 6), color: PALETTE.steel, y: 0.32 },
    gripPart(0.28, 0.14),
    pommelPart(0.0),
  ]);
}

function maulGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.14, 0.16, 0.14), color: PALETTE.steel, y: 0.34 },
    gripPart(GRIP_H_2H, 0.0),
    pommelPart(-0.22),
  ]);
}

// --- Polearm factories ---

function spearGeometry(): BufferGeometry {
  return compose([
    { geometry: new ConeGeometry(0.05, 0.12, 4), color: PALETTE.steel, y: 0.66 },
    guardPart(0.1, 0.58),
    gripPart(GRIP_H_POLE, 0.0),
    pommelPart(-0.56),
  ]);
}

function billhookGeometry(): BufferGeometry {
  return compose([
    {
      geometry: new BoxGeometry(0.14, 0.1, 0.04),
      color: PALETTE.steel,
      y: 0.64,
      x: 0.06,
      rotZ: 0.3,
    },
    {
      geometry: new ConeGeometry(0.04, 0.08, 4),
      color: PALETTE.steel,
      y: 0.6,
      x: -0.04,
      rotZ: -0.5,
    },
    gripPart(GRIP_H_POLE, 0.0),
    pommelPart(-0.56),
  ]);
}

function glaiveGeometry(): BufferGeometry {
  return compose([
    { geometry: new BoxGeometry(0.06, 0.22, 0.03), color: PALETTE.steel, y: 0.62, rotZ: 0.2 },
    gripPart(GRIP_H_POLE, 0.0),
    pommelPart(-0.56),
  ]);
}

export interface MeleeFamilySpec {
  readonly id: string;
  readonly factory: () => BufferGeometry;
  readonly twoHanded: boolean;
  readonly reach: number;
}

export const MELEE_FAMILIES: readonly MeleeFamilySpec[] = [
  { id: "sticker", factory: stickerGeometry, twoHanded: false, reach: 1 },
  { id: "shortblade", factory: shortbladeGeometry, twoHanded: false, reach: 1 },
  { id: "longblade", factory: longbladeGeometry, twoHanded: false, reach: 1 },
  { id: "greatblade", factory: greatbladeGeometry, twoHanded: true, reach: 1 },
  { id: "sabre", factory: sabreGeometry, twoHanded: false, reach: 1 },
  { id: "handaxe", factory: handaxeGeometry, twoHanded: false, reach: 1 },
  { id: "fellaxe", factory: fellaxeGeometry, twoHanded: true, reach: 1 },
  { id: "cudgel", factory: cudgelGeometry, twoHanded: false, reach: 1 },
  { id: "maul", factory: maulGeometry, twoHanded: true, reach: 1 },
  { id: "spear", factory: spearGeometry, twoHanded: false, reach: 2 },
  { id: "billhook", factory: billhookGeometry, twoHanded: true, reach: 2 },
  { id: "glaive", factory: glaiveGeometry, twoHanded: true, reach: 2 },
];

export const MELEE_FAMILY_IDS = MELEE_FAMILIES.map((f) => f.id);

export function getMeleeFamilyFactory(familyId: string): (() => BufferGeometry) | undefined {
  const spec = MELEE_FAMILIES.find((f) => f.id === familyId);
  return spec?.factory;
}
