import { describe, expect, it } from "vitest";
import type { EntityId, PrayerDef } from "@old-town/shared";
import { createWorld } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  applyPrayerProtection,
  createPrayerComponent,
  handlePrayerIntent,
  hitStyleToProtectionStyle,
  prayerBoostedLevel,
  prayerDrainResistance,
  prayerStatModifier,
  processPrayerDrainPhase,
  restorePrayerPoints,
} from "./prayer-system";

const THICK_SKIN: PrayerDef = {
  id: "thick_skin",
  name: "Thick Skin",
  requiredPrayer: 1,
  drainEffect: 10,
  conflictGroup: "defence_low",
  effects: [{ stat: "defence", mode: "add", value: 1 }],
};

const ROCK_SKIN: PrayerDef = {
  id: "rock_skin",
  name: "Rock Skin",
  requiredPrayer: 10,
  drainEffect: 12,
  conflictGroup: "defence_low",
  effects: [{ stat: "defence", mode: "add", value: 2 }],
};

const PROTECT_FROM_MELEE: PrayerDef = {
  id: "protect_from_melee",
  name: "Protect from Melee",
  requiredPrayer: 43,
  drainEffect: 20,
  conflictGroup: "overhead",
  effects: [],
  protection: { style: "melee", npcReduction: 1.0, playerReduction: 0.4 },
};

const PROTECT_FROM_MAGIC: PrayerDef = {
  id: "protect_from_magic",
  name: "Protect from Magic",
  requiredPrayer: 37,
  drainEffect: 20,
  conflictGroup: "overhead",
  effects: [],
  protection: { style: "magic", npcReduction: 1.0, playerReduction: 0.4 },
};

function setup(prayers: PrayerDef[] = [THICK_SKIN, ROCK_SKIN, PROTECT_FROM_MELEE, PROTECT_FROM_MAGIC]) {
  const world = createWorld();
  const owner = world.createEntity();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    prayer: new Map(prayers.map((p) => [p.id, p])),
  });
  return { world, owner, deltas, registries };
}

function setPrayer(world: ReturnType<typeof createWorld>, owner: EntityId, prayerLevel: number, points?: number) {
  world.setComponent(owner, "prayer", createPrayerComponent(owner, points ?? prayerLevel));
  world.setComponent(owner, "skills", {
    entityId: owner,
    skills: {
      prayer: { level: prayerLevel, xp: 0, boost: 0, drain: 0 },
    },
  });
}

describe("prayerDrainResistance", () => {
  it("is 60 with no prayer bonus", () => {
    const { world, owner, registries } = setup();
    expect(prayerDrainResistance({ world, deltas: new DeltaAccumulator(), registries }, owner)).toBe(60);
  });

  it("is 2 × prayerBonus + 60 with equipment prayer bonus", () => {
    const { world, owner, registries } = setup();
    world.setComponent(owner, "equipment", {
      entityId: owner,
      slots: {},
      bonuses: { prayer: 10 },
    });
    expect(prayerDrainResistance({ world, deltas: new DeltaAccumulator(), registries }, owner)).toBe(80);
  });
});

describe("handlePrayerIntent", () => {
  it("activates a prayer the player meets the level requirement for", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual(["thick_skin"]);
  });

  it("refuses to activate a prayer above the player's Prayer level", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 5);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "rock_skin", active: true }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual([]);
    expect(deltas.peek().chat?.some((c) => c.text.includes("need Prayer level 10"))).toBe(true);
  });

  it("refuses to activate when prayer points are 0", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50, 0);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual([]);
    expect(deltas.peek().chat?.some((c) => c.text.includes("no prayer points"))).toBe(true);
  });

  it("deactivates a conflicting prayer when activating one in the same group", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "rock_skin", active: true }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual(["rock_skin"]);
  });

  it("deactivates a prayer on a deactivate intent", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: false }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual([]);
  });

  it("is a no-op for an unknown prayer id", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "does_not_exist", active: true }, 0);
    expect(world.getComponent(owner, "prayer")?.activePrayers).toEqual([]);
  });
});

describe("processPrayerDrainPhase", () => {
  it("drains one point after enough ticks accumulate past the resistance", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    // drainEffect 10, resistance 60 → 6 ticks to lose one point.
    for (let i = 0; i < 5; i++) {
      processPrayerDrainPhase({ world, deltas, registries }, i);
    }
    expect(world.getComponent(owner, "prayer")?.points).toBe(50);
    processPrayerDrainPhase({ world, deltas, registries }, 5);
    expect(world.getComponent(owner, "prayer")?.points).toBe(49);
  });

  it("deactivates all prayers when points reach 0", () => {
    const { world, owner, deltas, registries } = setup([PROTECT_FROM_MELEE]);
    setPrayer(world, owner, 50, 1);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "protect_from_melee", active: true }, 0);
    // drainEffect 20, resistance 60 → 3 ticks to lose the last point.
    for (let i = 0; i < 3; i++) {
      processPrayerDrainPhase({ world, deltas, registries }, i);
    }
    const prayer = world.getComponent(owner, "prayer");
    expect(prayer?.points).toBe(0);
    expect(prayer?.activePrayers).toEqual([]);
  });

  it("does nothing when no prayers are active", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50, 50);
    processPrayerDrainPhase({ world, deltas, registries }, 0);
    expect(world.getComponent(owner, "prayer")?.points).toBe(50);
  });
});

describe("prayerBoostedLevel", () => {
  it("adds flat levels for an 'add' mode prayer", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "thick_skin", active: true }, 0);
    expect(prayerBoostedLevel({ world, deltas, registries }, owner, "defence", 10)).toBe(11);
  });

  it("returns the base level when no prayers modify the stat", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    expect(prayerBoostedLevel({ world, deltas, registries }, owner, "attack", 10)).toBe(10);
  });
});

describe("prayerStatModifier", () => {
  it("sums add and multiply across active prayers", () => {
    const multiplyPrayer: PrayerDef = {
      id: "hawk_eye",
      name: "Hawk Eye",
      requiredPrayer: 26,
      drainEffect: 14,
      conflictGroup: "ranged_mid",
      effects: [{ stat: "ranged", mode: "multiply", value: 0.15 }],
    };
    const { world, owner, deltas, registries } = setup([multiplyPrayer]);
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "hawk_eye", active: true }, 0);
    const mod = prayerStatModifier({ world, deltas, registries }, owner, "ranged");
    expect(mod.add).toBe(0);
    expect(mod.multiply).toBeCloseTo(0.15);
    expect(prayerBoostedLevel({ world, deltas, registries }, owner, "ranged", 50)).toBe(Math.floor(50 * 1.15));
  });
});

describe("applyPrayerProtection", () => {
  it("reduces NPC damage to 0 for a full npcReduction protection prayer", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "protect_from_melee", active: true }, 0);
    expect(
      applyPrayerProtection({ world, deltas, registries }, owner, "melee", 20, false),
    ).toBe(0);
  });

  it("reduces player damage by the playerReduction fraction", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "protect_from_melee", active: true }, 0);
    // 20 × (1 − 0.4) = 12
    expect(
      applyPrayerProtection({ world, deltas, registries }, owner, "melee", 20, true),
    ).toBe(12);
  });

  it("does not reduce damage when no matching protection prayer is active", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 50);
    handlePrayerIntent({ world, deltas, registries }, owner, { prayerId: "protect_from_magic", active: true }, 0);
    expect(
      applyPrayerProtection({ world, deltas, registries }, owner, "melee", 20, false),
    ).toBe(20);
  });
});

describe("restorePrayerPoints", () => {
  it("restores points clamped to the Prayer level", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 10, 3);
    const restored = restorePrayerPoints({ world, deltas, registries }, owner, 20);
    expect(restored).toBe(7);
    expect(world.getComponent(owner, "prayer")?.points).toBe(10);
  });

  it("returns 0 when already at max", () => {
    const { world, owner, deltas, registries } = setup();
    setPrayer(world, owner, 10, 10);
    expect(restorePrayerPoints({ world, deltas, registries }, owner, 5)).toBe(0);
  });
});

describe("hitStyleToProtectionStyle", () => {
  it("maps melee styles to melee", () => {
    expect(hitStyleToProtectionStyle("stab")).toBe("melee");
    expect(hitStyleToProtectionStyle("slash")).toBe("melee");
    expect(hitStyleToProtectionStyle("crush")).toBe("melee");
  });

  it("maps ranged and magic directly", () => {
    expect(hitStyleToProtectionStyle("ranged")).toBe("ranged");
    expect(hitStyleToProtectionStyle("magic")).toBe("magic");
  });
});
