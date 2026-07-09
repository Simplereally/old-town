/**
 * Equipment attachment grips (E49).
 *
 * Rule: all hand-held equipment attaches via `handSocketR` / `handSocketL` plus
 * a `GripSpec`. New weapon families get a category default first; add a
 * per-family override only when the default looks wrong. Never attach
 * equipment to the actor root (`meshes.group`).
 *
 * Socket-local frame: +y up along the arm, +z actor-forward.
 */

export interface GripSpec {
  /** Offset from the hand socket origin, in socket-local space. */
  position: [number, number, number];
  /** Euler rotation (XYZ order) in socket-local space. */
  rotation: [number, number, number];
}

export type GripCategory =
  | "melee_1h"
  | "melee_2h"
  | "ranged_bow"
  | "ranged_crossbow"
  | "thrown"
  | "magic_main"
  | "magic_offhand"
  | "shield";

/** Category defaults. Socket-local frame: +y up along the arm, +z actor-forward. */
export const GRIP_DEFAULTS: Record<GripCategory, GripSpec> = {
  // Blade-up along +y (procedural + GLB convention).
  melee_1h: { position: [0, 0, 0.02], rotation: [0, 0, 0] },
  // Slight forward pitch for two-handed stance.
  melee_2h: { position: [0, 0, 0.02], rotation: [0.35, 0, 0] },
  // Bow lies along the forearm (rotated so the limb reads horizontal).
  ranged_bow: { position: [0, 0.02, 0.04], rotation: [0, 0, Math.PI / 2] },
  ranged_crossbow: { position: [0, 0, 0.06], rotation: [0.2, 0, 0] },
  thrown: { position: [0, 0, 0.02], rotation: [0, 0, 0] },
  magic_main: { position: [0, 0, 0.02], rotation: [0.15, 0, 0] },
  magic_offhand: { position: [0, 0, 0.02], rotation: [0, 0, 0] },
  // Face outward from the left hand.
  shield: { position: [0, 0.05, 0.04], rotation: [0, Math.PI / 2, 0] },
};

/** Sparse per-family overrides, only where the category default looks wrong. */
export const GRIP_OVERRIDES: Partial<Record<string, GripSpec>> = {
  // Greatblade / maul need a bit more forward clearance at the grip.
  greatblade: { position: [0, 0, 0.04], rotation: [0.4, 0, 0] },
  maul: { position: [0, 0, 0.04], rotation: [0.4, 0, 0] },
  // Staffs are long — slight extra pitch keeps the tip clear of the torso.
  staff: { position: [0, 0, 0.02], rotation: [0.25, 0, 0] },
  rod: { position: [0, 0, 0.02], rotation: [0.25, 0, 0] },
};

export function resolveGrip(familyId: string, category: GripCategory): GripSpec {
  return GRIP_OVERRIDES[familyId] ?? GRIP_DEFAULTS[category];
}

/**
 * Map a weapon family id to its grip category using the family tables.
 * Used by attachment tests and any caller that has a family id but not the
 * setWeaponModel resolution branch.
 */
export function gripCategoryForFamily(
  familyId: string,
  tables: {
    melee: readonly { id: string; twoHanded: boolean }[];
    ranged: readonly { id: string; category: "bow" | "crossbow" | "thrown" }[];
    magic: readonly { id: string; offHand: boolean }[];
  },
): GripCategory | undefined {
  const melee = tables.melee.find((f) => f.id === familyId);
  if (melee) return melee.twoHanded ? "melee_2h" : "melee_1h";
  const ranged = tables.ranged.find((f) => f.id === familyId);
  if (ranged) {
    if (ranged.category === "bow") return "ranged_bow";
    if (ranged.category === "crossbow") return "ranged_crossbow";
    return "thrown";
  }
  const magic = tables.magic.find((f) => f.id === familyId);
  if (magic) return magic.offHand ? "magic_offhand" : "magic_main";
  return undefined;
}
