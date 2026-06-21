/**
 * Minimal SQL client port.
 *
 * The persistence adapter and repositories speak this small interface so the rest of the
 * server never imports a concrete database driver. Production wires {@link createPgSqlClient}
 * (node-postgres `pg`); tests wire an in-memory fake. Game systems never see SQL — they speak
 * game concepts through `PersistenceAdapter` / the stores, and this layer enforces DB mechanics.
 */

export type SqlValue =
  | string
  | number
  | boolean
  | null
  | Date
  | Record<string, unknown>
  | readonly SqlValue[]
  | undefined;

export type SqlRow = Record<string, unknown>;

export interface SqlQueryResult<Row extends SqlRow = SqlRow> {
  readonly rows: readonly Row[];
  /** Number of rows the statement affected (INSERT/UPDATE/DELETE). */
  readonly rowCount: number;
}

export interface SqlClient {
  /** Run a parameterized statement. Params use `$1`, `$2`, … placeholders. */
  query<Row extends SqlRow = SqlRow>(
    text: string,
    params?: readonly SqlValue[],
  ): Promise<SqlQueryResult<Row>>;
  /**
   * Run `fn` inside a single transaction. The client passed to `fn` runs every statement on
   * the same connection; throwing rolls the whole transaction back.
   */
  transaction<T>(fn: (tx: SqlClient) => Promise<T>): Promise<T>;
  /** Release pooled connections. Safe to call more than once. */
  close(): Promise<void>;
}
