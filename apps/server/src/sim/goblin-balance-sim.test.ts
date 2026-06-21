import { type ContentRegistries, createRng, type EntityId, tileKey, type TileCoord } from "@old-town/shared";
import { beforeAll, describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import {
  processCombatStartEvents,
  processDamageResolutionEvents,
} from "../systems/combat-system";
import { processDeathResolution } from "../systems/ground-item-system";
import { syncNpcOccupancy } from "../systems/npc-system";
import { createVarComponent } from "../vars/player-vars";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionQueue } from "./action-queue";
import { DeltaAccumulator } from "./delta-accumulator";

let registries: ContentRegistries;

beforeAll(async () => {
  const content = await loadContent("content");
  if (!content.ok || content.issues.length > 0) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  registries = content.registries;
});

function tile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as TileCoord["plane"] };
}

interface Ctx {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionQueue: ActionQueue;
  readonly rng: ReturnType<typeof createRng>;
  readonly itemAudit: ItemAuditLog;
}

function makeCtx(seed: number): Ctx {
  const world = createWorld();
  const map: RuntimeMap = createRuntimeMap();
  for (let x = 0; x < 6; x += 1) {
    for (let y = 0; y < 6; y += 1) {
      map.tiles.set(tileKey(tile(x, y)), {
        tile: tile(x, y),
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const itemAudit = new ItemAuditLog();
  return { world, collision, deltas, registries, actionQueue, rng: createRng(seed), itemAudit };
}

/**
 * Fresh player: 1/1/1 combat, 10 HP (hitpoints level 1 × 10, matching dev-session
 * creation and OSRS's 10-HP start). No weapon — the worst-case starter scenario.
 */
function addFreshPlayer(ctx: Ctx, coord: TileCoord): EntityId {
  const entityId = ctx.world.createEntity();
  ctx.world.setComponent(entityId, "position", { entityId, x: coord.x, y: coord.y, plane: coord.plane });
  ctx.world.setComponent(entityId, "player", {
    entityId,
    accountId: "account",
    sessionId: `session:${entityId}`,
    interestRadius: 32,
    spellbook: "common",
  });
  ctx.world.setComponent(entityId, "movement", { entityId, mode: "walk", path: [] });
  ctx.world.setComponent(entityId, "vars", createVarComponent(entityId));
  ctx.world.setComponent(entityId, "combatant", {
    entityId,
    health: 10,
    maxHealth: 10,
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
    spellCooldowns: {},
  });
  ctx.world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      attack: { level: 1, xp: 0, boost: 0, drain: 0 },
      strength: { level: 1, xp: 0, boost: 0, drain: 0 },
      defence: { level: 1, xp: 0, boost: 0, drain: 0 },
      hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      magic: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  ctx.world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  ctx.world.setComponent(entityId, "equipment", { entityId, slots: {}, bonuses: {} });
  return entityId;
}

function addNpc(ctx: Ctx, npcId: string, coord: TileCoord): EntityId {
  const def = ctx.registries.npc.get(npcId);
  if (!def) throw new Error(`Missing NPC ${npcId}`);
  const entityId = ctx.world.createEntity();
  ctx.world.setComponent(entityId, "position", { entityId, x: coord.x, y: coord.y, plane: coord.plane });
  ctx.world.setComponent(entityId, "npc", {
    entityId,
    npcId,
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: def.wanderRadius,
    home: coord,
    leashDistance: def.wanderRadius + (def.aggressiveRadius ?? 0) + 4,
  });
  ctx.world.setComponent(entityId, "actor", {
    entityId,
    name: def.name,
    level: def.combatLevel ?? 0,
    appearanceId: npcId,
  });
  ctx.world.setComponent(entityId, "combatant", {
    entityId,
    health: def.maxHp ?? 8,
    maxHealth: def.maxHp ?? 8,
    attackLevel: def.stats?.attack ?? 1,
    strengthLevel: def.stats?.strength ?? 1,
    defenceLevel: def.stats?.defence ?? 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: def.combatLevel ?? 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
    spellCooldowns: {},
  });
  return entityId;
}

/**
 * Runs a 1v1 fight where the player initiates (attacks first) and the NPC
 * retaliates only after being hit — the real scenario for a non-aggressive
 * mud_goblin in a single-combat area.
 */
function runPlayerInitiatedFight(seed: number, npcId: string): boolean {
  const ctx = makeCtx(seed);
  const player = addFreshPlayer(ctx, tile(1, 1));
  const goblin = addNpc(ctx, npcId, tile(1, 2));
  const existingCombatant = ctx.world.getComponent(player, "combatant");
  if (!existingCombatant) throw new Error("player missing combatant component");
  ctx.world.setComponent(player, "combatant", {
    ...existingCombatant,
    targetId: goblin,
  });
  syncNpcOccupancy(ctx);

  let tick = 0;
  while (tick < 600) {
    processCombatStartEvents(ctx, tick);
    processDamageResolutionEvents(ctx, tick + 1);
    processDeathResolution(ctx, tick + 1, 1_200);
    const p = ctx.world.getComponent(player, "combatant");
    const g = ctx.world.getComponent(goblin, "combatant");
    if (g?.dead || (g?.health ?? 0) <= 0) return true;
    if (p?.dead || (p?.health ?? 0) <= 0) return false;
    tick += 1;
  }
  return false;
}

describe("mud_goblin balance regression", () => {
  it("a fresh 1/1/1 unarmed player with 10 HP wins the majority of 1v1 fights", () => {
    const TRIALS = 200;
    let wins = 0;
    for (let seed = 1; seed <= TRIALS; seed += 1) {
      if (runPlayerInitiatedFight(seed, "mud_goblin")) wins += 1;
    }
    expect(wins / TRIALS).toBeGreaterThan(0.8);
  });

  it("mud_goblin is non-aggressive (retaliate-only, like OSRS Lumbridge goblins)", () => {
    const def = registries.npc.get("mud_goblin");
    expect(def?.aggressiveRadius).toBe(0);
    expect(def?.aggressionMode).toBe("retaliate");
  });
});
