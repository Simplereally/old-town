/**
 * Starts the local POC stack: authoritative game server plus Vite client.
 *
 * Run with: `bun run dev`
 */
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const bun = process.execPath;
const clientDir = join(root, "apps", "client");
// Spawn Vite directly via `node <vite/bin/vite.js>` instead of `bun run --filter … dev`.
// The latter wraps Vite in an intermediate `bun(client)` process, making the tree
// `bun(dev) → bun(client) → node(vite)`. On Ctrl+C that intermediate dies first and
// orphans the leaf node(vite), breaking `taskkill /T` and leaking port 5173. Spawning
// Vite directly collapses the tree to `bun(dev) → node(vite)` with no intermediate.
const viteBin = join(clientDir, "node_modules", "vite", "bin", "vite.js");

// Persistence driver override: `--persist` forces postgres, `--nosave` is the explicit no-save
// sandbox. With neither flag the server resolves its own default (postgres) from the environment
// and HARD-FAILS at boot if the database is unreachable (use `dev:nosave` to opt out).
const noSave = process.argv.includes("--nosave");
const persistenceDriver = noSave
  ? "disabled"
  : process.argv.includes("--persist")
    ? "postgres"
    : process.env.PERSISTENCE_DRIVER;

const serverHost = process.env.SERVER_HOST ?? "localhost";
const serverPort = process.env.PORT ?? "8080";
const clientHost = process.env.CLIENT_HOST ?? "127.0.0.1";
const clientPort = process.env.CLIENT_PORT ?? "5173";
const serverUrl = process.env.VITE_SERVER_URL ?? `ws://${serverHost}:${serverPort}/ws`;

const children: ChildProcess[] = [];
let shuttingDown = false;

/**
 * Grace window before force-killing a child tree. On Ctrl+C, the Windows console
 * delivers CTRL_C_EVENT to every process in its process group — which includes our
 * children, because we spawn them WITHOUT `detached` (see start()) so they stay in
 * this console's group. The server child therefore runs its own graceful shutdown
 * (flush persistence, release leases, close the pg pool, close the HTTP/WS servers,
 * process.exit) and Vite exits on its own; we just wait for them. Hard-killing
 * immediately would race the server's persistence flush and can leave port 8080
 * bound (EADDRINUSE on restart), so `taskkill /F` is only a fallback for a child
 * that hasn't settled within this window.
 */
const GRACEFUL_EXIT_MS = 8_000;

function prefixLines(label: string, chunk: Buffer): void {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.length > 0) {
      console.log(`[${label}] ${line}`);
    }
  }
}

function start(
  label: string,
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
  cwd: string = root,
): ChildProcess {
  // NO `detached`: the children share this console's process group, so the Ctrl+C the
  // user presses is delivered straight to them by Windows and each runs its own graceful
  // shutdown (the server flushes persistence; Vite frees its port). A `detached` child
  // gets CREATE_NEW_PROCESS_GROUP and would NOT receive that Ctrl+C — it would keep
  // running and leak its port until the GRACEFUL_EXIT_MS force-kill fires, or forever if
  // this parent is killed first (e.g. an impatient second Ctrl+C). killChildTree() stays
  // as the fallback for a child that ignores the signal.
  const child = spawn(command, [...args], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk: Buffer) => prefixLines(label, chunk));
  child.stderr?.on("data", (chunk: Buffer) => prefixLines(label, chunk));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`;
      console.error(`[dev] ${label} exited with ${reason}; stopping dev stack`);
      shutdown(code ?? 1);
    }
  });

  children.push(child);
  return child;
}

/**
 * Force-terminate a child and ALL of its descendants. This is the FALLBACK path used
 * only after the grace window expires — the primary shutdown is the children exiting
 * on their own from the console Ctrl+C broadcast (see GRACEFUL_EXIT_MS). With direct
 * Vite spawning the tree is `bun(dev) → node(vite)` (no intermediate), so `taskkill /T`
 * reliably reaches the leaf.
 */
function killChildTree(child: ChildProcess): void {
  if (child.killed || child.pid === undefined) {
    return;
  }
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

function shutdown(code = 0): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  process.exitCode = code;

  // Track which children are still alive. Each child already received the console
  // Ctrl+C broadcast and is running its own graceful shutdown; we just wait for it
  // to exit. The force-kill timer is the fallback for a child that hangs (e.g. an
  // unbounded DB close) so the dev stack never wedges. Children that already exited
  // (e.g. Vite, which can die immediately on Ctrl+C before this handler runs) are
  // excluded up front so we don't linger the whole grace window waiting on a corpse.
  const pending = new Set(
    children.filter((child) => child.exitCode === null && child.signalCode === null),
  );
  if (pending.size === 0) {
    return;
  }

  const forceKillTimer = setTimeout(() => {
    for (const child of pending) {
      killChildTree(child);
    }
  }, GRACEFUL_EXIT_MS);

  for (const child of pending) {
    child.once("exit", () => {
      pending.delete(child);
      if (pending.size === 0) {
        clearTimeout(forceKillTimer);
      }
    });
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev] Old Town local POC");
console.log(`[dev] server: http://${serverHost}:${serverPort} and ${serverUrl}`);
console.log(`[dev] client: http://${clientHost}:${clientPort}`);

start("server", bun, ["apps/server/src/index.ts"], {
  ...process.env,
  PORT: serverPort,
  CONTENT_DIR: process.env.CONTENT_DIR ?? "content",
  TICK_MS: process.env.TICK_MS ?? "600",
  ...(persistenceDriver ? { PERSISTENCE_DRIVER: persistenceDriver } : {}),
  ...(noSave ? { PERSISTENCE_UNSAFE_ALLOW_NOSAVE: "true" } : {}),
});

if (!existsSync(viteBin)) {
  console.error(`[dev] client: vite binary not found at ${viteBin}. Run \`bun install\` first.`);
  shutdown(1);
}
start(
  "client",
  "node",
  [viteBin, "--host", clientHost, "--port", clientPort, "--strictPort"],
  {
    ...process.env,
    VITE_SERVER_URL: serverUrl,
  },
  clientDir,
);
