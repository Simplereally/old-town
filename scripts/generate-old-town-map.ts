#!/usr/bin/env bun
/**
 * Old Town starter-region map generator.
 * Converts 96×96 design-space coordinates into four 64×64 runtime region files.
 *
 * Run: bun scripts/generate-old-town-map.ts
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const REGION_SIZE = 64;

interface GlobalPlacement {
  id: string;
  x: number;
  y: number;
  extra?: Record<string, unknown>;
}

interface RegionPayload {
  rx: number;
  ry: number;
  plane: number;
  objects: Array<{ objectId: string; x: number; y: number; rotation?: number }>;
  npcSpawns: Array<{ npcId: string; x: number; y: number; wanderRadius?: number }>;
  groundItemSpawns: Array<{ itemId: string; quantity: number; x: number; y: number }>;
  triggers: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    tag?: string;
  }>;
  tileOverrides: Array<{ x: number; y: number; underlayId: string; collision?: number }>;
}

// ---------------------------------------------------------------------------
// Design-space placements (global coordinates, 0-95)
// ---------------------------------------------------------------------------

// Core landmarks
const landmarks: GlobalPlacement[] = [
  { id: "market_bell", x: 48, y: 48 },
  { id: "oldroad_signpost", x: 16, y: 48 },
  { id: "gravegate_arch", x: 64, y: 16 },
  { id: "sootcellar_hatch", x: 32, y: 32 },
  { id: "counting_house_ledger_desk", x: 36, y: 50 },
];

// Service/shop objects
const serviceObjects: GlobalPlacement[] = [
  { id: "counting_house_counter", x: 36, y: 48 },
  { id: "general_stall", x: 46, y: 46 },
  { id: "penny_forge_counter", x: 60, y: 48 },
  { id: "lath_bowyer_counter", x: 48, y: 60 },
  { id: "patch_awl_counter", x: 48, y: 32 },
  { id: "chalkhouse_counter", x: 32, y: 64 },
  { id: "warden_board", x: 64, y: 66 },
  { id: "shrine_hearth", x: 32, y: 44 },
  { id: "river_stoop_counter", x: 64, y: 32 },
];

// Stations
const stations: GlobalPlacement[] = [
  { id: "foundry_furnace", x: 66, y: 48 },
  { id: "foundry_anvil", x: 62, y: 48 },
  { id: "lath_bow_bench", x: 48, y: 62 },
  { id: "patch_tanning_frame", x: 48, y: 30 },
  { id: "patch_dye_vat", x: 44, y: 30 },
  { id: "chalkhouse_bead_kiln", x: 32, y: 66 },
  { id: "chalkhouse_bead_loom", x: 36, y: 66 },
  { id: "market_kitchen_hearth", x: 64, y: 30 },
  { id: "apothecary_bench", x: 64, y: 44 },
  { id: "map_table", x: 16, y: 48 },
];

// Quest objects
const questObjects: GlobalPlacement[] = [
  { id: "old_kiln", x: 68, y: 44 },
  { id: "smoke_vent", x: 66, y: 46 },
  { id: "rat_chewed_ledger", x: 30, y: 30 },
  { id: "broken_anvil_plate", x: 62, y: 46 },
  { id: "split_bow_stave", x: 48, y: 58 },
  { id: "listening_clay_node", x: 64, y: 26 },
  { id: "wrongly_planted_flower", x: 64, y: 14 },
  { id: "bell_clapper_hook", x: 48, y: 52 },
];

// Service NPCs (14 total)
const serviceNpcs: GlobalPlacement[] = [
  { id: "mara_bellkeeper", x: 48, y: 50 },
  { id: "tomas_tally", x: 36, y: 50 },
  { id: "osric_penny", x: 60, y: 48 },
  { id: "letha_lath", x: 48, y: 60 },
  { id: "nell_patch", x: 48, y: 32 },
  { id: "mother_tallow", x: 32, y: 64 },
  { id: "warden_holt", x: 64, y: 64 },
  { id: "sister_writ", x: 32, y: 48 },
  { id: "finch_quill", x: 16, y: 48 },
  { id: "edda_tinfin", x: 64, y: 32 },
  { id: "bramble_hook", x: 66, y: 30 },
  { id: "marn_lock", x: 32, y: 32 },
  { id: "pippa_hearth", x: 46, y: 46 },
  { id: "gravekeeper_soll", x: 64, y: 16 },
];

// Creature spawns (conservative, scattered)
const creatureSpawns: GlobalPlacement[] = [
  // Sootcellar
  { id: "cellar_rat", x: 28, y: 28 },
  { id: "cellar_rat", x: 30, y: 30 },
  { id: "cellar_rat", x: 32, y: 28 },
  { id: "cellar_rat", x: 34, y: 30 },
  { id: "cellar_rat", x: 36, y: 28 },
  { id: "soot_rat", x: 28, y: 24 },
  { id: "soot_rat", x: 32, y: 24 },
  { id: "blacksealed_cutpurse", x: 34, y: 34 },
  // North Quarry Road
  { id: "mud_goblin", x: 44, y: 76 },
  { id: "mud_goblin", x: 48, y: 76 },
  { id: "mud_goblin", x: 50, y: 80 },
  { id: "mud_goblin", x: 52, y: 78 },
  // Lath / Oldroad
  { id: "bell_bat", x: 56, y: 56 },
  { id: "bell_bat", x: 58, y: 58 },
  { id: "road_crow", x: 10, y: 48 },
  { id: "road_crow", x: 14, y: 52 },
  { id: "road_crow", x: 18, y: 48 },
  // Patch Lane
  { id: "bog_fox", x: 42, y: 26 },
  { id: "bog_fox", x: 44, y: 28 },
  { id: "stray_dog", x: 10, y: 44 },
  { id: "stray_dog", x: 20, y: 52 },
  // Gravegate
  { id: "grave_mite", x: 60, y: 12 },
  { id: "grave_mite", x: 64, y: 14 },
  { id: "grave_mite", x: 68, y: 12 },
  { id: "grave_wisp", x: 56, y: 8 },
  // River Stoop
  { id: "river_snapper", x: 60, y: 26 },
  { id: "river_snapper", x: 66, y: 28 },
  // Old Kiln (rare)
  { id: "ash_drake_whelp", x: 68, y: 42 },
];

// Ground item spawns (minimal)
const groundItems: Array<{ id: string; x: number; y: number; quantity: number }> = [
  { id: "pennywrought_pickaxe", x: 48, y: 76, quantity: 1 },
];

// District triggers (from district-boundaries.md)
const districtTriggers: Array<{ id: string; x: number; y: number; width: number; height: number }> =
  [
    { id: "market_bell", x: 40, y: 40, width: 16, height: 16 },
    { id: "counting_house", x: 32, y: 44, width: 8, height: 8 },
    { id: "foundry_row", x: 56, y: 40, width: 16, height: 16 },
    { id: "lath_yard", x: 40, y: 56, width: 16, height: 16 },
    { id: "patch_lane", x: 40, y: 24, width: 16, height: 16 },
    { id: "chalkhouse_court", x: 24, y: 56, width: 16, height: 16 },
    { id: "warden_steps", x: 56, y: 56, width: 16, height: 16 },
    { id: "shrine_hearth", x: 24, y: 40, width: 16, height: 16 },
    { id: "river_stoop", x: 56, y: 24, width: 16, height: 16 },
    { id: "oldroad_gate", x: 8, y: 40, width: 16, height: 16 },
    { id: "gravegate", x: 56, y: 8, width: 16, height: 16 },
    { id: "sootcellar", x: 24, y: 24, width: 16, height: 16 },
    { id: "north_quarry_road", x: 40, y: 72, width: 16, height: 16 },
    // Spawn / respawn
    { id: "player_spawn_market_bell", x: 46, y: 46, width: 4, height: 4 },
    { id: "death_respawn_counting_house", x: 34, y: 46, width: 4, height: 4 },
  ];

// Terrain overrides (sparse, by district)
const terrainOverrides: Array<{ x: number; y: number; underlayId: string; collision?: number }> = [
  // Market Bell — bellstone plaza
  ...fillRect(40, 40, 16, 16, "bellstone_plaza", 0),
  // Counting House — wood floor
  ...fillRect(32, 44, 8, 8, "wood_floor", 0),
  // Foundry Row — soot cobble
  ...fillRect(56, 40, 16, 16, "soot_cobble", 0),
  // Lath Yard — chalk flagstone
  ...fillRect(40, 56, 16, 16, "chalk_flagstone", 0),
  // Patch Lane — patch grass
  ...fillRect(40, 24, 16, 16, "patch_grass", 0),
  // Chalkhouse Court — chalk flagstone
  ...fillRect(24, 56, 16, 16, "chalk_flagstone", 0),
  // Warden Steps — packed road
  ...fillRect(56, 56, 16, 16, "packed_road", 0),
  // Shrine Hearth — stone floor
  ...fillRect(24, 40, 16, 16, "stone_floor", 0),
  // River Stoop — river mud
  ...fillRect(56, 24, 16, 16, "river_mud", 0),
  // Oldroad Gate — oldroad slabs
  ...fillRect(8, 40, 16, 16, "oldroad_slabs", 0),
  // Gravegate — grave soil
  ...fillRect(56, 8, 16, 16, "grave_soil", 0),
  // Sootcellar — dark cellar floor
  ...fillRect(24, 24, 16, 16, "dark_cellar_floor", 0),
  // North Quarry Road — quarry grit
  ...fillRect(40, 72, 16, 16, "quarry_grit", 0),
  // Main roads — packed road
  ...fillRect(40, 36, 16, 4, "packed_road", 0), // Market Bell north
  ...fillRect(40, 56, 16, 4, "packed_road", 0), // Market Bell south
  ...fillRect(36, 40, 4, 16, "packed_road", 0), // Market Bell west
  ...fillRect(56, 40, 4, 16, "packed_road", 0), // Market Bell east
];

function fillRect(
  x: number,
  y: number,
  w: number,
  h: number,
  underlayId: string,
  collision: number,
): Array<{ x: number; y: number; underlayId: string; collision: number }> {
  const tiles: Array<{ x: number; y: number; underlayId: string; collision: number }> = [];
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      tiles.push({ x: x + dx, y: y + dy, underlayId, collision });
    }
  }
  return tiles;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function toRuntimeCoords(
  globalX: number,
  globalY: number,
): { rx: number; ry: number; lx: number; ly: number } {
  const rx = Math.floor(globalX / REGION_SIZE);
  const ry = Math.floor(globalY / REGION_SIZE);
  const lx = globalX % REGION_SIZE;
  const ly = globalY % REGION_SIZE;
  return { rx, ry, lx, ly };
}

function assertLocalBounds(lx: number, ly: number, id: string): void {
  if (lx < 0 || lx >= REGION_SIZE || ly < 0 || ly >= REGION_SIZE) {
    throw new Error(`Placement ${id} has out-of-bounds local coords (${lx}, ${ly})`);
  }
}

// ---------------------------------------------------------------------------
// Build regions
// ---------------------------------------------------------------------------

function buildRegion(rx: number, ry: number): RegionPayload {
  return {
    rx,
    ry,
    plane: 0,
    objects: [],
    npcSpawns: [],
    groundItemSpawns: [],
    triggers: [],
    tileOverrides: [],
  };
}

const regions = new Map<string, RegionPayload>();
function getRegion(rx: number, ry: number): RegionPayload {
  const key = `${rx}:${ry}`;
  let region = regions.get(key);
  if (!region) {
    region = buildRegion(rx, ry);
    regions.set(key, region);
  }
  return region;
}

// Place all objects
for (const p of [...landmarks, ...serviceObjects, ...stations, ...questObjects]) {
  const { rx, ry, lx, ly } = toRuntimeCoords(p.x, p.y);
  assertLocalBounds(lx, ly, p.id);
  getRegion(rx, ry).objects.push({ objectId: p.id, x: lx, y: ly });
}

// Place service NPCs
for (const p of serviceNpcs) {
  const { rx, ry, lx, ly } = toRuntimeCoords(p.x, p.y);
  assertLocalBounds(lx, ly, p.id);
  getRegion(rx, ry).npcSpawns.push({ npcId: p.id, x: lx, y: ly, wanderRadius: 0 });
}

// Place creature spawns
for (const p of creatureSpawns) {
  const { rx, ry, lx, ly } = toRuntimeCoords(p.x, p.y);
  assertLocalBounds(lx, ly, p.id);
  getRegion(rx, ry).npcSpawns.push({ npcId: p.id, x: lx, y: ly });
}

// Place ground items
for (const p of groundItems) {
  const { rx, ry, lx, ly } = toRuntimeCoords(p.x, p.y);
  assertLocalBounds(lx, ly, p.id);
  getRegion(rx, ry).groundItemSpawns.push({ itemId: p.id, x: lx, y: ly, quantity: p.quantity });
}

// Place triggers
for (const t of districtTriggers) {
  const { rx, ry, lx, ly } = toRuntimeCoords(t.x, t.y);
  const {
    rx: rx2,
    ry: ry2,
    lx: lx2,
    ly: ly2,
  } = toRuntimeCoords(t.x + t.width - 1, t.y + t.height - 1);

  if (rx === rx2 && ry === ry2) {
    // Fits in one region
    assertLocalBounds(lx, ly, t.id);
    assertLocalBounds(lx2, ly2, t.id);
    getRegion(rx, ry).triggers.push({
      id: t.id,
      x: lx,
      y: ly,
      width: t.width,
      height: t.height,
      tag: t.id,
    });
  } else {
    // Split across regions
    // For simplicity, split by 64 boundary
    const splitX = (rx + 1) * REGION_SIZE;
    const splitY = (ry + 1) * REGION_SIZE;

    // Part A: lower-left portion
    const w1 = Math.min(t.width, splitX - t.x);
    const h1 = Math.min(t.height, splitY - t.y);
    if (w1 > 0 && h1 > 0) {
      getRegion(rx, ry).triggers.push({
        id: `${t.id}_part_a`,
        x: lx,
        y: ly,
        width: w1,
        height: h1,
        tag: t.id,
      });
    }

    // Part B: remaining portions
    if (t.x + t.width > splitX) {
      const w2 = t.x + t.width - splitX;
      const h2 = Math.min(t.height, splitY - t.y);
      if (w2 > 0 && h2 > 0) {
        getRegion(rx + 1, ry).triggers.push({
          id: `${t.id}_part_b`,
          x: 0,
          y: ly,
          width: w2,
          height: h2,
          tag: t.id,
        });
      }
    }
    if (t.y + t.height > splitY) {
      const w3 = Math.min(t.width, splitX - t.x);
      const h3 = t.y + t.height - splitY;
      if (w3 > 0 && h3 > 0) {
        getRegion(rx, ry + 1).triggers.push({
          id: `${t.id}_part_c`,
          x: lx,
          y: 0,
          width: w3,
          height: h3,
          tag: t.id,
        });
      }
    }
    if (t.x + t.width > splitX && t.y + t.height > splitY) {
      const w4 = t.x + t.width - splitX;
      const h4 = t.y + t.height - splitY;
      if (w4 > 0 && h4 > 0) {
        getRegion(rx + 1, ry + 1).triggers.push({
          id: `${t.id}_part_d`,
          x: 0,
          y: 0,
          width: w4,
          height: h4,
          tag: t.id,
        });
      }
    }
  }
}

// Place terrain
for (const t of terrainOverrides) {
  const { rx, ry, lx, ly } = toRuntimeCoords(t.x, t.y);
  assertLocalBounds(lx, ly, t.underlayId);
  getRegion(rx, ry).tileOverrides.push({
    x: lx,
    y: ly,
    underlayId: t.underlayId,
    collision: t.collision,
  });
}

// ---------------------------------------------------------------------------
// Cross-reference validation
// ---------------------------------------------------------------------------

async function validateIds(): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Load existing content
  const objectIds = new Set<string>();
  const npcIds = new Set<string>();
  const itemIds = new Set<string>();

  const objectFiles = ["content/objects/starter-objects.json"];
  const npcFiles = ["content/npcs/starter-npcs.json"];
  const itemFiles = [
    "content/items/currency.json",
    "content/items/food.json",
    "content/items/resources.json",
    "content/items/tools.json",
    "content/items/weapons.json",
    "content/items/armour.json",
    "content/items/beads.json",
    "content/items/quest.json",
  ];

  for (const f of objectFiles) {
    if (existsSync(f)) {
      const data = JSON.parse(await readFile(f, "utf-8"));
      for (const o of data) objectIds.add(o.id);
    }
  }
  for (const f of npcFiles) {
    if (existsSync(f)) {
      const data = JSON.parse(await readFile(f, "utf-8"));
      for (const n of data) npcIds.add(n.id);
    }
  }
  for (const f of itemFiles) {
    if (existsSync(f)) {
      const data = JSON.parse(await readFile(f, "utf-8"));
      for (const i of data) itemIds.add(i.id);
    }
  }

  // Check all placements
  for (const p of [...landmarks, ...serviceObjects, ...stations, ...questObjects]) {
    if (!objectIds.has(p.id)) errors.push(`Missing object: ${p.id}`);
  }
  for (const p of [...serviceNpcs, ...creatureSpawns]) {
    if (!npcIds.has(p.id)) errors.push(`Missing NPC: ${p.id}`);
  }
  for (const p of groundItems) {
    if (!itemIds.has(p.id)) errors.push(`Missing item: ${p.id}`);
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Emit JSON
// ---------------------------------------------------------------------------

async function emit() {
  const { ok, errors } = await validateIds();
  if (!ok) {
    console.error("Validation errors:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Ensure we have all four expected regions
  for (const rx of [0, 1]) {
    for (const ry of [0, 1]) {
      getRegion(rx, ry);
    }
  }

  for (const region of regions.values()) {
    const filename = `content/maps/old-town-${region.rx}-${region.ry}-${region.plane}.json`;
    const payload = {
      region: { rx: region.rx, ry: region.ry, plane: region.plane },
      tiles: {
        default: { height: 0, underlayId: "grass", collision: 0 },
        overrides: region.tileOverrides.sort((a, b) => a.x - b.x || a.y - b.y),
      },
      objects: region.objects.sort((a, b) => a.x - b.x || a.y - b.y),
      npcSpawns: region.npcSpawns.sort((a, b) => a.x - b.x || a.y - b.y),
      groundItemSpawns: region.groundItemSpawns.sort((a, b) => a.x - b.x || a.y - b.y),
      triggers: region.triggers.sort((a, b) => a.x - b.x || a.y - b.y),
    };

    await writeFile(filename, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote ${filename}`);
  }

  console.log("\nDone. Run `bun run content:validate` to verify.");
}

emit().catch((e) => {
  console.error(e);
  process.exit(1);
});
