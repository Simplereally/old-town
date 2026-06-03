import { performance } from "node:perf_hooks";
import {
  type ClientCommand,
  type ContentRegistries,
  createRng,
  type FullStatePacket,
  GAME_TICK_MS,
  type ItemTransactionAuditRecord,
} from "@old-town/shared";
import { createDialogueActionHandlers } from "../dialogue/dialogue-engine";
import { createWorld, type World } from "../ecs/world";
import { ItemAuditLog } from "../items/item-audit";
import type { Logger } from "../logger";
import { type CommandRouteResult, CommandRouter } from "../net/command-router";
import type { DeltaTransport } from "../net/delta-broadcaster";
import { DeltaBroadcaster } from "../net/delta-broadcaster";
import { DevSessionManager } from "../net/dev-session";
import { InterestManager } from "../net/interest-manager";
import type { TransportSession } from "../net/websocket-transport";
import {
  CharacterSaveQueue,
  createPersistenceDirtyObserver,
  DisabledPersistenceAdapter,
  type PersistenceAdapter,
} from "../persistence";
import { ChatSystem } from "../systems/chat-system";
import {
  processCombatStartEvents,
  processCombatTargetValidation,
  processDamageResolutionEvents,
} from "../systems/combat-system";
import { ConsumableSystem } from "../systems/consumable-system";
import { processPlayerRespawn } from "../systems/death-system";
import { processContractLifecycle } from "../systems/contract-system";
import { processDeathResolution, processGroundItemLifecycle } from "../systems/ground-item-system";
import { npcFootprintResolver, processNpcAiPhase, syncNpcOccupancy } from "../systems/npc-system";
import { createResourceNodeActionHandlers } from "../systems/resource-node-system";
import { createSkillingActionHandlers } from "../systems/skilling-system";
import { handleBeginInteract } from "../systems/object-interaction-router";
import { processAppearanceUpdates } from "../systems/appearance-system";
import { processShopRestockPhase } from "../systems/shop-system";
import { processStatusEffects } from "../systems/status-system";
import { createSpellActionHandlers } from "../systems/spell-system";
import { processQuestTriggers } from "../quests/quest-engine";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionExecutor } from "./action-executor";
import type { ActionHandlerTable } from "./action-payloads";
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
  connectSession(session: TransportSession): Promise<FullStatePacket>;
  disconnectSession(session: TransportSession): Promise<void>;
  flushPersistence(): Promise<void>;
  routeCommand(session: TransportSession, command: ClientCommand): CommandRouteResult;
  runOneTick(): number;
  runDueTicks(nowMs: number): number;
  attachDeltaTransport(transport: DeltaTransport): void;
  detachDeltaTransport(): void;
  recentItemTransactions(limit?: number): readonly ItemTransactionAuditRecord[];
  stats(): KernelStats;
}

export interface KernelStats {
  readonly currentTick: number;
  readonly currentServerTime: number;
  readonly lastTickDurationMs: number;
  readonly aliveEntityCount: number;
  readonly pendingCommandCount: number;
  readonly lastCommandsProcessed: number;
  readonly connectedSessionCount: number;
  readonly regionCount: number;
  readonly tileCount: number;
  readonly lastDeltaSizeBytes: number;
  readonly saveQueuePendingCount: number;
  readonly saveQueueInFlightCount: number;
}

export interface SimulationKernelOptions {
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  readonly persistence?: PersistenceAdapter;
  readonly lazySaveIntervalTicks?: number;
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
  readonly actionExecutor: ActionExecutor<ActionHandlerTable>;
  readonly interestManager: InterestManager;
  readonly itemAudit: ItemAuditLog;
  readonly persistence: PersistenceAdapter;
  readonly saveQueue: CharacterSaveQueue;
  readonly collision: CollisionMap;
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  readonly rng: ReturnType<typeof createRng>;
}

interface KernelMetrics {
  lastTickDurationMs: number;
  lastCommandsProcessed: number;
  lastDeltaSizeBytes: number;
}

function createSimulationDeps(options: SimulationKernelOptions): SimulationDeps {
  const { registries, logger, startServerTime, startTick } = options;

  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, registries);
  const persistence = options.persistence ?? new DisabledPersistenceAdapter();
  const itemAudit = new ItemAuditLog({ persistence, logger });
  const devSessions = new DevSessionManager(world, map, registries, persistence, itemAudit);
  itemAudit.setCharacterResolver((entityId) => devSessions.characterIdForEntity(entityId));
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
  const saveQueue = new CharacterSaveQueue({
    world,
    registries,
    persistence,
    resolveCharacterId: (entityId) => devSessions.characterIdForEntity(entityId),
    lazySaveIntervalTicks: options.lazySaveIntervalTicks ?? 10,
    logger,
  });
  deltas.setObserver(
    createPersistenceDirtyObserver({
      saveQueue,
      players: devSessions,
      clock: () => ({
        tick: tickLoop.currentTick,
        serverTime: tickLoop.currentServerTime,
      }),
    }),
  );
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
    itemAudit,
  };
  syncNpcOccupancy({ world, collision, registries });
  const skillingHandlers = createSkillingActionHandlers(skillingContext);
  const resourceNodeHandlers = createResourceNodeActionHandlers(skillingContext);
  const spellHandlers = createSpellActionHandlers(skillingContext);
  const dialogueHandlers = createDialogueActionHandlers({
    world,
    collision,
    deltas,
    actionRuntime,
    registries,
    itemAudit,
  });
  const actionTable: ActionHandlerTable = {
    ...skillingHandlers,
    ...resourceNodeHandlers,
    ...spellHandlers,
    ...dialogueHandlers,
    begin_interact: (payload, actionCtx) =>
      handleBeginInteract(
        skillingContext,
        actionCtx.execution,
        payload,
        actionCtx.serverTime,
        actionCtx.tick,
      ),
  };
  const actionExecutor = new ActionExecutor(
    actionTable,
    actionRuntime.cancel.bind(actionRuntime),
    (kind, action) =>
      logger.error("action", "No handler for action kind", {
        kind,
        owner: action.entry.owner,
        id: action.entry.id,
      }),
  );
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
    itemAudit,
    persistence,
    saveQueue,
    collision,
    registries,
    logger,
    rng,
  };
}

function wireTickPhases(
  deps: SimulationDeps,
  deltaBroadcasterRef: { current: DeltaBroadcaster | undefined },
  metrics: KernelMetrics,
): void {
  const {
    world,
    map,
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
    itemAudit,
    saveQueue,
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
    itemAudit,
  };
  const npcContext = {
    world,
    collision,
    deltas,
    registries,
    rng,
  };
  const combatContext = {
    world,
    collision,
    deltas,
    registries,
    rng,
    itemAudit,
    actionRuntime,
  };

  tickLoop.registerPhase(TickPhase.InputClose, ({ tick, serverTime }) => {
    const commands = commandRouter.consumeTick(tick);
    metrics.lastCommandsProcessed = commands.groups.reduce(
      (count, group) => count + group.intents.length,
      0,
    );
    for (const group of commands.groups) {
      dispatchIntentGroup(dispatchContext, group, tick, serverTime);
    }
  });

  tickLoop.registerPhase(TickPhase.ActionQueueTimers, ({ tick, serverTime }) => {
    const executions = actionRuntime.advanceTick();
    actionExecutor.execute(executions, { tick, serverTime });
  });

  tickLoop.registerPhase(TickPhase.Movement, ({ tick }) => {
    dispatchMovementPhase(dispatchContext, tick, npcFootprintResolver(npcContext));
    syncNpcOccupancy(npcContext);
  });

  tickLoop.registerPhase(TickPhase.TargetValidation, () => {
    processCombatTargetValidation(combatContext);
  });

  tickLoop.registerPhase(TickPhase.NpcAi, ({ tick }) => {
    processNpcAiPhase(npcContext, tick);
  });

  tickLoop.registerPhase(TickPhase.CombatStartEvents, ({ tick }) => {
    processCombatStartEvents(combatContext, tick);
  });

  tickLoop.registerPhase(TickPhase.DamageResolutionEvents, ({ tick }) => {
    processDamageResolutionEvents(combatContext, tick);
  });

  const statusEffectContext = {
    world,
    deltas,
    registries,
    map,
  };

  tickLoop.registerPhase(TickPhase.StatusEffects, ({ tick }) => {
    processStatusEffects(statusEffectContext, tick);
  });

  tickLoop.registerPhase(TickPhase.DeathResolution, ({ tick, serverTime }) => {
    processDeathResolution(combatContext, tick, serverTime);
    processPlayerRespawn(combatContext, tick, serverTime);
    processGroundItemLifecycle(combatContext, tick);
  });

  tickLoop.registerPhase(TickPhase.FoodPotionPrayerStatChanges, () => {
    dispatchConsumablePhase(dispatchContext);
  });

  tickLoop.registerPhase(TickPhase.ShopRestock, ({ tick }) => {
    processShopRestockPhase({ world, collision, deltas, registries, itemAudit }, tick);
  });

  tickLoop.registerPhase(TickPhase.QuestTriggersVarbits, ({ tick, serverTime }) => {
    processQuestTriggers({ world, registries, deltas, itemAudit }, serverTime, tick);
    saveQueue.flushDue(tick, serverTime);
  });

  tickLoop.registerPhase(TickPhase.ContractLifecycle, ({ tick, serverTime }) => {
    processContractLifecycle(
      { world, deltas, registries, itemAudit },
      tick,
      serverTime,
    );
  });

  tickLoop.registerPhase(TickPhase.AppearanceUpdate, () => {
    processAppearanceUpdates({ world, deltas, items: registries.item });
  });

  tickLoop.registerPhase(TickPhase.SnapshotDeltaBuild, ({ tick, serverTime }) => {
    const delta = deltaBroadcasterRef.current?.broadcastTick(tick, serverTime);
    metrics.lastDeltaSizeBytes = delta === undefined ? 0 : JSON.stringify(delta).length;
  });
}

function createKernelInterface(
  deps: SimulationDeps,
  deltaBroadcasterRef: { current: DeltaBroadcaster | undefined },
  metrics: KernelMetrics,
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
    saveQueue,
    itemAudit,
  } = deps;
  const connectedSessions = new Set<string>();

  function primeSessionOnAttach(session: TransportSession): void {
    const fullState = devSessions.fullStateForSession(
      session,
      tickLoop.currentTick,
      tickLoop.currentServerTime,
    );
    if (fullState) {
      deltaBroadcasterRef.current?.primeSession(session, fullState.entities);
    }
  }

  return {
    async connectSession(session) {
      const fullState = await devSessions.bootstrap(
        session,
        tickLoop.currentTick,
        tickLoop.currentServerTime,
      );
      connectedSessions.add(session.id);
      deltaBroadcasterRef.current?.primeSession(session, fullState.entities);
      const entityById = new Map(fullState.entities.map((e) => [e.entityId, e]));
      const selfSpawn = entityById.get(fullState.selfEntityId);
      if (selfSpawn) {
        deltas.markEntityAdd(selfSpawn);
      }
      return fullState;
    },

    async disconnectSession(session) {
      const entityId = devSessions.getEntityId(session);
      if (entityId !== undefined) {
        deltas.markEntityRemove(entityId);
      }
      try {
        await devSessions.remove(session, tickLoop.currentServerTime);
      } catch (error) {
        logger.error("kernel", "Session persistence failed during disconnect", {
          sessionId: session.id,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        if (entityId !== undefined) {
          saveQueue.discard(entityId);
        }
        connectedSessions.delete(session.id);
      }
    },

    routeCommand(session, command) {
      const result = commandRouter.route(session, command);
      if (!result.ok) {
        logger.warn("kernel", "Command rejected", { sessionId: session.id, reason: result.reason });
      }
      return result;
    },

    runOneTick() {
      const startedAt = performance.now();
      try {
        return tickLoop.runOneTick();
      } finally {
        metrics.lastTickDurationMs = performance.now() - startedAt;
      }
    },

    runDueTicks(nowMs) {
      let ran = 0;
      while (tickLoop.currentServerTime + GAME_TICK_MS <= nowMs) {
        this.runOneTick();
        ran += 1;
      }
      return ran;
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

    async flushPersistence() {
      await saveQueue.flushAll(tickLoop.currentTick, tickLoop.currentServerTime);
      await itemAudit.flush();
    },

    recentItemTransactions(limit = 50) {
      return itemAudit.recent(limit);
    },

    stats() {
      return {
        currentTick: tickLoop.currentTick,
        currentServerTime: tickLoop.currentServerTime,
        lastTickDurationMs: metrics.lastTickDurationMs,
        aliveEntityCount: world.aliveEntityCount(),
        pendingCommandCount: commandBuffer.pendingCount,
        lastCommandsProcessed: metrics.lastCommandsProcessed,
        connectedSessionCount: connectedSessions.size,
        regionCount: map.regions.size,
        tileCount: map.tiles.size,
        lastDeltaSizeBytes: metrics.lastDeltaSizeBytes,
        saveQueuePendingCount: saveQueue.pendingCount,
        saveQueueInFlightCount: saveQueue.inFlightCount,
      };
    },
  };
}

export function createSimulationKernel(options: SimulationKernelOptions): SimulationKernel {
  const deps = createSimulationDeps(options);
  const deltaBroadcasterRef: { current: DeltaBroadcaster | undefined } = { current: undefined };
  const metrics: KernelMetrics = {
    lastTickDurationMs: 0,
    lastCommandsProcessed: 0,
    lastDeltaSizeBytes: 0,
  };
  wireTickPhases(deps, deltaBroadcasterRef, metrics);
  return createKernelInterface(deps, deltaBroadcasterRef, metrics);
}
