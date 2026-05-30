/**
 * Component definitions for the ECS world. Every component is a plain data object with
 * no methods. The world stores these in dense arrays indexed by entity slot.
 */
import type { EntityId } from "@old-town/shared";

/** Position in tile coordinates (integer world truth). */
export interface PositionComponent {
  entityId: EntityId;
  x: number;
  y: number;
  plane: number;
}

/** Movement state: current path, speed, and whether the entity is moving. */
export interface MovementComponent {
  entityId: EntityId;
  path: readonly { x: number; y: number }[];
  speed: number; // tiles per tick
  moving: boolean;
  nextMoveTick: number;
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
}

/** NPC-specific data (type, brain state, respawn). */
export interface NpcComponent {
  entityId: EntityId;
  npcId: string;
  brainState: string;
  respawnTick: number;
  wanderRadius: number;
}

/** World object (tree, rock, door, etc.). */
export interface ObjectComponent {
  entityId: EntityId;
  objectId: string;
  facing: number;
  variant: number;
}

/** Inventory container (slotted items). */
export interface InventoryComponent {
  entityId: EntityId;
  capacity: number;
  items: (readonly [string, number] | undefined)[];
}

/** Equipment slots. */
export interface EquipmentComponent {
  entityId: EntityId;
  slots: Record<string, string | undefined>;
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
}

/** Resource node (tree, rock, fishing spot). */
export interface ResourceNodeComponent {
  entityId: EntityId;
  nodeId: string;
  depleted: boolean;
  respawnTick: number;
}

/** Quest progress variables. */
export interface QuestVarsComponent {
  entityId: EntityId;
  vars: Record<string, number | string | boolean>;
}
