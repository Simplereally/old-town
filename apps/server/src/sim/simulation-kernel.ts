import { performance } from "node:perf_hooks";
import {
  type ClientCommand,
  type ContentRegistries,
  createRng,
  type EntityId,
  type FullStatePacket,
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
import { PersistenceMetrics, type PersistenceMetricsSnapshot } from "../persistence/metrics";
import {
  MemoryWorldSessionStore,
  type WorldSessionStore,
} from "../persistence/postgres/world-session-store";
import { CharacterSaveQueue } from "../persistence/save-queue";
import { processQuestTriggers } from "../quests/quest-engine";
import {
  type ActivityHandlerTable,
  createActivityActionHandlers,
} from "../systems/activity-system";
import { processAppearanceUpdates } from "../systems/appearance-system";
import { processCharterExpiry } from "../systems/charter-system";
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
  type BeginPickupPayload,
  handleBeginPickup,
  processDeathResolution,
  processGraveLifecycle,
  processGroundItemLifecycle,
} from "../systems/ground-item-system";
import { processDeedExpiry } from "../systems/ledger-system";
import type { NookDef } from "../systems/nook-system";
import { checkNookDiscovery } from "../systems/nook-system";
import { npcFootprintResolver, processNpcAiPhase, syncNpcOccupancy } from "../systems/npc-system";
import {
  type BeginInteractPayload,
  handleBeginInteract,
} from "../systems/object-interaction-router";
import { processPrayerDrainPhase } from "../systems/prayer-system";
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
import { processStatusEffectTick } from "../systems/status-effect-system";
import { processStatusEffects } from "../systems/status-system";
import { checkTrailDiscovery, processTrailBuffs } from "../systems/trail-system";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionExecutor, type ActionHandler } from "./action-executor";
import { ActionQueue, InterruptGroup } from "./action-queue";
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
  /** Release every active session lease (graceful shutdown / redeploy). */
  releaseAllLeases(): Promise<void>;
  routeCommand(session: TransportSession, command: ClientCommand): CommandRouteResult;
  runOneTick(): number;
  runDueTicks(nowMs: number): number;
  attachDeltaTransport(transport: DeltaTransport): void;
  detachDeltaTransport(): void;
  recentItemTransactions(limit?: number): readonly ItemTransactionAuditRecord[];
  persistenceMetrics(): PersistenceMetricsSnapshot;
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
  readonly persistence: PersistenceMetricsSnapshot;
}

export interface SimulationKernelOptions {
  readonly registries: ContentRegistries;
  readonly logger: Logger;
  /** Seed for deterministic simulation rolls. Defaults to the stable development-world seed. */
  readonly rngSeed?: number;
  readonly persistence?: PersistenceAdapter;
  readonly lazySaveIntervalTicks?: number;
  readonly startServerTime?: number;
  readonly startTick?: number;
  readonly nooks?: readonly NookDef[];
  /** Logical world id for session leases (item 5). */
  readonly worldId?: string;
  /** Enforce the one-live-owner-per-character lease on connect (item 5). */
  readonly sessionLeasing?: boolean;
  /** Lease store to use when leasing is enabled. Defaults to an in-memory store. */
  readonly sessionStore?: WorldSessionStore;
  /** Lease validity window without a heartbeat, in ms. */
  readonly leaseDurationMs?: number;
  /** Max concurrent durable writes before the save queue applies backpressure (item 9). */
  readonly maxInFlightSaves?: number;
}

const DEFAULT_SPAM_CAP_PER_TICK = 8;

type CommandCountsByTick = Map<number, Map<string, number>>;

type ActionHandlerTable = SkillingHandlerTable &
  ResourceNodeHandlerTable &
  SpellHandlerTable &
  DialogueHandlerTable &
  ActivityHandlerTable & {
    begin_interact: ActionHandler<BeginInteractPayload>;
    begin_pickup: ActionHandler<BeginPickupPayload>;
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
  readonly persistenceMetrics: PersistenceMetrics;
  readonly sessionLeasing: boolean;
  readonly sessionStore: WorldSessionStore | undefined;
  readonly worldId: string;
  readonly leaseDurationMs: number;
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
  return position ? { x: position.x, y: position.y, plane: position.plane } : undefined;
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
  const persistenceMetrics = new PersistenceMetrics();
  const itemAudit = new ItemAuditLog({ persistence, logger, metrics: persistenceMetrics });
  const devSessions = new DevSessionManager(world, map, registries, persistence, itemAudit);
  // One live owner per character is enforced by default (item 7); disable explicitly for sandboxes.
  const sessionLeasing = options.sessionLeasing ?? true;
  const sessionStore =
    options.sessionStore ?? (sessionLeasing ? new MemoryWorldSessionStore() : undefined);
  const worldId = options.worldId ?? "old_town_dev";
  const leaseDurationMs = options.leaseDurationMs ?? 60_000;
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
    metrics: persistenceMetrics,
    ...(options.maxInFlightSaves !== undefined
      ? { maxInFlightSaves: options.maxInFlightSaves }
      : {}),
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
  const rng = createRng(options.rngSeed ?? 0x1d70a0d);
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
    begin_pickup: (payload, actionCtx) =>
      handleBeginPickup(
        skillingContext,
        actionCtx.execution,
        payload,
        actionCtx.tick,
        actionCtx.serverTime,
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
    persistenceMetrics,
    sessionLeasing,
    sessionStore,
    worldId,
    leaseDurationMs,
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
    // Atomic economy commits only when the adapter supports them; otherwise the bank falls back to
    // the standalone audit-persist path (see recordEconomicMove).
    ...(saveQueue.supportsEconomy
      ? {
          economyCommit: (
            entityId: EntityId,
            ledger: Parameters<typeof saveQueue.markEconomyCommit>[1],
            idempotencyKey: string,
            tick: number,
            serverTime: number,
          ) => saveQueue.markEconomyCommit(entityId, ledger, idempotencyKey, tick, serverTime),
        }
      : {}),
    nooks: deps.nooks,
    footprintResolver: npcFootprintResolver({ world, registries }),
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
    map,
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

  tickLoop.registerPhase(TickPhase.Interruptions, ({ tick }) => {
    const blockedOwners = new Set<EntityId>();
    const statusEffectRegistry = registries.statusEffect;
    for (const [entityId, _player] of world.componentEntries("player")) {
      // Blocked by dialogue modal
      if (world.getComponent(entityId, "dialogue")) {
        blockedOwners.add(entityId);
      }
      // Blocked by movement freeze/stun
      const movement = world.getComponent(entityId, "movement");
      if (
        movement &&
        movement.blockedUntilTick !== undefined &&
        movement.blockedUntilTick >= tick
      ) {
        blockedOwners.add(entityId);
      }
      // Blocked by active status effect (freeze/stun)
      const statusEffects = world.getComponent(entityId, "statusEffects");
      if (statusEffects) {
        for (const effect of statusEffects.effects) {
          const def = statusEffectRegistry.get(effect.statusEffectId);
          if (def && (def.id === "freeze" || def.id === "stun") && effect.remainingTicks > 0) {
            blockedOwners.add(entityId);
            break;
          }
        }
      }
    }
    if (blockedOwners.size > 0) {
      actionQueue.setBlockedOwners(blockedOwners);
      // Interrupt weak actions for blocked owners
      for (const owner of blockedOwners) {
        actionQueue.interrupt(owner, InterruptGroup.Skilling);
        actionQueue.interrupt(owner, InterruptGroup.Combat);
        actionQueue.interrupt(owner, InterruptGroup.Dialogue);
        actionQueue.interrupt(owner, InterruptGroup.Interface);
      }
    } else {
      actionQueue.clearBlockedOwners();
    }
  });

  tickLoop.registerPhase(TickPhase.ActionQueueTimers, ({ tick, serverTime }) => {
    const executions = actionQueue.advanceTick();
    actionQueue.clearBlockedOwners();
    actionExecutor.execute(executions, { tick, serverTime });
  });

  tickLoop.registerPhase(TickPhase.Movement, ({ tick, serverTime }) => {
    dispatchMovementPhase(dispatchContext, tick, npcFootprintResolver(npcContext));
    syncNpcOccupancy(npcContext);

    // Trail discovery and buffs for all players
    const trailContext = {
      world,
      deltas,
      registries,
    };
    const trails = Array.from(registries.trail.values());
    for (const [entityId, _player] of world.componentEntries("player")) {
      checkTrailDiscovery(trailContext, entityId, trails, serverTime);
      processTrailBuffs(trailContext, entityId, trails, tick);
    }

    // Nook discovery for all players
    const nooks = deps.nooks;
    if (nooks) {
      const nookContext = { world, deltas };
      for (const [entityId, _player] of world.componentEntries("player")) {
        checkNookDiscovery(nookContext, entityId, nooks, serverTime);
      }
    }
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
    processStatusEffectTick(statusEffectContext, tick);
  });

  tickLoop.registerPhase(TickPhase.DeathResolution, ({ tick, serverTime }) => {
    processDeathResolution(combatContext, tick, serverTime);
    processPlayerRespawn(combatContext, tick, serverTime);
    processGroundItemLifecycle(combatContext, tick);
    processGraveLifecycle(combatContext, tick, serverTime);
  });

  tickLoop.registerPhase(TickPhase.FoodPotionPrayerStatChanges, ({ tick }) => {
    processPrayerDrainPhase({ world, deltas, registries }, tick);
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

  tickLoop.registerPhase(TickPhase.SkillingProgress, ({ tick, serverTime }) => {
    processCharterExpiry({ world, deltas, registries, itemAudit }, tick, serverTime);
    processDeedExpiry({ world, deltas, registries, itemAudit }, tick, serverTime);
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
    chatSystem,
    actionQueue,
    logger,
    saveQueue,
    itemAudit,
    persistenceMetrics,
    sessionLeasing,
    sessionStore,
    worldId,
    leaseDurationMs,
  } = deps;
  const connectedSessions = new Set<string>();
  /** sessionId -> characterId for sessions currently holding a lease (for bulk release on shutdown). */
  const leasedSessions = new Map<string, string>();

  const persistenceMetricsSnapshot = (): PersistenceMetricsSnapshot =>
    persistenceMetrics.snapshot({
      currentTick: tickLoop.currentTick,
      pendingSaves: saveQueue.pendingCount,
      inFlightSaves: saveQueue.inFlightCount,
      oldestDirtyTick: saveQueue.oldestDirtyTick,
    });

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
    return tickLoop.runDueTicks(nowMs);
  };

  return {
    async connectSession(session) {
      if (sessionLeasing && sessionStore) {
        const lease = await sessionStore.acquire({
          characterId: session.characterId,
          worldId,
          sessionId: session.id,
          now: Date.now(),
          leaseDurationMs,
        });
        if (!lease.ok) {
          logger.warn("kernel", "Rejected connect; character already owned by a live session", {
            sessionId: session.id,
            characterId: session.characterId,
            heldBy: lease.heldBy.sessionId,
          });
          throw new Error("character_already_online");
        }
        if (lease.recoveredFromExpiredLease) {
          logger.info("kernel", "Recovered character from an expired session lease", {
            sessionId: session.id,
            characterId: session.characterId,
          });
        }
        leasedSessions.set(session.id, session.characterId);
      }
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
          interestManager.removePlayer(entityId);
          chatSystem.removeEntity(entityId);
          commandBuffer.removeConnection(session.id, entityId);
          saveQueue.discard(entityId);
          actionQueue.cancel(entityId, {});
        }
        if (sessionLeasing && sessionStore) {
          leasedSessions.delete(session.id);
          await sessionStore
            .release({ characterId: session.characterId, sessionId: session.id })
            .catch((error: unknown) => {
              logger.warn("kernel", "Failed to release session lease", {
                sessionId: session.id,
                characterId: session.characterId,
                message: error instanceof Error ? error.message : String(error),
              });
            });
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
      await Promise.all([
        saveQueue.flushAll(tickLoop.currentTick, tickLoop.currentServerTime),
        itemAudit.flush(),
      ]);
    },

    async releaseAllLeases() {
      if (!sessionStore) {
        return;
      }
      const entries = [...leasedSessions.entries()];
      leasedSessions.clear();
      await Promise.all(
        entries.map(([sessionId, characterId]) =>
          sessionStore.release({ characterId, sessionId }).catch((error: unknown) => {
            logger.warn("kernel", "Failed to release session lease during shutdown", {
              sessionId,
              characterId,
              message: error instanceof Error ? error.message : String(error),
            });
          }),
        ),
      );
    },

    recentItemTransactions(limit = 50) {
      return itemAudit.recent(limit);
    },

    persistenceMetrics() {
      return persistenceMetricsSnapshot();
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
        persistence: persistenceMetricsSnapshot(),
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
