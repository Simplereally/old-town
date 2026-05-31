import type { ChatIntent, ChatPacket, EntityId } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export type ProfanityFilter = (text: string) => string;

export interface ChatSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
}

export type ChatSubmitResult =
  | { readonly ok: true; readonly packet: ChatPacket }
  | { readonly ok: false; readonly reason: "malformed" | "rate_limited" };

export interface ChatSystemOptions {
  readonly maxLength?: number;
  readonly rateLimitTicks?: number;
  readonly profanityFilter?: ProfanityFilter;
}

const DEFAULT_MAX_LENGTH = 256;
const DEFAULT_RATE_LIMIT_TICKS = 2;

function normalizeText(intent: ChatIntent, maxLength: number): string | undefined {
  const raw = intent.text.trim();
  if (raw.length === 0) return undefined;
  const hasControlCharacters = Array.from(raw).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (hasControlCharacters) return undefined;
  const text = raw.replace(/\s+/g, " ");
  if (text.length > maxLength) return undefined;
  return text;
}

export class ChatRateLimiter {
  private readonly lastChatTickByEntity = new Map<EntityId, number>();

  constructor(private readonly intervalTicks = DEFAULT_RATE_LIMIT_TICKS) {}

  allow(entityId: EntityId, tick: number): boolean {
    const lastTick = this.lastChatTickByEntity.get(entityId);
    if (lastTick !== undefined && tick - lastTick < this.intervalTicks) {
      return false;
    }
    this.lastChatTickByEntity.set(entityId, tick);
    return true;
  }
}

export class ChatSystem {
  private readonly maxLength: number;
  private readonly profanityFilter: ProfanityFilter;
  private readonly rateLimiter: ChatRateLimiter;

  constructor(options: ChatSystemOptions = {}) {
    this.maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    this.profanityFilter = options.profanityFilter ?? ((text) => text);
    this.rateLimiter = new ChatRateLimiter(options.rateLimitTicks ?? DEFAULT_RATE_LIMIT_TICKS);
  }

  submit(
    context: ChatSystemContext,
    entityId: EntityId,
    intent: ChatIntent,
    tick: number,
    serverTime: number,
  ): ChatSubmitResult {
    const text = normalizeText(intent, this.maxLength);
    if (!text) {
      return { ok: false, reason: "malformed" };
    }
    if (!this.rateLimiter.allow(entityId, tick)) {
      return { ok: false, reason: "rate_limited" };
    }

    const filteredText = this.profanityFilter(text);
    const actor = context.world.getComponent(entityId, "actor");
    const packet: ChatPacket = {
      entityId,
      ...(actor ? { name: actor.name } : {}),
      text: filteredText,
      channel: "public",
      serverTime,
    };
    context.deltas.markChat(packet);
    context.deltas.markEntityUpdate(entityId, { overheadText: filteredText });
    return { ok: true, packet };
  }
}
