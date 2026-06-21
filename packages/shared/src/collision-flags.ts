/** Collision bitmask flags for tile movement, line-of-sight, occupancy, and projectile tests. */
export enum CollisionFlag {
  BLOCK_NORTH = 1 << 0,
  BLOCK_EAST = 1 << 1,
  BLOCK_SOUTH = 1 << 2,
  BLOCK_WEST = 1 << 3,
  BLOCK_FULL = 1 << 4,
  BLOCK_FLOOR = 1 << 5,
  BLOCK_DECORATION = 1 << 6,
  BLOCK_LOS_NORTH = 1 << 7,
  BLOCK_LOS_EAST = 1 << 8,
  BLOCK_LOS_SOUTH = 1 << 9,
  BLOCK_LOS_WEST = 1 << 10,
  BLOCK_LOS_FULL = 1 << 11,
  OCCUPIED_PLAYER = 1 << 12,
  OCCUPIED_NPC = 1 << 13,
  OCCUPIED_OBJECT = 1 << 14,
  PROJECTILE_BLOCK = 1 << 15,
}

export type CollisionFlagName =
  | "BLOCK_NORTH"
  | "BLOCK_EAST"
  | "BLOCK_SOUTH"
  | "BLOCK_WEST"
  | "BLOCK_FULL"
  | "BLOCK_FLOOR"
  | "BLOCK_DECORATION"
  | "BLOCK_LOS_NORTH"
  | "BLOCK_LOS_EAST"
  | "BLOCK_LOS_SOUTH"
  | "BLOCK_LOS_WEST"
  | "BLOCK_LOS_FULL"
  | "OCCUPIED_PLAYER"
  | "OCCUPIED_NPC"
  | "OCCUPIED_OBJECT"
  | "PROJECTILE_BLOCK";

export interface CollisionFlagDescriptor {
  readonly name: CollisionFlagName;
  readonly flag: CollisionFlag;
  readonly label: string;
  readonly staticMap: boolean;
}

export const COLLISION_FLAG_DESCRIPTORS: readonly CollisionFlagDescriptor[] = [
  { name: "BLOCK_NORTH", flag: CollisionFlag.BLOCK_NORTH, label: "Block north", staticMap: true },
  { name: "BLOCK_EAST", flag: CollisionFlag.BLOCK_EAST, label: "Block east", staticMap: true },
  { name: "BLOCK_SOUTH", flag: CollisionFlag.BLOCK_SOUTH, label: "Block south", staticMap: true },
  { name: "BLOCK_WEST", flag: CollisionFlag.BLOCK_WEST, label: "Block west", staticMap: true },
  { name: "BLOCK_FULL", flag: CollisionFlag.BLOCK_FULL, label: "Full block", staticMap: true },
  { name: "BLOCK_FLOOR", flag: CollisionFlag.BLOCK_FLOOR, label: "Floor block", staticMap: true },
  {
    name: "BLOCK_DECORATION",
    flag: CollisionFlag.BLOCK_DECORATION,
    label: "Decor block",
    staticMap: true,
  },
  {
    name: "BLOCK_LOS_NORTH",
    flag: CollisionFlag.BLOCK_LOS_NORTH,
    label: "LoS north",
    staticMap: true,
  },
  {
    name: "BLOCK_LOS_EAST",
    flag: CollisionFlag.BLOCK_LOS_EAST,
    label: "LoS east",
    staticMap: true,
  },
  {
    name: "BLOCK_LOS_SOUTH",
    flag: CollisionFlag.BLOCK_LOS_SOUTH,
    label: "LoS south",
    staticMap: true,
  },
  {
    name: "BLOCK_LOS_WEST",
    flag: CollisionFlag.BLOCK_LOS_WEST,
    label: "LoS west",
    staticMap: true,
  },
  {
    name: "BLOCK_LOS_FULL",
    flag: CollisionFlag.BLOCK_LOS_FULL,
    label: "LoS full",
    staticMap: true,
  },
  {
    name: "OCCUPIED_PLAYER",
    flag: CollisionFlag.OCCUPIED_PLAYER,
    label: "Player occupied",
    staticMap: false,
  },
  {
    name: "OCCUPIED_NPC",
    flag: CollisionFlag.OCCUPIED_NPC,
    label: "NPC occupied",
    staticMap: false,
  },
  {
    name: "OCCUPIED_OBJECT",
    flag: CollisionFlag.OCCUPIED_OBJECT,
    label: "Object occupied",
    staticMap: false,
  },
  {
    name: "PROJECTILE_BLOCK",
    flag: CollisionFlag.PROJECTILE_BLOCK,
    label: "Projectile block",
    staticMap: true,
  },
];

export const STATIC_COLLISION_FLAG_DESCRIPTORS = COLLISION_FLAG_DESCRIPTORS.filter(
  (descriptor) => descriptor.staticMap,
);

export const STATIC_COLLISION_MASK = STATIC_COLLISION_FLAG_DESCRIPTORS.reduce(
  (mask, descriptor) => mask | descriptor.flag,
  0,
);

export function isValidStaticCollisionMask(mask: number): boolean {
  return Number.isInteger(mask) && mask >= 0 && (mask & ~STATIC_COLLISION_MASK) === 0;
}
