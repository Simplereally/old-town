import {
  type AreaTriggerDef,
  type ContentRegistries,
  type DefaultTile,
  type GroundItemSpawnDef,
  isValidStaticCollisionMask,
  type MaterialDef,
  type NpcSpawnDef,
  type PlacedObjectDef,
  REGION_SIZE,
  type RegionMapDef,
  regionMapDefSchema,
  type TileOverride,
} from "@old-town/shared";

export interface EditorTile {
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly underlayId: string;
  readonly overlayId?: string;
  readonly collision: number;
  readonly water: boolean;
  readonly bridge: boolean;
  readonly zoneId?: string;
}

export interface RegionSummary {
  readonly key: string;
  readonly label: string;
  readonly region: RegionMapDef;
}

export interface TileEditPatch {
  readonly height?: number | undefined;
  readonly underlayId?: string | undefined;
  readonly overlayId?: string | null | undefined;
  readonly collision?: number | undefined;
  readonly water?: boolean | undefined;
  readonly bridge?: boolean | undefined;
  readonly zoneId?: string | null | undefined;
}

export type PlacementKind = "object" | "npc" | "groundItem" | "trigger";

export interface PlacementSelection {
  readonly kind: PlacementKind;
  readonly index: number;
}

export type PlacementDraft =
  | { readonly kind: "object"; readonly value: PlacedObjectDef }
  | { readonly kind: "npc"; readonly value: NpcSpawnDef }
  | { readonly kind: "groundItem"; readonly value: GroundItemSpawnDef }
  | { readonly kind: "trigger"; readonly value: AreaTriggerDef };

export function regionKey(region: RegionMapDef): string {
  return `${region.region.rx}:${region.region.ry}:${region.region.plane}`;
}

export function summarizeRegion(region: RegionMapDef): RegionSummary {
  return {
    key: regionKey(region),
    label: `Region ${region.region.rx}, ${region.region.ry}, plane ${region.region.plane}`,
    region,
  };
}

export function listRegions(registries: Pick<ContentRegistries, "regionMap">): RegionSummary[] {
  return Array.from(registries.regionMap.values())
    .map((region) => summarizeRegion(region))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function tileAt(region: RegionMapDef, x: number, y: number): EditorTile {
  const override = region.tiles.overrides.find((tile) => tile.x === x && tile.y === y);
  return mergeTile(region.tiles.default, override, x, y);
}

export function tileOverrideMap(region: RegionMapDef): ReadonlyMap<string, TileOverride> {
  return new Map(region.tiles.overrides.map((tile) => [`${tile.x}:${tile.y}`, tile]));
}

export function tileAtFromMap(
  region: RegionMapDef,
  overrides: ReadonlyMap<string, TileOverride>,
  x: number,
  y: number,
): EditorTile {
  return mergeTile(region.tiles.default, overrides.get(`${x}:${y}`), x, y);
}

export function materialHex(material: MaterialDef | undefined, fallback = "#1d2b20"): string {
  const color = material?.color;
  if (color === undefined) {
    return fallback;
  }
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function exportRegionJson(region: RegionMapDef): string {
  const parsed = regionMapDefSchema.parse(region);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function parseExportedRegion(json: string): RegionMapDef {
  return regionMapDefSchema.parse(JSON.parse(json));
}

export function cloneRegion(region: RegionMapDef): RegionMapDef {
  return parseExportedRegion(exportRegionJson(region));
}

export function assertRegionBounds(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < REGION_SIZE &&
    y < REGION_SIZE
  );
}

export function assertRectBounds(x: number, y: number, width: number, height: number): boolean {
  return (
    assertRegionBounds(x, y) &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    x + width <= REGION_SIZE &&
    y + height <= REGION_SIZE
  );
}

export function applyTilePatch(
  region: RegionMapDef,
  x: number,
  y: number,
  patch: TileEditPatch,
): void {
  if (!assertRegionBounds(x, y)) {
    throw new RangeError(`Tile ${x},${y} is outside the 0-${REGION_SIZE - 1} region bounds`);
  }
  if (patch.collision !== undefined && !isValidStaticCollisionMask(patch.collision)) {
    throw new RangeError(`Collision mask ${patch.collision} contains runtime-only or unknown bits`);
  }

  const current = tileAt(region, x, y);
  const overlayId =
    patch.overlayId !== undefined ? (patch.overlayId ?? undefined) : current.overlayId;
  const zoneId = patch.zoneId !== undefined ? (patch.zoneId ?? undefined) : current.zoneId;
  const next: EditorTile = {
    x,
    y,
    height: patch.height ?? current.height,
    underlayId: patch.underlayId ?? current.underlayId,
    ...(overlayId !== undefined ? { overlayId } : {}),
    collision: patch.collision ?? current.collision,
    water: patch.water ?? current.water,
    bridge: patch.bridge ?? current.bridge,
    ...(zoneId !== undefined ? { zoneId } : {}),
  };
  const override = tileOverrideFor(region.tiles.default, next);
  const index = region.tiles.overrides.findIndex((tile) => tile.x === x && tile.y === y);

  if (!override) {
    if (index >= 0) {
      region.tiles.overrides.splice(index, 1);
    }
    return;
  }

  if (index >= 0) {
    region.tiles.overrides[index] = override;
  } else {
    region.tiles.overrides.push(override);
    region.tiles.overrides.sort((a, b) => a.y - b.y || a.x - b.x);
  }
}

export function addPlacement(region: RegionMapDef, draft: PlacementDraft): PlacementSelection {
  switch (draft.kind) {
    case "object":
      assertRegionTile(draft.value.x, draft.value.y);
      region.objects.push({ ...draft.value });
      return { kind: "object", index: region.objects.length - 1 };
    case "npc":
      assertRegionTile(draft.value.x, draft.value.y);
      region.npcSpawns.push({ ...draft.value });
      return { kind: "npc", index: region.npcSpawns.length - 1 };
    case "groundItem":
      assertRegionTile(draft.value.x, draft.value.y);
      region.groundItemSpawns.push({ ...draft.value });
      return { kind: "groundItem", index: region.groundItemSpawns.length - 1 };
    case "trigger":
      assertRegionRect(draft.value.x, draft.value.y, draft.value.width, draft.value.height);
      region.triggers.push({ ...draft.value });
      return { kind: "trigger", index: region.triggers.length - 1 };
  }
}

export function movePlacement(
  region: RegionMapDef,
  selection: PlacementSelection,
  x: number,
  y: number,
): void {
  switch (selection.kind) {
    case "object": {
      const placed = requirePlacement(region.objects, selection);
      assertRegionTile(x, y);
      placed.x = x;
      placed.y = y;
      return;
    }
    case "npc": {
      const placed = requirePlacement(region.npcSpawns, selection);
      assertRegionTile(x, y);
      placed.x = x;
      placed.y = y;
      return;
    }
    case "groundItem": {
      const placed = requirePlacement(region.groundItemSpawns, selection);
      assertRegionTile(x, y);
      placed.x = x;
      placed.y = y;
      return;
    }
    case "trigger": {
      const placed = requirePlacement(region.triggers, selection);
      assertRegionRect(x, y, placed.width, placed.height);
      placed.x = x;
      placed.y = y;
      return;
    }
  }
}

export function rotateObjectPlacement(
  region: RegionMapDef,
  selection: PlacementSelection,
  delta = 1,
): void {
  if (selection.kind !== "object") {
    throw new Error("Only object placements can rotate");
  }
  const placed = requirePlacement(region.objects, selection);
  placed.rotation = positiveModulo(placed.rotation + delta, 4);
}

export function duplicatePlacement(
  region: RegionMapDef,
  selection: PlacementSelection,
): PlacementSelection {
  switch (selection.kind) {
    case "object": {
      const placed = requirePlacement(region.objects, selection);
      return addPlacement(region, {
        kind: "object",
        value: { ...placed, ...offsetPlacement(placed.x, placed.y) },
      });
    }
    case "npc": {
      const placed = requirePlacement(region.npcSpawns, selection);
      return addPlacement(region, {
        kind: "npc",
        value: { ...placed, ...offsetPlacement(placed.x, placed.y) },
      });
    }
    case "groundItem": {
      const placed = requirePlacement(region.groundItemSpawns, selection);
      return addPlacement(region, {
        kind: "groundItem",
        value: { ...placed, ...offsetPlacement(placed.x, placed.y) },
      });
    }
    case "trigger": {
      const placed = requirePlacement(region.triggers, selection);
      return addPlacement(region, {
        kind: "trigger",
        value: {
          ...placed,
          id: uniqueTriggerId(region, `${placed.id}_copy`),
          ...offsetPlacement(placed.x, placed.y, placed.width, placed.height),
        },
      });
    }
  }
}

export function deletePlacement(region: RegionMapDef, selection: PlacementSelection): void {
  switch (selection.kind) {
    case "object":
      deleteAt(region.objects, selection);
      return;
    case "npc":
      deleteAt(region.npcSpawns, selection);
      return;
    case "groundItem":
      deleteAt(region.groundItemSpawns, selection);
      return;
    case "trigger":
      deleteAt(region.triggers, selection);
      return;
  }
}

export function uniqueTriggerId(region: RegionMapDef, base: string): string {
  const used = new Set(region.triggers.map((trigger) => trigger.id));
  const normalized = base.trim() || "area_trigger";
  if (!used.has(normalized)) {
    return normalized;
  }
  for (let i = 2; i < 10_000; i += 1) {
    const candidate = `${normalized}_${i}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  throw new Error("Unable to allocate unique trigger id");
}

function mergeTile(
  defaults: DefaultTile,
  override: TileOverride | undefined,
  x: number,
  y: number,
): EditorTile {
  const zoneId = override?.zoneId ?? defaults.zoneId;
  return {
    x,
    y,
    height: override?.height ?? defaults.height,
    underlayId: override?.underlayId ?? defaults.underlayId,
    ...(override?.overlayId ? { overlayId: override.overlayId } : {}),
    collision: override?.collision ?? defaults.collision,
    water: override?.water ?? defaults.water ?? false,
    bridge: override?.bridge ?? defaults.bridge ?? false,
    ...(zoneId ? { zoneId } : {}),
  };
}

function tileOverrideFor(defaults: DefaultTile, tile: EditorTile): TileOverride | undefined {
  const override: TileOverride = { x: tile.x, y: tile.y };
  if (tile.height !== defaults.height) {
    override.height = tile.height;
  }
  if (tile.underlayId !== defaults.underlayId) {
    override.underlayId = tile.underlayId;
  }
  if (tile.overlayId !== undefined) {
    override.overlayId = tile.overlayId;
  }
  if (tile.collision !== defaults.collision) {
    override.collision = tile.collision;
  }
  if (tile.water !== (defaults.water ?? false)) {
    override.water = tile.water;
  }
  if (tile.bridge !== (defaults.bridge ?? false)) {
    override.bridge = tile.bridge;
  }
  if (tile.zoneId !== undefined && tile.zoneId !== defaults.zoneId) {
    override.zoneId = tile.zoneId;
  }
  return Object.keys(override).length > 2 ? override : undefined;
}

function assertRegionTile(x: number, y: number): void {
  if (!assertRegionBounds(x, y)) {
    throw new RangeError(`Placement tile ${x},${y} is outside region bounds`);
  }
}

function assertRegionRect(x: number, y: number, width: number, height: number): void {
  if (!assertRectBounds(x, y, width, height)) {
    throw new RangeError(
      `Placement rectangle ${x},${y},${width},${height} is outside region bounds`,
    );
  }
}

function requirePlacement<T>(placements: T[], selection: PlacementSelection): T {
  const placement = placements[selection.index];
  if (!placement) {
    throw new RangeError(`Missing ${selection.kind} placement ${selection.index}`);
  }
  return placement;
}

function deleteAt<T>(placements: T[], selection: PlacementSelection): void {
  requirePlacement(placements, selection);
  placements.splice(selection.index, 1);
}

function offsetPlacement(
  x: number,
  y: number,
  width = 1,
  height = 1,
): { readonly x: number; readonly y: number } {
  const nextX = Math.min(REGION_SIZE - width, x + 1);
  const nextY = nextX === x ? Math.min(REGION_SIZE - height, y + 1) : y;
  return { x: nextX, y: nextY };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
