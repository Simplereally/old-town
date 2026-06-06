import type { PresentationEvent } from "./presentation-events";

export function applyRegionLoads(
  regions: readonly import("@old-town/shared").RegionLoadPacket[] | undefined,
  events: PresentationEvent[],
): void {
  if (!regions) return;
  for (const region of regions) {
    events.push({
      type: "region.load",
      payload: { regionId: region.regionId, chunks: region.chunks ?? [] },
    });
  }
}

export function applyRegionUnloads(
  regions: readonly import("@old-town/shared").RegionUnloadPacket[] | undefined,
  events: PresentationEvent[],
): void {
  if (!regions) return;
  for (const region of regions) {
    events.push({
      type: "region.unload",
      payload: { regionId: region.regionId },
    });
  }
}
