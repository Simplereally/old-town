/**
 * Client audio manager (E47-S01 / E47-S02).
 *
 * Owns ambience beds, positional sources, and one-shot UI/action cues.
 * Presentation-only — never drives gameplay truth.
 */
import type { AudioDef, TileCoord } from "@old-town/shared";
import type { AudioSettings } from "./AudioSettings";
import { DEFAULT_AUDIO_SETTINGS } from "./AudioSettings";
import { E47_MAX_ONESHOT_SOUNDS } from "./e47-budgets";

/** Convert content assetPath (`assets/audio/...`) to a Vite public URL (`/audio/...`). */
export function audioAssetUrl(assetPath: string): string {
  if (assetPath.startsWith("assets/audio/")) {
    return `/audio/${assetPath.slice("assets/audio/".length)}`;
  }
  return assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
}

export function positionalGain(
  playerTile: Pick<TileCoord, "x" | "y">,
  sourceTile: Pick<TileCoord, "x" | "y">,
  maxDistanceTiles: number,
  falloffStartTiles = 0,
): number {
  const dx = playerTile.x - sourceTile.x;
  const dy = playerTile.y - sourceTile.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= maxDistanceTiles) return 0;
  if (distance <= falloffStartTiles) return 1;
  const span = Math.max(1, maxDistanceTiles - falloffStartTiles);
  return Math.max(0, 1 - (distance - falloffStartTiles) / span);
}

interface ActiveLoop {
  readonly def: AudioDef;
  readonly element: HTMLAudioElement;
  targetGain: number;
  currentGain: number;
  fadingOut: boolean;
}

export interface AudioManagerOptions {
  /** Optional clock for deterministic fade tests (ms). Defaults to performance.now. */
  nowMs?: () => number;
  /** Optional audio element factory for tests. */
  createAudioElement?: (url: string) => HTMLAudioElement;
}

export class AudioManager {
  private _defs = new Map<string, AudioDef>();
  private _settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private _ambience: ActiveLoop | undefined;
  private _outgoingAmbience: ActiveLoop[] = [];
  private _positional = new Map<string, ActiveLoop>();
  private _currentZoneId: string | undefined;
  private _disposed = false;
  private readonly _nowMs: () => number;
  private readonly _createAudioElement: (url: string) => HTMLAudioElement;
  private readonly _lastPlayAt = new Map<string, number>();
  private _rateLimitMs = 80;
  private _activeOneShotCount = 0;
  private _maxOneShots = E47_MAX_ONESHOT_SOUNDS;

  constructor(options: AudioManagerOptions = {}) {
    this._nowMs = options.nowMs ?? (() => performance.now());
    this._createAudioElement =
      options.createAudioElement ??
      ((url: string) => {
        const el = new Audio(url);
        el.preload = "auto";
        return el;
      });
  }

  get currentZoneId(): string | undefined {
    return this._currentZoneId;
  }

  get settings(): Readonly<AudioSettings> {
    return this._settings;
  }

  get activeAmbienceId(): string | undefined {
    return this._ambience?.def.id;
  }

  get outgoingAmbienceCount(): number {
    return this._outgoingAmbience.length;
  }

  get activePositionalCount(): number {
    return this._positional.size;
  }

  get activeOneShotCount(): number {
    return this._activeOneShotCount;
  }

  get activeSourceCount(): number {
    return (
      (this._ambience ? 1 : 0) +
      this._outgoingAmbience.length +
      this._positional.size +
      this._activeOneShotCount
    );
  }

  setDefinitions(defs: ReadonlyMap<string, AudioDef> | Record<string, AudioDef>): void {
    this._defs = defs instanceof Map ? new Map(defs) : new Map(Object.entries(defs));
    this._rebuildPositionalSources();
    if (this._currentZoneId !== undefined || this._ambience) {
      this.setZone(this._currentZoneId);
    }
  }

  setSettings(partial: Partial<AudioSettings>): void {
    this._settings = {
      ...this._settings,
      ...partial,
      masterVolume:
        partial.masterVolume !== undefined
          ? clamp01(partial.masterVolume)
          : this._settings.masterVolume,
      ambientVolume:
        partial.ambientVolume !== undefined
          ? clamp01(partial.ambientVolume)
          : this._settings.ambientVolume,
      uiVolume:
        partial.uiVolume !== undefined ? clamp01(partial.uiVolume) : this._settings.uiVolume,
      actionVolume:
        partial.actionVolume !== undefined
          ? clamp01(partial.actionVolume)
          : this._settings.actionVolume,
    };
    this._applyGains();
  }

  /**
   * Update ambience for the player's current zone. Cross-fades when the mapped
   * ambience definition changes. Pass `undefined` to use the fallback bed.
   */
  setZone(zoneId: string | undefined): void {
    if (this._disposed) return;
    this._currentZoneId = zoneId;
    const next = this._resolveAmbience(zoneId);
    const currentId = this._ambience?.def.id;
    if (next && next.id === currentId) {
      if (this._ambience) {
        this._ambience.targetGain = this._categoryGain("ambience") * next.volume;
        this._ambience.fadingOut = false;
      }
      return;
    }
    if (this._ambience) {
      this._ambience.fadingOut = true;
      this._ambience.targetGain = 0;
      this._outgoingAmbience.push(this._ambience);
      this._ambience = undefined;
    }
    if (next) {
      this._ambience = this._startLoop(next, this._categoryGain("ambience") * next.volume);
    }
  }

  /**
   * Update positional source gains from the player's integer tile.
   * Call each frame or on tile change — cheap math only.
   */
  updateListenerTile(tile: Pick<TileCoord, "x" | "y" | "plane">): void {
    if (this._disposed) return;
    for (const loop of this._positional.values()) {
      const src = loop.def.tile;
      const maxDist = loop.def.maxDistanceTiles ?? 0;
      if (!src || maxDist <= 0) {
        loop.targetGain = 0;
        continue;
      }
      const falloff = positionalGain(tile, src, maxDist, loop.def.falloffStartTiles ?? 0);
      loop.targetGain = this._categoryGain("positional") * loop.def.volume * falloff;
      loop.fadingOut = false;
    }
  }

  /**
   * Play a one-shot by content id (UI or action). Rate-limited per id.
   * Returns false when muted, unknown, rate-limited, or over the one-shot budget.
   */
  play(soundId: string, volumeScale = 1): boolean {
    if (this._disposed || this._settings.muted) return false;
    const def = this._defs.get(soundId);
    if (!def) return false;
    if (def.category !== "ui" && def.category !== "action") return false;
    const now = this._nowMs();
    const last = this._lastPlayAt.get(soundId) ?? 0;
    if (now - last < this._rateLimitMs) return false;
    if (this._activeOneShotCount >= this._maxOneShots) return false;
    this._lastPlayAt.set(soundId, now);

    const categoryGain =
      def.category === "ui" ? this._categoryGain("ui") : this._categoryGain("action");
    const gain = clamp01(categoryGain * def.volume * clamp01(volumeScale));
    if (gain <= 0) return false;

    const el = this._createAudioElement(audioAssetUrl(def.assetPath));
    el.loop = false;
    el.volume = gain;
    this._activeOneShotCount++;
    const cleanup = (): void => {
      this._activeOneShotCount = Math.max(0, this._activeOneShotCount - 1);
      el.onended = null;
      el.onerror = null;
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch {
        // ignore
      }
    };
    el.onended = cleanup;
    el.onerror = cleanup;
    void el.play().catch(() => cleanup());
    return true;
  }

  /** Advance fades. Call from the render frame with optional dt; uses wall clock if omitted. */
  update(_dtMs?: number): void {
    if (this._disposed) return;
    const step = 1 / 30; // ~30 Hz gain lerp toward target
    if (this._ambience) {
      this._stepGain(this._ambience, step);
    }
    const stillOutgoing: ActiveLoop[] = [];
    for (const loop of this._outgoingAmbience) {
      this._stepGain(loop, step);
      if (loop.currentGain <= 0.001) {
        this._stopLoop(loop);
      } else {
        stillOutgoing.push(loop);
      }
    }
    this._outgoingAmbience = stillOutgoing;
    for (const loop of this._positional.values()) {
      this._stepGain(loop, step);
    }
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    if (this._ambience) this._stopLoop(this._ambience);
    this._ambience = undefined;
    for (const loop of this._outgoingAmbience) this._stopLoop(loop);
    this._outgoingAmbience = [];
    for (const loop of this._positional.values()) this._stopLoop(loop);
    this._positional.clear();
    this._defs.clear();
    this._lastPlayAt.clear();
    this._activeOneShotCount = 0;
  }

  private _resolveAmbience(zoneId: string | undefined): AudioDef | undefined {
    if (zoneId) {
      for (const def of this._defs.values()) {
        if (def.category === "ambience" && def.zoneIds.includes(zoneId)) {
          return def;
        }
      }
    }
    for (const def of this._defs.values()) {
      if (def.category === "ambience" && def.fallback) {
        return def;
      }
    }
    return undefined;
  }

  private _rebuildPositionalSources(): void {
    for (const loop of this._positional.values()) this._stopLoop(loop);
    this._positional.clear();
    for (const def of this._defs.values()) {
      if (def.category !== "positional") continue;
      this._positional.set(def.id, this._startLoop(def, 0));
    }
  }

  private _startLoop(def: AudioDef, initialGain: number): ActiveLoop {
    const el = this._createAudioElement(audioAssetUrl(def.assetPath));
    el.loop = def.loop;
    el.volume = 0;
    const loop: ActiveLoop = {
      def,
      element: el,
      targetGain: initialGain,
      currentGain: 0,
      fadingOut: false,
    };
    void el.play().catch(() => {
      // Autoplay may be blocked until a user gesture; gains still track state.
    });
    return loop;
  }

  private _stopLoop(loop: ActiveLoop): void {
    try {
      loop.element.pause();
      loop.element.removeAttribute("src");
      loop.element.load();
    } catch {
      // ignore
    }
  }

  private _stepGain(loop: ActiveLoop, step: number): void {
    const fadeMs = Math.max(1, loop.def.fadeMs || 400);
    const rate = Math.min(1, (step * 1000) / fadeMs);
    const delta = loop.targetGain - loop.currentGain;
    loop.currentGain += delta * Math.min(1, rate * 3);
    if (Math.abs(loop.targetGain - loop.currentGain) < 0.002) {
      loop.currentGain = loop.targetGain;
    }
    loop.element.volume = clamp01(loop.currentGain);
  }

  private _applyGains(): void {
    if (this._ambience && !this._ambience.fadingOut) {
      this._ambience.targetGain = this._categoryGain("ambience") * this._ambience.def.volume;
    }
    for (const loop of this._positional.values()) {
      // Listener tile update will recompute falloff; keep relative category scale.
      const ratio =
        this._settings.muted || this._settings.masterVolume <= 0
          ? 0
          : loop.targetGain /
            Math.max(
              0.0001,
              this._settings.ambientVolume * this._settings.masterVolume * loop.def.volume,
            );
      loop.targetGain =
        this._categoryGain("positional") *
        loop.def.volume *
        clamp01(ratio === Infinity ? 0 : ratio);
    }
    if (this._settings.muted) {
      if (this._ambience) this._ambience.targetGain = 0;
      for (const loop of this._positional.values()) loop.targetGain = 0;
    }
  }

  private _categoryGain(category: "ambience" | "positional" | "ui" | "action"): number {
    if (this._settings.muted) return 0;
    const master = this._settings.masterVolume;
    if (category === "ambience" || category === "positional") {
      return master * this._settings.ambientVolume;
    }
    if (category === "ui") return master * this._settings.uiVolume;
    return master * this._settings.actionVolume;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
