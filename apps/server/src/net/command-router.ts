import type { ClientCommand, EntityId } from "@old-town/shared";
import type { CommandBuffer, ConsumedCommands } from "../sim/command-buffer";
import type { TransportSession } from "./websocket-transport";

export interface CommandRouteResult {
  readonly ok: boolean;
  readonly reason?: string;
}

export interface CommandRouterOptions {
  readonly commandBuffer: CommandBuffer;
  readonly getEntityId: (session: TransportSession) => EntityId | undefined;
  readonly getCurrentTick: () => number;
  readonly spamCapPerTick?: number;
}

const DEFAULT_SPAM_CAP_PER_TICK = 8;

export class CommandRouter {
  private readonly commandBuffer: CommandBuffer;
  private readonly getEntityId: (session: TransportSession) => EntityId | undefined;
  private readonly getCurrentTick: () => number;
  private readonly spamCapPerTick: number;
  private readonly countsBySessionTick = new Map<string, number>();

  constructor(options: CommandRouterOptions) {
    this.commandBuffer = options.commandBuffer;
    this.getEntityId = options.getEntityId;
    this.getCurrentTick = options.getCurrentTick;
    this.spamCapPerTick = options.spamCapPerTick ?? DEFAULT_SPAM_CAP_PER_TICK;
  }

  route(session: TransportSession, command: ClientCommand): CommandRouteResult {
    const ownerEntityId = this.getEntityId(session);
    if (ownerEntityId === undefined) {
      return { ok: false, reason: "no_session_entity" };
    }

    const receivedTick = this.getCurrentTick();
    const targetTick = receivedTick + 1;
    const countKey = `${session.id}:${targetTick}`;
    const count = this.countsBySessionTick.get(countKey) ?? 0;
    if (count >= this.spamCapPerTick) {
      return { ok: false, reason: "spam_cap" };
    }

    const result = this.commandBuffer.accept(command, {
      ownerEntityId,
      connectionId: session.id,
      receivedTick,
      targetTick,
    });
    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    this.countsBySessionTick.set(countKey, count + 1);
    return { ok: true };
  }

  consumeTick(tick: number): ConsumedCommands {
    const counts = this.countsBySessionTick;
    for (const key of counts.keys()) {
      const tickPart = Number.parseInt(key.slice(key.lastIndexOf(":") + 1), 10);
      if (tickPart <= tick) {
        counts.delete(key);
      }
    }
    return this.commandBuffer.consumeTick(tick);
  }
}
