import { describe, expect, it } from "vitest";
import { entityId } from "../types/ids";
import type { EntityUpdatePayload } from "./entity-update";
import {
  ALL_MASKS,
  assertValidEntityUpdate,
  buildEntityUpdate,
  composeMask,
  decomposeMask,
  EntityUpdateMask,
  hasFlag,
  MASK_FIELDS,
  maskFromPayload,
  payloadMatchesMask,
} from "./update-mask";

const fullPayload: Required<EntityUpdatePayload> = {
  position: { x: 1, y: 1, plane: 0 },
  facingTile: { x: 2, y: 2, plane: 0 },
  facingEntity: entityId(3),
  animation: { id: "swing" },
  graphic: { id: "splash" },
  hitsplat: { amount: 5, type: "damage" },
  overheadText: "grr",
  appearance: { name: "Guard" },
  equipment: { slots: [null, "penny_sword"] },
  healthBar: { current: 10, max: 30 },
  transform: "guard_angry",
  moveSpeed: "walk",
  statusEffects: [],
  doorState: { isOpen: true },
};

describe("mask composition/decomposition", () => {
  it("composes and tests flags", () => {
    const mask = composeMask(EntityUpdateMask.POSITION, EntityUpdateMask.HITSPLAT);
    expect(hasFlag(mask, EntityUpdateMask.POSITION)).toBe(true);
    expect(hasFlag(mask, EntityUpdateMask.HITSPLAT)).toBe(true);
    expect(hasFlag(mask, EntityUpdateMask.ANIMATION)).toBe(false);
  });

  it("composes an empty mask when no flags are given", () => {
    expect(composeMask()).toBe(0);
  });

  it("decomposes a zero mask into an empty array", () => {
    expect(decomposeMask(0)).toEqual([]);
  });

  it("decomposes a mask into its flags in canonical order", () => {
    const mask = composeMask(
      EntityUpdateMask.HITSPLAT,
      EntityUpdateMask.POSITION,
      EntityUpdateMask.ANIMATION,
    );
    expect(decomposeMask(mask)).toEqual([
      EntityUpdateMask.POSITION,
      EntityUpdateMask.ANIMATION,
      EntityUpdateMask.HITSPLAT,
    ]);
  });

  it("decomposes the full mask into every flag in canonical order", () => {
    expect(decomposeMask(ALL_MASKS)).toEqual(MASK_FIELDS.map(([bit]) => bit));
  });

  it("hasFlag returns false for every flag on a zero mask", () => {
    for (const [bit] of MASK_FIELDS) {
      expect(hasFlag(0, bit)).toBe(false);
    }
  });

  it("composeMask is idempotent for a single flag", () => {
    expect(composeMask(EntityUpdateMask.POSITION)).toBe(EntityUpdateMask.POSITION);
  });
});

describe("maskFromPayload", () => {
  it("derives only the bits for present fields", () => {
    const mask = maskFromPayload({
      position: { x: 1, y: 1, plane: 0 },
      hitsplat: { amount: 1, type: "damage" },
      animation: { id: "swing" },
    });
    expect(mask).toBe(
      composeMask(EntityUpdateMask.POSITION, EntityUpdateMask.HITSPLAT, EntityUpdateMask.ANIMATION),
    );
  });

  it("a full payload yields every defined bit (exhaustive coverage)", () => {
    expect(maskFromPayload(fullPayload)).toBe(ALL_MASKS);
  });

  it("an empty payload yields a zero mask", () => {
    expect(maskFromPayload({})).toBe(0);
  });
});

describe("payloadMatchesMask validation", () => {
  it("accepts a matching mask and payload", () => {
    const payload: EntityUpdatePayload = {
      position: { x: 1, y: 1, plane: 0 },
      healthBar: { current: 5, max: 10 },
    };
    const mask = composeMask(EntityUpdateMask.POSITION, EntityUpdateMask.HEALTH_BAR);
    expect(payloadMatchesMask(mask, payload)).toBe(true);
  });

  it("rejects a set bit whose payload field is missing", () => {
    const mask = composeMask(EntityUpdateMask.POSITION, EntityUpdateMask.HITSPLAT);
    expect(payloadMatchesMask(mask, { position: { x: 0, y: 0, plane: 0 } })).toBe(false);
  });

  it("rejects a present field whose bit is not set", () => {
    const mask = composeMask(EntityUpdateMask.POSITION);
    expect(
      payloadMatchesMask(mask, {
        position: { x: 0, y: 0, plane: 0 },
        hitsplat: { amount: 1, type: "damage" },
      }),
    ).toBe(false);
  });

  it("rejects unknown bits beyond the defined flags", () => {
    expect(payloadMatchesMask(ALL_MASKS | (1 << 20), fullPayload)).toBe(false);
  });
});

describe("buildEntityUpdate / assertValidEntityUpdate", () => {
  it("builds a packet carrying multiple changes without full replacement", () => {
    const packet = buildEntityUpdate(entityId(9), {
      position: { x: 4, y: 5, plane: 0 },
      hitsplat: { amount: 3, type: "damage" },
      healthBar: { current: 7, max: 10 },
    });
    expect(decomposeMask(packet.mask)).toHaveLength(3);
    expect(() => assertValidEntityUpdate(packet)).not.toThrow();
  });

  it("throws when a packet's mask and payload disagree", () => {
    const bad = { entityId: entityId(9), mask: ALL_MASKS, changes: {} };
    expect(() => assertValidEntityUpdate(bad)).toThrow();
  });
});
