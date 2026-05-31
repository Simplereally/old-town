// Old Town client entrypoint.
// Boots the renderer, connects to the server, and starts the render loop.
import { GameEngine } from "./game/GameEngine";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const statusOverlay = document.getElementById("status-overlay") as HTMLDivElement;
const debugOverlay = document.getElementById("debug-overlay") as HTMLDivElement;

if (!canvas) {
  throw new Error("Game canvas not found");
}

const engine = new GameEngine({
  canvas,
  statusOverlay,
  debugOverlay,
  serverUrl: import.meta.env.VITE_SERVER_URL ?? "ws://localhost:8080",
});

engine.start().catch((error) => {
  console.error("Fatal error during engine startup:", error);
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  engine.shutdown();
});
