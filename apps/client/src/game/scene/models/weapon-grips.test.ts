import { describe, expect, it } from "vitest";
import { GRIP_DEFAULTS, type GripCategory, resolveGrip } from "./weapon-grips";

describe("weapon-grips (E49-S02)", () => {
  it("resolveGrip returns category default when no override", () => {
    const grip = resolveGrip("shortblade", "melee_1h");
    expect(grip).toEqual(GRIP_DEFAULTS.melee_1h);
  });

  it("resolveGrip prefers per-family override", () => {
    const grip = resolveGrip("greatblade", "melee_2h");
    expect(grip).not.toEqual(GRIP_DEFAULTS.melee_2h);
    expect(grip.rotation[0]).toBe(0.4);
  });

  it("every GripCategory has a default", () => {
    const categories: GripCategory[] = [
      "melee_1h",
      "melee_2h",
      "ranged_bow",
      "ranged_crossbow",
      "thrown",
      "magic_main",
      "magic_offhand",
      "shield",
    ];
    for (const cat of categories) {
      expect(GRIP_DEFAULTS[cat]).toBeDefined();
      expect(GRIP_DEFAULTS[cat].position).toHaveLength(3);
      expect(GRIP_DEFAULTS[cat].rotation).toHaveLength(3);
    }
  });
});
