import {
  type CastSpellCommand,
  type ChatCommand,
  ClientCommandType,
  type EntityId,
  type ItemOptionCommand,
  type MoveClickCommand,
  type NpcOptionCommand,
  type ObjectOptionCommand,
  type PingCommand,
  type UiActionCommand,
  parseClientCommand,
} from "@old-town/shared";

export const IntentKind = {
  Move: "move",
  Object: "object",
  Npc: "npc",
  Item: "item",
  Spell: "spell",
  Chat: "chat",
  UiAction: "uiAction",
  Ping: "ping",
} as const;

export type IntentKind = (typeof IntentKind)[keyof typeof IntentKind];

type NormalizedByCommand =
  | { readonly kind: typeof IntentKind.Move; readonly command: MoveClickCommand }
  | { readonly kind: typeof IntentKind.Object; readonly command: ObjectOptionCommand }
  | { readonly kind: typeof IntentKind.Npc; readonly command: NpcOptionCommand }
  | { readonly kind: typeof IntentKind.Item; readonly command: ItemOptionCommand }
  | { readonly kind: typeof IntentKind.Spell; readonly command: CastSpellCommand }
  | { readonly kind: typeof IntentKind.Chat; readonly command: ChatCommand }
  | { readonly kind: typeof IntentKind.UiAction; readonly command: UiActionCommand }
  | { readonly kind: typeof IntentKind.Ping; readonly command: PingCommand };

export type BufferedIntent = NormalizedByCommand extends infer T
  ? T extends { readonly kind: infer K; readonly command: infer C }
    ? C extends { readonly commandId: number; readonly payload: infer P }
      ? {
          readonly kind: K;
          readonly ownerEntityId: EntityId;
          readonly connectionId: string;
          readonly commandId: number;
          readonly receivedTick: number;
          readonly targetTick: number;
          readonly payload: P;
        }
      : never
    : never
  : never;

export interface CommandSource {
  readonly ownerEntityId: EntityId;
  readonly connectionId: string;
  readonly receivedTick: number;
  readonly targetTick: number;
}

export type CommandRejectReason = "malformed" | "duplicate" | "late";

export type CommandBufferAcceptResult =
  | { readonly ok: true; readonly intent: BufferedIntent }
  | { readonly ok: false; readonly reason: CommandRejectReason; readonly error?: string };

export interface ConsumedCommandGroup {
  readonly ownerEntityId: EntityId;
  readonly intents: readonly BufferedIntent[];
}

export interface ConsumedCommands {
  readonly tick: number;
  readonly groups: readonly ConsumedCommandGroup[];
}

function dedupeKey(ownerEntityId: EntityId, connectionId: string): string {
  return `${connectionId}:${ownerEntityId}`;
}

function normalize(raw: unknown, source: CommandSource): CommandBufferAcceptResult {
  const parsed = parseClientCommand(raw);
  if (!parsed.ok) {
    return { ok: false, reason: "malformed", error: parsed.error };
  }

  const base = {
    ownerEntityId: source.ownerEntityId,
    connectionId: source.connectionId,
    commandId: parsed.value.commandId,
    receivedTick: source.receivedTick,
    targetTick: source.targetTick,
  };

  switch (parsed.value.type) {
    case ClientCommandType.MoveClick:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Move, payload: parsed.value.payload },
      };
    case ClientCommandType.ObjectOption:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Object, payload: parsed.value.payload },
      };
    case ClientCommandType.NpcOption:
      return { ok: true, intent: { ...base, kind: IntentKind.Npc, payload: parsed.value.payload } };
    case ClientCommandType.ItemOption:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Item, payload: parsed.value.payload },
      };
    case ClientCommandType.CastSpell:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Spell, payload: parsed.value.payload },
      };
    case ClientCommandType.Chat:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Chat, payload: parsed.value.payload },
      };
    case ClientCommandType.UiAction:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.UiAction, payload: parsed.value.payload },
      };
    case ClientCommandType.Ping:
      return {
        ok: true,
        intent: { ...base, kind: IntentKind.Ping, payload: parsed.value.payload },
      };
  }
}

export class CommandBuffer {
  private lastClosedTick = 0;
  private readonly intentsByTick = new Map<number, Map<EntityId, BufferedIntent[]>>();
  private readonly seenCommandIds = new Map<string, Set<number>>();

  accept(raw: unknown, source: CommandSource): CommandBufferAcceptResult {
    const normalized = normalize(raw, source);
    if (!normalized.ok) {
      return normalized;
    }

    if (source.targetTick <= this.lastClosedTick) {
      return { ok: false, reason: "late" };
    }

    const key = dedupeKey(source.ownerEntityId, source.connectionId);
    const seen = this.seenCommandIds.get(key) ?? new Set<number>();
    if (seen.has(normalized.intent.commandId)) {
      return { ok: false, reason: "duplicate" };
    }
    seen.add(normalized.intent.commandId);
    this.seenCommandIds.set(key, seen);

    const owners =
      this.intentsByTick.get(source.targetTick) ?? new Map<EntityId, BufferedIntent[]>();
    const intents = owners.get(source.ownerEntityId) ?? [];
    intents.push(normalized.intent);
    owners.set(source.ownerEntityId, intents);
    this.intentsByTick.set(source.targetTick, owners);

    return normalized;
  }

  consumeTick(tick: number): ConsumedCommands {
    if (tick <= this.lastClosedTick) {
      throw new Error(`Tick ${tick} is already closed`);
    }

    const owners = this.intentsByTick.get(tick) ?? new Map<EntityId, BufferedIntent[]>();
    this.intentsByTick.delete(tick);
    this.lastClosedTick = tick;

    const groups =
      owners.size === 0
        ? []
        : Array.from(owners.entries())
            .toSorted(([a], [b]) => (a as number) - (b as number))
            .map(([ownerEntityId, intents]) => ({
              ownerEntityId,
              intents: [...intents],
            }));

    return { tick, groups };
  }

  get pendingCount(): number {
    let count = 0;
    for (const owners of this.intentsByTick.values()) {
      for (const intents of owners.values()) {
        count += intents.length;
      }
    }
    return count;
  }
}
