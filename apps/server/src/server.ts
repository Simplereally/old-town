/**
 * Old Town authoritative game server.
 *
 * Boots with content validation, starts a lightweight HTTP server for health checks,
 * wires the simulation kernel, and starts the WebSocket transport. Graceful shutdown
 * stops the tick loop and closes sockets.
 */
import type { Server } from "node:http";
import { createServer } from "node:http";
import { GAME_TICK_MS } from "@old-town/shared";
import { type BootContentResult, loadContent } from "./content-loader";
import { loadRuntimeConfig } from "./env";
import { createLogger } from "./logger";
import { createWebSocketTransport, type WebSocketTransport } from "./net/websocket-transport";
import { createSimulationKernel, type SimulationKernel } from "./sim/simulation-kernel";

export interface GameServer {
  /** Stop the server and release all resources. */
  shutdown(): Promise<void>;
  /** The HTTP server instance (for tests). */
  httpServer: Server;
  /** WebSocket transport shell. */
  transport: WebSocketTransport;
  /** The authoritative simulation kernel. */
  kernel: SimulationKernel;
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

  // --- Create simulation kernel ----------------------------------------------------
  const kernel = createSimulationKernel({
    registries: content.registries,
    logger,
    startServerTime: Date.now(),
  });

  // --- HTTP server (health + readiness + content) -----------------------------------
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

  // --- WebSocket transport ----------------------------------------------------------
  const transport = createWebSocketTransport({
    httpServer,
    logger,
    getFullState: (session) => kernel.connectSession(session),
    onCommand: (session, command) => kernel.routeCommand(session, command),
    onClose: (session) => kernel.disconnectSession(session),
  });

  kernel.attachDeltaTransport(transport);

  httpServer.listen(config.port, () => {
    logger.info("http", `Server listening on port ${config.port}`, { port: config.port });
  });

  // --- Tick loop timer --------------------------------------------------------------
  const tickTimer = setInterval(() => {
    kernel.runDueTicks(Date.now());
  }, GAME_TICK_MS);

  // --- Graceful shutdown ------------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    logger.info("shutdown", "Graceful shutdown initiated");
    clearInterval(tickTimer);
    await Promise.all([
      transport.close(),
      new Promise<void>((resolve) => httpServer.close(() => resolve())),
    ]);
    logger.info("shutdown", "HTTP server closed");
  };

  return { shutdown, httpServer, transport, kernel };
}

function serializeContentForClient(registries: BootContentResult["registries"]): unknown {
  return {
    item: Object.fromEntries(registries.item),
    npc: Object.fromEntries(registries.npc),
    object: Object.fromEntries(registries.object),
    skill: Object.fromEntries(registries.skill),
    spell: Object.fromEntries(registries.spell),
    quest: Object.fromEntries(registries.quest),
  };
}
