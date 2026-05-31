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
    const options = this.options;
    const delta = options.deltas.consume(tick, serverTime);
    const world = options.world;
    const getEntityId = options.getEntityId;
    const interestManager = options.interestManager;
    const transport = options.transport;
    for (const session of transport.sessions.values()) {
      const entityId = getEntityId(session);
      const center = entityId === undefined ? undefined : positionTile(world, entityId);
      if (!center || entityId === undefined) {
        continue;
      }
      transport.send(session.id, interestManager.filterDelta(entityId, center, delta, world));
    }
    return delta;
  }
}
