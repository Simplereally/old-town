import type { Logger } from "../logger";
import {
  DisabledPersistenceAdapter,
  JsonFilePersistenceAdapter,
  MemoryPersistenceAdapter,
  type PersistenceAdapter,
  PersistenceConfigError,
} from "./adapter";
import { createPgSqlClient, PostgresPersistenceAdapter } from "./postgres";
import type { SqlClient } from "./postgres/sql-client";

/**
 * Selectable persistence drivers (subsystem items 2-4):
 * - `postgres`  — default local/dev/prod path (durable, versioned, leased).
 * - `memory`    — tests only (fast, ephemeral).
 * - `json_file` — deprecated; debug export / tiny sandbox only.
 * - `disabled`  — explicit no-save sandbox.
 */
export type PersistenceDriver = "disabled" | "memory" | "json_file" | "postgres";

export interface PersistenceAdapterConfig {
  /** Explicit driver. When omitted, falls back to the legacy `enabled` flag, then to postgres. */
  readonly driver?: PersistenceDriver;
  /** Legacy toggle: `false` → disabled, `true` → json_file. Superseded by `driver`. */
  readonly enabled?: boolean;
  readonly filePath?: string;
  readonly databaseUrl?: string | undefined;
  readonly worldId?: string;
  readonly contentVersion?: number;
  /** Pre-built SQL client (tests / shared pool). When set, postgres is created synchronously. */
  readonly sqlClient?: SqlClient;
  /** Max pooled Postgres connections. */
  readonly pgMaxConnections?: number;
  /** Pool connect timeout in ms. */
  readonly pgConnectionTimeoutMillis?: number;
  /** Pool idle connection timeout in ms. */
  readonly pgIdleTimeoutMillis?: number;
  /** Postgres statement_timeout in ms (per query). */
  readonly pgStatementTimeoutMs?: number;
  /** Postgres lock_timeout in ms (row locks). */
  readonly pgLockTimeoutMs?: number;
  /** Postgres idle_in_transaction_session_timeout in ms. */
  readonly pgIdleInTransactionSessionTimeoutMs?: number;
  readonly logger?: Pick<Logger, "debug" | "warn" | "info">;
}

/** Resolve the effective driver, honouring the legacy `enabled` flag for backward compatibility. */
export function resolvePersistenceDriver(config: PersistenceAdapterConfig): PersistenceDriver {
  if (config.driver) {
    return config.driver;
  }
  if (config.enabled === false) {
    return "disabled";
  }
  if (config.enabled === true) {
    return "json_file";
  }
  // Postgres is the default development persistence (item 2).
  return "postgres";
}

/**
 * Build a persistence adapter synchronously. Handles disabled/memory/json_file, and postgres only
 * when a {@link SqlClient} is injected. The postgres connection-string path needs async setup
 * (lazy driver import + pool) — use {@link createPersistenceAdapterAsync} for that.
 */
export function createPersistenceAdapter(config: PersistenceAdapterConfig): PersistenceAdapter {
  const driver = resolvePersistenceDriver(config);
  switch (driver) {
    case "disabled":
      return new DisabledPersistenceAdapter();
    case "memory":
      return new MemoryPersistenceAdapter();
    case "json_file":
      return createJsonFileAdapter(config);
    case "postgres": {
      if (!config.sqlClient) {
        throw new PersistenceConfigError(
          "Postgres driver requires a connection string; use createPersistenceAdapterAsync()",
        );
      }
      return new PostgresPersistenceAdapter({
        client: config.sqlClient,
        ...(config.worldId !== undefined ? { worldId: config.worldId } : {}),
        ...(config.contentVersion !== undefined ? { contentVersion: config.contentVersion } : {}),
        ...(config.logger ? { logger: config.logger } : {}),
      });
    }
  }
}

/**
 * Build a persistence adapter, connecting to Postgres when that driver is selected. The pool
 * connects lazily, so this resolves even if the database is briefly unreachable — call
 * {@link PersistenceAdapter.ping} afterwards to confirm reachability.
 */
export async function createPersistenceAdapterAsync(
  config: PersistenceAdapterConfig,
): Promise<PersistenceAdapter> {
  const driver = resolvePersistenceDriver(config);
  if (driver !== "postgres" || config.sqlClient) {
    return createPersistenceAdapter(config);
  }
  if (!config.databaseUrl) {
    throw new PersistenceConfigError(
      "Postgres driver requires DATABASE_URL (or a sqlClient) to be configured",
    );
  }
  const client = await createPgSqlClient({
    connectionString: config.databaseUrl,
    ...(config.pgMaxConnections !== undefined ? { maxConnections: config.pgMaxConnections } : {}),
    ...(config.pgConnectionTimeoutMillis !== undefined
      ? { connectionTimeoutMillis: config.pgConnectionTimeoutMillis }
      : {}),
    ...(config.pgIdleTimeoutMillis !== undefined
      ? { idleTimeoutMillis: config.pgIdleTimeoutMillis }
      : {}),
    ...(config.pgStatementTimeoutMs !== undefined
      ? { statementTimeoutMs: config.pgStatementTimeoutMs }
      : {}),
    ...(config.pgLockTimeoutMs !== undefined ? { lockTimeoutMs: config.pgLockTimeoutMs } : {}),
    ...(config.pgIdleInTransactionSessionTimeoutMs !== undefined
      ? { idleInTransactionSessionTimeoutMs: config.pgIdleInTransactionSessionTimeoutMs }
      : {}),
  });
  return new PostgresPersistenceAdapter({
    client,
    ...(config.worldId !== undefined ? { worldId: config.worldId } : {}),
    ...(config.contentVersion !== undefined ? { contentVersion: config.contentVersion } : {}),
    ...(config.logger ? { logger: config.logger } : {}),
  });
}

function createJsonFileAdapter(config: PersistenceAdapterConfig): PersistenceAdapter {
  if (!config.filePath) {
    throw new PersistenceConfigError("json_file driver requires a filePath");
  }
  config.logger?.warn?.(
    "persistence",
    "JSON-file persistence is deprecated for real development; use the postgres driver",
    { filePath: config.filePath },
  );
  return new JsonFilePersistenceAdapter(config.filePath);
}
