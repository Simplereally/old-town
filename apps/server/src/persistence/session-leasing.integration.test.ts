import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createLogger } from "../logger";
import type { TransportSession } from "../net/websocket-transport";
import { createSimulationKernel } from "../sim/simulation-kernel";
import { MemoryPersistenceAdapter } from "./adapter";

const logger = createLogger("test", false, false);

async function makeKernel(sessionLeasing: boolean) {
  const content = await loadContent("content");
  expect(content.ok).toBe(true);
  return createSimulationKernel({
    registries: content.registries,
    logger,
    persistence: new MemoryPersistenceAdapter(),
    sessionLeasing,
    startServerTime: 0,
  });
}

function session(id: string, characterId: string): TransportSession {
  return { id, characterId };
}

describe("kernel session leasing (item 5)", () => {
  it("rejects a second live connection for the same character when leasing is on", async () => {
    const kernel = await makeKernel(true);

    await kernel.connectSession(session("s1", "dev-a"));
    await expect(kernel.connectSession(session("s2", "dev-a"))).rejects.toThrow(
      "character_already_online",
    );
    // A different character is unaffected.
    await expect(kernel.connectSession(session("s3", "dev-b"))).resolves.toBeDefined();
  });

  it("frees the character after disconnect so it can reconnect", async () => {
    const kernel = await makeKernel(true);

    await kernel.connectSession(session("s1", "dev-a"));
    await kernel.disconnectSession(session("s1", "dev-a"));

    await expect(kernel.connectSession(session("s2", "dev-a"))).resolves.toBeDefined();
  });

  it("allows duplicate characters when leasing is off (current POC default)", async () => {
    const kernel = await makeKernel(false);

    await kernel.connectSession(session("s1", "dev-a"));
    await expect(kernel.connectSession(session("s2", "dev-a"))).resolves.toBeDefined();
  });
});
