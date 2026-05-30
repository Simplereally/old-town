/**
 * Runtime environment loading. Reads `.env` overrides from the server app directory,
 * falls back to `.env.example`, then uses `process.env` for defaults.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GAME_TICK_MS } from "@old-town/shared";

export interface RuntimeConfig {
  /** Port the WebSocket server listens on. */
  port: number;
  /** Server simulation tick length in milliseconds (gameplay truth; do not change lightly). */
  tickMs: number;
  /** Content directory path relative to project root. */
  contentDir: string;
  /** Whether to emit debug logs and extra runtime checks. */
  debug: boolean;
  /** Whether to log to console as JSON (structured) or plain text (human-readable). */
  logJson: boolean;
}

function parseIntEnv(value: string | undefined, defaultValue: number): number {
  const parsed = value === undefined ? Number.NaN : Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function parseBoolEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

function loadEnvFile(path: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      map.set(key, value);
    }
  } catch {
    // File missing is fine — we will fall back to process.env or defaults.
  }
  return map;
}

function buildEnv(): Map<string, string> {
  const env = new Map<string, string>();
  // Load .env.example first as defaults.
  const example = loadEnvFile(resolve(import.meta.dirname, "../.env.example"));
  for (const [k, v] of example) {
    env.set(k, v);
  }
  // Allow .env overrides.
  const local = loadEnvFile(resolve(import.meta.dirname, "../.env"));
  for (const [k, v] of local) {
    env.set(k, v);
  }
  // Process.env wins over everything.
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) {
      env.set(k, v);
    }
  }
  return env;
}

export function loadRuntimeConfig(): RuntimeConfig {
  const env = buildEnv();
  return {
    port: parseIntEnv(env.get("PORT"), 8080),
    tickMs: parseIntEnv(env.get("TICK_MS"), GAME_TICK_MS),
    contentDir: env.get("CONTENT_DIR") ?? "content",
    debug: parseBoolEnv(env.get("DEBUG"), false),
    logJson: parseBoolEnv(env.get("LOG_JSON"), false),
  };
}
