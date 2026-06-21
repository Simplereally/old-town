import { type ContentRegistries, createRng, type NpcDef, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { processMovementPhase } from "./movement-system";
import {
  type NpcSystemContext,
  npcFootprintResolver,
  processNpcAiPhase,
  syncNpcOccupancy,
} from "./npc-system";

const NPC_DEF: NpcDef = {
  id: "test_goblin",
  name: "Test Goblin",
  size: 1,
  combatLevel: 3,
  maxHp: 6,
  stats: {
    attack: 1,
    strength: 1,
    defence: 1,
    ranged: 1,
    magic: 1,
    prayer: 1,
    hitpoints: 6,
  },
  aggressiveRadius: 2,
  wanderRadius: 1,
  respawnTicks: 3,
  options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
  movementType: "static",
  aggressionMode: "peaceful",
  contractEligible: false,
};

function registries(npcDef: NpcDef): ContentRegistries {
  return makeRegistries({
    npc: new Map([[npcDef.id, npcDef]]),
  });
}

function addOpenTiles(ctx: ReturnType<typeof createRuntimeMap>, size = 12): void {
  for (let x = 0; x <= size; x += 1) {
    for (let y = 0; y <= size; y += 1) {
      const tile = { x, y, plane: 0 as const };
      ctx.tiles.set(tileKey(tile), {
        tile,
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function combatant(entityId: ReturnType<World["createEntity"]>, hp = 6) {
  return {
    entityId,
    health: hp,
    maxHealth: hp,
    attackLevel: 1,
    strengthLevel: 1,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
  };
}

function setup(
  options: {
    readonly npcDef?: NpcDef;
    readonly npcTile?: { readonly x: number; readonly y: number; readonly plane: 0 };
    readonly home?: { readonly x: number; readonly y: number; readonly plane: 0 };
    readonly leashDistance?: number;
  } = {},
): {
  readonly ctx: NpcSystemContext;
  readonly world: World;
  readonly npc: ReturnType<World["createEntity"]>;
  readonly home: { readonly x: number; readonly y: number; readonly plane: 0 };
  readonly deltas: DeltaAccumulator;
} {
  const npcDef = options.npcDef ?? NPC_DEF;
  const content = registries(npcDef);
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const home = options.home ?? { x: 5, y: 5, plane: 0 as const };
  const npcTile = options.npcTile ?? home;
  const npc = world.createEntity();
  world.setComponent(npc, "position", {
    entityId: npc,
    x: npcTile.x,
    y: npcTile.y,
    plane: npcTile.plane,
  });
  world.setComponent(npc, "npc", {
    entityId: npc,
    npcId: npcDef.id,
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: npcDef.wanderRadius,
    home,
    leashDistance:
      options.leashDistance ?? npcDef.wanderRadius + (npcDef.aggressiveRadius ?? 0) + 4,
  });
  world.setComponent(npc, "actor", {
    entityId: npc,
    name: npcDef.name,
    level: npcDef.combatLevel ?? 0,
    appearanceId: npcDef.id,
  });
  world.setComponent(npc, "combatant", combatant(npc, npcDef.maxHp ?? 6));
  const ctx = { world, collision, deltas, registries: content, rng: createRng(1234) };
  syncNpcOccupancy(ctx);
  return { ctx, world, npc, home, deltas };
}

function tileOf(world: World, entityId: ReturnType<World["createEntity"]>) {
  const position = world.getComponent(entityId, "position");
  if (!position) throw new Error("missing position");
  return { x: position.x, y: position.y, plane: position.plane as 0 };
}

function chebyshev(
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number },
): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

describe("NPC AI", () => {
  it("wanders deterministically without leaving its home radius", () => {
    const { ctx, world, npc, home } = setup();

    for (let tick = 1; tick <= 12; tick += 1) {
      processMovementPhase(
        { world, collision: ctx.collision, deltas: ctx.deltas },
        tick,
        npcFootprintResolver(ctx),
      );
      syncNpcOccupancy(ctx);
      processNpcAiPhase(ctx, tick);

      expect(chebyshev(tileOf(world, npc), home)).toBeLessThanOrEqual(NPC_DEF.wanderRadius);
    }
  });

  it("drops its target and paths home after exceeding leash distance", () => {
    const { ctx, world, npc, home } = setup({
      npcTile: { x: 9, y: 5, plane: 0 },
      leashDistance: 2,
    });
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 9, y: 6, plane: 0 });
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "a",
      sessionId: "s",
      interestRadius: 8,
    });
    world.setComponent(player, "combatant", combatant(player, 10));
    const combat = world.getComponent(npc, "combatant");
    if (!combat) throw new Error("missing combatant");
    world.setComponent(npc, "combatant", { ...combat, targetId: player });
    const state = world.getComponent(npc, "npc");
    if (!state) throw new Error("missing npc");
    world.setComponent(npc, "npc", { ...state, brainState: "chase" });

    processNpcAiPhase(ctx, 1);

    expect(world.getComponent(npc, "combatant")?.targetId).toBeUndefined();
    expect(world.getComponent(npc, "npc")?.brainState).toBe("returnHome");
    expect(world.getComponent(npc, "movement")?.destination).toEqual(home);
  });

  it("clears occupancy on death and respawns at home after content ticks", () => {
    const { ctx, world, npc, home, deltas } = setup();
    const homeMask = () => ctx.collision.getMask(home);
    expect(homeMask() & CollisionFlag.OCCUPIED_NPC).not.toBe(0);
    const combat = world.getComponent(npc, "combatant");
    if (!combat) throw new Error("missing combatant");
    world.setComponent(npc, "combatant", { ...combat, health: 0 });

    processNpcAiPhase(ctx, 5);

    expect(world.getComponent(npc, "npc")?.brainState).toBe("respawning");
    expect(world.getComponent(npc, "combatant")?.dead).toBe(true);
    expect(homeMask() & CollisionFlag.OCCUPIED_NPC).toBe(0);
    expect(deltas.peek().entityRemoves).toEqual([npc]);
    deltas.consume(5, 3_000);

    processNpcAiPhase(ctx, 7);
    expect(world.getComponent(npc, "combatant")?.dead).toBe(true);

    processNpcAiPhase(ctx, 8);

    expect(tileOf(world, npc)).toEqual(home);
    expect(world.getComponent(npc, "npc")?.brainState).toBe("idle");
    expect(world.getComponent(npc, "combatant")).toMatchObject({ dead: false, health: 6 });
    expect(homeMask() & CollisionFlag.OCCUPIED_NPC).not.toBe(0);
    expect(deltas.peek().entityAdds.map((entity) => entity.entityId)).toEqual([npc]);
  });
});
