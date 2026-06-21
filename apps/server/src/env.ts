/**
 * Runtime environment loading. Reads `.env` overrides from the server app directory,
 * falls back to `.env.example`, then uses `process.env` for defaults.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GAME_TICK_MS } from "@old-town/shared";
import type { PersistenceDriver } from "./persistence/factory";

export interface RuntimeConfig {
  /** Port the WebSocket server listens on. */
  port: number;
  /** Host the server binds to. */
  host: string;
  /** Server simulation tick length in milliseconds (gameplay truth; do not change lightly). */
  tickMs: number;
  /** Content directory path relative to project root. */
  contentDir: string;
  /** Persistence subsystem configuration. */
  persistence: {
    /** Selected driver. Defaults to postgres; legacy `PERSISTENCE_ENABLED` is still honoured. */
    readonly driver: PersistenceDriver;
    /** PostgreSQL connection string (required when driver is postgres). */
    readonly databaseUrl: string | undefined;
    /** Logical world id stamped onto saves and leases. */
    readonly worldId: string;
    /** Content build version stamped onto saves / ledger rows for later migration. */
    readonly contentVersion: number;
    /** Deprecated JSON-file path (debug export / sandbox only). */
    readonly filePath: string;
    readonly lazySaveIntervalTicks: number;
    /** Enforce the one-live-owner-per-character lease on connect (items 5 & 7). */
    readonly sessionLeasing: boolean;
    /**
     * Allow falling back to the no-save (disabled) adapter when the configured driver fails to
     * start. UNSAFE: only `dev:nosave` sets this. Otherwise startup hard-fails (item 1).
     */
    readonly unsafeAllowNoSave: boolean;
    /** Max time to wait for the persistence flush during graceful shutdown. */
    readonly shutdownFlushMs: number;
    /** Max pooled Postgres connections. */
    readonly pgMaxConnections: number;
    /** Pool connect timeout in ms. */
    readonly pgConnectionTimeoutMillis: number;
    /** Pool idle connection timeout in ms. */
    readonly pgIdleTimeoutMillis: number;
    /** Postgres statement_timeout in ms (per query). */
    readonly pgStatementTimeoutMs: number;
    /** Postgres lock_timeout in ms (row locks). */
    readonly pgLockTimeoutMs: number;
    /** Postgres idle_in_transaction_session_timeout in ms. */
    readonly pgIdleInTransactionSessionTimeoutMs: number;
  };
  /** Whether to emit debug logs and extra runtime checks. */
  debug: boolean;
  /** Whether to log to console as JSON (structured) or plain text (human-readable). */
  logJson: boolean;
}

const PERSISTENCE_DRIVERS: readonly PersistenceDriver[] = [
  "disabled",
  "memory",
  "json_file",
  "postgres",
];

function resolvePersistenceDriverEnv(env: Map<string, string>): PersistenceDriver {
  const raw = env.get("PERSISTENCE_DRIVER")?.trim().toLowerCase();
  if (raw && (PERSISTENCE_DRIVERS as readonly string[]).includes(raw)) {
    return raw as PersistenceDriver;
  }
  // Legacy fallback: PERSISTENCE_ENABLED=false → disabled, true → json_file.
  const legacy = env.get("PERSISTENCE_ENABLED");
  if (legacy !== undefined) {
    return legacy === "true" || legacy === "1" ? "json_file" : "disabled";
  }
  // Postgres is the default development persistence (subsystem item 2).
  return "postgres";
}

function parseIntEnv(value: string | undefined, defaultValue: number): number {
  const parsed = value === undefined ? Number.NaN : Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function parseBoolEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

function loadEnvFile(path: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      map.set(key, value);
    }
  } catch {
    // File missing is fine — we will fall back to process.env or defaults.
  }
  return map;
}

const builtEnv = ((): Map<string, string> => {
  const env = new Map<string, string>();
  // Load .env.example first as defaults.
  const example = loadEnvFile(resolve(import.meta.dirname, "../.env.example"));
  for (const [k, v] of example) {
    env.set(k, v);
  }
  // Allow .env overrides.
  const local = loadEnvFile(resolve(import.meta.dirname, "../.env"));
  for (const [k, v] of local) {
    env.set(k, v);
  }
  // Process.env wins over everything.
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) {
      env.set(k, v);
    }
  }
  return env;
})();

export function loadRuntimeConfig(): RuntimeConfig {
  return {
    port: parseIntEnv(builtEnv.get("PORT"), 8080),
    host: builtEnv.get("HOST") ?? "0.0.0.0",
    tickMs: parseIntEnv(builtEnv.get("TICK_MS"), GAME_TICK_MS),
    contentDir: builtEnv.get("CONTENT_DIR") ?? "content",
    persistence: {
      driver: resolvePersistenceDriverEnv(builtEnv),
      databaseUrl: builtEnv.get("DATABASE_URL"),
      worldId: builtEnv.get("WORLD_ID") ?? "old_town_dev",
      contentVersion: parseIntEnv(builtEnv.get("CONTENT_VERSION"), 1),
      filePath: builtEnv.get("PERSISTENCE_FILE") ?? ".old-town/dev-persistence.json",
      lazySaveIntervalTicks: parseIntEnv(builtEnv.get("PERSISTENCE_LAZY_SAVE_TICKS"), 10),
      sessionLeasing: parseBoolEnv(builtEnv.get("PERSISTENCE_SESSION_LEASING"), true),
      unsafeAllowNoSave: parseBoolEnv(builtEnv.get("PERSISTENCE_UNSAFE_ALLOW_NOSAVE"), false),
      shutdownFlushMs: parseIntEnv(builtEnv.get("PERSISTENCE_SHUTDOWN_FLUSH_MS"), 5_000),
      pgMaxConnections: parseIntEnv(builtEnv.get("PG_MAX_CONNECTIONS"), 10),
      pgConnectionTimeoutMillis: parseIntEnv(builtEnv.get("PG_CONNECTION_TIMEOUT_MS"), 2_000),
      pgIdleTimeoutMillis: parseIntEnv(builtEnv.get("PG_IDLE_TIMEOUT_MS"), 30_000),
      pgStatementTimeoutMs: parseIntEnv(builtEnv.get("PG_STATEMENT_TIMEOUT_MS"), 5_000),
      pgLockTimeoutMs: parseIntEnv(builtEnv.get("PG_LOCK_TIMEOUT_MS"), 1_000),
      pgIdleInTransactionSessionTimeoutMs: parseIntEnv(
        builtEnv.get("PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS"),
        5_000,
      ),
    },
    debug: parseBoolEnv(builtEnv.get("DEBUG"), false),
    logJson: parseBoolEnv(builtEnv.get("LOG_JSON"), false),
  };
}
