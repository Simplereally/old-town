import { GAME_TICK_MS } from "@old-town/shared";
import type { Logger } from "../logger";

export const TickPhase = {
  InputClose: "inputClose",
  Interruptions: "interruptions",
  ActionQueueTimers: "actionQueueTimers",
  Movement: "movement",
  TargetValidation: "targetValidation",
  NpcAi: "npcAi",
  CombatStartEvents: "combatStartEvents",
  DamageResolutionEvents: "damageResolutionEvents",
  StatusEffects: "statusEffects",
  FoodPotionPrayerStatChanges: "foodPotionPrayerStatChanges",
  DeathResolution: "deathResolution",
  SkillingProgress: "skillingProgress",
  ShopRestock: "shopRestock",
  QuestTriggersVarbits: "questTriggersVarbits",
  ContractLifecycle: "contractLifecycle",
  AppearanceUpdate: "appearanceUpdate",
  SnapshotDeltaBuild: "snapshotDeltaBuild",
} as const;

export type TickPhase = (typeof TickPhase)[keyof typeof TickPhase];

export const TICK_PHASE_ORDER = [
  TickPhase.InputClose,
  TickPhase.Interruptions,
  TickPhase.ActionQueueTimers,
  TickPhase.Movement,
  TickPhase.TargetValidation,
  TickPhase.NpcAi,
  TickPhase.CombatStartEvents,
  TickPhase.DamageResolutionEvents,
  TickPhase.StatusEffects,
  TickPhase.FoodPotionPrayerStatChanges,
  TickPhase.DeathResolution,
  TickPhase.SkillingProgress,
  TickPhase.ShopRestock,
  TickPhase.QuestTriggersVarbits,
  TickPhase.ContractLifecycle,
  TickPhase.AppearanceUpdate,
  TickPhase.SnapshotDeltaBuild,
] as const satisfies readonly TickPhase[];

export interface TickContext {
  readonly tick: number;
  readonly serverTime: number;
  readonly phase: TickPhase;
}

export type TickPhaseHandler = (context: TickContext) => void;

export interface TickLoopOptions {
  readonly logger?: Pick<Logger, "error">;
  readonly startTick?: number;
  readonly startServerTime?: number;
}

export class TickLoopError extends Error {
  constructor(
    readonly phase: TickPhase,
    readonly tick: number,
    cause: unknown,
  ) {
    super(`Tick phase ${phase} failed at tick ${tick}`, { cause });
    this.name = "TickLoopError";
  }
}

export class TickLoop {
  private tick: number;
  private serverTime: number;
  private readonly handlers = new Map<TickPhase, TickPhaseHandler[]>();
  private readonly logger: Pick<Logger, "error"> | undefined;

  constructor(options: TickLoopOptions = {}) {
    this.tick = options.startTick ?? 0;
    this.serverTime = options.startServerTime ?? 0;
    this.logger = options.logger;
    for (const phase of TICK_PHASE_ORDER) {
      this.handlers.set(phase, []);
    }
  }

  get currentTick(): number {
    return this.tick;
  }

  get currentServerTime(): number {
    return this.serverTime;
  }

  registerPhase(phase: TickPhase, handler: TickPhaseHandler): () => void {
    const handlers = this.handlers.get(phase);
    if (!handlers) {
      throw new Error(`Unknown tick phase: ${phase}`);
    }
    handlers.push(handler);
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  runOneTick(): number {
    this.tick += 1;
    this.serverTime += GAME_TICK_MS;

    const tick = this.tick;
    const serverTime = this.serverTime;
    const handlersMap = this.handlers;
    const logger = this.logger;
    for (const phase of TICK_PHASE_ORDER) {
      const context: TickContext = {
        tick,
        serverTime,
        phase,
      };
      const handlers = handlersMap.get(phase) ?? [];
      for (const handler of handlers) {
        try {
          handler(context);
        } catch (cause) {
          logger?.error("tick", "Tick phase failed", {
            phase,
            tick,
          });
          throw new TickLoopError(phase, tick, cause);
        }
      }
    }

    return this.tick;
  }

  runDueTicks(nowMs: number): number {
    let ran = 0;
    while (this.serverTime + GAME_TICK_MS <= nowMs) {
      this.runOneTick();
      ran += 1;
    }
    return ran;
  }
}
