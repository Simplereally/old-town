import type { RegionMapDef } from "@old-town/shared";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { PlacementSelection } from "./editor-model";
import { exportRegionJson } from "./editor-model";
import type { EditorState } from "./main";

// Mock import.meta.glob (Vite feature) before importing main.ts
vi.stubGlobal("import.meta.glob", vi.fn(() => ({})));

let commitPlacementMutation: (
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
  mutate: (region: RegionMapDef) => PlacementSelection | undefined,
) => void;

function makeElement<T extends HTMLElement>(
  tag: string,
  id: string,
  attrs?: Record<string, string>,
): T {
  const el = document.createElement(tag) as T;
  el.id = id;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  document.body.appendChild(el);
  return el;
}

function setupDom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const g = global as unknown as typeof globalThis & {
    document: Document;
    window: Window & typeof globalThis;
  };
  g.document = dom.window.document;
  g.window = dom.window;
  g.window.devicePixelRatio = 1;

  // Mock URL.createObjectURL / revokeObjectURL
  const blobUrls = new Map<string, Blob>();
  dom.window.URL.createObjectURL = (blob: Blob) => {
    const url = `blob:mock-${Math.random().toString(36).slice(2)}`;
    blobUrls.set(url, blob);
    return url;
  };
  dom.window.URL.revokeObjectURL = (url: string) => {
    blobUrls.delete(url);
  };

  // Create all elements needed by main.ts
  const elements: Array<{ id: string; tag: string; type?: string }> = [
    { id: "app", tag: "div" },
    { id: "validity-pill", tag: "div" },
    { id: "stat-region", tag: "span" },
    { id: "stat-overrides", tag: "span" },
    { id: "stat-objects", tag: "span" },
    { id: "stat-npcs", tag: "span" },
    { id: "active-region", tag: "span" },
    { id: "active-zoom", tag: "span" },
    { id: "probe-status", tag: "span" },
    { id: "undo-button", tag: "button" },
    { id: "redo-button", tag: "button" },
    { id: "move-placement", tag: "button" },
    { id: "rotate-placement", tag: "button" },
    { id: "duplicate-placement", tag: "button" },
    { id: "delete-placement", tag: "button" },
    { id: "selected-title", tag: "span" },
    { id: "selected-detail", tag: "span" },
    { id: "hover-title", tag: "span" },
    { id: "hover-detail", tag: "span" },
    { id: "placement-kind", tag: "select" },
    { id: "object-palette", tag: "select" },
    { id: "resource-palette", tag: "select" },
    { id: "npc-palette", tag: "select" },
    { id: "item-palette", tag: "select" },
    { id: "object-rotation", tag: "input" },
    { id: "npc-wander", tag: "input" },
    { id: "item-quantity", tag: "input" },
    { id: "trigger-id", tag: "input" },
    { id: "trigger-width", tag: "input" },
    { id: "trigger-height", tag: "input" },
    { id: "trigger-tag", tag: "input" },
    { id: "region-select", tag: "select" },
    { id: "brush-mode", tag: "select" },
    { id: "underlay-select", tag: "select" },
    { id: "overlay-select", tag: "select" },
    { id: "height-input", tag: "input" },
    { id: "water-toggle", tag: "input", type: "checkbox" },
    { id: "bridge-toggle", tag: "input", type: "checkbox" },
    { id: "zone-input", tag: "input" },
    { id: "collision-flags", tag: "div" },
    { id: "export-output", tag: "textarea" },
    { id: "download-link", tag: "a" },
  ];

  for (const { id, tag, type } of elements) {
    const el = makeElement(tag, id);
    if (tag === "input" && type) {
      (el as HTMLInputElement).type = type;
    }
    if (tag === "select") {
      el.appendChild(document.createElement("option"));
    }
  }

  // Create canvas with mock 2D context
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.getBoundingClientRect = () =>
    ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => "",
    }) as DOMRect;
  const mockCanvas = canvas as unknown as {
    getContext: (ctxId: string) => CanvasRenderingContext2D | null;
  };
  mockCanvas.getContext = (ctxId: string) => {
    if (ctxId === "2d") {
      return {
        setTransform: () => {},
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        transform: () => {},
        setLineDash: () => {},
        measureText: () => ({ width: 0 }),
        fillText: () => {},
        globalAlpha: 1,
        canvas,
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  };
  document.body.appendChild(canvas);

  return { canvas };
}

const baseRegion: RegionMapDef = {
  region: { rx: 0, ry: 0, plane: 0 },
  tiles: {
    default: { height: 0, underlayId: "grass", collision: 0 },
    overrides: [],
  },
  objects: [],
  npcSpawns: [],
  groundItemSpawns: [],
  triggers: [],
  resourceNodeSpawns: [],
  playerSpawnPoints: [],
  deathRespawnPoints: [],
};

function makeState(region: RegionMapDef = baseRegion): EditorState {
  return {
    registries: {
      material: new Map(),
      object: new Map(),
      npc: new Map(),
      item: new Map(),
      resourceNode: new Map(),
      animation: new Map(),
      spell: new Map(),
      dropTable: new Map(),
      quest: new Map(),
      dialogue: new Map(),
      shop: new Map(),
      bank: new Map(),
      serviceFee: new Map(),
      statusEffect: new Map(),
      contract: new Map(),
      property: new Map(),
      charter: new Map(),
      processingRecipe: new Map(),
      regionMap: new Map(),
      skill: new Map(),
    },
    regions: [],
    selected: {
      key: "0:0:0",
      label: "Region 0, 0, plane 0",
      region,
    },
    cameraX: 32,
    cameraY: 32,
    zoom: 12,
    brushMode: "inspect",
    history: { undo: [], redo: [] },
    probe: { mode: "path" },
  };
}

beforeAll(async () => {
  setupDom();
  const gt = globalThis as unknown as typeof globalThis & {
    URL: { createObjectURL: (_blob: Blob) => string; revokeObjectURL: () => void };
  };
  gt.URL.createObjectURL = (_blob: Blob) =>
    `blob:mock-${Math.random().toString(36).slice(2)}`;
  gt.URL.revokeObjectURL = () => {};
  const mod = await import("./main");
  commitPlacementMutation = mod.commitPlacementMutation;
});

describe("commitPlacementMutation", () => {
  it("happy path: applies mutation, updates history, clears redo, and sets selection", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const pill = document.getElementById("validity-pill") as HTMLDivElement;

    state.history.redo.push(structuredClone(baseRegion));

    const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
      region.objects.push({ objectId: "oak_tree", x: 5, y: 5, rotation: 0 });
      return { kind: "object", index: 0 };
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(state.selected.region.objects.length).toBe(1);
    expect(state.selected.region.objects[0]).toMatchObject({ objectId: "oak_tree", x: 5, y: 5 });
    expect(state.selectedPlacement).toEqual({ kind: "object", index: 0 });
    expect(state.history.undo.length).toBe(1);
    expect(state.history.redo.length).toBe(0);
    expect(pill.textContent).toBe("placement saved");
    expect(pill.dataset.severity).toBe("ok");
    expect(exportOutput.value).toBe(exportRegionJson(state.selected.region));
  });

  it("error path: mutation throws, no history change, error status", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const pill = document.getElementById("validity-pill") as HTMLDivElement;

    const mutate = () => {
      throw new Error("invalid placement");
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(state.selected.region).toEqual(baseRegion);
    expect(state.history.undo.length).toBe(0);
    expect(state.history.redo.length).toBe(0);
    expect(pill.textContent).toBe("invalid placement");
    expect(pill.dataset.severity).toBe("error");
  });

  it("unchanged path: mutation does not change region, no history update, unchanged status", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const pill = document.getElementById("validity-pill") as HTMLDivElement;

    state.history.undo.push(structuredClone(baseRegion));

    const mutate = () => undefined;

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(state.history.undo.length).toBe(1);
    expect(state.history.redo.length).toBe(0);
    expect(pill.textContent).toBe("unchanged");
    expect(pill.dataset.severity).toBe("ok");
  });

  it("caps undo stack at 50 entries", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    // Pre-fill undo with 50 entries
    for (let i = 0; i < 50; i++) {
      state.history.undo.push(structuredClone(baseRegion));
    }

    let counter = 0;
    const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
      region.objects.push({ objectId: "tree", x: counter, y: counter, rotation: 0 });
      counter += 1;
      return { kind: "object", index: region.objects.length - 1 };
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(state.history.undo.length).toBe(50);
    expect(state.history.undo[0]).toEqual(baseRegion);
    expect(state.history.undo[49]).toEqual(baseRegion);
  });

  it("clears redo on every successful mutation", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    state.history.redo.push(structuredClone(baseRegion), structuredClone(baseRegion));

    const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
      region.objects.push({ objectId: "tree", x: 1, y: 1, rotation: 0 });
      return { kind: "object", index: 0 };
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);
    expect(state.history.redo.length).toBe(0);
  });

  it("clone safety: before snapshot is independent of original state", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
      region.objects.push({ objectId: "tree", x: 1, y: 1, rotation: 0 });
      return { kind: "object", index: 0 };
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    // After mutation, the undo entry should be a clone of the original region
    const undoEntry = state.history.undo[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry?.objects.length).toBe(0);
    expect(state.selected.region.objects.length).toBe(1);
    expect(undoEntry).not.toBe(state.selected.region);
  });

  it("handles delete returning undefined selection", () => {
    const region = structuredClone(baseRegion);
    region.objects.push({ objectId: "tree", x: 1, y: 1, rotation: 0 });
    const state = makeState(region);
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const pill = document.getElementById("validity-pill") as HTMLDivElement;

    const mutate = (r: RegionMapDef) => {
      r.objects.pop();
      return undefined;
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(state.selected.region.objects.length).toBe(0);
    expect(state.selectedPlacement).toBeUndefined();
    expect(pill.textContent).toBe("placement saved");
    expect(state.history.undo.length).toBe(1);
  });

  it("non-Error throw results in generic error message", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const pill = document.getElementById("validity-pill") as HTMLDivElement;

    const mutate = () => {
      throw "not an error object";
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(pill.textContent).toBe("placement edit failed");
    expect(pill.dataset.severity).toBe("error");
  });

  it("updates region options in select element", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
      region.objects.push({ objectId: "tree", x: 1, y: 1, rotation: 0 });
      return { kind: "object", index: 0 };
    };

    commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);

    expect(select.value).toBe("0:0:0");
    expect(select.children.length).toBe(1);
  });

  it("handles multiple sequential mutations building undo stack", () => {
    const state = makeState();
    const select = document.getElementById("region-select") as HTMLSelectElement;
    const exportOutput = document.getElementById("export-output") as HTMLTextAreaElement;
    const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    for (let i = 0; i < 3; i++) {
      const mutate = (region: RegionMapDef): PlacementSelection | undefined => {
        region.objects.push({ objectId: `tree_${i}`, x: i, y: i, rotation: 0 });
        return { kind: "object", index: region.objects.length - 1 };
      };
      commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, mutate);
    }

    expect(state.history.undo.length).toBe(3);
    expect(state.selected.region.objects.length).toBe(3);
    expect(state.selected.region.objects[0]?.objectId).toBe("tree_0");
    expect(state.selected.region.objects[1]?.objectId).toBe("tree_1");
    expect(state.selected.region.objects[2]?.objectId).toBe("tree_2");
  });
});
