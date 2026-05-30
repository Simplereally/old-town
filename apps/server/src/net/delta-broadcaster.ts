import type { EntityId, EntitySpawnPacket, TickDeltaPacket, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { InterestManager } from "./interest-manager";
import type { TransportSession } from "./websocket-transport";

interface DeltaTransport {
  readonly sessions: ReadonlyMap<string, TransportSession>;
  send(sessionId: string, packet: TickDeltaPacket): boolean;
}

export interface DeltaBroadcasterOptions {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly interestManager: InterestManager;
  readonly transport: DeltaTransport;
  readonly getEntityId: (session: TransportSession) => EntityId | undefined;
}

function positionTile(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.stores.position.get(entityId);
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

export class DeltaBroadcaster {
  constructor(private readonly options: DeltaBroadcasterOptions) {}

  primeSession(session: TransportSession, entities: readonly EntitySpawnPacket[]): void {
    const entityId = this.options.getEntityId(session);
    const center = entityId === undefined ? undefined : positionTile(this.options.world, entityId);
    if (!center || entityId === undefined) {
      return;
    }
    this.options.interestManager.updateInterest(entityId, center);
    this.options.interestManager.primeKnownEntities(entityId, entities);
  }

  broadcastTick(tick: number, serverTime: number): TickDeltaPacket {
    const delta = this.options.deltas.consume(tick, serverTime);
    for (const session of this.options.transport.sessions.values()) {
      const entityId = this.options.getEntityId(session);
      const center =
        entityId === undefined ? undefined : positionTile(this.options.world, entityId);
      if (!center || entityId === undefined) {
        continue;
      }
      this.options.transport.send(
        session.id,
        this.options.interestManager.filterDelta(entityId, center, delta, this.options.world),
      );
    }
    return delta;
  }
}
