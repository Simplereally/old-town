/**
 * Old Town authoritative game server.
 *
 * Boots with content validation, starts a lightweight HTTP server for health checks,
 * wires the simulation kernel, and starts the WebSocket transport. Graceful shutdown
 * stops the tick loop and closes sockets.
 */
import type { Server } from "node:http";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { GAME_TICK_MS } from "@old-town/shared";
import { type BootContentResult, loadContent } from "./content-loader";
import { loadRuntimeConfig } from "./env";
import { createLogger } from "./logger";
import { createWebSocketTransport, type WebSocketTransport } from "./net/websocket-transport";
import { createPersistenceAdapter } from "./persistence";
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
  const logger = createLogger("server", config.logJson, config.debug);

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

  const persistence = createPersistenceAdapter(config.persistence);
  logger.info("boot", "Persistence configured", {
    enabled: persistence.enabled,
    kind: persistence.kind,
  });

  // --- Create simulation kernel ----------------------------------------------------
  const kernel = createSimulationKernel({
    registries: content.registries,
    logger,
    persistence,
    lazySaveIntervalTicks: config.persistence.lazySaveIntervalTicks,
    startServerTime: Date.now(),
  });

  // --- HTTP server (health + readiness + content) -----------------------------------
  const serializedContent = JSON.stringify(serializeContentForClient(content.registries));

  const httpServer = createServer((req, res) => {
    const url = req.url ? new URL(req.url, "http://old-town.local") : undefined;
    if (url?.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tickMs: config.tickMs }));
      return;
    }
    if (url?.pathname === "/ready" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ready", content: true }));
      return;
    }
    if (url?.pathname === "/api/content" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      });
      res.end(serializedContent);
      return;
    }
    if (url?.pathname === "/debug/item-audit" && req.method === "GET") {
      const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(200, Math.floor(requestedLimit)))
        : 50;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ events: kernel.recentItemTransactions(limit) }));
      return;
    }
    if (url?.pathname === "/debug/stats" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(kernel.stats()));
      return;
    }
    // Static file serving for client build
    if (req.method === "GET") {
      const staticPath = resolve("apps/client/dist", "." + (url?.pathname ?? "/"));
      if (existsSync(staticPath) && statSync(staticPath).isFile()) {
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".ico": "image/x-icon",
        };
        const ext = extname(staticPath).toLowerCase();
        res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
        res.end(readFileSync(staticPath));
        return;
      }
      if (url?.pathname === "/" || !extname(url?.pathname ?? "")) {
        const fallback = resolve("apps/client/dist", "index.html");
        if (existsSync(fallback)) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(readFileSync(fallback));
          return;
        }
      }
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

  httpServer.listen(config.port, config.host, () => {
    logger.info("http", `Server listening on ${config.host}:${config.port}`, { port: config.port, host: config.host });
  });

  // --- Tick loop timer --------------------------------------------------------------
  const tickTimer = setInterval(() => {
    kernel.runDueTicks(Date.now());
  }, GAME_TICK_MS);

  // --- Graceful shutdown ------------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    logger.info("shutdown", "Graceful shutdown initiated");
    clearInterval(tickTimer);
    await kernel.flushPersistence();
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
    dialogue: Object.fromEntries(registries.dialogue),
  };
}
