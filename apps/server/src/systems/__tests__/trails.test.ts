import type { Plane } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../../ecs/world";
import { DeltaAccumulator } from "../../sim/delta-accumulator";
import { makeRegistries } from "../../test-support/registries";
import {
  applyTrailBuff,
  checkTrailDiscovery,
  getTrailShortcutPath,
  handleTrailShortcut,
  isPlayerOnTrail,
  isTrailDiscovered,
  type TrailDef,
} from "../trail-system";

const HIDDEN_TRAIL: TrailDef = {
  id: "oldroad_path",
  name: "Oldroad Path",
  startTile: { x: 10, y: 10, plane: 0 },
  endTile: { x: 20, y: 10, plane: 0 },
  hidden: true,
  discoveryRadius: 3,
  buff: "trail_haste",
  shortcutSpeed: 2,
};

const VISIBLE_TRAIL: TrailDef = {
  id: "market_lane",
  name: "Market Lane",
  startTile: { x: 5, y: 5, plane: 0 },
  endTile: { x: 5, y: 15, plane: 0 },
  hidden: false,
  discoveryRadius: 0,
  buff: "trail_haste",
};

const STATUS_EFFECT_DEF = {
  id: "trail_haste",
  name: "Trail Haste",
  description: "Move faster on trails.",
  durationTicks: 4,
  maxStacks: 1,
  effectType: "buff" as const,
  statModifiers: [],
  cureItems: [],
};

function addPlayer(
  world: World,
  x: number,
  y: number,
  plane: number = 0,
): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: plane as Plane });
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
  const ctx = { world, deltas, registries };
  return { ctx, world, deltas };
}

describe("trail discovery", () => {
  it("discovers a hidden trail when player is within discoveryRadius of startTile", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 12, 12, 0);

    const discovered = checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);

    expect(discovered).toEqual(["oldroad_path"]);
    expect(isTrailDiscovered(world, player, "oldroad_path")).toBe(true);
    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You discover a hidden trail: Oldroad Path.");
  });

  it("discovers a hidden trail when player is within discoveryRadius of endTile", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 18, 12, 0);

    const discovered = checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);

    expect(discovered).toEqual(["oldroad_path"]);
    expect(isTrailDiscovered(world, player, "oldroad_path")).toBe(true);
  });

  it("does not discover a hidden trail when player is outside discoveryRadius", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 50, 50, 0);

    const discovered = checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);

    expect(discovered).toEqual([]);
    expect(isTrailDiscovered(world, player, "oldroad_path")).toBe(false);
  });

  it("does not re-discover an already-discovered trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 12, 12, 0);

    checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);
    const discoveredAgain = checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);

    expect(discoveredAgain).toEqual([]);
  });

  it("does not discover visible trails", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 5, 5, 0);

    const discovered = checkTrailDiscovery(ctx, player, [VISIBLE_TRAIL], 0);

    expect(discovered).toEqual([]);
  });

  it("persists discovered trails in player vars", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 12, 12, 0);

    checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);

    const vars = world.getComponent(player, "vars");
    expect(vars?.values.discovered_trails).toBeDefined();
    expect(typeof vars?.values.discovered_trails).toBe("string");
    const parsed = JSON.parse(vars?.values.discovered_trails as string) as string[];
    expect(parsed).toContain("oldroad_path");
  });
});

describe("trail buff", () => {
  it("applies buff when player is on a visible trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 5, 10, 0);

    const result = applyTrailBuff(ctx, player, VISIBLE_TRAIL, 1);

    expect(result).toBe(true);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects?.effects).toHaveLength(1);
    expect(statusEffects?.effects[0]?.statusEffectId).toBe("trail_haste");
  });

  it("applies buff when player is on a discovered hidden trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 12, 12, 0);

    // Discover the trail while near the startTile
    checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);
    expect(isTrailDiscovered(world, player, "oldroad_path")).toBe(true);

    // Move onto the trail path
    world.setComponent(player, "position", { entityId: player, x: 15, y: 10, plane: 0 });
    const result = applyTrailBuff(ctx, player, HIDDEN_TRAIL, 1);

    expect(result).toBe(true);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects?.effects).toHaveLength(1);
    expect(statusEffects?.effects[0]?.statusEffectId).toBe("trail_haste");
  });

  it("does not apply buff when player is off the trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 50, 50, 0);

    const result = applyTrailBuff(ctx, player, VISIBLE_TRAIL, 1);

    expect(result).toBe(false);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects).toBeUndefined();
  });

  it("does not apply buff when hidden trail is not yet discovered", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 15, 10, 0);

    const result = applyTrailBuff(ctx, player, HIDDEN_TRAIL, 1);

    expect(result).toBe(false);
    const statusEffects = world.getComponent(player, "statusEffects");
    expect(statusEffects).toBeUndefined();
  });

  it("detects player on trail start tile", () => {
    expect(isPlayerOnTrail({ x: 10, y: 10, plane: 0 }, HIDDEN_TRAIL)).toBe(true);
  });

  it("detects player on trail end tile", () => {
    expect(isPlayerOnTrail({ x: 20, y: 10, plane: 0 }, HIDDEN_TRAIL)).toBe(true);
  });

  it("detects player on a straight horizontal trail between endpoints", () => {
    expect(isPlayerOnTrail({ x: 15, y: 10, plane: 0 }, HIDDEN_TRAIL)).toBe(true);
  });

  it("does not detect player off the trail path", () => {
    expect(isPlayerOnTrail({ x: 15, y: 11, plane: 0 }, HIDDEN_TRAIL)).toBe(false);
  });
});

describe("trail shortcut", () => {
  it("returns shortcut path when player is on trail start tile", () => {
    const path = getTrailShortcutPath({ x: 10, y: 10, plane: 0 }, HIDDEN_TRAIL);

    expect(path).toEqual([{ x: 20, y: 10, plane: 0 }]);
  });

  it("returns shortcut path when player is on trail end tile", () => {
    const path = getTrailShortcutPath({ x: 20, y: 10, plane: 0 }, HIDDEN_TRAIL);

    expect(path).toEqual([{ x: 10, y: 10, plane: 0 }]);
  });

  it("returns undefined when player is not on the trail", () => {
    const path = getTrailShortcutPath({ x: 50, y: 50, plane: 0 }, HIDDEN_TRAIL);

    expect(path).toBeUndefined();
  });

  it("sets movement path when handling shortcut for discovered trail", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10, 0);

    checkTrailDiscovery(ctx, player, [HIDDEN_TRAIL], 0);
    const result = handleTrailShortcut(ctx, player, HIDDEN_TRAIL, 0);

    expect(result).toBe(true);
    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([{ x: 20, y: 10, plane: 0 }]);
    expect(movement?.destination).toEqual({ x: 20, y: 10, plane: 0 });
  });

  it("rejects shortcut for hidden trail that is not discovered", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 10, 10, 0);

    const result = handleTrailShortcut(ctx, player, HIDDEN_TRAIL, 0);

    expect(result).toBe(false);
    const chat = deltas.peek().chat;
    expect(chat?.[0]?.text).toBe("You have not discovered this trail yet.");
  });

  it("allows shortcut for visible trail without discovery", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 5, 5, 0);

    const result = handleTrailShortcut(ctx, player, VISIBLE_TRAIL, 0);

    expect(result).toBe(true);
    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([{ x: 5, y: 15, plane: 0 }]);
  });
});
