/**
 * Starts the local POC stack: authoritative game server plus Vite client.
 *
 * Run with: `bun run dev`
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";

const root = process.cwd();
const bun = process.execPath;

const serverHost = process.env.SERVER_HOST ?? "localhost";
const serverPort = process.env.PORT ?? "8080";
const clientHost = process.env.CLIENT_HOST ?? "127.0.0.1";
const clientPort = process.env.CLIENT_PORT ?? "5173";
const serverUrl = process.env.VITE_SERVER_URL ?? `ws://${serverHost}:${serverPort}/ws`;

const children: ChildProcessWithoutNullStreams[] = [];
let shuttingDown = false;

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
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): ChildProcessWithoutNullStreams {
  const child = spawn(bun, [...args], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk: Buffer) => prefixLines(label, chunk));
  child.stderr.on("data", (chunk: Buffer) => prefixLines(label, chunk));
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

function shutdown(code = 0): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
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
  PERSISTENCE_ENABLED: process.env.PERSISTENCE_ENABLED ?? "false",
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
