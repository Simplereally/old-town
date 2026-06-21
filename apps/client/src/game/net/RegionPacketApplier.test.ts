import type { RegionLoadPacket, RegionUnloadPacket } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { PresentationEvent } from "./presentation-events";
import { applyRegionLoads, applyRegionUnloads } from "./RegionPacketApplier";

function rid(value: string): RegionLoadPacket["regionId"] {
  return value as RegionLoadPacket["regionId"];
}

function loadPacket(regionId: string, chunks: RegionLoadPacket["chunks"]): RegionLoadPacket {
  return {
    region: { rx: 0, ry: 0, plane: 0 },
    regionId: rid(regionId),
    chunks,
  };
}

function unloadPacket(regionId: string): RegionUnloadPacket {
  return { regionId: rid(regionId) };
}

describe("applyRegionLoads", () => {
  it("pushes a region.load event per region with its chunks", () => {
    const events: PresentationEvent[] = [];
    applyRegionLoads(
      [
        loadPacket("r1", [{ cx: 0, cy: 0, tiles: [] }]),
        loadPacket("r2", [
          { cx: 1, cy: 0, tiles: [] },
          { cx: 1, cy: 1, tiles: [] },
        ]),
      ],
      events,
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      type: "region.load",
      payload: { regionId: "r1", chunks: [{ cx: 0, cy: 0, tiles: [] }] },
    });
    expect(events[1]?.type).toBe("region.load");
    expect(events[1]?.payload.regionId).toBe("r2");
    expect(events[1]?.payload.chunks).toHaveLength(2);
  });

  it("substitutes an empty chunk array when chunks is undefined", () => {
    const events: PresentationEvent[] = [];
    applyRegionLoads([loadPacket("rX", undefined)], events);
    expect(events).toHaveLength(1);
    expect(events[0]?.payload.chunks).toEqual([]);
  });

  it("does nothing when regions is undefined", () => {
    const events: PresentationEvent[] = [];
    applyRegionLoads(undefined, events);
    expect(events).toEqual([]);
  });

  it("does nothing when regions is an empty array", () => {
    const events: PresentationEvent[] = [];
    applyRegionLoads([], events);
    expect(events).toEqual([]);
  });
});

describe("applyRegionUnloads", () => {
  it("pushes a region.unload event per region", () => {
    const events: PresentationEvent[] = [];
    applyRegionUnloads([unloadPacket("old1"), unloadPacket("old2")], events);
    expect(events).toEqual([
      { type: "region.unload", payload: { regionId: "old1" } },
      { type: "region.unload", payload: { regionId: "old2" } },
    ]);
  });

  it("does nothing when regions is undefined", () => {
    const events: PresentationEvent[] = [];
    applyRegionUnloads(undefined, events);
    expect(events).toEqual([]);
  });

  it("does nothing when regions is an empty array", () => {
    const events: PresentationEvent[] = [];
    applyRegionUnloads([], events);
    expect(events).toEqual([]);
  });
});
