import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  MeshLambertMaterial,
  Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Shared low-poly modelling toolkit for the OSRS-era renderer (ADR-008).
 *
 * The whole scene is built from a handful of primitives that are merged into a
 * single vertex-coloured `BufferGeometry` per asset, lit per-vertex by
 * `MeshLambertMaterial` (three's only built-in Gouraud material). There are no
 * textures and no per-instance materials: colour lives in the geometry so an
 * entire asset is one draw call and pools cheaply.
 *
 * Keep every colour in {@link PALETTE}. Hand-picked muted, desaturated tones are
 * what read as "retro" — vivid sRGB primaries do not.
 */

// Scratch singletons reused across the hot build loops to avoid GC churn.
const _color = new Color();
const _vertex = new Vector3();

/** Restricted, desaturated palette. Builders MUST pull colours from here. */
export const PALETTE = {
  // Woods & foliage
  barkDark: 0x4a3526,
  barkMid: 0x6b4a2b,
  barkLight: 0x8a6a44,
  deadWood: 0x9a8769,
  leafDark: 0x2f5d2e,
  leafMid: 0x3c7d3a,
  leafLight: 0x5a9a4a,
  leafDry: 0x8a7a3a,
  // Stone & earth
  stoneDark: 0x6a6d6f,
  stoneMid: 0x83868a,
  stoneLight: 0x9aa0a4,
  dirt: 0x6b5640,
  sand: 0xb8a878,
  clay: 0xa6845e,
  // Metals & ore
  iron: 0x6f7378,
  steel: 0x9aa0a6,
  copper: 0xb87333,
  bronze: 0xa07a3a,
  goldMetal: 0xc9a23c,
  silver: 0xc2c6cc,
  oreCopper: 0xc8772e,
  oreIron: 0x8a5a3a,
  oreCoal: 0x2e3033,
  // Heat & fire
  ember: 0xd2622a,
  flame: 0xe08a2a,
  coal: 0x2e2c2a,
  ash: 0x7a746c,
  // Cloth & leather
  clothBlue: 0x3a6ea5,
  clothGreen: 0x4f7a3a,
  clothRed: 0x8a3a32,
  clothBrown: 0x7a5a3a,
  clothGrey: 0x6a6a6a,
  clothCream: 0xc9b88a,
  leather: 0x8a5a32,
  // Flesh & hide
  skin: 0xd8a878,
  goblinSkin: 0x6f7a44,
  furBrown: 0x6a4a32,
  furGrey: 0x7a7670,
  furRed: 0x9a5a32,
  furBlack: 0x2e2a28,
  bone: 0xcfc6ad,
  // Liquids & glow
  water: 0x3f6f9a,
  dye: 0x6a3a7a,
  wispGlow: 0x8ad0c0,
  drakeHide: 0x7a3a2e,
  // Neutrals
  shadow: 0x3a3632,
  highlight: 0xd8cfba,
} as const;

export type PaletteColor = number;

/** Bake a single flat vertex colour onto every vertex of a geometry, in place. */
export function paint(geometry: BufferGeometry, color: number): void {
  _color.set(color);
  const count = geometry.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

/**
 * Deterministically perturb every vertex so a mathematically perfect primitive
 * gains the hand-carved irregularity of a classic low-poly model. The same
 * `amount`/`seed` always yields the same shape, so jitter can be baked into a
 * shared template once and pooled across instances.
 *
 * Apply this BEFORE splitting a geometry into independent faces — see
 * {@link compose}, which welds shared corners first so facets stay seam-free.
 */
export function jitter(geometry: BufferGeometry, amount: number, seed = 1): void {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    _vertex.fromBufferAttribute(position, i);
    const { x, y, z } = _vertex;
    const dx = Math.sin(y * 12.9 + z * 4.7 + seed) * amount;
    const dy = Math.sin(x * 7.3 + z * 9.1 + seed * 1.7) * amount;
    const dz = Math.sin(x * 5.2 + y * 11.4 + seed * 2.3) * amount;
    position.setXYZ(i, x + dx, y + dy, z + dz);
  }
  position.needsUpdate = true;
}

/**
 * A box that tapers from bottom to top — wider or narrower at the top than the
 * bottom. Built by scaling the +Y face vertices of a {@link BoxGeometry} in X/Z.
 * `topScale > 1` widens the top (shoulders), `< 1` narrows it (waist, ankles).
 * Use directly as a part geometry or pass to {@link compose}.
 */
export function taperedBox(w: number, h: number, d: number, topScale = 1): BufferGeometry {
  const geo = new BoxGeometry(w, h, d);
  if (topScale === 1) return geo;
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) * topScale);
      pos.setZ(i, pos.getZ(i) * topScale);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * A tiny dark beady eye — a flat box that reads as an eye at low-poly scale.
 * Returns a ready-to-merge {@link Part}; override `color` for glowing/red eyes.
 */
export function eyePart(x: number, y: number, z: number, color: number = PALETTE.shadow): Part {
  return { geometry: new BoxGeometry(0.04, 0.04, 0.02), color, x, y, z };
}

/** A single coloured chunk of a composite low-poly asset, in local space. */
export interface Part {
  readonly geometry: BufferGeometry;
  readonly color: number;
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
  readonly rotX?: number;
  readonly rotY?: number;
  readonly rotZ?: number;
  readonly sx?: number;
  readonly sy?: number;
  readonly sz?: number;
  /** Deterministic vertex deformation amount (world units). */
  readonly jitter?: number;
  /** Seed so sibling parts of the same shape can deform differently. */
  readonly seed?: number;
}

/**
 * Merge several coloured primitives into one non-indexed, vertex-coloured
 * `BufferGeometry`. One asset = one geometry = one draw call. Transform order is
 * jitter → scale → rotate (X, Y, Z) → translate, all in local space.
 *
 * Input primitive geometries are consumed/mutated in place; callers pass fresh
 * `new XGeometry(...)` instances.
 */
export function compose(parts: Part[]): BufferGeometry {
  const geometries = parts.map((part) => {
    let geometry: BufferGeometry;
    if (part.jitter) {
      // Weld so shared corners move together, deform, then re-split into
      // independent faces for crisp flat shading with no torn seams.
      const welded = mergeVertices(part.geometry);
      jitter(welded, part.jitter, part.seed ?? 1);
      geometry = welded.toNonIndexed();
      welded.dispose();
      part.geometry.dispose();
    } else {
      geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    }

    paint(geometry, part.color);

    if (part.sx !== undefined || part.sy !== undefined || part.sz !== undefined) {
      geometry.scale(part.sx ?? 1, part.sy ?? 1, part.sz ?? 1);
    }
    if (part.rotX) geometry.rotateX(part.rotX);
    if (part.rotY) geometry.rotateY(part.rotY);
    if (part.rotZ) geometry.rotateZ(part.rotZ);
    geometry.translate(part.x ?? 0, part.y ?? 0, part.z ?? 0);
    return geometry;
  });

  const merged = mergeGeometries(geometries, false);
  if (!merged) {
    throw new Error("lowpoly.compose: failed to merge geometries");
  }
  return merged;
}

/** A flat-shaded, vertex-coloured Lambert material — the standard retro look. */
export function vertexColorMaterial(flatShading = true): MeshLambertMaterial {
  return new MeshLambertMaterial({ vertexColors: true, flatShading });
}
