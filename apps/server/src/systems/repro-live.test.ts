import { createRng, type EntityId, type NpcDef, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { ActionQueue, InterruptGroup } from "../sim/action-queue";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  handleNpcCombatIntent,
  processCombatStartEvents,
  processCombatTargetValidation,
  processDamageResolutionEvents,
} from "./combat-system";
import { processMovementPhase } from "./movement-system";
import { npcFootprintResolver, processNpcAiPhase, syncNpcOccupancy } from "./npc-system";

const GOBLIN: NpcDef = {
  id: "mud_goblin",
  name: "Mud Goblin",
  size: 1,
  combatLevel: 5,
  maxHp: 15,
  stats: { attack: 3, strength: 3, defence: 3, ranged: 1, magic: 1, prayer: 1, hitpoints: 15 },
  attackSpeedTicks: 5,
  attackRangeTiles: 1,
  aggressiveRadius: 3,
  wanderRadius: 5,
  respawnTicks: 15,
  movementType: "wander",
  aggressionMode: "aggressive",
  contractEligible: false,
  options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
};

function addCombatant(world: World, entityId: EntityId, hp: number): void {
  world.setComponent(entityId, "combatant", {
    entityId,
    health: hp,
    maxHealth: hp,
    attackLevel: 20,
    strengthLevel: 20,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 20,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
  });
}

describe("repro live attack", () => {
  it("lands a blow when attacking an aggressive goblin (full phase order + freeze)", () => {
    const world = createWorld();
    const map = createRuntimeMap();
    for (let x = 0; x <= 14; x += 1) {
      for (let y = 0; y <= 14; y += 1) {
        const tile = { x, y, plane: 0 as const };
        map.tiles.set(tileKey(tile), {
          tile,
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
    const registries = makeRegistries({ npc: new Map([[GOBLIN.id, GOBLIN]]) });
    const actionQueue = new ActionQueue();

    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 6, y: 10, plane: 0 });
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "a",
      sessionId: "s",
      interestRadius: 14,
    });
    addCombatant(world, player, 30);

    const npc = world.createEntity();
    const home = { x: 6, y: 6, plane: 0 as const };
    world.setComponent(npc, "position", { entityId: npc, x: home.x, y: home.y, plane: 0 });
    world.setComponent(npc, "npc", {
      entityId: npc,
      npcId: GOBLIN.id,
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: GOBLIN.wanderRadius,
      home,
      leashDistance: 20,
    });
    addCombatant(world, npc, GOBLIN.maxHp ?? 15);

    const ctx = { world, collision, deltas, registries, rng: createRng(99), actionQueue };
    const footprint = npcFootprintResolver(ctx);
    syncNpcOccupancy(ctx);

    handleNpcCombatIntent(ctx, player, { npcEntityId: npc, actionId: "attack" }, 0, 1);

    let landed = false;
    for (let tick = 1; tick <= 3; tick += 1) {
      // Interruptions phase (freeze): mirror the kernel.
      const blocked = new Set<EntityId>();
      const mv = world.getComponent(player, "movement");
      if (mv?.blockedUntilTick !== undefined && mv.blockedUntilTick >= tick) blocked.add(player);
      if (blocked.size > 0) {
        actionQueue.setBlockedOwners(blocked);
        for (const o of blocked) actionQueue.interrupt(o, InterruptGroup.Combat);
      } else {
        actionQueue.clearBlockedOwners();
      }

      processMovementPhase({ world, collision, deltas }, tick, footprint);
      syncNpcOccupancy(ctx);
      processCombatTargetValidation(ctx);
      processNpcAiPhase(ctx, tick);
      processCombatStartEvents(ctx, tick);
      processDamageResolutionEvents(ctx, tick);

      const hp = world.getComponent(npc, "combatant")?.health ?? -1;
      if (hp < 15) landed = true;
    }

    expect(landed).toBe(true);
  });
});
