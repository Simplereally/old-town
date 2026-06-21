/**
 * Starts the local POC stack: authoritative game server plus Vite client.
 *
 * Run with: `bun run dev`
 */
import { type ChildProcess, spawn } from "node:child_process";

const root = process.cwd();
const bun = process.execPath;

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

function prefixLines(label: string, chunk: Buffer): void {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.length > 0) {
      console.log(`[${label}] ${line}`);
    }
  }
}

function start(label: string, args: readonly string[], env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(bun, [...args], {
    cwd: root,
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
 * Terminate a child and ALL of its descendants. The client child is `bun run …` which
 * itself spawns `node vite.js`, so the real process tree is
 * `bun(dev) → bun(client) → node(vite)`. On Windows `child.kill()` only signals the
 * direct child, orphaning the grandchild Vite — which then keeps port 5173 bound and
 * makes the next `bun run dev` fail on `--strictPort`. `taskkill /T` kills the whole tree.
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
  for (const child of children) {
    killChildTree(child);
  }
  process.exitCode = code;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev] Old Town local POC");
console.log(`[dev] server: http://${serverHost}:${serverPort} and ${serverUrl}`);
console.log(`[dev] client: http://${clientHost}:${clientPort}`);

start("server", ["apps/server/src/index.ts"], {
  ...process.env,
  PORT: serverPort,
  CONTENT_DIR: process.env.CONTENT_DIR ?? "content",
  TICK_MS: process.env.TICK_MS ?? "600",
  ...(persistenceDriver ? { PERSISTENCE_DRIVER: persistenceDriver } : {}),
  ...(noSave ? { PERSISTENCE_UNSAFE_ALLOW_NOSAVE: "true" } : {}),
});

start(
  "client",
  [
    "run",
    "--filter",
    "@old-town/client",
    "dev",
    "--host",
    clientHost,
    "--port",
    clientPort,
    "--strictPort",
  ],
  {
    ...process.env,
    VITE_SERVER_URL: serverUrl,
  },
);
