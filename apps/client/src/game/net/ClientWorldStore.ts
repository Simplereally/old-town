import type { StatusEffectUpdate, TileCoord } from "@old-town/shared";

export interface WorldEntity {
  entityId: number;
  kind: "player" | "npc" | "object" | "groundItem" | "grave";
  tile: TileCoord;
  previousTile: TileCoord | null;
  moveSpeed: "walk" | "run" | "idle" | "teleport";
  facing: number;
  appearance: { name?: string; bodyId?: string; colors?: readonly number[] };
  healthBar: { current: number; max: number } | null;
  defId: string;
  quantity?: number;
  isLocalPlayer: boolean;
  animation?: string;
  hidden?: boolean;
  moveSpeedRaw?: "stationary" | "walk" | "run";
  equipment?: { slots: readonly (string | null)[] };
  statusEffects?: readonly StatusEffectUpdate[];
}

/**
 * Pure render-relevant client world state. Holds entity maps and region
 * load/unload metadata. No Three.js references or scene graph mutations.
 */
export class ClientWorldStore {
  private readonly _entities = new Map<number, WorldEntity>();
  private _selfEntityId = 0;

  clear(): void {
    this._entities.clear();
    this._selfEntityId = 0;
  }

  setSelfEntityId(id: number): void {
    this._selfEntityId = id;
  }

  get selfEntityId(): number {
    return this._selfEntityId;
  }

  setEntity(entity: WorldEntity): void {
    this._entities.set(entity.entityId, entity);
  }

  getEntity(entityId: number): WorldEntity | undefined {
    return this._entities.get(entityId);
  }

  removeEntity(entityId: number): void {
    this._entities.delete(entityId);
  }

  getAllEntities(): readonly WorldEntity[] {
    return Array.from(this._entities.values());
  }
}
