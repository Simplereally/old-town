/**
 * Old Town authoritative game server.
 *
 * Boots with content validation, starts a lightweight HTTP server for health checks,
 * and prepares the tick loop and ECS state (added in later stories). Graceful shutdown
 * stops the tick loop and closes sockets when those are wired in.
 */
import type { Server } from "node:http";
import { createServer } from "node:http";
import { GAME_TICK_MS } from "@old-town/shared";
import { type BootContentResult, loadContent } from "./content-loader";
import { type World, createWorld } from "./ecs/world";
import { loadRuntimeConfig } from "./env";
import { handleItemIntent } from "./items/item-actions";
import { createLogger } from "./logger";
import { CommandRouter } from "./net/command-router";
import { DeltaBroadcaster } from "./net/delta-broadcaster";
import { DevSessionManager } from "./net/dev-session";
import { InterestManager } from "./net/interest-manager";
import { type WebSocketTransport, createWebSocketTransport } from "./net/websocket-transport";
import { CommandBuffer, IntentKind } from "./sim/command-buffer";
import { DeltaAccumulator } from "./sim/delta-accumulator";
import { TickLoop, TickPhase } from "./sim/tick-loop";
import { ChatSystem } from "./systems/chat-system";
import { handleMoveIntent, processMovementPhase } from "./systems/movement-system";
import { CollisionMap } from "./world/collision";
import { loadAllRegionMapsIntoWorld } from "./world/region-loader";
import { type RuntimeMap, createRuntimeMap } from "./world/runtime-map";

export interface GameServer {
  /** Stop the server and release all resources. */
  shutdown(): Promise<void>;
  /** The HTTP server instance (for tests). */
  httpServer: Server;
  /** Authoritative ECS state. */
  world: World;
  /** Runtime terrain, trigger, and region state. */
  map: RuntimeMap;
  /** WebSocket transport shell. */
  transport: WebSocketTransport;
  /** Deterministic simulation tick loop. */
  tickLoop: TickLoop;
}

export async function startServer(): Promise<GameServer> {
  const config = loadRuntimeConfig();
  const logger = createLogger("server", config.logJson);

  logger.info("boot", "Old Town server booting", { port: config.port, tickMs: config.tickMs });

  // --- Load and validate content ----------------------------------------------------
  const content: BootContentResult = await loadContent(config.contentDir);
  if (!content.ok || content.issues.length > 0) {
    for (const issue of content.issues) {
      const where = issue.path ?? "(unknown)";
      const id = issue.id ? ` [${issue.id}]` : "";
      logger.error("content", `Content issue: ${where}${id}: ${issue.message}`);
    }
    logger.error("boot", "Server startup aborted — content validation failed");
    process.exit(1);
  }

  const registryCounts = Object.entries(content.registries)
    .filter(([, r]) => r.size > 0)
    .map(([k, r]) => `${k}=${r.size}`)
    .join(", ");
  logger.info("boot", "Content loaded", { registries: registryCounts });

  const world = createWorld();
  const map = createRuntimeMap();
  const loadedRegions = loadAllRegionMapsIntoWorld(world, map, content.registries);
  const devSessions = new DevSessionManager(world, map, content.registries);
  const collision = new CollisionMap(map);
  const commandBuffer = new CommandBuffer();
  const deltas = new DeltaAccumulator();
  const interestManager = new InterestManager();
  const tickLoop = new TickLoop({ logger, startServerTime: Date.now() });
  const chatSystem = new ChatSystem();
  const commandRouter = new CommandRouter({
    commandBuffer,
    getEntityId: (session) => devSessions.getEntityId(session),
    getCurrentTick: () => tickLoop.currentTick,
  });
  const netRuntime = {
    deltaBroadcaster: undefined as DeltaBroadcaster | undefined,
  };

  tickLoop.registerPhase(TickPhase.InputClose, ({ tick, serverTime }) => {
    const commands = commandRouter.consumeTick(tick);
    for (const group of commands.groups) {
      for (const intent of group.intents) {
        if (intent.kind === IntentKind.Move) {
          handleMoveIntent({ world, collision, deltas }, group.ownerEntityId, {
            dest: intent.payload.dest,
          });
        } else if (intent.kind === IntentKind.Chat) {
          chatSystem.submit(
            { world, deltas },
            group.ownerEntityId,
            { text: intent.payload.text },
            tick,
            serverTime,
          );
        } else if (intent.kind === IntentKind.Item) {
          handleItemIntent(
            { world, deltas, items: content.registries.item },
            group.ownerEntityId,
            intent.payload,
            serverTime,
          );
        }
      }
    }
  });
  tickLoop.registerPhase(TickPhase.Movement, ({ tick }) => {
    processMovementPhase({ world, collision, deltas }, tick);
  });
  tickLoop.registerPhase(TickPhase.SnapshotDeltaBuild, ({ tick, serverTime }) => {
    netRuntime.deltaBroadcaster?.broadcastTick(tick, serverTime);
  });
  logger.info("world", "Regions loaded", {
    regions: loadedRegions.length,
    tiles: map.tiles.size,
    objects: world.stores.object.size,
    npcs: world.stores.npc.size,
    groundItems: world.stores.groundItem.size,
    resourceNodes: world.stores.resourceNode.size,
  });

  // --- HTTP server (health + readiness) --------------------------------------------
  const serializedContent = JSON.stringify(serializeContentForClient(content.registries));

  const httpServer = createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tickMs: config.tickMs }));
      return;
    }
    if (req.url === "/ready" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ready", content: true }));
      return;
    }
    if (req.url === "/api/content" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      });
      res.end(serializedContent);
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  const transport = createWebSocketTransport({
    httpServer,
    logger,
    getFullState: (session) => {
      const fullState = devSessions.bootstrap(
        session,
        tickLoop.currentTick,
        tickLoop.currentServerTime,
      );
      netRuntime.deltaBroadcaster?.primeSession(session, fullState.entities);
      const entityById = new Map(fullState.entities.map((e) => [e.entityId, e]));
      const selfSpawn = entityById.get(fullState.selfEntityId);
      if (selfSpawn) {
        deltas.markEntityAdd(selfSpawn);
      }
      return fullState;
    },
    onCommand: (session, command) => commandRouter.route(session, command),
    onClose: (session) => {
      const entityId = devSessions.getEntityId(session);
      if (entityId !== undefined) {
        deltas.markEntityRemove(entityId);
      }
      devSessions.remove(session);
    },
  });
  netRuntime.deltaBroadcaster = new DeltaBroadcaster({
    world,
    deltas,
    interestManager,
    transport,
    getEntityId: (session) => devSessions.getEntityId(session),
  });

  httpServer.listen(config.port, () => {
    logger.info("http", `Server listening on port ${config.port}`, { port: config.port });
  });

  const tickTimer = setInterval(() => {
    tickLoop.runDueTicks(Date.now());
  }, GAME_TICK_MS);

  // --- Graceful shutdown -----------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    logger.info("shutdown", "Graceful shutdown initiated");
    clearInterval(tickTimer);
    await Promise.all([
      transport.close(),
      new Promise<void>((resolve) => httpServer.close(() => resolve())),
    ]);
    logger.info("shutdown", "HTTP server closed");
  };

  return { shutdown, httpServer, world, map, transport, tickLoop };
}

function serializeContentForClient(registries: BootContentResult["registries"]): unknown {
  return {
    item: Object.fromEntries(registries.item),
    npc: Object.fromEntries(registries.npc),
    object: Object.fromEntries(registries.object),
    skill: Object.fromEntries(registries.skill),
    resourceNode: Object.fromEntries(registries.resourceNode),
    spell: Object.fromEntries(registries.spell),
    dropTable: Object.fromEntries(registries.dropTable),
    quest: Object.fromEntries(registries.quest),
    dialogue: Object.fromEntries(registries.dialogue),
    regionMap: Object.fromEntries(registries.regionMap),
    material: Object.fromEntries(registries.material),
    animation: Object.fromEntries(registries.animation),
  };
}
