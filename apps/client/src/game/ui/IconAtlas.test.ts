import { describe, expect, it, vi } from "vitest";
import { IconAtlas, PLACEHOLDER_DATA_URI } from "./IconAtlas";

function mockFetchOk(data: unknown): void {
  const fetchSpy = vi.fn(async () => ({
    ok: true,
    json: async () => data,
  }));
  globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
}

function mockFetchFail(): void {
  const fetchSpy = vi.fn(async () => ({ ok: false, json: async () => null }));
  globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
}

/** Mock fetch that returns SVG atlas for the first call and PNG atlas for the second. */
function mockFetchTwoAtlas(svgData: unknown, pngData: unknown | null): void {
  const fetchSpy = vi.fn(async (url: string | URL) => {
    const u = url.toString();
    if (u.includes("atlas-png-index")) {
      if (pngData === null) return { ok: false, json: async () => null };
      return { ok: true, json: async () => pngData };
    }
    return { ok: true, json: async () => svgData };
  });
  globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
}

describe("IconAtlas", () => {
  it("resolveIcon returns null before load", () => {
    const atlas = new IconAtlas();
    expect(atlas.ready).toBe(false);
    expect(atlas.resolveIcon("icon_a")).toBeNull();
  });

  it("resolveIcon returns correct cell for a known AssetId after load", async () => {
    mockFetchOk({
      version: 1,
      atlas: "atlas-0.svg",
      cellSize: 64,
      cells: {
        icon_a: { x: 0, y: 0, w: 64, h: 64 },
        icon_b: { x: 64, y: 0, w: 64, h: 64 },
      },
    });
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    expect(atlas.ready).toBe(true);

    const resolved = atlas.resolveIcon("icon_b");
    expect(resolved).not.toBeNull();
    expect(resolved?.cell.x).toBe(64);
    expect(resolved?.cell.y).toBe(0);
    expect(resolved?.cellSize).toBe(64);
    expect(resolved?.atlasUrl).toContain("atlas-0.svg");
  });

  it("resolveIcon returns null for an unknown AssetId", async () => {
    mockFetchOk({
      version: 1,
      atlas: "atlas-0.svg",
      cellSize: 64,
      cells: { icon_a: { x: 0, y: 0, w: 64, h: 64 } },
    });
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    expect(atlas.resolveIcon("icon_missing")).toBeNull();
  });

  it("load is non-fatal on fetch failure (stays not ready, placeholders render)", async () => {
    mockFetchFail();
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    expect(atlas.ready).toBe(false);
    expect(atlas.resolveIcon("icon_a")).toBeNull();
  });

  it("placeholder data URI is a valid SVG data URI", () => {
    expect(PLACEHOLDER_DATA_URI).toMatch(/^data:image\/svg\+xml/);
    expect(PLACEHOLDER_DATA_URI).toContain("ff00ff");
  });

  it("PNG atlas takes precedence over SVG atlas for the same icon id", async () => {
    mockFetchTwoAtlas(
      {
        version: 1,
        atlas: "atlas-0.svg",
        cellSize: 64,
        cells: { icon_ember_bead: { x: 0, y: 0, w: 64, h: 64 } },
      },
      {
        version: 1,
        atlas: "atlas-png-0.png",
        cellSize: 64,
        cells: { icon_ember_bead: { x: 128, y: 64, w: 64, h: 64 } },
      },
    );
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    const resolved = atlas.resolveIcon("icon_ember_bead");
    expect(resolved).not.toBeNull();
    expect(resolved?.atlasUrl).toContain("atlas-png-0.png");
    expect(resolved?.cell.x).toBe(128);
    expect(resolved?.cell.y).toBe(64);
  });

  it("falls back to SVG atlas when icon is absent from PNG atlas", async () => {
    mockFetchTwoAtlas(
      {
        version: 1,
        atlas: "atlas-0.svg",
        cellSize: 64,
        cells: { icon_a: { x: 0, y: 0, w: 64, h: 64 } },
      },
      {
        version: 1,
        atlas: "atlas-png-0.png",
        cellSize: 64,
        cells: { icon_b: { x: 64, y: 0, w: 64, h: 64 } },
      },
    );
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    const resolved = atlas.resolveIcon("icon_a");
    expect(resolved).not.toBeNull();
    expect(resolved?.atlasUrl).toContain("atlas-0.svg");
  });

  it("works with SVG atlas only when PNG atlas is absent", async () => {
    mockFetchTwoAtlas(
      {
        version: 1,
        atlas: "atlas-0.svg",
        cellSize: 64,
        cells: { icon_a: { x: 0, y: 0, w: 64, h: 64 } },
      },
      null,
    );
    const atlas = new IconAtlas();
    await atlas.load("http://localhost:8080");
    expect(atlas.ready).toBe(true);
    const resolved = atlas.resolveIcon("icon_a");
    expect(resolved).not.toBeNull();
    expect(resolved?.atlasUrl).toContain("atlas-0.svg");
  });
});
