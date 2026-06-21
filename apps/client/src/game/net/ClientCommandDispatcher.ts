import {
  type ClientCommand,
  ClientCommandType,
  type CombatStyle,
  entityId,
  type SpellTarget,
  type TileCoord,
} from "@old-town/shared";
import type { GameSocket } from "./GameSocket";

/**
 * Owns the client's command ID counter, current tick hint, and all socket
 * command construction.  GameEngine delegates packet building here so it
 * never manually assembles a ClientCommandType.* envelope.
 */
export class ClientCommandDispatcher {
  private _commandId = 0;
  private _currentTick = 0;
  private readonly _socket: GameSocket;

  constructor(socket: GameSocket) {
    this._socket = socket;
  }

  setCurrentTick(tick: number): void {
    this._currentTick = tick;
  }

  move(tile: TileCoord): void {
    this._sendCommand({
      type: ClientCommandType.MoveClick,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { dest: tile },
    });
  }

  npcOption(npcId: number, actionId: string): void {
    this._sendCommand({
      type: ClientCommandType.NpcOption,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { npcEntityId: entityId(npcId), actionId },
    });
  }

  objectOption(objectId: number, actionId: string): void {
    this._sendCommand({
      type: ClientCommandType.ObjectOption,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { objectEntityId: entityId(objectId), actionId },
    });
  }

  groundItemOption(groundItemId: number, actionId: string): void {
    this._sendCommand({
      type: ClientCommandType.GroundItemOption,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { groundItemEntityId: entityId(groundItemId), actionId },
    });
  }

  inventoryItemOption(itemUid: number, actionId: string): void {
    this._sendCommand({
      type: ClientCommandType.ItemOption,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { itemUid, actionId },
    });
  }

  useItemOn(itemUid: number, target: SpellTarget): void {
    this._sendCommand({
      type: ClientCommandType.UseItemOn,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { itemUid, target },
    });
  }

  castSpell(spellId: string, target: SpellTarget): void {
    this._sendCommand({
      type: ClientCommandType.CastSpell,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { spellId, target },
    });
  }

  chat(text: string): void {
    this._sendCommand({
      type: ClientCommandType.Chat,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { text },
    });
  }

  uiAction(action: string, targetId?: string, value?: number): void {
    const payload: { action: string; targetId?: string; value?: number } = { action };
    if (targetId !== undefined) payload.targetId = targetId;
    if (value !== undefined) payload.value = value;
    this._sendCommand({
      type: ClientCommandType.UiAction,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload,
    });
  }

  bankAction(
    action: "deposit" | "withdraw" | "open" | "close",
    itemUid?: number,
    quantity?: number,
  ): void {
    const payload = {
      action,
      ...(itemUid !== undefined && { itemUid }),
      ...(quantity !== undefined && { quantity }),
    } as const;
    this._sendCommand({
      type: ClientCommandType.BankAction,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: payload as unknown as import("@old-town/shared").BankIntent,
    });
  }

  shopAction(action: "buy" | "sell" | "open" | "close", itemId?: string, quantity?: number): void {
    const payload = {
      action,
      ...(itemId !== undefined && { itemId }),
      ...(quantity !== undefined && { quantity }),
    } as const;
    this._sendCommand({
      type: ClientCommandType.ShopAction,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: payload as unknown as import("@old-town/shared").ShopIntent,
    });
  }

  recipeSelect(recipeId: string, stationEntityId: number): void {
    this._sendCommand({
      type: ClientCommandType.RecipeSelect,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { recipeId, stationEntityId: entityId(stationEntityId) },
    });
  }

  setCombatStyle(style: CombatStyle): void {
    this._sendCommand({
      type: ClientCommandType.SetCombatStyle,
      commandId: ++this._commandId,
      clientTickHint: this._currentTick,
      payload: { style },
    });
  }

  private _sendCommand(command: ClientCommand): void {
    this._socket.sendCommand(command);
  }
}
