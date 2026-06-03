import { beforeEach, describe, expect, it, vi } from "vitest";
import { Minimap } from "./Minimap";
import type { MinimapData } from "./Minimap";
import type { MinimapEntity, MinimapTile } from "./UIState";

function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: "",
  } as unknown as CanvasRenderingContext2D;
}

function mockCanvas(): void {
  const mockCtx = createMockCanvasContext();
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return mockCtx;
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.id = "minimap-canvas";
  document.body.appendChild(canvas);
  return canvas;
}

function createData(
  playerTile: { x: number; y: number } | undefined,
  tiles: MinimapTile[],
  entities: MinimapEntity[],
): MinimapData {
  const tileMap = new Map<string, MinimapTile>();
  for (const t of tiles) {
    tileMap.set(`${t.x}:${t.y}`, t);
  }
  const entityMap = new Map<number, MinimapEntity>();
  for (const e of entities) {
    entityMap.set(e.entityId, e);
  }
  return {
    playerTile,
    tiles: tileMap,
    entities: entityMap,
  };
}

describe("Minimap", () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    mockCanvas();
    canvas = createMockCanvas();
  });

  it("renders terrain tiles as colored squares", () => {
    const data = createData(
      { x: 0, y: 0 },
      [
        { x: -1, y: -1, underlayId: "grass" },
        { x: 0, y: 0, underlayId: "dirt" },
        { x: 1, y: 1, underlayId: "water", water: true },
      ],
      [],
    );
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("renders player position as white arrow", () => {
    const data = createData({ x: 0, y: 0 }, [], []);
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    expect((ctx.beginPath as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("renders NPCs as yellow dots", () => {
    const data = createData(
      { x: 0, y: 0 },
      [],
      [{ entityId: 1, kind: "npc", tile: { x: 1, y: 1, plane: 0 }, defId: "guard" }],
    );
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[1]).toEqual([66, 62, 2, 2]);
  });

  it("renders objects as grey dots", () => {
    const data = createData(
      { x: 0, y: 0 },
      [],
      [{ entityId: 2, kind: "object", tile: { x: 2, y: 2, plane: 0 }, defId: "oak_tree" }],
    );
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[1]).toEqual([68, 60, 2, 2]);
  });

  it("renders POI objects as larger markers", () => {
    const data = createData(
      { x: 0, y: 0 },
      [],
      [{ entityId: 3, kind: "object", tile: { x: 3, y: 3, plane: 0 }, defId: "bank_booth" }],
    );
    const minimap = new Minimap({ canvas, data, getObjectName: () => "Bank Booth" });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[1]).toEqual([69, 57, 4, 4]);
  });

  it("clears canvas when no player tile is present", () => {
    const data = createData(undefined, [], []);
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    expect((ctx.clearRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("does not render entities outside view radius", () => {
    const data = createData(
      { x: 0, y: 0 },
      [],
      [{ entityId: 1, kind: "npc", tile: { x: 100, y: 100, plane: 0 } }],
    );
    const minimap = new Minimap({ canvas, data });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    minimap.render();
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual([0, 0, 128, 128]);
  });

  it("disposes without error", () => {
    const data = createData({ x: 0, y: 0 }, [], []);
    const minimap = new Minimap({ canvas, data });
    expect(() => minimap.dispose()).not.toThrow();
  });
});
