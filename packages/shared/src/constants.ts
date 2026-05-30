/**
 * Engine constants — the single source of truth for spatial and temporal quanta.
 * These match POC_SPEC.md §4. Never redefine chunk/region/tick sizes anywhere else;
 * import them from here so server simulation and client presentation cannot drift.
 */

/** Server simulation tick length in milliseconds. The core gameplay quantum (POC_SPEC §2.3). */
export const GAME_TICK_MS = 600;

/** World units per tile edge. Renderer-facing only; gameplay truth is integer tiles. */
export const TILE_SIZE_WORLD_UNITS = 1;

/** Tiles per chunk axis. A chunk is CHUNK_SIZE × CHUNK_SIZE tiles (8×8). */
export const CHUNK_SIZE = 8;

/** Tiles per region axis. A region is REGION_SIZE × REGION_SIZE tiles (64×64). */
export const REGION_SIZE = 64;

/** Chunks per region axis (REGION_SIZE / CHUNK_SIZE = 8). A region is 8×8 chunks. */
export const CHUNKS_PER_REGION = REGION_SIZE / CHUNK_SIZE;

/** Active scene size per axis in tiles (13×13 chunks, classic-inspired). */
export const ACTIVE_SCENE_SIZE = 104;

/** Number of vertical planes (0..3). */
export const PLANES = 4;

/** Player inventory slot count (POC_SPEC §16.2). */
export const INVENTORY_SIZE = 28;

/** Number of equipment slots a character can wear at once (POC_SPEC §16.3). */
export const EQUIPMENT_SLOT_COUNT = 11;
