/**
 * Old Town authoritative game server.
 *
 * Boots with content validation, starts a lightweight HTTP server for health checks,
 * wires the simulation kernel, and starts the WebSocket transport. Graceful shutdown
 * stops the tick loop and closes sockets.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import type { Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { GAME_TICK_MS, PROTOCOL_VERSION } from "@old-town/shared";
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

interface ClientBuildCompatibility {
  readonly ok: boolean;
  readonly reason?: string;
  readonly clientProtocolVersion?: number;
}

const CLIENT_DIST_DIR = resolve("apps/client/dist");
const CLIENT_BUILD_MANIFEST = resolve(CLIENT_DIST_DIR, "old-town-build.json");

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
  // The authoritative timeline is deterministic sim time: serverTime starts at 0
  // and advances exactly GAME_TICK_MS per tick, so `serverTime === tick * GAME_TICK_MS`
  // holds everywhere. The client renderer relies on this identity — snapshot
  // interpolation, projectile flight, and hitsplat fades all derive their timing
  // from `tick * GAME_TICK_MS`. Stamping serverTime from Date.now() (epoch) silently
  // breaks that identity and desyncs every time-based render layer, so we keep the
  // sim clock at 0 and drive the scheduler from wall-clock elapsed since boot.
  const simEpochMs = Date.now();
  const kernel = createSimulationKernel({
    registries: content.registries,
    logger,
    persistence,
    lazySaveIntervalTicks: config.persistence.lazySaveIntervalTicks,
  });

  // --- HTTP server (health + readiness + content) -----------------------------------
  const serializedContent = JSON.stringify(serializeContentForClient(content.registries));

  const httpServer = createServer((req, res) => {
    const url = req.url ? new URL(req.url, "http://old-town.local") : undefined;
    if (url?.pathname.startsWith("/api/") || url?.pathname.startsWith("/debug/")) {
      writeCorsHeaders(res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
    }
    if (url?.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", tickMs: config.tickMs, protocolVersion: PROTOCOL_VERSION }),
      );
      return;
    }
    if (url?.pathname === "/ready" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ready", content: true, protocolVersion: PROTOCOL_VERSION }),
      );
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
      const staticPath = resolve(CLIENT_DIST_DIR, `.${url?.pathname ?? "/"}`);
      if (existsSync(staticPath) && statSync(staticPath).isFile()) {
        const compatibility = readClientBuildCompatibility();
        if (!compatibility.ok) {
          writeClientBuildMismatch(res, compatibility);
          return;
        }
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
        const fallback = resolve(CLIENT_DIST_DIR, "index.html");
        if (existsSync(fallback)) {
          const compatibility = readClientBuildCompatibility();
          if (!compatibility.ok) {
            writeClientBuildMismatch(res, compatibility);
            return;
          }
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
    logger.info("http", `Server listening on ${config.host}:${config.port}`, {
      port: config.port,
      host: config.host,
    });
  });

  // --- Tick loop timer --------------------------------------------------------------
  // Drive the sim from wall-clock elapsed since boot so serverTime stays 0-based
  // (see the simEpochMs note above).
  //
  // Use a self-correcting scheduler that re-targets the absolute tick grid
  // (simEpochMs + n*GAME_TICK_MS) on every fire rather than `setInterval`.
  // Node reschedules `setInterval` relative to when each callback *finishes*, so
  // per-tick work — every system plus the periodic lazy-save serialization — is
  // added to the period and accumulates as steady drift. The loop then slips a
  // full tick behind every few seconds and runDueTicks emits a catch-up burst
  // (two deltas back-to-back). That bursty, periodic cadence is precisely what
  // makes client snapshot interpolation stutter on an endless loop. Targeting
  // the grid keeps emission aligned to real time regardless of per-tick cost;
  // runDueTicks still absorbs any genuine overrun without drifting.
  let tickTimer: ReturnType<typeof setTimeout> | undefined;
  let tickLoopStopped = false;
  const scheduleNextTick = (): void => {
    if (tickLoopStopped) return;
    const elapsed = Date.now() - simEpochMs;
    const nextSlotMs = Math.floor(elapsed / GAME_TICK_MS) * GAME_TICK_MS + GAME_TICK_MS;
    const delayMs = Math.max(0, nextSlotMs - elapsed);
    tickTimer = setTimeout(() => {
      kernel.runDueTicks(Date.now() - simEpochMs);
      scheduleNextTick();
    }, delayMs);
  };
  scheduleNextTick();

  // --- Graceful shutdown ------------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    logger.info("shutdown", "Graceful shutdown initiated");
    tickLoopStopped = true;
    if (tickTimer) clearTimeout(tickTimer);
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
    contract: Object.fromEntries(registries.contract),
    material: Object.fromEntries(registries.material),
  };
}

function writeCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readClientBuildCompatibility(): ClientBuildCompatibility {
  if (!existsSync(CLIENT_BUILD_MANIFEST)) {
    return { ok: false, reason: "missing_client_build_manifest" };
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(CLIENT_BUILD_MANIFEST, "utf8"));
  } catch {
    return { ok: false, reason: "invalid_client_build_manifest" };
  }

  const clientProtocolVersion =
    typeof manifest === "object" && manifest !== null
      ? (manifest as { protocolVersion?: unknown }).protocolVersion
      : undefined;
  if (typeof clientProtocolVersion !== "number") {
    return { ok: false, reason: "invalid_client_protocol_version" };
  }
  if (clientProtocolVersion !== PROTOCOL_VERSION) {
    return {
      ok: false,
      reason: "client_server_protocol_mismatch",
      clientProtocolVersion,
    };
  }

  return { ok: true, clientProtocolVersion };
}

function writeClientBuildMismatch(
  res: ServerResponse,
  compatibility: ClientBuildCompatibility,
): void {
  res.writeHead(503, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(
    JSON.stringify({
      error: "client_build_not_compatible",
      reason: compatibility.reason ?? "unknown",
      clientProtocolVersion: compatibility.clientProtocolVersion,
      serverProtocolVersion: PROTOCOL_VERSION,
    }),
  );
}
