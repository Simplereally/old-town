import { GameEngine } from "./game/GameEngine";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const statusOverlay = document.getElementById("status-overlay") as HTMLDivElement;
const debugOverlay = document.getElementById("debug-overlay") as HTMLDivElement;
const loginScreen = document.getElementById("login-screen") as HTMLDivElement;
const loginUsername = document.getElementById("login-username") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;

if (!canvas) {
  throw new Error("Game canvas not found");
}

const win = window as unknown as Record<string, unknown>;
if (win.__OLD_TOWN_INIT__) {
  console.warn("[Old Town] Init already running, skipping duplicate initialization");
} else {
  win.__OLD_TOWN_INIT__ = true;

  const serverUrl = import.meta.env.VITE_SERVER_URL ?? "ws://localhost:8080/ws";
  let engine: GameEngine | undefined;

  function startEngine(characterId: string): void {
    if (engine) {
      return;
    }
    loginScreen.classList.add("hidden");

    engine = new GameEngine({
      canvas,
      statusOverlay,
      debugOverlay,
      serverUrl,
      characterId,
    });

    engine
      .start()
      .then(() => {
        window.addEventListener("beforeunload", () => {
          engine?.shutdown();
        });
      })
      .catch((error) => {
        console.error("Fatal error during engine startup:", error);
        engine?.shutdown();
        engine = undefined;
        loginScreen.classList.remove("hidden");
      });
  }

  function handleLogin(): void {
    const username = loginUsername.value.trim();
    if (!username) {
      loginUsername.focus();
      return;
    }
    startEngine(username);
  }

  loginBtn.addEventListener("click", handleLogin);
  loginUsername.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const autoLogin = urlParams.get("autoLogin");
  if (autoLogin) {
    loginUsername.value = autoLogin;
    handleLogin();
  }
}
