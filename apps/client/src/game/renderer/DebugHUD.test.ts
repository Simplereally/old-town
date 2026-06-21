import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebugHUD, DebugHUD } from "./DebugHUD";
import { RendererMetrics } from "./RendererMetrics";

describe("DebugHUD", () => {
  let metrics: RendererMetrics;
  let parent: HTMLDivElement;

  beforeEach(() => {
    metrics = new RendererMetrics();
    parent = document.createElement("div");
    document.body.appendChild(parent);
  });

  afterEach(() => {
    parent.remove();
  });

  it("starts hidden and does not create DOM element", () => {
    const hud = new DebugHUD({ metrics, parent });
    expect(hud.visible).toBe(false);
    expect(parent.children.length).toBe(0);
  });

  it("creates DOM element when shown", () => {
    const hud = new DebugHUD({ metrics, parent });
    hud.visible = true;
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]?.tagName).toBe("DIV");
  });

  it("toggles visibility", () => {
    const hud = new DebugHUD({ metrics, parent });
    hud.toggle();
    expect(hud.visible).toBe(true);
    expect((parent.children[0] as HTMLElement).style.display).toBe("block");
    hud.toggle();
    expect(hud.visible).toBe(false);
    expect((parent.children[0] as HTMLElement).style.display).toBe("none");
  });

  it("removes DOM element on dispose", () => {
    const hud = new DebugHUD({ metrics, parent });
    hud.visible = true;
    hud.dispose();
    expect(parent.children.length).toBe(0);
  });

  it("updates DOM with metrics at most 4 Hz", () => {
    vi.useFakeTimers();
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(16.6, 100, 200, 300);
    hud.visible = true;
    const el = parent.children[0] as HTMLElement;
    const fpsValue = Array.from(el.querySelectorAll("div")).find(
      (row) => row.children[0]?.textContent === "FPS",
    )?.children[1] as HTMLSpanElement;
    expect(fpsValue.textContent).toBe("60");
    hud.dispose();
    vi.useRealTimers();
  });

  it("formats labels from performance-budgets.md section 4", () => {
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(16.6, 100, 200, 300);
    metrics.recordLayerCounts(10, 20, 30);
    metrics.recordSnapshotDepth(4);
    metrics.recordUploadQueueDepth(1);
    metrics.recordWorkerQueueDepth(2);
    metrics.recordHeapSample(1024 * 1024 * 42.1);
    metrics.recordGpuTime(4.2);
    hud.visible = true;
    const el = parent.children[0] as HTMLElement;
    const rows = Array.from(el.querySelectorAll("div")).map((row) => ({
      label: row.children[0]?.textContent,
      value: row.children[1]?.textContent,
    }));
    const labels = rows.map((r) => r.label);
    expect(labels).toEqual([
      "FPS",
      "FT",
      "DC",
      "GEO",
      "TEX",
      "ACT",
      "OBJ",
      "CHK",
      "SBF",
      "UQ",
      "WQ",
      "HEAP",
      "GPU",
    ]);
    expect(rows.find((r) => r.label === "FPS")?.value).toBe("60");
    expect(rows.find((r) => r.label === "FT")?.value).toBe("16.6");
    expect(rows.find((r) => r.label === "DC")?.value).toBe("100");
    expect(rows.find((r) => r.label === "GEO")?.value).toBe("200");
    expect(rows.find((r) => r.label === "TEX")?.value).toBe("300");
    expect(rows.find((r) => r.label === "ACT")?.value).toBe("10");
    expect(rows.find((r) => r.label === "OBJ")?.value).toBe("20");
    expect(rows.find((r) => r.label === "CHK")?.value).toBe("30");
    expect(rows.find((r) => r.label === "SBF")?.value).toBe("4");
    expect(rows.find((r) => r.label === "UQ")?.value).toBe("1");
    expect(rows.find((r) => r.label === "WQ")?.value).toBe("2");
    expect(rows.find((r) => r.label === "HEAP")?.value).toBe("42.1 MB");
    expect(rows.find((r) => r.label === "GPU")?.value).toBe("4.2 ms");
    hud.dispose();
  });

  it("shows red threshold when frame time exceeds p99 budget", () => {
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(40, 100, 200, 300);
    hud.visible = true;
    const el = parent.children[0] as HTMLElement;
    const ftValue = Array.from(el.querySelectorAll("div")).find(
      (row) => row.children[0]?.textContent === "FT",
    )?.children[1] as HTMLSpanElement;
    expect(ftValue.style.color).toBe("rgb(248, 113, 113)");
    hud.dispose();
  });

  it("shows yellow threshold when frame time exceeds p95 budget", () => {
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(20, 100, 200, 300);
    hud.visible = true;
    const el = parent.children[0] as HTMLElement;
    const ftValue = Array.from(el.querySelectorAll("div")).find(
      (row) => row.children[0]?.textContent === "FT",
    )?.children[1] as HTMLSpanElement;
    expect(ftValue.style.color).toBe("rgb(250, 204, 21)");
    hud.dispose();
  });

  it("shows green threshold when frame time is within budget", () => {
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(10, 100, 200, 300);
    hud.visible = true;
    const el = parent.children[0] as HTMLElement;
    const ftValue = Array.from(el.querySelectorAll("div")).find(
      (row) => row.children[0]?.textContent === "FT",
    )?.children[1] as HTMLSpanElement;
    expect(ftValue.style.color).toBe("rgb(74, 222, 128)");
    hud.dispose();
  });

  it("does not update DOM when hidden", () => {
    vi.useFakeTimers();
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(10, 100, 200, 300);
    hud.visible = true;
    hud.visible = false;
    vi.advanceTimersByTime(1000);
    expect(parent.children.length).toBe(1);
    expect((parent.children[0] as HTMLElement).style.display).toBe("none");
    hud.dispose();
    vi.useRealTimers();
  });

  it("cancels update timer on dispose", () => {
    vi.useFakeTimers();
    const hud = new DebugHUD({ metrics, parent });
    metrics.recordFrame(10, 100, 200, 300);
    hud.visible = true;
    hud.dispose();
    vi.advanceTimersByTime(1000);
    expect(parent.children.length).toBe(0);
    vi.useRealTimers();
  });
});

describe("createDebugHUD", () => {
  it("returns a DebugHUD instance in non-production", () => {
    const metrics = new RendererMetrics();
    const hud = createDebugHUD({ metrics });
    expect(hud).toBeInstanceOf(DebugHUD);
    hud?.dispose();
  });
});
