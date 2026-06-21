/**
 * Structured logging. Every log line is a single JSON object with a fixed schema so
 * that log aggregation can index and filter by `level`, `service`, `ts`, and `topic`.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  ts: string;
  service: string;
  topic: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(topic: string, message: string, metadata?: Record<string, unknown>): void;
  info(topic: string, message: string, metadata?: Record<string, unknown>): void;
  warn(topic: string, message: string, metadata?: Record<string, unknown>): void;
  error(topic: string, message: string, metadata?: Record<string, unknown>): void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createLogger(service: string, logJson: boolean, debugEnabled = false): Logger {
  const emit = (
    level: LogLevel,
    topic: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void => {
    if (level === "debug" && !debugEnabled) {
      return;
    }

    const entry: LogEntry = {
      level,
      ts: nowIso(),
      service,
      topic,
      message,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    if (logJson) {
      console.log(JSON.stringify(entry));
      return;
    }

    const meta = metadata && Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : "";
    const line = `[${entry.ts}] ${level.toUpperCase()} ${service}::${topic} — ${message}${meta}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    debug: (topic, message, metadata) => emit("debug", topic, message, metadata),
    info: (topic, message, metadata) => emit("info", topic, message, metadata),
    warn: (topic, message, metadata) => emit("warn", topic, message, metadata),
    error: (topic, message, metadata) => emit("error", topic, message, metadata),
  };
}
