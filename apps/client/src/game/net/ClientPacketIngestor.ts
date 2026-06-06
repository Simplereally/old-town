import type { FullStatePacket, TickDeltaPacket, TileCoord } from "@old-town/shared";
import type { RenderClock } from "../renderer/RenderClock";
import type { ClientPacketApplier, PurePacketApplierResult } from "./ClientPacketApplier";

/**
 * Orchestrates pure packet ingestion. Wraps ClientPacketApplier (pure reducer)
 * and RenderClock so that GameEngine socket callbacks never touch scene layers.
 *
 * All packet arrival paths:
 *   1. ingestFullState   – called once on login bootstrap
 *   2. ingestTickDelta   – called per S2C_TICK_DELTA
 *
 * Both paths sync the RenderClock to the accepted server tick so the render
 * frame can sample the correct interpolation time.
 */
export class ClientPacketIngestor {
  constructor(
    private readonly _applier: ClientPacketApplier,
    private readonly _renderClock: RenderClock,
  ) {}

  get lastClickTile(): TileCoord | undefined {
    return this._applier.lastClickTile;
  }

  get lastClickTick(): number {
    return this._applier.lastClickTick;
  }

  get selfEntityId(): number {
    return this._applier.selfEntityId;
  }

  recordClickTile(tile: TileCoord, tick: number): void {
    this._applier.recordClickTile(tile, tick);
  }

  /**
   * Ingest a full-state bootstrap packet.
   *
   * Resets the world store, snapshot buffer, applies all entities, UI state,
   * and syncs the RenderClock.
   */
  ingestFullState(packet: FullStatePacket, rafNowMs: number): PurePacketApplierResult {
    const result = this._applier.applyFullState(packet);
    this._renderClock.syncToServer(result.tick, result.serverTime, rafNowMs);
    return result;
  }

  /**
   * Ingest a tick-delta packet.
   *
   * Returns `null` if the tick is stale (tick <= currentTick). Otherwise
   * applies the delta to the world store, inserts a RenderSnapshot into the
   * SnapshotBuffer, and syncs the RenderClock.
   */
  ingestTickDelta(
    packet: TickDeltaPacket,
    currentTick: number,
    rafNowMs: number,
  ): PurePacketApplierResult | null {
    const result = this._applier.applyTickDelta(packet, currentTick);
    if (result) {
      this._renderClock.syncToServer(result.tick, result.serverTime, rafNowMs);
    }
    return result;
  }
}
