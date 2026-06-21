export interface RenderClockOptions {
  /** Server tick duration in milliseconds. */
  readonly tickMs: number;
  /** Time the client stays behind estimated server time to smooth jitter. */
  readonly interpolationDelayMs: number;
  /** Maximum frame delta after background-tab pauses. */
  readonly maxFrameDeltaMs: number;
  /** Smoothing factor (0–1) for server-time offset updates. */
  readonly serverTimeSmoothing: number;
}

export interface RenderClockSample {
  /** The RAF timestamp passed to sample. */
  readonly rafNowMs: number;
  /** Elapsed time since the last sample, clamped to maxFrameDeltaMs. */
  readonly frameDeltaMs: number;
  /** Current estimate of server wall time. */
  readonly estimatedServerTimeMs: number;
  /** Server time we are actually rendering (delayed by interpolationDelayMs). */
  readonly renderServerTimeMs: number;
  /** True when frameDeltaMs was clamped because the raw delta exceeded maxFrameDeltaMs. */
  readonly clamped: boolean;
}

/**
 * Pure clock adapter that maps RAF timestamps to delayed server presentation time.
 *
 * No local authoritative tick counter is advanced.  No `performance.now()` is
 * called inside the pure sample path.  The caller supplies RAF timestamps
 * (e.g. from `requestAnimationFrame`) and sync packets from the server.
 */
export class RenderClock {
  private _serverTimeOffset: number | null = null;
  private _lastRafNowMs: number | null = null;
  private _lastSyncTick = -1;

  constructor(private readonly _options: RenderClockOptions) {}

  /** The last tick passed to `syncToServer`, or -1 if none. */
  get lastSyncTick(): number {
    return this._lastSyncTick;
  }

  /**
   * Update the estimated server-time offset from an accepted server packet.
   *
   * The offset is computed as `packetServerTimeMs - rafNowMs` and tracked with a
   * symmetric exponential moving average controlled by `serverTimeSmoothing`.
   *
   * It must converge on the *mean* offset and self-correct in both directions.
   * A previous implementation clamped this with `Math.max(prev, smoothed)` to
   * "never move render time backwards", but a one-sided ratchet permanently
   * locks onto the most optimistic arrival — the early packet of a server
   * tick-loop catch-up burst, a GC-delayed frame, or any low-latency outlier.
   * Every such spike biases the playout clock forward and never decays, so under
   * a bursty/jittery packet cadence render time creeps past the newest buffered
   * snapshot and interpolation collapses into a per-tick teleport (smooth, then
   * progressively worse, then a reset when the next burst lands — repeating).
   * Smoothing both ways keeps the clock centred; each correction is bounded by
   * `serverTimeSmoothing`, so it never produces a perceptible rewind.
   */
  syncToServer(packetTick: number, packetServerTimeMs: number, rafNowMs: number): void {
    const rawOffset = packetServerTimeMs - rafNowMs;

    if (this._serverTimeOffset === null) {
      this._serverTimeOffset = rawOffset;
    } else {
      this._serverTimeOffset =
        this._serverTimeOffset * (1 - this._options.serverTimeSmoothing) +
        rawOffset * this._options.serverTimeSmoothing;
    }

    this._lastSyncTick = packetTick;
  }

  /**
   * Produce a sample for the given RAF timestamp.
   *
   * `frameDeltaMs` is the raw delta since the previous call, clamped to
   * `maxFrameDeltaMs`.  `estimatedServerTimeMs` is derived from the smoothed
   * offset plus the current RAF time.  `renderServerTimeMs` is the delayed
   * presentation time used by `SnapshotBuffer`.
   */
  sample(rafNowMs: number): RenderClockSample {
    let frameDeltaMs = 0;
    let clamped = false;

    if (this._lastRafNowMs !== null) {
      const rawDelta = rafNowMs - this._lastRafNowMs;
      if (rawDelta > this._options.maxFrameDeltaMs) {
        frameDeltaMs = this._options.maxFrameDeltaMs;
        clamped = true;
      } else {
        frameDeltaMs = Math.max(0, rawDelta);
      }
    }

    this._lastRafNowMs = rafNowMs;

    const estimatedServerTimeMs =
      this._serverTimeOffset !== null ? rafNowMs + this._serverTimeOffset : rafNowMs;

    const renderServerTimeMs = estimatedServerTimeMs - this._options.interpolationDelayMs;

    return {
      rafNowMs,
      frameDeltaMs,
      estimatedServerTimeMs,
      renderServerTimeMs,
      clamped,
    };
  }
}
