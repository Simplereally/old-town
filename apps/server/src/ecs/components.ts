/**
 * Component definitions for the ECS world. Every component is a plain data object with
 * no methods. The world stores these in dense arrays indexed by entity slot.
 */
import type {
  CombatBonuses,
  Direction,
  EntityId,
  EquipmentSlotName,
  SpellDef,
  TileCoord,
} from "@old-town/shared";

/** Position in tile coordinates (integer world truth). */
export interface PositionComponent {
  entityId: EntityId;
  x: number;
  y: number;
  plane: number;
}

export type MovementMode = "walk" | "run";

/** Movement state: current path, speed mode, and deterministic blocking state. */
export interface MovementComponent {
  entityId: EntityId;
  mode: MovementMode;
  path: readonly TileCoord[];
  destination?: TileCoord;
  lastStepDirection?: Direction;
  blockedUntilTick?: number;
}

/** Base actor properties (name, level, appearance). */
export interface ActorComponent {
  entityId: EntityId;
  name: string;
  level: number;
  appearanceId: string;
}

/** Player-specific data (account, session, interest area). */
export interface PlayerComponent {
  entityId: EntityId;
  accountId: string;
  sessionId: string;
  interestRadius: number;
  spellbook?: SpellDef["spellbook"];
}

/** NPC-specific data (type, brain state, respawn). */
export type NpcBrainState =
  | "idle"
  | "wander"
  | "aggro"
  | "chase"
  | "attack"
  | "returnHome"
  | "dead"
  | "respawning";

export interface NpcComponent {
  entityId: EntityId;
  npcId: string;
  brainState: NpcBrainState;
  respawnTick: number;
  wanderRadius: number;
  home?: TileCoord;
  leashDistance?: number;
  occupiedTile?: TileCoord;
}

/** World object (tree, rock, door, etc.). */
export interface ObjectComponent {
  entityId: EntityId;
  objectId: string;
  facing: number;
  variant: number;
}

/** Ground item spawn or drop. `itemId` is a content definition id, not the runtime entity id. */
export interface GroundItemComponent {
  entityId: EntityId;
  itemId: string;
  quantity: number;
  ownerId?: EntityId;
  publicAtTick?: number;
  despawnTick?: number;
}

/**
 * A single occupied inventory slot. `uid` is a per-container instance id assigned when an
 * item first enters the container; it travels with the item across moves/swaps so the
 * client can reference a specific stack in item-option commands (`itemUid`).
 */
export interface InventorySlot {
  itemId: string;
  quantity: number;
  uid: number;
}

/**
 * Inventory container (slotted items). Plain data — all mutation logic lives in
 * `items/inventory.ts`. `slots` is length `capacity`; `undefined` marks an empty slot.
 */
export interface InventoryComponent {
  entityId: EntityId;
  containerId: string;
  capacity: number;
  slots: (InventorySlot | undefined)[];
  /** Monotonic allocator for slot `uid`s (starts at 1). */
  nextUid: number;
}

/**
 * Worn equipment. `slots` maps a canonical slot name (POC_SPEC §16.3) to the equipped item id;
 * `bonuses` is the aggregated combat bonus sum, recomputed only on equip/unequip (§16.4) so the
 * combat loop never re-sums per tick. Mutation logic lives in `items/equipment.ts`.
 */
export interface EquipmentComponent {
  entityId: EntityId;
  slots: Partial<Record<EquipmentSlotName, string>>;
  bonuses: CombatBonuses;
}

export interface SkillState {
  level: number;
  xp: number;
  /** Temporary boost above base level (e.g. from potions). */
  boost: number;
  /** Temporary drain below base level (e.g. from spells). */
  drain: number;
}

export interface SkillsComponent {
  entityId: EntityId;
  skills: Record<string, SkillState>;
}

export type CombatHitStyle = "stab" | "slash" | "crush" | "ranged" | "magic";

export interface PendingHit {
  sourceId: EntityId;
  targetId: EntityId;
  applyTick: number;
  style: CombatHitStyle;
  attackRoll: number;
  defenceRoll: number;
  hitChance: number;
  maxHit: number;
  damage: number;
  hitLanded: boolean;
}

/** Combat stats and state. */
export interface CombatantComponent {
  entityId: EntityId;
  health: number;
  maxHealth: number;
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  targetId: EntityId | undefined;
  attackCooldown: number;
  combatLevel: number;
  eatBlockedUntilTick: number;
  autoRetaliate?: boolean;
  nextAttackTick?: number;
  dead?: boolean;
  lastDamageSourceId?: EntityId;
  spellCooldowns?: Record<string, number>;
  pendingHits?: PendingHit[];
}

/** Resource node (tree, rock, fishing spot). */
export interface ResourceNodeComponent {
  entityId: EntityId;
  nodeId: string;
  active?: boolean;
  depleted: boolean;
  respawnTick: number;
}

/** Quest progress variables. */
export interface QuestVarsComponent {
  entityId: EntityId;
  vars: Record<string, number | string | boolean>;
}
