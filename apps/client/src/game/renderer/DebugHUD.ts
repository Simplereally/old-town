import { RendererBudgets } from "./RendererBudgets";
import type { RendererMetrics } from "./RendererMetrics";

export interface DebugHUDOptions {
  readonly metrics: RendererMetrics;
  readonly parent?: HTMLElement;
}

type Stats = ReturnType<RendererMetrics["computeStats"]>;

interface RowDef {
  readonly label: string;
  readonly key: keyof Stats;
  readonly format: (value: number | null) => string;
  readonly threshold?: (stats: Stats) => "green" | "yellow" | "red";
}

const THROTTLE_MS = 250; // 4 Hz max

function formatInt(value: number | null): string {
  return typeof value === "number" ? value.toFixed(0) : "—";
}

function formatFloat1(value: number | null): string {
  return typeof value === "number" ? value.toFixed(1) : "—";
}

function formatHeap(value: number | null): string {
  return typeof value === "number" ? `${(value / 1024 / 1024).toFixed(1)} MB` : "—";
}

function formatGpu(value: number | null): string {
  return typeof value === "number" ? `${value.toFixed(1)} ms` : "—";
}

const ROWS: readonly RowDef[] = [
  { label: "FPS", key: "fps", format: formatInt },
  {
    label: "FT",
    key: "lastFrameTimeMs",
    format: formatFloat1,
    threshold: (s) => {
      if (s.lastFrameTimeMs > RendererBudgets.FRAME_P99_MS.value) return "red";
      if (s.lastFrameTimeMs > RendererBudgets.FRAME_P95_MS.value) return "yellow";
      return "green";
    },
  },
  {
    label: "DC",
    key: "drawCalls",
    format: formatInt,
    threshold: (s) => {
      if (s.drawCalls > RendererBudgets.DRAW_CALLS_MAX.value) return "red";
      if (s.drawCalls > RendererBudgets.OPTIMIZED_DRAW_CALLS_MAX.value) return "yellow";
      return "green";
    },
  },
  { label: "GEO", key: "geometries", format: formatInt },
  { label: "TEX", key: "textures", format: formatInt },
  {
    label: "ACT",
    key: "actors",
    format: formatInt,
    threshold: (s) => {
      const total = s.actors + s.objects;
      if (total > RendererBudgets.VISIBLE_ENTITIES_MAX.value) return "red";
      if (total > RendererBudgets.VISIBLE_ENTITIES_MAX.value * 0.75) return "yellow";
      return "green";
    },
  },
  {
    label: "OBJ",
    key: "objects",
    format: formatInt,
    threshold: (s) => {
      const total = s.actors + s.objects;
      if (total > RendererBudgets.VISIBLE_ENTITIES_MAX.value) return "red";
      if (total > RendererBudgets.VISIBLE_ENTITIES_MAX.value * 0.75) return "yellow";
      return "green";
    },
  },
  { label: "CHK", key: "loadedChunks", format: formatInt },
  { label: "SBF", key: "snapshotDepth", format: formatInt },
  { label: "UQ", key: "uploadQueueDepth", format: formatInt },
  { label: "WQ", key: "workerQueueDepth", format: formatInt },
  { label: "HEAP", key: "latestHeap", format: formatHeap },
  { label: "GPU", key: "latestGpu", format: formatGpu },
];

const COLOR_MAP = {
  green: "#4ade80",
  yellow: "#facc15",
  red: "#f87171",
} as const;

export class DebugHUD {
  private readonly metrics: RendererMetrics;
  private readonly parent: HTMLElement;
  private readonly rowElements: Map<string, HTMLSpanElement> = new Map();
  private _visible = false;
  private _element: HTMLElement | null = null;
  private _updateTimer: number | null = null;

  constructor(options: DebugHUDOptions) {
    this.metrics = options.metrics;
    this.parent = options.parent ?? document.body;
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    if (this._visible === value) return;
    this._visible = value;
    if (value) {
      this._ensureElement();
      this._element!.style.display = "block";
      this._scheduleUpdate();
    } else {
      if (this._element) {
        this._element.style.display = "none";
      }
      this._cancelUpdate();
    }
  }

  toggle(): void {
    this.visible = !this.visible;
  }

  dispose(): void {
    this._cancelUpdate();
    if (this._element) {
      this._element.remove();
      this._element = null;
    }
    this.rowElements.clear();
  }

  private _ensureElement(): void {
    if (this._element) return;
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;top:8px;left:8px;z-index:9999;font-family:monospace;font-size:12px;background:rgba(0,0,0,0.7);color:#fff;padding:8px 12px;border-radius:4px;pointer-events:none;white-space:pre;";
    for (const rowDef of ROWS) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:12px;align-items:center;line-height:1.6;";
      const label = document.createElement("span");
      label.textContent = rowDef.label;
      label.style.cssText = "color:#aaa;min-width:32px;";
      const value = document.createElement("span");
      value.style.cssText = "min-width:64px;text-align:right;";
      row.appendChild(label);
      row.appendChild(value);
      el.appendChild(row);
      this.rowElements.set(rowDef.label, value);
    }
    this.parent.appendChild(el);
    this._element = el;
  }

  private _scheduleUpdate(): void {
    if (this._updateTimer !== null) return;
    this._updateTimer = window.setInterval(() => this._update(), THROTTLE_MS);
    this._update();
  }

  private _cancelUpdate(): void {
    if (this._updateTimer !== null) {
      clearInterval(this._updateTimer);
      this._updateTimer = null;
    }
  }

  private _update(): void {
    if (!this._visible || !this._element) return;
    const stats = this.metrics.computeStats();
    for (const rowDef of ROWS) {
      const valueEl = this.rowElements.get(rowDef.label);
      if (!valueEl) continue;
      const rawValue = stats[rowDef.key];
      valueEl.textContent = rowDef.format(rawValue as number | null);
      const color = rowDef.threshold ? rowDef.threshold(stats) : "green";
      valueEl.style.color = COLOR_MAP[color];
    }
  }
}

export function createDebugHUD(options: DebugHUDOptions): DebugHUD | null {
  if (import.meta.env.PROD) {
    return null;
  }
  return new DebugHUD(options);
}
