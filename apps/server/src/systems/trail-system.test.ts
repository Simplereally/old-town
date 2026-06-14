import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import {
  applyTrailBuff,
  checkTrailDiscovery,
  getTrailShortcutPath,
  handleTrailShortcut,
  isPlayerOnTrail,
  isTrailDiscovered,
  processTrailBuffs,
} from "./trail-system";

const TRAIL_VISIBLE: import("@old-town/shared").TrailDef = {
  id: "oldroad_gate_path",
  name: "Oldroad Gate Path",
  startTile: { x: 10, y: 10, plane: 0 },
  endTile: { x: 20, y: 10, plane: 0 },
  hidden: false,
  discoveryRadius: 3,
  buff: "strength_boost",
  shortcutSpeed: 2,
};

const TRAIL_HIDDEN: import("@old-town/shared").TrailDef = {
  id: "sootcellar_shortcut",
  name: "Sootcellar Shortcut",
  startTile: { x: 30, y: 30, plane: 0 },
  endTile: { x: 40, y: 40, plane: 0 },
  hidden: true,
  discoveryRadius: 2,
  buff: "strength_boost",
  shortcutSpeed: 3,
};

const STATUS_EFFECT_DEF = {
  id: "strength_boost",
  name: "Strength Boost",
  description: "Increased melee damage.",
  durationTicks: 20,
  maxStacks: 1,
  effectType: "buff" as const,
  statModifiers: [{ stat: "meleeStrength" as const, value: 5, mode: "add" as const }],
  cureItems: [],
};

function addPlayer(world: World, x: number, y: number): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "vars", {
    entityId,
    values: {},
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const deltas = new DeltaAccumulator();
  const registries = makeRegistries({
    statusEffect: new Map([[STATUS_EFFECT_DEF.id, STATUS_EFFECT_DEF]]),
  });
  const ctx = {
    world,
    deltas,
    registries,
  };
  return { ctx, world, deltas };
}

describe("isPlayerOnTrail", () => {
  it("returns true when player is on start tile", () => {
    expect(isPlayerOnTrail({ x: 10, y: 10, plane: 0 }, TRAIL_VISIBLE)).toBe(true);
  });

  it("returns true when player is on end tile", () => {
    expect(isPlayerOnTrail({ x: 20, y: 10, plane: 0 }, TRAIL_VISIBLE)).toBe(true);
  });

  it("returns true when player is between tiles on a straight line", () => {
    expect(isPlayerOnTrail({ x: 15, y: 10, plane: 0 }, TRAIL_VISIBLE)).toBe(true);
  });

  it("returns true when player is on a diagonal trail", () => {
    expect(isPlayerOnTrail({ x: 35, y: 35, plane: 0 }, TRAIL_HIDDEN)).toBe(true);
  });

  it("returns false when player is off the trail", () => {
    expect(isPlayerOnTrail({ x: 10, y: 12, plane: 0 }, TRAIL_VISIBLE)).toBe(false);
  });

  it("returns false when player is on different plane", () => {
    expect(isPlayerOnTrail({ x: 15, y: 10, plane: 1 }, TRAIL_VISIBLE)).toBe(false);
  });
});

describe("checkTrailDiscovery", () => {
  it("discovers a hidden trail when player is within radius of start tile", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 31, 31);

    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    expect(discovered).toEqual(["sootcellar_shortcut"]);
    expect(isTrailDiscovered(world, player, "sootcellar_shortcut")).toBe(true);

    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You discover a hidden trail: Sootcellar Shortcut.");
  });

  it("discovers a hidden trail when player is within radius of end tile", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 41, 41);

    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    expect(discovered).toEqual(["sootcellar_shortcut"]);
    expect(isTrailDiscovered(world, player, "sootcellar_shortcut")).toBe(true);
  });

  it("does not discover hidden trail when player is too far away", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);

    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    expect(discovered).toEqual([]);
    expect(isTrailDiscovered(world, player, "sootcellar_shortcut")).toBe(false);
  });

  it("does not discover already-discovered trail again", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 31, 31);

    checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);
    deltas.consume(0, 0); // Clear first discovery message
    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    expect(discovered).toEqual([]);
    const state = deltas.peek();
    expect(state.chat).toBeUndefined();
  });

  it("does not discover visible trails", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_VISIBLE], 0);

    expect(discovered).toEqual([]);
    expect(isTrailDiscovered(world, player, "oldroad_gate_path")).toBe(false);
  });

  it("handles multiple trails at once", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 31, 31);

    const discovered = checkTrailDiscovery(ctx, player, [TRAIL_VISIBLE, TRAIL_HIDDEN], 0);

    expect(discovered).toEqual(["sootcellar_shortcut"]);
  });
});

describe("applyTrailBuff", () => {
  it("applies buff when player is on a visible trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 15, 10);

    const applied = applyTrailBuff(ctx, player, TRAIL_VISIBLE, 0);

    expect(applied).toBe(true);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects?.effects.some((e) => e.statusEffectId === "strength_boost")).toBe(true);
  });

  it("does not apply buff when player is off trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);

    const applied = applyTrailBuff(ctx, player, TRAIL_VISIBLE, 0);

    expect(applied).toBe(false);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects?.effects.length ?? 0).toBe(0);
  });

  it("does not apply buff for hidden trail when not discovered", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 35, 35);

    const applied = applyTrailBuff(ctx, player, TRAIL_HIDDEN, 0);

    expect(applied).toBe(false);
  });

  it("applies buff for hidden trail when discovered", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 31, 31);
    checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    const applied = applyTrailBuff(ctx, player, TRAIL_HIDDEN, 0);

    expect(applied).toBe(true);
  });
});

describe("processTrailBuffs", () => {
  it("processes buffs for all matching trails", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 15, 10);

    processTrailBuffs(ctx, player, [TRAIL_VISIBLE, TRAIL_HIDDEN], 0);

    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects?.effects.some((e) => e.statusEffectId === "strength_boost")).toBe(true);
  });
});

describe("getTrailShortcutPath", () => {
  it("returns path to end when player is at start", () => {
    const path = getTrailShortcutPath({ x: 10, y: 10, plane: 0 }, TRAIL_VISIBLE);
    expect(path).toEqual([{ x: 20, y: 10, plane: 0 }]);
  });

  it("returns path to start when player is at end", () => {
    const path = getTrailShortcutPath({ x: 20, y: 10, plane: 0 }, TRAIL_VISIBLE);
    expect(path).toEqual([{ x: 10, y: 10, plane: 0 }]);
  });

  it("returns undefined when player is not on trail", () => {
    const path = getTrailShortcutPath({ x: 0, y: 0, plane: 0 }, TRAIL_VISIBLE);
    expect(path).toBeUndefined();
  });
});

describe("handleTrailShortcut", () => {
  it("returns true and sets movement when player is on visible trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    const result = handleTrailShortcut(ctx, player, TRAIL_VISIBLE, 0);

    expect(result).toBe(true);
    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([{ x: 20, y: 10, plane: 0 }]);
    expect(movement?.destination).toEqual({ x: 20, y: 10, plane: 0 });
  });

  it("returns false when player is not on trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 0, 0);

    const result = handleTrailShortcut(ctx, player, TRAIL_VISIBLE, 0);

    expect(result).toBe(false);
  });

  it("returns false for hidden trail when not discovered", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 35, 35);

    const result = handleTrailShortcut(ctx, player, TRAIL_HIDDEN, 0);

    expect(result).toBe(false);
    const state = deltas.peek();
    expect(state.chat?.[0]?.text).toBe("You have not discovered this trail yet.");
  });

  it("returns true for hidden trail when discovered", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 30, 30);
    checkTrailDiscovery(ctx, player, [TRAIL_HIDDEN], 0);

    const result = handleTrailShortcut(ctx, player, TRAIL_HIDDEN, 0);

    expect(result).toBe(true);
    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([{ x: 40, y: 40, plane: 0 }]);
  });
});
