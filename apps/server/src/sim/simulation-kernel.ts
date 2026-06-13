import { performance } from "node:perf_hooks";
import {
  type ClientCommand,
  type ContentRegistries,
  createRng,
  type EntityId,
  type FullStatePacket,
  GAME_TICK_MS,
  type ItemTransactionAuditRecord,
  type TileCoord,
} from "@old-town/shared";
import {
  createDialogueActionHandlers,
  type DialogueHandlerTable,
} from "../dialogue/dialogue-engine";
import { createWorld, type World } from "../ecs/world";
import { ItemAuditLog } from "../items/item-audit";
import type { Logger } from "../logger";
import type { DeltaTransport } from "../net/delta-transport";
import { DevSessionManager } from "../net/dev-session";
import { InterestManager } from "../net/interest-manager";
import type { TransportSession } from "../net/websocket-transport";
import { DisabledPersistenceAdapter, type PersistenceAdapter } from "../persistence/adapter";
import { createPersistenceDirtyObserver } from "../persistence/dirty-triggers";
import { CharacterSaveQueue } from "../persistence/save-queue";
import { processQuestTriggers } from "../quests/quest-engine";
import { processAppearanceUpdates } from "../systems/appearance-system";
import { ChatSystem } from "../systems/chat-system";
import {
  processCombatStartEvents,
  processCombatTargetValidation,
  processDamageResolutionEvents,
} from "../systems/combat-system";
import { ConsumableSystem } from "../systems/consumable-system";
import { processContractLifecycle } from "../systems/contract-system";
import { processPlayerRespawn } from "../systems/death-system";
import {
  processDeathResolution,
  processGraveLifecycle,
  processGroundItemLifecycle,
} from "../systems/ground-item-system";
import type { NookDef } from "../systems/nook-system";
import { npcFootprintResolver, processNpcAiPhase, syncNpcOccupancy } from "../systems/npc-system";
import {
  type BeginInteractPayload,
  handleBeginInteract,
} from "../systems/object-interaction-router";
import {
  createResourceNodeActionHandlers,
  type ResourceNodeHandlerTable,
} from "../systems/resource-node-system";
import { processShopRestockPhase } from "../systems/shop-system";
import {
  createSkillingActionHandlers,
  type SkillingHandlerTable,
} from "../systems/skilling-system";
import { createSpellActionHandlers, type SpellHandlerTable } from "../systems/spell-system";
import {
  createActivityActionHandlers,
  type ActivityHandlerTable,
} from "../systems/activity-system";
import { processStatusEffects } from "../systems/status-system";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionExecutor, type ActionHandler } from "./action-executor";
import { ActionQueue } from "./action-queue";
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

export interface CommandRouteResult {
  readonly ok: boolean;
  readonly reason?: string;
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
  readonly nooks?: readonly NookDef[];
}

const DEFAULT_SPAM_CAP_PER_TICK = 8;

type CommandCountsByTick = Map<number, Map<string, number>>;

type ActionHandlerTable = SkillingHandlerTable &
  ResourceNodeHandlerTable &
  SpellHandlerTable &
  DialogueHandlerTable &
  ActivityHandlerTable & {
    begin_interact: ActionHandler<BeginInteractPayload>;
  };

interface SimulationDeps {
  readonly world: World;
  readonly map: RuntimeMap;
  readonly tickLoop: TickLoop;
  readonly commandBuffer: CommandBuffer;
  readonly deltas: DeltaAccumulator;
  readonly devSessions: DevSessionManager;
  readonly chatSystem: ChatSystem;
  readonly consumableSystem: ConsumableSystem;
  readonly actionQueue: ActionQueue;
  readonly actionExecutor: ActionExecutor<ActionHandlerTable>;
  readonly interestManager: InterestManager;
  readonly itemAudit: ItemAuditLog;
  readonly persistence: PersistenceAdapter;
  readonly saveQueue: CharacterSaveQueue;
  readonly collision: CollisionMap;
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  readonly rng: ReturnType<typeof createRng>;
  readonly nooks?: readonly NookDef[];
}

interface KernelMetrics {
  lastTickDurationMs: number;
  lastCommandsProcessed: number;
  lastDeltaSizeBytes: number;
}

function positionTile(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function clearCommandCountsForTick(countsByTargetTick: CommandCountsByTick, tick: number): void {
  countsByTargetTick.delete(tick);
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
  const actionQueue = new ActionQueue();
  const rng = createRng(0x1d70a0d);
  const skillingContext = {
    world,
    collision,
    deltas,
    actionQueue,
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
    actionQueue,
    registries,
    itemAudit,
  });
  const activityHandlers = createActivityActionHandlers(skillingContext);
  const actionTable: ActionHandlerTable = {
    ...skillingHandlers,
    ...resourceNodeHandlers,
    ...spellHandlers,
    ...dialogueHandlers,
    ...activityHandlers,
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
    (owner, filter) => actionQueue.cancel(owner, filter),
    (kind, action) =>
      logger.error("action", "No handler for action kind", {
        kind,
        owner: action.entry.owner,
        id: action.entry.id,
      }),
  );

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
    devSessions,
    chatSystem,
    consumableSystem,
    actionQueue,
    actionExecutor,
    interestManager,
    itemAudit,
    persistence,
    saveQueue,
    collision,
    registries,
    logger,
    rng,
    ...(options.nooks !== undefined ? { nooks: options.nooks } : {}),
  };
}

function wireTickPhases(
  deps: SimulationDeps,
  deltaTransportRef: { current: DeltaTransport | undefined },
  countsByTargetTick: CommandCountsByTick,
  metrics: KernelMetrics,
): void {
  const {
    world,
    map,
    collision,
    deltas,
    commandBuffer,
    devSessions,
    chatSystem,
    consumableSystem,
    actionQueue,
    actionExecutor,
    tickLoop,
    registries,
    rng,
    itemAudit,
    saveQueue,
    interestManager,
  } = deps;

  const dispatchContext = {
    world,
    collision,
    deltas,
    actionQueue,
    registries,
    rng,
    chatSystem,
    consumableSystem,
    itemAudit,
    nooks: deps.nooks,
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
    actionQueue,
  };

  tickLoop.registerPhase(TickPhase.InputClose, ({ tick, serverTime }) => {
    clearCommandCountsForTick(countsByTargetTick, tick);
    const commands = commandBuffer.consumeTick(tick);
    metrics.lastCommandsProcessed = commands.groups.reduce(
      (count, group) => count + group.intents.length,
      0,
    );
    for (const group of commands.groups) {
      dispatchIntentGroup(dispatchContext, group, tick, serverTime);
    }
  });

  tickLoop.registerPhase(TickPhase.ActionQueueTimers, ({ tick, serverTime }) => {
    const executions = actionQueue.advanceTick();
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
    processGraveLifecycle(combatContext, tick, serverTime);
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
    processContractLifecycle({ world, deltas, registries, itemAudit }, tick, serverTime);
  });

  tickLoop.registerPhase(TickPhase.AppearanceUpdate, () => {
    processAppearanceUpdates({ world, deltas, items: registries.item });
  });

  tickLoop.registerPhase(TickPhase.SnapshotDeltaBuild, ({ tick, serverTime }) => {
    const transport = deltaTransportRef.current;
    if (!transport) {
      metrics.lastDeltaSizeBytes = 0;
      return;
    }

    const delta = deltas.consume(tick, serverTime);
    for (const session of transport.sessions.values()) {
      const entityId = devSessions.getEntityId(session);
      const center = entityId === undefined ? undefined : positionTile(world, entityId);
      if (!center || entityId === undefined) {
        continue;
      }
      transport.send(session.id, interestManager.filterDelta(entityId, center, delta, world));
    }
    metrics.lastDeltaSizeBytes = JSON.stringify(delta).length;
  });
}

function createKernelInterface(
  deps: SimulationDeps,
  deltaTransportRef: { current: DeltaTransport | undefined },
  countsByTargetTick: CommandCountsByTick,
  metrics: KernelMetrics,
): SimulationKernel {
  const {
    world,
    map,
    tickLoop,
    commandBuffer,
    deltas,
    devSessions,
    interestManager,
    logger,
    saveQueue,
    itemAudit,
  } = deps;
  const connectedSessions = new Set<string>();

  function primeSessionInterest(
    session: TransportSession,
    entities: FullStatePacket["entities"],
  ): void {
    const entityId = devSessions.getEntityId(session);
    const center = entityId === undefined ? undefined : positionTile(world, entityId);
    if (!center || entityId === undefined) {
      return;
    }
    interestManager.updateInterest(entityId, center);
    interestManager.primeKnownEntities(entityId, entities);
  }

  function primeSessionOnAttach(session: TransportSession): void {
    const fullState = devSessions.fullStateForSession(
      session,
      tickLoop.currentTick,
      tickLoop.currentServerTime,
    );
    if (fullState) {
      primeSessionInterest(session, fullState.entities);
    }
  }

  const runOneTick = (): number => {
    const startedAt = performance.now();
    try {
      return tickLoop.runOneTick();
    } finally {
      metrics.lastTickDurationMs = performance.now() - startedAt;
    }
  };

  const runDueTicks = (nowMs: number): number => {
    let ran = 0;
    while (tickLoop.currentServerTime + GAME_TICK_MS <= nowMs) {
      runOneTick();
      ran += 1;
    }
    return ran;
  };

  return {
    async connectSession(session) {
      const fullState = await devSessions.bootstrap(
        session,
        tickLoop.currentTick,
        tickLoop.currentServerTime,
      );
      connectedSessions.add(session.id);
      // If no transport is attached yet, attachDeltaTransport primes from a fresh
      // full state later. With a live transport, prime now so the first delta after
      // connect does not echo entities the client already received in full state.
      if (deltaTransportRef.current) {
        primeSessionInterest(session, fullState.entities);
      }
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
      const ownerEntityId = devSessions.getEntityId(session);
      let result: CommandRouteResult;
      if (ownerEntityId === undefined) {
        result = { ok: false, reason: "no_session_entity" };
      } else {
        const receivedTick = tickLoop.currentTick;
        const targetTick = receivedTick + 1;
        const countsBySession = countsByTargetTick.get(targetTick) ?? new Map<string, number>();
        const count = countsBySession.get(session.id) ?? 0;
        if (count >= DEFAULT_SPAM_CAP_PER_TICK) {
          result = { ok: false, reason: "spam_cap" };
        } else {
          const accepted = commandBuffer.accept(command, {
            ownerEntityId,
            connectionId: session.id,
            receivedTick,
            targetTick,
          });
          if (accepted.ok) {
            countsBySession.set(session.id, count + 1);
            countsByTargetTick.set(targetTick, countsBySession);
            result = { ok: true };
          } else {
            result = { ok: false, reason: accepted.reason };
          }
        }
      }
      if (!result.ok) {
        logger.warn("kernel", "Command rejected", { sessionId: session.id, reason: result.reason });
      }
      return result;
    },

    runOneTick,

    runDueTicks,

    attachDeltaTransport(transport) {
      if (deltaTransportRef.current) {
        logger.warn("kernel", "Delta transport already attached; replacing");
      }
      deltaTransportRef.current = transport;
      // Prime existing sessions if transport is attached after connections
      for (const sessionId of connectedSessions) {
        const session = transport.sessions.get(sessionId);
        if (session) {
          primeSessionOnAttach(session);
        }
      }
    },

    detachDeltaTransport() {
      deltaTransportRef.current = undefined;
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
  const deltaTransportRef: { current: DeltaTransport | undefined } = { current: undefined };
  const countsByTargetTick: CommandCountsByTick = new Map();
  const metrics: KernelMetrics = {
    lastTickDurationMs: 0,
    lastCommandsProcessed: 0,
    lastDeltaSizeBytes: 0,
  };
  wireTickPhases(deps, deltaTransportRef, countsByTargetTick, metrics);
  return createKernelInterface(deps, deltaTransportRef, countsByTargetTick, metrics);
}
