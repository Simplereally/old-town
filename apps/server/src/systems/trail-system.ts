import type { ContentRegistries, EntityId, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { StatusEffectContext } from "./status-system";
import { applyStatusEffect } from "./status-system";

export interface TrailDef {
  readonly id: string;
  readonly name: string;
  readonly startTile: TileCoord;
  readonly endTile: TileCoord;
  readonly hidden: boolean;
  readonly discoveryRadius: number;
  readonly buff: string; // status effect id
  readonly shortcutSpeed?: number;
}

export interface TrailSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function isWithinRadius(a: TileCoord, b: TileCoord, radius: number): boolean {
  return a.plane === b.plane && chebyshev(a, b) <= radius;
}

function isOnTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function isBetweenTiles(playerTile: TileCoord, start: TileCoord, end: TileCoord): boolean {
  if (playerTile.plane !== start.plane || playerTile.plane !== end.plane) return false;
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return (
    playerTile.x >= minX &&
    playerTile.x <= maxX &&
    playerTile.y >= minY &&
    playerTile.y <= maxY &&
    ((start.x === end.x && playerTile.x === start.x) ||
      (start.y === end.y && playerTile.y === start.y) ||
      Math.abs(playerTile.x - start.x) === Math.abs(playerTile.y - start.y))
  );
}

function getDiscoveredTrailSet(world: World, player: EntityId): Set<string> {
  const vars = world.getComponent(player, "vars");
  if (!vars) return new Set();
  const raw = vars.values.discovered_trails;
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

function markTrailDiscovered(world: World, player: EntityId, trailId: string): void {
  const vars = world.getComponent(player, "vars");
  if (!vars) return;
  const set = getDiscoveredTrailSet(world, player);
  set.add(trailId);
  vars.values.discovered_trails = JSON.stringify([...set]);
}

export function isTrailDiscovered(world: World, player: EntityId, trailId: string): boolean {
  return getDiscoveredTrailSet(world, player).has(trailId);
}

export function isPlayerOnTrail(playerTile: TileCoord, trail: TrailDef): boolean {
  return (
    isOnTile(playerTile, trail.startTile) ||
    isOnTile(playerTile, trail.endTile) ||
    isBetweenTiles(playerTile, trail.startTile, trail.endTile)
  );
}

export function checkTrailDiscovery(
  ctx: TrailSystemContext,
  player: EntityId,
  trails: readonly TrailDef[],
  serverTime: number,
): string[] {
  const playerTile = tileOf(ctx.world, player);
  if (!playerTile) return [];

  const newlyDiscovered: string[] = [];
  for (const trail of trails) {
    if (!trail.hidden) continue;
    if (isTrailDiscovered(ctx.world, player, trail.id)) continue;
    if (
      isWithinRadius(playerTile, trail.startTile, trail.discoveryRadius) ||
      isWithinRadius(playerTile, trail.endTile, trail.discoveryRadius)
    ) {
      markTrailDiscovered(ctx.world, player, trail.id);
      newlyDiscovered.push(trail.id);
      ctx.deltas.markChat({
        entityId: player,
        channel: "system",
        text: `You discover a hidden trail: ${trail.name}.`,
        serverTime,
      });
    }
  }

  return newlyDiscovered;
}

export function applyTrailBuff(
  ctx: TrailSystemContext,
  player: EntityId,
  trail: TrailDef,
  _tick: number,
): boolean {
  const playerTile = tileOf(ctx.world, player);
  if (!playerTile) return false;

  if (trail.hidden && !isTrailDiscovered(ctx.world, player, trail.id)) return false;
  if (!isPlayerOnTrail(playerTile, trail)) return false;

  const statusCtx: StatusEffectContext = {
    world: ctx.world,
    deltas: ctx.deltas,
    registries: ctx.registries,
  };

  return applyStatusEffect(statusCtx, player, trail.buff, undefined, 2);
}

export function processTrailBuffs(
  ctx: TrailSystemContext,
  player: EntityId,
  trails: readonly TrailDef[],
  tick: number,
): void {
  for (const trail of trails) {
    applyTrailBuff(ctx, player, trail, tick);
  }
}

export function getTrailShortcutPath(
  playerTile: TileCoord,
  trail: TrailDef,
): TileCoord[] | undefined {
  if (!isPlayerOnTrail(playerTile, trail)) return undefined;

  const dest = isOnTile(playerTile, trail.startTile) ? trail.endTile : trail.startTile;
  return [dest];
}

export function handleTrailShortcut(
  ctx: TrailSystemContext,
  player: EntityId,
  trail: TrailDef,
  serverTime: number,
): boolean {
  const playerTile = tileOf(ctx.world, player);
  if (!playerTile) return false;

  if (trail.hidden && !isTrailDiscovered(ctx.world, player, trail.id)) {
    ctx.deltas.markChat({
      entityId: player,
      channel: "system",
      text: "You have not discovered this trail yet.",
      serverTime,
    });
    return false;
  }

  const shortcutPath = getTrailShortcutPath(playerTile, trail);
  if (!shortcutPath) return false;

  const movement = ctx.world.getComponent(player, "movement");
  const mode = movement?.mode ?? "walk";
  const speed = trail.shortcutSpeed ?? 2;
  const dest = shortcutPath[shortcutPath.length - 1];
  ctx.world.setComponent(player, "movement", {
    entityId: player,
    mode,
    path: shortcutPath,
    ...(dest !== undefined ? { destination: dest } : {}),
    ...(movement?.lastStepDirection !== undefined
      ? { lastStepDirection: movement.lastStepDirection }
      : {}),
  });

  // Emit a shortcut step count based on speed multiplier
  const stepCount = speed;
  ctx.deltas.markEntityUpdate(player, {
    moveSpeed: stepCount > 1 ? "run" : "walk",
  });

  return true;
}
