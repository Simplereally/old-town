/**
 * Old Town migration runner (PostgresMigrationRunner equivalent).
 *
 * Applies the SQL migrations under `apps/server/migrations` in order, tracking applied versions in
 * a `schema_migrations` table so re-running is a no-op. Requires the `pg` package and a reachable
 * database — install with `bun add pg` in `apps/server` and start one with `bun run db:up`.
 *
 *   bun scripts/db-migrate.ts up        # apply all pending up migrations
 *   bun scripts/db-migrate.ts down      # roll back the most recent migration
 *   bun scripts/db-migrate.ts down all  # roll everything back
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve("apps/server/migrations");
const DEFAULT_DATABASE_URL = "postgres://old_town:old_town@localhost:5432/old_town";

interface PgClientLike {
  query(
    text: string,
    params?: readonly unknown[],
  ): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
}

async function main(): Promise<void> {
  const direction = process.argv[2] ?? "up";
  const scope = process.argv[3] ?? "one";
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

  const client = await connect(databaseUrl);
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    if (direction === "up") {
      await migrateUp(client);
    } else if (direction === "down") {
      await migrateDown(client, scope === "all");
    } else {
      throw new Error(`Unknown direction "${direction}" (expected up|down)`);
    }
  } finally {
    await client.end();
  }
}

async function migrateUp(client: PgClientLike): Promise<void> {
  const [applied, migrations] = await Promise.all([
    appliedVersions(client),
    listMigrations("up"),
  ]);
  let count = 0;
  for (const { version, file } of migrations) {
    if (applied.has(version)) {
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`[db-migrate] applying ${file}`);
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
    count += 1;
  }
  console.log(
    count === 0 ? "[db-migrate] already up to date" : `[db-migrate] applied ${count} migration(s)`,
  );
}

async function migrateDown(client: PgClientLike, all: boolean): Promise<void> {
  const [applied, migrations] = await Promise.all([
    appliedVersions(client),
    listMigrations("down"),
  ]);
  migrations.reverse();
  let count = 0;
  for (const { version, file } of migrations) {
    if (!applied.has(version)) {
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`[db-migrate] rolling back ${file}`);
    await client.query(sql);
    await client.query("DELETE FROM schema_migrations WHERE version = $1", [version]);
    count += 1;
    if (!all) {
      break;
    }
  }
  console.log(`[db-migrate] rolled back ${count} migration(s)`);
}

async function appliedVersions(client: PgClientLike): Promise<Set<string>> {
  const result = await client.query("SELECT version FROM schema_migrations");
  return new Set(result.rows.map((row) => String(row.version)));
}

async function listMigrations(
  direction: "up" | "down",
): Promise<Array<{ version: string; file: string }>> {
  const suffix = `.${direction}.sql`;
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((file) => file.endsWith(suffix))
    .sort()
    .map((file) => ({ version: file.slice(0, file.length - suffix.length), file }));
}

async function connect(databaseUrl: string): Promise<PgClientLike> {
  const specifier: string = ["p", "g"].join("");
  let pg: {
    Client: new (config: {
      connectionString: string;
    }) => PgClientLike & { connect(): Promise<void> };
  };
  try {
    pg = (await import(specifier)) as never;
  } catch {
    throw new Error('The "pg" package is required. Run `bun add pg` in apps/server.');
  }
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

main().catch((error: unknown) => {
  console.error("[db-migrate] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
