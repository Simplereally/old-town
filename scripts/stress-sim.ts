/**
 * Lightweight simulation stress harness.
 *
 * Run with:
 *   PLAYERS=25 TICKS=100 bun run stress:sim
 */
import { loadContent } from "../apps/server/src/content-loader";
import type { Logger } from "../apps/server/src/logger";
import type { DeltaTransport } from "../apps/server/src/net/delta-broadcaster";
import type { TransportSession } from "../apps/server/src/net/websocket-transport";
import { createSimulationKernel } from "../apps/server/src/sim/simulation-kernel";
import { ClientCommandType, type TileCoord } from "../packages/shared/src/index";

interface StressOptions {
  readonly players: number;
  readonly ticks: number;
}

interface SentDeltaStats {
  packetCount: number;
  bytes: number;
}

function parsePositiveInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function makeLogger(): Logger {
  const noop = () => {};
  return {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
  };
}

function destinationFor(playerIndex: number, tick: number): TileCoord {
  const offsets = [
    { x: 32, y: 34 },
    { x: 35, y: 34 },
    { x: 35, y: 37 },
    { x: 32, y: 37 },
    { x: 30, y: 35 },
    { x: 37, y: 35 },
  ];
  const point = offsets[(playerIndex + tick) % offsets.length] ?? { x: 32, y: 34 };
  return { ...point, plane: 0 };
}

async function runStress(options: StressOptions): Promise<void> {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }

  const kernel = createSimulationKernel({
    registries: content.registries,
    logger: makeLogger(),
    startServerTime: 0,
  });

  const sessions = new Map<string, TransportSession>();
  for (let i = 0; i < options.players; i += 1) {
    const session: TransportSession = {
      id: `stress-${i}`,
      characterId: `stress-character-${i}`,
    };
    sessions.set(session.id, session);
    await kernel.connectSession(session);
  }

  const sentDeltas: SentDeltaStats = { packetCount: 0, bytes: 0 };
  const transport: DeltaTransport = {
    sessions,
    send(_sessionId, packet) {
      sentDeltas.packetCount += 1;
      sentDeltas.bytes += JSON.stringify(packet).length;
      return true;
    },
  };
  kernel.attachDeltaTransport(transport);

  const startedAt = performance.now();
  let commandId = 1;
  for (let tick = 0; tick < options.ticks; tick += 1) {
    let playerIndex = 0;
    for (const session of sessions.values()) {
      kernel.routeCommand(session, {
        type: ClientCommandType.MoveClick,
        commandId,
        clientTickHint: kernel.stats().currentTick,
        payload: { dest: destinationFor(playerIndex, tick) },
      });
      commandId += 1;
      playerIndex += 1;
    }
    kernel.runOneTick();
  }
  const elapsedMs = performance.now() - startedAt;
  const stats = kernel.stats();

  console.log(
    JSON.stringify(
      {
        players: options.players,
        ticks: options.ticks,
        elapsedMs: Number(elapsedMs.toFixed(2)),
        msPerTick: Number((elapsedMs / options.ticks).toFixed(2)),
        sentDeltaPackets: sentDeltas.packetCount,
        sentDeltaBytes: sentDeltas.bytes,
        lastTickDurationMs: Number(stats.lastTickDurationMs.toFixed(2)),
        lastCommandsProcessed: stats.lastCommandsProcessed,
        aliveEntityCount: stats.aliveEntityCount,
        pendingCommandCount: stats.pendingCommandCount,
        lastDeltaSizeBytes: stats.lastDeltaSizeBytes,
        saveQueuePendingCount: stats.saveQueuePendingCount,
        saveQueueInFlightCount: stats.saveQueueInFlightCount,
      },
      null,
      2,
    ),
  );
}

await runStress({
  players: parsePositiveInt("PLAYERS", 25),
  ticks: parsePositiveInt("TICKS", 100),
});
