/**
 * Persisted audio preferences (E47-S01). Separate from input/render settings so
 * the schema can evolve independently.
 */

const AUDIO_SETTINGS_KEY = "old-town-audio-settings";
const AUDIO_SETTINGS_VERSION = 1;

export interface AudioSettings {
  /** Master mute — silences all categories. */
  muted: boolean;
  /** Master gain 0..1 applied after category volumes. */
  masterVolume: number;
  /** Ambient/positional bed gain 0..1. */
  ambientVolume: number;
  /** UI one-shot gain 0..1. */
  uiVolume: number;
  /** Server action cue gain 0..1. */
  actionVolume: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 0.7,
  ambientVolume: 0.55,
  uiVolume: 0.6,
  actionVolume: 0.7,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw) as { v?: number } & Partial<AudioSettings>;
    if (parsed.v !== AUDIO_SETTINGS_VERSION) return { ...DEFAULT_AUDIO_SETTINGS };
    return {
      muted: parsed.muted ?? DEFAULT_AUDIO_SETTINGS.muted,
      masterVolume: clamp01(parsed.masterVolume ?? DEFAULT_AUDIO_SETTINGS.masterVolume),
      ambientVolume: clamp01(parsed.ambientVolume ?? DEFAULT_AUDIO_SETTINGS.ambientVolume),
      uiVolume: clamp01(parsed.uiVolume ?? DEFAULT_AUDIO_SETTINGS.uiVolume),
      actionVolume: clamp01(parsed.actionVolume ?? DEFAULT_AUDIO_SETTINGS.actionVolume),
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(
      AUDIO_SETTINGS_KEY,
      JSON.stringify({ v: AUDIO_SETTINGS_VERSION, ...settings }),
    );
  } catch {
    // Ignore storage errors (e.g. private mode quota).
  }
}
