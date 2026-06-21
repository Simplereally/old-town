import type { WebGLRenderer } from "three";
import { RendererBudgets } from "../RendererBudgets";

/** Result of a heap sample attempt. */
export interface HeapSampleResult {
  readonly bytes: number | null;
  readonly status: "available" | "unavailable";
}

/** Result of a draw-call sample attempt. */
export interface DrawCallSampleResult {
  readonly calls: number | null;
  readonly status: "available" | "unavailable";
}

/** Result of a budget assertion. */
export interface BudgetAssertionResult {
  readonly passed: boolean;
  readonly label: string;
  readonly before: number | null;
  readonly after: number | null;
  readonly status: "passed" | "failed" | "manual-required" | "unavailable";
  readonly message: string;
}

/** Chrome-only MemoryInfo shape. */
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/** Chrome-only performance extension. */
interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

/**
 * Samples JS heap size via `performance.memory` (Chrome only).
 * Returns `null` with `status: 'unavailable'` in other environments.
 */
export class HeapSampler {
  private _checked = false;
  private _available = false;

  isAvailable(): boolean {
    if (!this._checked) {
      this._available =
        typeof performance !== "undefined" &&
        (performance as PerformanceWithMemory).memory !== undefined;
      this._checked = true;
    }
    return this._available;
  }

  sample(): HeapSampleResult {
    if (!this.isAvailable()) {
      return { bytes: null, status: "unavailable" };
    }
    const mem = (performance as PerformanceWithMemory).memory;
    if (!mem) {
      return { bytes: null, status: "unavailable" };
    }
    return { bytes: mem.usedJSHeapSize, status: "available" };
  }
}

/**
 * Samples draw-call count from a Three.js WebGLRenderer.
 * Returns `null` with `status: 'unavailable'` when `renderer.info` is missing.
 */
export class DrawCallSampler {
  sample(renderer: WebGLRenderer): DrawCallSampleResult {
    const info = renderer.info;
    if (!info || typeof info.render?.calls !== "number") {
      return { calls: null, status: "unavailable" };
    }
    return { calls: info.render.calls, status: "available" };
  }
}

/**
 * Assert that a pool did not grow without bound between two measurements.
 * Returns a `BudgetAssertionResult` so the caller can decide whether to throw or report.
 */
export function assertNoUnboundedGrowth(
  before: number | null,
  after: number | null,
  label: string,
): BudgetAssertionResult {
  if (before === null || after === null) {
    return {
      passed: false,
      label,
      before,
      after,
      status: "unavailable",
      message: `${label}: cannot compare because one or both samples are null`,
    };
  }

  if (after > before) {
    return {
      passed: false,
      label,
      before,
      after,
      status: "failed",
      message: `${label}: unbounded growth detected (${before} -> ${after})`,
    };
  }

  return {
    passed: true,
    label,
    before,
    after,
    status: "passed",
    message: `${label}: no growth (${before} -> ${after})`,
  };
}

/**
 * Assert that draw calls are within the configured budget.
 * Returns a `BudgetAssertionResult` so browser-only metrics can report `manual-required`.
 */
export function assertDrawCallBudget(
  sampleResult: DrawCallSampleResult,
  label = "draw_calls",
): BudgetAssertionResult {
  if (sampleResult.status === "unavailable" || sampleResult.calls === null) {
    return {
      passed: false,
      label,
      before: null,
      after: sampleResult.calls,
      status: "manual-required",
      message: `${label}: draw-call sampling unavailable (browser-only metric)`,
    };
  }

  const max = RendererBudgets.DRAW_CALLS_MAX.value;
  const passed = sampleResult.calls < max;

  return {
    passed,
    label,
    before: null,
    after: sampleResult.calls,
    status: passed ? "passed" : "failed",
    message: `${label}: ${sampleResult.calls} calls (budget ${max}) — ${passed ? "PASS" : "FAIL"}`,
  };
}
