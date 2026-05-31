/**
 * Old Town authoritative game server entrypoint.
 */
import { startServer } from "./server";

let _initStarted = false;

async function main(): Promise<void> {
  if (_initStarted) {
    console.warn("[Old Town] Server init already started, skipping duplicate call");
    return;
  }
  _initStarted = true;

  const server = await startServer();

  const gracefulShutdown = async (): Promise<void> => {
    await server.shutdown();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

main().catch((error) => {
  console.error("Fatal error during startup:", error);
  process.exit(1);
});
