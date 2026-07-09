/**
 * E47-local provisional renderer/audio budgets.
 *
 * These are not yet in POC_SPEC.md — they gate E47 atmosphere work only.
 * Promote into the spec before treating them as engine-wide contracts.
 */

/** Max simultaneous one-shot UI/action cues before AudioManager drops new plays. */
export const E47_MAX_ONESHOT_SOUNDS = 8;

/** Soft cap on ambience + positional + one-shot sources after zone transitions settle. */
export const E47_MAX_ACTIVE_AUDIO_SOURCES = 24;

/**
 * Soft draw-call budget for the starter-town atmosphere pass.
 * Uses ThreeRenderer.debugCounters().drawCalls — provisional, not a hard fail in CI.
 */
export const E47_PROVISIONAL_DRAW_CALL_SOFT_CAP = 2500;
