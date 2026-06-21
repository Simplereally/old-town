import { describe, expect, it, vi } from "vitest";
import {
  DisabledPersistenceAdapter,
  JsonFilePersistenceAdapter,
  MemoryPersistenceAdapter,
  PersistenceConfigError,
} from "./adapter";
import {
  createPersistenceAdapter,
  createPersistenceAdapterAsync,
  resolvePersistenceDriver,
} from "./factory";
import { InMemorySqlClient } from "./postgres/fake-sql-client";
import { PostgresPersistenceAdapter } from "./postgres/postgres-adapter";

describe("resolvePersistenceDriver", () => {
  it("defaults to postgres when nothing is configured", () => {
    expect(resolvePersistenceDriver({})).toBe("postgres");
  });

  it("honours an explicit driver over the legacy flag", () => {
    expect(resolvePersistenceDriver({ driver: "memory", enabled: false })).toBe("memory");
  });

  it("maps the legacy enabled flag for backward compatibility", () => {
    expect(resolvePersistenceDriver({ enabled: false })).toBe("disabled");
    expect(resolvePersistenceDriver({ enabled: true })).toBe("json_file");
  });
});

describe("createPersistenceAdapter", () => {
  it("builds disabled / memory / json_file adapters", () => {
    expect(createPersistenceAdapter({ driver: "disabled" })).toBeInstanceOf(
      DisabledPersistenceAdapter,
    );
    expect(createPersistenceAdapter({ driver: "memory" })).toBeInstanceOf(MemoryPersistenceAdapter);
    expect(createPersistenceAdapter({ driver: "json_file", filePath: "x.json" })).toBeInstanceOf(
      JsonFilePersistenceAdapter,
    );
  });

  it("warns that json_file is deprecated for real development", () => {
    const logger = { debug: vi.fn(), warn: vi.fn(), info: vi.fn() };
    createPersistenceAdapter({ driver: "json_file", filePath: "x.json", logger });
    expect(logger.warn).toHaveBeenCalledWith(
      "persistence",
      expect.stringContaining("deprecated"),
      expect.objectContaining({ filePath: "x.json" }),
    );
  });

  it("builds a postgres adapter from an injected sql client", () => {
    const adapter = createPersistenceAdapter({
      driver: "postgres",
      sqlClient: new InMemorySqlClient(),
    });
    expect(adapter).toBeInstanceOf(PostgresPersistenceAdapter);
    expect(adapter.kind).toBe("postgres");
  });

  it("refuses to build postgres synchronously without a client", () => {
    expect(() => createPersistenceAdapter({ driver: "postgres" })).toThrow(PersistenceConfigError);
  });
});

describe("createPersistenceAdapterAsync", () => {
  it("delegates to the sync builder for non-postgres drivers", async () => {
    await expect(createPersistenceAdapterAsync({ driver: "memory" })).resolves.toBeInstanceOf(
      MemoryPersistenceAdapter,
    );
  });

  it("requires DATABASE_URL for the postgres driver", async () => {
    await expect(createPersistenceAdapterAsync({ driver: "postgres" })).rejects.toBeInstanceOf(
      PersistenceConfigError,
    );
  });

  it("uses an injected client without touching the real driver", async () => {
    const adapter = await createPersistenceAdapterAsync({
      driver: "postgres",
      sqlClient: new InMemorySqlClient(),
    });
    expect(adapter).toBeInstanceOf(PostgresPersistenceAdapter);
  });
});
