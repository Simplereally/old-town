import { ClientCommandType } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { loadContent } from "../content-loader";
import type { DeltaTransport } from "../net/delta-broadcaster";
import { createSimulationKernel } from "./simulation-kernel";

async function setup() {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  const kernel = createSimulationKernel({
    registries: content.registries,
    logger: logger as unknown as import("../logger").Logger,
  });
  return { kernel, logger, registries: content.registries };
}

function makeSession(id: string, characterId: string) {
  return { id, characterId };
}

describe("SimulationKernel", () => {
  it("connects a session and produces a full-state snapshot with a player entity", async () => {
    const { kernel } = await setup();

    const baseline = kernel.stats().aliveEntityCount;
    const session = makeSession("session-1", "dev-a");
    const fullState = kernel.connectSession(session);

    expect(fullState.selfEntityId).toBeDefined();
    expect(fullState.entities.length).toBeGreaterThan(0);
    expect(fullState.inventory?.changes?.length).toBeGreaterThan(0);
    expect(fullState.skills?.length).toBeGreaterThan(0);
    expect(fullState.regionLoads?.length).toBeGreaterThan(0);

    const stats = kernel.stats();
    expect(stats.connectedSessionCount).toBe(1);
    expect(stats.aliveEntityCount).toBe(baseline + 1);
  });

  it("connects multiple sessions with independent entities", async () => {
    const { kernel } = await setup();

    const baseline = kernel.stats().aliveEntityCount;
    const first = kernel.connectSession(makeSession("session-1", "dev-a"));
    const second = kernel.connectSession(makeSession("session-2", "dev-b"));

    expect(first.selfEntityId).not.toBe(second.selfEntityId);
    expect(kernel.stats().connectedSessionCount).toBe(2);
    expect(kernel.stats().aliveEntityCount).toBe(baseline + 2);
  });

  it("disconnects a session and removes the entity", async () => {
    const { kernel } = await setup();

    const baseline = kernel.stats().aliveEntityCount;
    const session = makeSession("session-1", "dev-a");
    kernel.connectSession(session);

    expect(kernel.stats().connectedSessionCount).toBe(1);
    expect(kernel.stats().aliveEntityCount).toBe(baseline + 1);

    kernel.disconnectSession(session);

    expect(kernel.stats().connectedSessionCount).toBe(0);
    expect(kernel.stats().aliveEntityCount).toBe(baseline);
  });

  it("routes a command and consumes it on the next tick", async () => {
    const { kernel } = await setup();

    const session = makeSession("session-1", "dev-a");
    kernel.connectSession(session);

    const result = kernel.routeCommand(session, {
      type: ClientCommandType.MoveClick,
      commandId: 1,
      clientTickHint: 0,
      payload: { dest: { x: 32, y: 34, plane: 0 } },
    });

    expect(result.ok).toBe(true);
    expect(kernel.stats().pendingCommandCount).toBe(1);

    const beforeTick = kernel.stats().currentTick;
    kernel.runOneTick();
    expect(kernel.stats().currentTick).toBe(beforeTick + 1);
    expect(kernel.stats().pendingCommandCount).toBe(0);
  });

  it("rejects a command from an unknown session", async () => {
    const { kernel } = await setup();

    const result = kernel.routeCommand(makeSession("unknown", "nobody"), {
      type: ClientCommandType.MoveClick,
      commandId: 1,
      clientTickHint: 0,
      payload: { dest: { x: 32, y: 34, plane: 0 } },
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_session_entity");
  });

  it("advances tick and server time on runOneTick", async () => {
    const { kernel } = await setup();

    const beforeTick = kernel.stats().currentTick;
    const beforeTime = kernel.stats().currentServerTime;

    kernel.runOneTick();

    const stats = kernel.stats();
    expect(stats.currentTick).toBe(beforeTick + 1);
    expect(stats.currentServerTime).toBe(beforeTime + 600);
  });

  it("runs multiple due ticks with runDueTicks", async () => {
    const { kernel } = await setup();

    const startTime = kernel.stats().currentServerTime;
    const ran = kernel.runDueTicks(startTime + 600 * 5);

    expect(ran).toBe(5);
    expect(kernel.stats().currentTick).toBe(5);
  });

  it("attaches a delta transport and broadcasts on tick", async () => {
    const { kernel } = await setup();

    const session = makeSession("session-1", "dev-a");
    kernel.connectSession(session);

    const sendSpy = vi.fn(() => true);
    const transport: DeltaTransport = {
      sessions: new Map([[session.id, session]]),
      send: sendSpy,
    };

    kernel.attachDeltaTransport(transport);
    kernel.runOneTick();

    expect(sendSpy).toHaveBeenCalled();
    const calls = sendSpy.mock.calls as unknown[][];
    const packet = calls[0]?.[1];
    expect(packet).toBeDefined();
    expect((packet as { type: string }).type).toBe("S2C_TICK_DELTA");
  });

  it("detaches a delta transport and stops broadcasting", async () => {
    const { kernel } = await setup();

    const session = makeSession("session-1", "dev-a");
    kernel.connectSession(session);

    const sendSpy = vi.fn(() => true);
    const transport: DeltaTransport = {
      sessions: new Map([[session.id, session]]),
      send: sendSpy,
    };

    kernel.attachDeltaTransport(transport);
    kernel.runOneTick();
    expect(sendSpy).toHaveBeenCalledTimes(1);

    kernel.detachDeltaTransport();
    kernel.runOneTick();
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it("does not re-send the self entity in entityAdds on first tick after late attach", async () => {
    const { kernel } = await setup();

    const session = makeSession("session-1", "dev-a");
    const fullState = kernel.connectSession(session);
    const selfEntityId = fullState.selfEntityId;

    const sendSpy = vi.fn(() => true);
    const transport: DeltaTransport = {
      sessions: new Map([[session.id, session]]),
      send: sendSpy,
    };

    kernel.attachDeltaTransport(transport);
    kernel.runOneTick();

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const calls = sendSpy.mock.calls as unknown[][];
    const packet = calls[0]?.[1];
    expect(packet).toBeDefined();
    const entityAdds = (packet as { entityAdds: readonly { entityId: unknown }[] }).entityAdds;
    const selfInAdds = entityAdds.some((add) => add.entityId === selfEntityId);
    expect(selfInAdds).toBe(false);
  });

  it("returns stats with zero values before any activity", async () => {
    const { kernel } = await setup();

    const stats = kernel.stats();
    expect(stats.currentTick).toBe(0);
    expect(stats.currentServerTime).toBe(0);
    expect(stats.pendingCommandCount).toBe(0);
    expect(stats.connectedSessionCount).toBe(0);
    expect(stats.regionCount).toBeGreaterThan(0);
    expect(stats.tileCount).toBeGreaterThan(0);

    const baseline = stats.aliveEntityCount;
    expect(baseline).toBeGreaterThan(0);

    const session = makeSession("session-1", "dev-a");
    kernel.connectSession(session);
    expect(kernel.stats().aliveEntityCount).toBe(baseline + 1);
  });
});
