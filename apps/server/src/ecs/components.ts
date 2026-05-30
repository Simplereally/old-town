/**
 * Component definitions for the ECS world. Every component is a plain data object with
 * no methods. The world stores these in dense arrays indexed by entity slot.
 */
import type { EntityId } from "@old-town/shared";
import type { Direction, TileCoord } from "@old-town/shared";

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

/** Ground item spawn or drop. `itemId` is a content definition id, not the runtime entity id. */
export interface GroundItemComponent {
  entityId: EntityId;
  itemId: string;
  quantity: number;
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

export interface SkillState {
  level: number;
  xp: number;
}

export interface SkillsComponent {
  entityId: EntityId;
  skills: Record<string, SkillState>;
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
