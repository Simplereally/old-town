import {
  type ClientCommand,
  type ContentRegistries,
  createRng,
  type EntityId,
  type FullStatePacket,
} from "@old-town/shared";
import { createWorld, type World } from "../ecs/world";
import type { Logger } from "../logger";
import { type CommandRouteResult, CommandRouter } from "../net/command-router";
import type { DeltaTransport } from "../net/delta-broadcaster";
import { DeltaBroadcaster } from "../net/delta-broadcaster";
import { DevSessionManager } from "../net/dev-session";
import { InterestManager } from "../net/interest-manager";
import type { TransportSession } from "../net/websocket-transport";
import { ChatSystem } from "../systems/chat-system";
import { ConsumableSystem } from "../systems/consumable-system";
import { respawnResourceNode } from "../systems/resource-node-system";
import { handleSkillingAction } from "../systems/skilling-system";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionExecutor } from "./action-executor";
import { ActionRuntime } from "./action-runtime";
import { CommandBuffer } from "./command-buffer";
import { DeltaAccumulator } from "./delta-accumulator";
import {
  dispatchConsumablePhase,
  dispatchIntentGroup,
  dispatchMovementPhase,
} from "./intent-dispatcher";
import { TickLoop, TickPhase } from "./tick-loop";

export interface SimulationKernel {
  connectSession(session: TransportSession): FullStatePacket;
  disconnectSession(session: TransportSession): void;
  routeCommand(session: TransportSession, command: ClientCommand): CommandRouteResult;
  runOneTick(): number;
  runDueTicks(nowMs: number): number;
  attachDeltaTransport(transport: DeltaTransport): void;
  detachDeltaTransport(): void;
  stats(): KernelStats;
}

export interface KernelStats {
  readonly currentTick: number;
  readonly currentServerTime: number;
  readonly aliveEntityCount: number;
  readonly pendingCommandCount: number;
  readonly connectedSessionCount: number;
  readonly regionCount: number;
  readonly tileCount: number;
}

export interface SimulationKernelOptions {
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  readonly startServerTime?: number;
  readonly startTick?: number;
}

interface SimulationDeps {
  readonly world: World;
  readonly map: RuntimeMap;
  readonly tickLoop: TickLoop;
  readonly commandBuffer: CommandBuffer;
  readonly deltas: DeltaAccumulator;
  readonly commandRouter: CommandRouter;
  readonly devSessions: DevSessionManager;
  readonly chatSystem: ChatSystem;
  readonly consumableSystem: ConsumableSystem;
  readonly actionRuntime: ActionRuntime;
  readonly actionExecutor: ActionExecutor;
  readonly interestManager: InterestManager;
  readonly collision: CollisionMap;
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  readonly rng: ReturnType<typeof createRng>;
}

function createSimulationDeps(options: SimulationKernelOptions): SimulationDeps {
  const { registries, logger, startServerTime, startTick } = options;

  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, registries);
  const devSessions = new DevSessionManager(world, map, registries);
  const collision = new CollisionMap(map);
  applyObjectCollision(world, registries, collision);
  const commandBuffer = new CommandBuffer();
  const deltas = new DeltaAccumulator();
  const interestManager = new InterestManager();
  const tickLoop = new TickLoop({
    logger,
    ...(startTick !== undefined ? { startTick } : {}),
    ...(startServerTime !== undefined ? { startServerTime } : {}),
  });
  const chatSystem = new ChatSystem();
  const consumableSystem = new ConsumableSystem();
  const actionRuntime = new ActionRuntime();
  const rng = createRng(0x1d70a0d);
  const skillingContext = {
    world,
    collision,
    deltas,
    actionRuntime,
    registries,
    rng,
  };
  const actionExecutor = new ActionExecutor([
    (execution, context) => {
      const payload = execution.entry.payload as { readonly kind?: string };
      if (payload.kind === "resource_respawn") {
        return respawnResourceNode(
          skillingContext,
          (payload as { readonly nodeEntityId: EntityId }).nodeEntityId,
        );
      }
      return handleSkillingAction(
        skillingContext,
        execution,
        context?.tick ?? 0,
        context?.serverTime ?? 0,
      );
    },
  ]);
  const commandRouter = new CommandRouter({
    commandBuffer,
    getEntityId: (session) => devSessions.getEntityId(session),
    getCurrentTick: () => tickLoop.currentTick,
  });

  logger.info("kernel", "Simulation kernel initialized", {
    objects: world.componentCount("object"),
    npcs: world.componentCount("npc"),
    groundItems: world.componentCount("groundItem"),
    resourceNodes: world.componentCount("resourceNode"),
  });

  return {
    world,
    map,
    tickLoop,
    commandBuffer,
    deltas,
    commandRouter,
    devSessions,
    chatSystem,
    consumableSystem,
    actionRuntime,
    actionExecutor,
    interestManager,
    collision,
    registries,
    logger,
    rng,
  };
}

function wireTickPhases(
  deps: SimulationDeps,
  deltaBroadcasterRef: { current: DeltaBroadcaster | undefined },
): void {
  const {
    world,
    collision,
    deltas,
    commandRouter,
    chatSystem,
    consumableSystem,
    actionRuntime,
    actionExecutor,
    tickLoop,
    registries,
    rng,
  } = deps;

  const dispatchContext = {
    world,
    collision,
    deltas,
    actionRuntime,
    registries,
    rng,
    chatSystem,
    consumableSystem,
  };

  tickLoop.registerPhase(TickPhase.InputClose, ({ tick, serverTime }) => {
    const commands = commandRouter.consumeTick(tick);
    for (const group of commands.groups) {
      dispatchIntentGroup(dispatchContext, group, tick, serverTime);
    }
  });

  tickLoop.registerPhase(TickPhase.ActionQueueTimers, ({ tick, serverTime }) => {
    const executions = actionRuntime.advanceTick();
    actionExecutor.execute(executions, { tick, serverTime });
  });

  tickLoop.registerPhase(TickPhase.Movement, ({ tick }) => {
    dispatchMovementPhase(dispatchContext, tick);
  });

  tickLoop.registerPhase(TickPhase.FoodPotionPrayerStatChanges, () => {
    dispatchConsumablePhase(dispatchContext);
  });

  tickLoop.registerPhase(TickPhase.SnapshotDeltaBuild, ({ tick, serverTime }) => {
    deltaBroadcasterRef.current?.broadcastTick(tick, serverTime);
  });
}

function createKernelInterface(
  deps: SimulationDeps,
  deltaBroadcasterRef: { current: DeltaBroadcaster | undefined },
): SimulationKernel {
  const {
    world,
    map,
    tickLoop,
    commandBuffer,
    deltas,
    commandRouter,
    devSessions,
    interestManager,
    logger,
  } = deps;
  const connectedSessions = new Set<string>();

  function primeSessionOnAttach(session: TransportSession): void {
    const fullState = devSessions.bootstrap(
      session,
      tickLoop.currentTick,
      tickLoop.currentServerTime,
    );
    deltaBroadcasterRef.current?.primeSession(session, fullState.entities);
  }

  return {
    connectSession(session) {
      connectedSessions.add(session.id);
      const fullState = devSessions.bootstrap(
        session,
        tickLoop.currentTick,
        tickLoop.currentServerTime,
      );
      deltaBroadcasterRef.current?.primeSession(session, fullState.entities);
      const entityById = new Map(fullState.entities.map((e) => [e.entityId, e]));
      const selfSpawn = entityById.get(fullState.selfEntityId);
      if (selfSpawn) {
        deltas.markEntityAdd(selfSpawn);
      }
      return fullState;
    },

    disconnectSession(session) {
      const entityId = devSessions.getEntityId(session);
      if (entityId !== undefined) {
        deltas.markEntityRemove(entityId);
      }
      devSessions.remove(session);
      connectedSessions.delete(session.id);
    },

    routeCommand(session, command) {
      const result = commandRouter.route(session, command);
      if (!result.ok) {
        logger.warn("kernel", "Command rejected", { sessionId: session.id, reason: result.reason });
      }
      return result;
    },

    runOneTick() {
      return tickLoop.runOneTick();
    },

    runDueTicks(nowMs) {
      return tickLoop.runDueTicks(nowMs);
    },

    attachDeltaTransport(transport) {
      if (deltaBroadcasterRef.current) {
        logger.warn("kernel", "Delta transport already attached; replacing");
      }
      deltaBroadcasterRef.current = new DeltaBroadcaster({
        world,
        deltas,
        interestManager,
        transport,
        getEntityId: (session) => devSessions.getEntityId(session),
      });
      // Prime existing sessions if transport is attached after connections
      for (const sessionId of connectedSessions) {
        const session = transport.sessions.get(sessionId);
        if (session) {
          primeSessionOnAttach(session);
        }
      }
    },

    detachDeltaTransport() {
      deltaBroadcasterRef.current = undefined;
    },

    stats() {
      return {
        currentTick: tickLoop.currentTick,
        currentServerTime: tickLoop.currentServerTime,
        aliveEntityCount: world.aliveEntityCount(),
        pendingCommandCount: commandBuffer.pendingCount,
        connectedSessionCount: connectedSessions.size,
        regionCount: map.regions.size,
        tileCount: map.tiles.size,
      };
    },
  };
}

export function createSimulationKernel(options: SimulationKernelOptions): SimulationKernel {
  const deps = createSimulationDeps(options);
  const deltaBroadcasterRef: { current: DeltaBroadcaster | undefined } = { current: undefined };
  wireTickPhases(deps, deltaBroadcasterRef);
  return createKernelInterface(deps, deltaBroadcasterRef);
}
