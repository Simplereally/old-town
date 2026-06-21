/**
 * Production {@link SqlClient} backed by node-postgres (`pg`).
 *
 * `pg` is imported lazily inside the factory so the dependency is only required when the Postgres
 * driver is actually selected at runtime — tests and the offline POC never load it. Add `pg` to
 * `apps/server` dependencies before running against a real database.
 */
import { PersistenceConfigError } from "../adapter";
import type { SqlClient, SqlQueryResult, SqlRow, SqlValue } from "./sql-client";

export interface PgSqlClientOptions {
  readonly connectionString: string;
  /** Max pooled connections. Defaults to 10. */
  readonly maxConnections?: number;
  /** Pool connect timeout in ms. Defaults to 2000. */
  readonly connectionTimeoutMillis?: number;
  /** Pool idle connection timeout in ms. Defaults to 30000. */
  readonly idleTimeoutMillis?: number;
  /** Postgres statement_timeout in ms (per query). Defaults to 5000. */
  readonly statementTimeoutMs?: number;
  /** Postgres lock_timeout in ms (row locks). Defaults to 1000. */
  readonly lockTimeoutMs?: number;
  /** Postgres idle_in_transaction_session_timeout in ms. Defaults to 5000. */
  readonly idleInTransactionSessionTimeoutMs?: number;
}

interface PgQueryable {
  query(
    text: string,
    params?: readonly unknown[],
  ): Promise<{ rows: SqlRow[]; rowCount: number | null }>;
}

interface PgPoolLike extends PgQueryable {
  on(event: "error", listener: (err: Error) => void): void;
  connect(): Promise<PgPoolClientLike>;
  end(): Promise<void>;
}

interface PgPoolClientLike extends PgQueryable {
  release(): void;
}

interface PgModule {
  Pool: new (config: {
    connectionString: string;
    max?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    options?: string;
  }) => PgPoolLike;
}

/**
 * Create a pooled Postgres client. The pool connects lazily on first query, so construction never
 * throws on an unreachable database — call {@link SqlClient.ping} to verify reachability at boot.
 *
 * Statement, lock, and idle-in-transaction timeouts are set per-connection via libpq `options` so
 * every checked-out connection enforces them without per-query `SET` overhead. A stuck lock or
 * slow query surfaces as a persistence error (not a silently hung pool slot).
 */
export async function createPgSqlClient(options: PgSqlClientOptions): Promise<SqlClient> {
  if (!options.connectionString) {
    throw new PersistenceConfigError("Postgres driver requires a non-empty connection string");
  }
  const pg = await loadPgModule();
  const statementTimeout = options.statementTimeoutMs ?? 5_000;
  const lockTimeout = options.lockTimeoutMs ?? 1_000;
  const idleInTxn = options.idleInTransactionSessionTimeoutMs ?? 5_000;
  const poolOptions = {
    connectionString: options.connectionString,
    ...(options.maxConnections !== undefined ? { max: options.maxConnections } : {}),
    ...(options.connectionTimeoutMillis !== undefined
      ? { connectionTimeoutMillis: options.connectionTimeoutMillis }
      : {}),
    ...(options.idleTimeoutMillis !== undefined
      ? { idleTimeoutMillis: options.idleTimeoutMillis }
      : {}),
    // libpq options string — applied to every backend connection at startup.
    options: `-c statement_timeout=${statementTimeout} -c lock_timeout=${lockTimeout} -c idle_in_transaction_session_timeout=${idleInTxn}`,
  };
  const pool = new pg.Pool(poolOptions);
  // Surface pool-level errors (e.g. idle connection lost) so they are not swallowed.
  pool.on("error", (err: Error) => {
    // Re-throw on the next tick so the process does not silently lose a connection.
    // The pool itself remains usable; this is observability, not a fatal event.
    console.error(`[pg] idle pool error: ${err.message}`);
  });
  return new PgSqlClient(pool, pool);
}

class PgSqlClient implements SqlClient {
  constructor(
    private readonly queryable: PgQueryable,
    private readonly pool?: PgPoolLike,
  ) {}

  async query<Row extends SqlRow = SqlRow>(
    text: string,
    params: readonly SqlValue[] = [],
  ): Promise<SqlQueryResult<Row>> {
    const result = await this.queryable.query(text, params.map(normalizeParam));
    const rows = result.rows ?? [];
    return { rows: rows as Row[], rowCount: result.rowCount ?? rows.length };
  }

  async transaction<T>(fn: (tx: SqlClient) => Promise<T>): Promise<T> {
    const pool = this.pool ?? (this.queryable as PgPoolLike);
    const connection = await pool.connect();
    const scoped = new PgSqlClient(connection);
    try {
      await connection.query("BEGIN");
      const result = await fn(scoped);
      await connection.query("COMMIT");
      return result;
    } catch (error) {
      await connection.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }
}

/** JSONB params are sent as objects; `pg` serialises them. Everything else passes through. */
function normalizeParam(value: SqlValue): unknown {
  return value === undefined ? null : value;
}

async function loadPgModule(): Promise<PgModule> {
  // `pg` is a real dependency but imported lazily so it is only loaded when the Postgres driver is
  // actually selected (tests and the offline POC never pull it in).
  try {
    const mod = (await import("pg")) as unknown as { default?: PgModule } & PgModule;
    return mod.default ?? mod;
  } catch {
    throw new PersistenceConfigError(
      'Failed to load the "pg" package. Run `bun install` to install dependencies.',
    );
  }
}
