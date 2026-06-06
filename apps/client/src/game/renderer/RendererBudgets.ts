export enum BudgetGateType {
  CI_ENFORCEABLE = "CI_ENFORCEABLE",
  MANUAL_BROWSER_ONLY = "MANUAL_BROWSER_ONLY",
}

export interface BudgetStatus {
  name: string;
  target: number;
  actual: number | null;
  unit: string;
  gate: BudgetGateType;
  passed: boolean | null;
}

export const RendererBudgets = {
  FRAME_P95_MS: {
    value: 16.6,
    unit: "ms",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  FRAME_P99_MS: {
    value: 33,
    unit: "ms",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  DRAW_CALLS_MAX: {
    value: 150,
    unit: "count",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  OPTIMIZED_DRAW_CALLS_MAX: {
    value: 75,
    unit: "count",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  CHUNK_UPLOAD_BUDGET_MS: {
    value: 2,
    unit: "ms",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  SNAPSHOT_INGEST_MS: {
    value: 1,
    unit: "ms",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  VISIBLE_ENTITIES_MAX: {
    value: 200,
    unit: "count",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  RENDER_CACHED_STRESS_MAX: {
    value: 1000,
    unit: "count",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  VISIBLE_INSTANCED_PROPS_MAX: {
    value: 5000,
    unit: "count",
    gate: BudgetGateType.CI_ENFORCEABLE,
  },
  STRESS_INSTANCED_PROPS_MAX: {
    value: 30000,
    unit: "count",
    gate: BudgetGateType.MANUAL_BROWSER_ONLY,
  },
  HEAP_STABLE_SLOPE_MB_PER_MIN: {
    value: 1,
    unit: "MB/min",
    gate: BudgetGateType.MANUAL_BROWSER_ONLY,
  },
} as const;
