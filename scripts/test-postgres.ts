/**
 * Runs the real-PostgreSQL integration suite (`*.pg-integration.test.ts`).
 *
 * Sets OLD_TOWN_TEST_DATABASE_URL (defaulting to the docker-compose database) so the otherwise
 * skipped suite runs. Requires `bun run db:up` first.
 *
 *   bun run db:up && bun run db:migrate && bun run test:postgres
 */
import { spawn } from "node:child_process";

const databaseUrl =
  process.env.OLD_TOWN_TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://old_town:old_town@localhost:5432/old_town";

const child = spawn(process.execPath, ["x", "vitest", "run", "pg-integration"], {
  stdio: "inherit",
  env: { ...process.env, OLD_TOWN_TEST_DATABASE_URL: databaseUrl },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
