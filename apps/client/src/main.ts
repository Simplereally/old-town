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

  const defaultSocketProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const defaultServerUrl = `${defaultSocketProtocol}//${window.location.host}/ws`;
  const serverUrl = resolveServerUrl(import.meta.env.VITE_SERVER_URL, defaultServerUrl);
  let engine: GameEngine | undefined;
  let loginInProgress = false;

  function resolveServerUrl(configuredUrl: string | undefined, fallbackUrl: string): string {
    if (!configuredUrl) {
      return fallbackUrl;
    }

    const pageHostname = window.location.hostname;
    if (pageHostname === "localhost" || pageHostname === "127.0.0.1" || pageHostname === "::1") {
      return configuredUrl;
    }

    try {
      const url = new URL(configuredUrl);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1") {
        if (window.location.protocol === "https:") {
          return fallbackUrl;
        }
        url.protocol = defaultSocketProtocol;
        url.hostname = pageHostname;
        return url.toString();
      }
    } catch {
      return fallbackUrl;
    }

    return configuredUrl;
  }

  function installMobileZoomGuards(): void {
    document.addEventListener("gesturestart", (event) => event.preventDefault());
    document.addEventListener(
      "dblclick",
      (event) => {
        if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLDivElement) {
          event.preventDefault();
        }
      },
      { capture: true },
    );
  }

  installMobileZoomGuards();

  function isLoginButtonTarget(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest("#login-btn");
  }

  function activateLogin(event: Event): void {
    if (!isLoginButtonTarget(event.target)) {
      return;
    }
    event.preventDefault();
    handleLogin();
  }

  function setLoginPending(pending: boolean): void {
    loginInProgress = pending;
    loginBtn.disabled = pending;
    loginUsername.disabled = pending;
    loginBtn.classList.toggle("login-btn-loading", pending);
    loginBtn.setAttribute("aria-busy", pending ? "true" : "false");
    loginBtn.textContent = pending ? "LOGGING IN" : "LOG IN";
  }

  function startEngine(characterId: string): void {
    if (engine || loginInProgress) {
      return;
    }
    setLoginPending(true);

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
        loginScreen.classList.add("hidden");
        window.addEventListener("beforeunload", () => {
          engine?.shutdown();
        });
      })
      .catch((error) => {
        console.error("Fatal error during engine startup:", error);
        engine?.shutdown();
        engine = undefined;
        loginScreen.classList.remove("hidden");
        setLoginPending(false);
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

  loginScreen.addEventListener("pointerup", activateLogin, { passive: false });
  loginScreen.addEventListener("touchend", activateLogin, { passive: false });
  loginBtn.addEventListener("click", (event) => {
    event.preventDefault();
    handleLogin();
  });
  loginUsername.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const autoLogin = urlParams.get("autoLogin");
  if (autoLogin && import.meta.env.DEV) {
    loginUsername.value = autoLogin;
    handleLogin();
  }
}
