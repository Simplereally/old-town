/**
 * Old Town authoritative game server.
 *
 * Boots with content validation, starts a lightweight HTTP server for health checks,
 * and prepares the tick loop and ECS state (added in later stories). Graceful shutdown
 * stops the tick loop and closes sockets when those are wired in.
 */
import type { Server } from "node:http";
import { createServer } from "node:http";
import { type BootContentResult, loadContent } from "./content-loader";
import { loadRuntimeConfig } from "./env";
import { createLogger } from "./logger";

export interface GameServer {
  /** Stop the server and release all resources. */
  shutdown(): Promise<void>;
  /** The HTTP server instance (for tests). */
  httpServer: Server;
}

export async function startServer(): Promise<GameServer> {
  const config = loadRuntimeConfig();
  const logger = createLogger("server", config.logJson);

  logger.info("boot", "Old Town server booting", { port: config.port, tickMs: config.tickMs });

  // --- Load and validate content ----------------------------------------------------
  const content: BootContentResult = loadContent(config.contentDir);
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

  // --- HTTP server (health + readiness) --------------------------------------------
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
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  httpServer.listen(config.port, () => {
    logger.info("http", `Server listening on port ${config.port}`, { port: config.port });
  });

  // --- Graceful shutdown -----------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    logger.info("shutdown", "Graceful shutdown initiated");
    // Tick loop and sockets will be closed here when added in later stories.
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    logger.info("shutdown", "HTTP server closed");
  };

  return { shutdown, httpServer };
}
