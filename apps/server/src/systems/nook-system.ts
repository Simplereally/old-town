import type { EntityId, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import { hasItem } from "../items/inventory";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { getQuestStage } from "../vars/player-vars";

export interface NookDef {
  readonly id: string;
  readonly name: string;
  readonly entryTile: TileCoord;
  readonly hidden: boolean;
  readonly requiredItem?: string;
  readonly requiredQuest?: string;
  readonly requiredLevel?: { readonly skillId: string; readonly level: number };
  readonly timeWindow?: { readonly startHour: number; readonly endHour: number };
  readonly interiorTile?: TileCoord;
  readonly interiorRegionId?: string;
}

export interface NookSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
}

export type NookEntryResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position ? { x: position.x, y: position.y, plane: position.plane } : undefined;
}

function isOnTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function getDiscoveredNookSet(world: World, player: EntityId): Set<string> {
  const vars = world.getComponent(player, "vars");
  if (!vars) return new Set();
  const raw = vars.values.discovered_nooks;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as string[];
      return new Set(parsed);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

export function isNookRevealed(world: World, player: EntityId, nookId: string): boolean {
  return getDiscoveredNookSet(world, player).has(nookId);
}

function markNookDiscovered(world: World, player: EntityId, nookId: string): void {
  const vars = world.getComponent(player, "vars");
  if (!vars) return;
  const set = getDiscoveredNookSet(world, player);
  set.add(nookId);
  vars.values.discovered_nooks = JSON.stringify([...set]);
}

export function validateNookEntry(
  ctx: NookSystemContext,
  player: EntityId,
  nook: NookDef,
  serverTime: number,
): NookEntryResult {
  if (nook.requiredItem) {
    const inventory = ctx.world.getComponent(player, "inventory");
    if (!inventory || !hasItem(inventory, nook.requiredItem, 1)) {
      return { ok: false, reason: `You need a specific item to enter ${nook.name}.` };
    }
  }

  if (nook.requiredQuest) {
    const stage = getQuestStage(ctx.world, player, nook.requiredQuest);
    if (stage < 1) {
      return { ok: false, reason: `You must complete a quest to enter ${nook.name}.` };
    }
  }

  if (nook.requiredLevel) {
    const skills = ctx.world.getComponent(player, "skills");
    const skill = skills?.skills[nook.requiredLevel.skillId];
    if (!skill || skill.level < nook.requiredLevel.level) {
      return {
        ok: false,
        reason: `You need level ${nook.requiredLevel.level} ${nook.requiredLevel.skillId} to enter ${nook.name}.`,
      };
    }
  }

  if (nook.timeWindow) {
    // Server time is epoch ms; use UTC hours so entry gates are timezone-independent.
    const hour = new Date(serverTime).getUTCHours();
    const { startHour, endHour } = nook.timeWindow;
    if (startHour < endHour) {
      if (hour < startHour || hour >= endHour) {
        return { ok: false, reason: `${nook.name} is not accessible at this time.` };
      }
    } else {
      if (hour >= endHour && hour < startHour) {
        return { ok: false, reason: `${nook.name} is not accessible at this time.` };
      }
    }
  }

  return { ok: true };
}

export function revealNook(
  ctx: NookSystemContext,
  player: EntityId,
  nook: NookDef,
  serverTime: number,
): boolean {
  if (!nook.hidden) return true;
  if (isNookRevealed(ctx.world, player, nook.id)) return true;

  const validation = validateNookEntry(ctx, player, nook, serverTime);
  if (!validation.ok) return false;

  markNookDiscovered(ctx.world, player, nook.id);
  ctx.deltas.markChat({
    entityId: player,
    channel: "system",
    text: `You discover a hidden nook: ${nook.name}.`,
    serverTime,
  });
  return true;
}

export function enterNook(
  ctx: NookSystemContext,
  player: EntityId,
  nook: NookDef,
  serverTime: number,
): { readonly ok: boolean; readonly reason?: string } {
  const validation = validateNookEntry(ctx, player, nook, serverTime);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  if (nook.hidden && !isNookRevealed(ctx.world, player, nook.id)) {
    const revealed = revealNook(ctx, player, nook, serverTime);
    if (!revealed) {
      return { ok: false, reason: "This area is hidden and you cannot enter yet." };
    }
  }

  if (nook.interiorTile) {
    const movement = ctx.world.getComponent(player, "movement");
    ctx.world.setComponent(player, "position", {
      entityId: player,
      x: nook.interiorTile.x,
      y: nook.interiorTile.y,
      plane: nook.interiorTile.plane,
    });
    ctx.world.setComponent(player, "movement", {
      entityId: player,
      mode: movement?.mode ?? "walk",
      path: [],
      ...(movement?.lastStepDirection !== undefined
        ? { lastStepDirection: movement.lastStepDirection }
        : {}),
    });
    ctx.deltas.markEntityUpdate(player, {
      position: nook.interiorTile,
      moveSpeed: "stationary",
    });
    ctx.deltas.markDebugPath(player, []);
    ctx.deltas.markChat({
      entityId: player,
      channel: "system",
      text: `You enter ${nook.name}.`,
      serverTime,
    });
    return { ok: true };
  }

  return { ok: false, reason: "This nook has no interior." };
}

export function checkNookDiscovery(
  ctx: NookSystemContext,
  player: EntityId,
  nooks: readonly NookDef[],
  serverTime: number,
): string[] {
  const playerTile = tileOf(ctx.world, player);
  if (!playerTile) return [];

  const newlyDiscovered: string[] = [];
  for (const nook of nooks) {
    if (!nook.hidden) continue;
    if (isNookRevealed(ctx.world, player, nook.id)) continue;
    if (isOnTile(playerTile, nook.entryTile)) {
      const validation = validateNookEntry(ctx, player, nook, serverTime);
      if (validation.ok) {
        markNookDiscovered(ctx.world, player, nook.id);
        newlyDiscovered.push(nook.id);
        ctx.deltas.markChat({
          entityId: player,
          channel: "system",
          text: `You discover a hidden nook: ${nook.name}.`,
          serverTime,
        });
      }
    }
  }
  return newlyDiscovered;
}
