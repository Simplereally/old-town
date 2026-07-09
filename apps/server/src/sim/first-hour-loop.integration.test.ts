import { type ClientCommand, ClientCommandType } from "@old-town/shared/protocol/commands";
import type { EntitySpawnPacket } from "@old-town/shared/protocol/entity-update";
import type {
  FullStatePacket,
  HitsplatPacket,
  InventoryDelta,
  InventorySlotChange,
  SkillDelta,
  TickDeltaPacket,
} from "@old-town/shared/protocol/packets";
import type { TileCoord } from "@old-town/shared/types/coords";
import type { EntityId } from "@old-town/shared/types/ids";
import { beforeAll, describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import type { Logger } from "../logger";
import type { DeltaTransport } from "../net/delta-transport";
import type { TransportSession } from "../net/websocket-transport";
import { createSimulationKernel, type SimulationKernel } from "./simulation-kernel";

interface ItemStack {
  readonly itemId: string;
  readonly quantity: number;
  readonly uid?: number;
}

class AuthoritativeClientState {
  readonly entities = new Map<EntityId, EntitySpawnPacket>();
  readonly inventory = new Map<number, ItemStack>();
  readonly bank = new Map<number, ItemStack>();
  readonly skills = new Map<string, SkillDelta>();
  readonly packets: TickDeltaPacket[] = [];
  readonly xpDrops: { readonly skillId: string; readonly amount: number }[] = [];
  readonly hitsplats: HitsplatPacket[] = [];
  readonly chat: string[] = [];
  readonly removedEntities = new Set<EntityId>();
  private readonly inventoryContainerId: string;
  private bankContainerId: string | undefined;

  constructor(
    readonly selfEntityId: EntityId,
    fullState: FullStatePacket,
  ) {
    for (const entity of fullState.entities) {
      this.entities.set(entity.entityId, entity);
    }
    if (!fullState.inventory) {
      throw new Error("Full state is missing the player inventory");
    }
    this.inventoryContainerId = fullState.inventory.containerId;
    this.applyContainerDelta(fullState.inventory, this.inventory);
    if (fullState.bank) {
      this.bankContainerId = fullState.bank.containerId;
      this.applyContainerDelta(fullState.bank, this.bank);
    }
    for (const skill of fullState.skills ?? []) {
      this.skills.set(skill.skillId, skill);
    }
  }

  apply(packet: TickDeltaPacket): void {
    this.packets.push(packet);
    for (const entity of packet.entityAdds) {
      this.entities.set(entity.entityId, entity);
    }
    for (const entityId of packet.entityRemoves) {
      this.removedEntities.add(entityId);
      this.entities.delete(entityId);
    }
    for (const update of packet.entityUpdates) {
      const entity = this.entities.get(update.entityId);
      if (entity && (update.changes.position || update.changes.healthBar)) {
        this.entities.set(update.entityId, {
          ...entity,
          ...(update.changes.position ? { tile: update.changes.position } : {}),
          ...(update.changes.healthBar ? { healthBar: update.changes.healthBar } : {}),
        });
      }
    }
    for (const delta of packet.inventoryDeltas ?? []) {
      if (delta.containerId === this.inventoryContainerId) {
        this.applyContainerDelta(delta, this.inventory);
      } else {
        this.bankContainerId ??= delta.containerId;
        if (delta.containerId === this.bankContainerId) {
          this.applyContainerDelta(delta, this.bank);
        }
      }
    }
    for (const skill of packet.skillDelta ?? []) {
      this.skills.set(skill.skillId, skill);
    }
    this.xpDrops.push(...(packet.xpDrops ?? []));
    this.hitsplats.push(...(packet.hitsplats ?? []));
    this.chat.push(...(packet.chat ?? []).map((message) => message.text));
  }

  tileOf(entityId: EntityId): TileCoord {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Missing visible entity ${entityId}`);
    }
    return entity.tile;
  }

  entity(defId: string, expectedTile?: TileCoord): EntitySpawnPacket {
    const entity = Array.from(this.entities.values()).find(
      (candidate) =>
        candidate.defId === defId &&
        (expectedTile === undefined || sameTile(candidate.tile, expectedTile)),
    );
    if (!entity) {
      throw new Error(`Missing visible ${defId}`);
    }
    return entity;
  }

  itemCount(container: ReadonlyMap<number, ItemStack>, itemId: string): number {
    let quantity = 0;
    for (const item of container.values()) {
      if (item.itemId === itemId) {
        quantity += item.quantity;
      }
    }
    return quantity;
  }

  inventoryUid(itemId: string): number {
    const item = Array.from(this.inventory.values()).find(
      (candidate) => candidate.itemId === itemId,
    );
    if (item?.uid === undefined) {
      throw new Error(`Missing inventory uid for ${itemId}`);
    }
    return item.uid;
  }

  private applyContainerDelta(delta: InventoryDelta, container: Map<number, ItemStack>): void {
    for (const change of delta.changes) {
      this.applySlotChange(change, container);
    }
  }

  private applySlotChange(change: InventorySlotChange, container: Map<number, ItemStack>): void {
    if (change.itemId === null || change.quantity <= 0) {
      container.delete(change.slot);
      return;
    }
    container.set(change.slot, {
      itemId: change.itemId,
      quantity: change.quantity,
      ...(change.uid !== undefined ? { uid: change.uid } : {}),
    });
  }
}

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

let loadedContent: Awaited<ReturnType<typeof loadContent>>;

beforeAll(async () => {
  loadedContent = await loadContent("content");
  if (!loadedContent.ok || loadedContent.issues.length > 0) {
    throw new Error(loadedContent.issues.map((issue) => issue.message).join("; "));
  }
});

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function sameTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function runUntil(
  kernel: SimulationKernel,
  predicate: () => boolean,
  description: string,
  maxTicks = 240,
): void {
  for (let elapsed = 0; elapsed < maxTicks; elapsed += 1) {
    kernel.runOneTick();
    if (predicate()) {
      return;
    }
  }
  throw new Error(`Timed out after ${maxTicks} ticks: ${description}`);
}

describe("E45 first-hour gameplay loop", () => {
  it("gathers, smelts, fights, loots, and banks through authoritative tick commands", async () => {
    if (!loadedContent.ok) {
      throw new Error("Content did not load");
    }

    const session: TransportSession = {
      id: "e45-first-hour-session",
      characterId: "e45-first-hour-character",
    };
    const kernel = createSimulationKernel({
      registries: loadedContent.registries,
      logger,
      startServerTime: 0,
      rngSeed: 0x45_5006,
    });
    const fullState = await kernel.connectSession(session);
    const state = new AuthoritativeClientState(fullState.selfEntityId, fullState);
    const transport: DeltaTransport = {
      sessions: new Map([[session.id, session]]),
      send: (_sessionId, packet) => {
        state.apply(packet);
        return true;
      },
    };
    kernel.attachDeltaTransport(transport);
    const tutorialRatId = state.entity("cellar_rat", tile(28, 28)).entityId;

    let commandId = 0;
    const route = (command: ClientCommand): void => {
      expect(kernel.routeCommand(session, command)).toEqual({ ok: true });
    };
    const moveTo = (dest: TileCoord): void => {
      route({
        type: ClientCommandType.MoveClick,
        commandId: ++commandId,
        payload: { dest },
      });
      runUntil(
        kernel,
        () => sameTile(state.tileOf(state.selfEntityId), dest),
        `move to (${dest.x}, ${dest.y})`,
      );
    };

    expect(state.tileOf(state.selfEntityId)).toEqual(tile(45, 45));

    const dryTree = state.entity("dry_tree", tile(20, 25));
    moveTo(tile(21, 25));
    route({
      type: ClientCommandType.ObjectOption,
      commandId: ++commandId,
      payload: { objectEntityId: dryTree.entityId, actionId: "woodcut" },
    });
    runUntil(kernel, () => state.itemCount(state.inventory, "dry_log") >= 1, "receive a dry log");
    expect(state.skills.get("woodcutting")?.xp).toBeGreaterThan(0);

    const copperRock = state.entity("copper_rock", tile(30, 35));
    moveTo(tile(30, 36));
    route({
      type: ClientCommandType.ObjectOption,
      commandId: ++commandId,
      payload: { objectEntityId: copperRock.entityId, actionId: "mine" },
    });
    runUntil(
      kernel,
      () => state.itemCount(state.inventory, "copper_ore") >= 1,
      "receive copper ore",
    );

    const pennyCopperRock = state.entity("penny_copper_rock", tile(34, 35));
    moveTo(tile(34, 36));
    route({
      type: ClientCommandType.ObjectOption,
      commandId: ++commandId,
      payload: { objectEntityId: pennyCopperRock.entityId, actionId: "mine" },
    });
    runUntil(
      kernel,
      () => state.itemCount(state.inventory, "penny_copper_ore") >= 1,
      "receive penny copper ore",
    );
    expect(state.skills.get("mining")?.xp).toBeGreaterThan(0);

    const furnace = state.entity("foundry_furnace", tile(60, 46));
    moveTo(tile(59, 46));
    route({
      type: ClientCommandType.ObjectOption,
      commandId: ++commandId,
      payload: { objectEntityId: furnace.entityId, actionId: "smelt" },
    });
    runUntil(
      kernel,
      () =>
        state.packets.some((packet) =>
          packet.recipeLists?.some((list) =>
            list.recipes.some((recipe) => recipe.recipeId === "smelt_pennywrought_ingot"),
          ),
        ),
      "open the foundry recipe list",
    );
    route({
      type: ClientCommandType.RecipeSelect,
      commandId: ++commandId,
      payload: {
        stationEntityId: furnace.entityId,
        recipeId: "smelt_pennywrought_ingot",
      },
    });
    runUntil(
      kernel,
      () =>
        state.packets.some((packet) =>
          packet.recipeResults?.some((result) => result.recipeId === "smelt_pennywrought_ingot"),
        ),
      "finish smelting",
    );
    expect(state.itemCount(state.inventory, "pennywrought_ingot")).toBe(1);
    expect(state.skills.get("smithing")?.xp).toBeGreaterThan(0);

    moveTo(tile(29, 29));
    const cellarRat = state.entities.get(tutorialRatId);
    if (!cellarRat) {
      throw new Error("Missing a visible cellar rat");
    }
    route({
      type: ClientCommandType.NpcOption,
      commandId: ++commandId,
      payload: { npcEntityId: cellarRat.entityId, actionId: "attack" },
    });
    for (
      let elapsed = 0;
      elapsed < 360 && !state.removedEntities.has(cellarRat.entityId);
      elapsed += 1
    ) {
      kernel.runOneTick();
    }
    if (!state.removedEntities.has(cellarRat.entityId)) {
      throw new Error(
        `Cellar rat combat stalled: ${JSON.stringify({
          playerId: state.selfEntityId,
          ratId: cellarRat.entityId,
          playerTile: state.tileOf(state.selfEntityId),
          ratTile: state.tileOf(cellarRat.entityId),
          playerHealth: state.entities.get(state.selfEntityId)?.healthBar,
          ratHealth: state.entities.get(cellarRat.entityId)?.healthBar,
          hitsplats: state.hitsplats.slice(-10),
          attackXp: state.skills.get("attack")?.xp,
          xpDrops: state.xpDrops.slice(-10),
          chat: state.chat.slice(-10),
        })}`,
      );
    }
    expect(state.removedEntities.has(state.selfEntityId)).toBe(false);
    expect(state.chat).not.toContain("You have died. You will respawn shortly.");
    expect(
      state.hitsplats.some(
        (packet) => packet.entityId === cellarRat.entityId && packet.hitsplat.amount > 0,
      ),
    ).toBe(true);

    const ratTail = state.entity("smoke_over_old_town_cellar_rat_tail");
    expect(chebyshev(state.tileOf(state.selfEntityId), ratTail.tile)).toBeLessThanOrEqual(1);
    route({
      type: ClientCommandType.GroundItemOption,
      commandId: ++commandId,
      payload: { groundItemEntityId: ratTail.entityId, actionId: "pickup" },
    });
    runUntil(
      kernel,
      () => state.itemCount(state.inventory, "smoke_over_old_town_cellar_rat_tail") === 1,
      "pick up the cellar rat tail",
    );

    const banker = state.entity("tomas_tally", tile(36, 50));
    moveTo(tile(35, 50));
    route({
      type: ClientCommandType.NpcOption,
      commandId: ++commandId,
      payload: { npcEntityId: banker.entityId, actionId: "bank" },
    });
    runUntil(
      kernel,
      () =>
        state.packets.some((packet) =>
          packet.interfaceOpens?.some((opened) => opened.interfaceId === "bank"),
        ),
      "open the bank",
    );
    const ratTailUid = state.inventoryUid("smoke_over_old_town_cellar_rat_tail");
    route({
      type: ClientCommandType.BankAction,
      commandId: ++commandId,
      payload: { action: "deposit", itemUid: ratTailUid, quantity: 1 },
    });
    runUntil(
      kernel,
      () => state.itemCount(state.bank, "smoke_over_old_town_cellar_rat_tail") === 1,
      "deposit the cellar rat tail",
    );

    expect(state.itemCount(state.inventory, "smoke_over_old_town_cellar_rat_tail")).toBe(0);
    expect(kernel.recentItemTransactions().some((entry) => entry.reason === "bank_deposit")).toBe(
      true,
    );
    const xpSkills = new Set(state.xpDrops.map((drop) => drop.skillId));
    expect(Array.from(xpSkills)).toEqual(
      expect.arrayContaining(["woodcutting", "mining", "smithing", "attack", "hitpoints"]),
    );
  }, 30_000);
});
