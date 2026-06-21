/**
 * Client → server command contracts (POC_SPEC §2.1, §8.1).
 *
 * Commands express *intent only*. The server is authoritative: it decides true tile
 * position, inventory/XP/HP changes, damage rolls, drops, quest state, and whether any
 * interaction is valid. There is deliberately no command that sets authoritative state.
 */
import type { CombatStyle, CombatStyleMode } from "../content-schemas/common";
import type { TileCoord } from "../types/coords";
import type { EntityId } from "../types/ids";

/** Wire identifiers for every client → server message. */
export const ClientCommandType = {
  MoveClick: "C2S_MOVE_CLICK",
  ObjectOption: "C2S_OBJECT_OPTION",
  NpcOption: "C2S_NPC_OPTION",
  ItemOption: "C2S_ITEM_OPTION",
  UseItemOn: "C2S_USE_ITEM_ON",
  GroundItemOption: "C2S_GROUND_ITEM_OPTION",
  CastSpell: "C2S_CAST_SPELL",
  Chat: "C2S_CHAT",
  UiAction: "C2S_UI_ACTION",
  BankAction: "C2S_BANK_ACTION",
  ShopAction: "C2S_SHOP_ACTION",
  RecipeSelect: "C2S_RECIPE_SELECT",
  SetCombatStyle: "C2S_SET_COMBAT_STYLE",
  SetPrayer: "C2S_SET_PRAYER",
  Ping: "C2S_PING",
} as const;

export type ClientCommandType = (typeof ClientCommandType)[keyof typeof ClientCommandType];

// --- Intent payloads --------------------------------------------------------------

/** Request to walk/run toward a destination tile. The server computes the path. */
export interface MoveIntent {
  readonly dest: TileCoord;
}

/** Request to use an action on a world object (e.g. "chop", "mine", "open"). */
export interface ObjectIntent {
  readonly objectEntityId: EntityId;
  readonly actionId: string;
}

/** Request to use an action on an NPC (e.g. "attack", "talk"). */
export interface NpcIntent {
  readonly npcEntityId: EntityId;
  readonly actionId: string;
}

/** Request to use an action on an inventory item (e.g. "equip", "eat", "drop"). */
export interface ItemIntent {
  /** Server-assigned inventory item instance id (received via inventory deltas). */
  readonly itemUid: number;
  readonly actionId: string;
}

/** Request to use an inventory item on a world target (NPC, object, ground item, or tile). */
export interface UseItemOnIntent {
  readonly itemUid: number;
  readonly target: SpellTarget;
}

/** Request to use an action on a ground item (e.g. "pickup"). */
export interface GroundItemIntent {
  readonly groundItemEntityId: EntityId;
  readonly actionId: string;
}

/** What a spell is aimed at. Some spells target an entity, a tile, or nothing (self). */
export type SpellTarget =
  | { readonly kind: "entity"; readonly entityId: EntityId }
  | { readonly kind: "tile"; readonly tile: TileCoord }
  | { readonly kind: "none" };

/** Request to cast a spell. `spellId` is a content id (tightened in E01-S06). */
export interface SpellIntent {
  readonly spellId: string;
  readonly target: SpellTarget;
}

/** A public chat message. */
export interface ChatIntent {
  readonly text: string;
}

/** A generic UI action (button click, panel toggle, etc.). Refined per-interface later. */
export interface UiActionIntent {
  readonly action: string;
  readonly targetId?: string;
  readonly value?: number;
}

/** Latency probe; the server echoes it back. */
export interface PingIntent {
  readonly clientTimeMs: number;
}

export interface BankIntent {
  readonly action: "deposit" | "withdraw" | "open" | "close";
  readonly itemUid?: number;
  readonly quantity?: number;
  readonly targetEntityId?: EntityId;
}

export interface ShopIntent {
  readonly action: "buy" | "sell" | "open" | "close";
  readonly itemId?: string;
  readonly quantity?: number;
  readonly targetEntityId?: EntityId;
}

export interface RecipeSelectIntent {
  readonly recipeId: string;
  readonly stationEntityId: EntityId;
}

/** Request to set the active combat attack style (which combat skill melee XP trains).
 *  The server clamps the choice to the equipped weapon's allowed styles at resolution time. */
export interface SetCombatStyleIntent {
  readonly style: CombatStyle;
  /** Optional XP distribution mode (POC_SPEC §13.5.2). Absent clears any chosen mode. */
  readonly mode?: CombatStyleMode;
}

/** Request to activate or deactivate a prayer (POC_SPEC §13.8). `prayerId` is a content id. */
export interface SetPrayerIntent {
  readonly prayerId: string;
  readonly active: boolean;
}

// --- Command envelope -------------------------------------------------------------

/** Common envelope: a typed payload plus dedupe/ordering metadata. */
export interface ClientCommandBase<T extends ClientCommandType, P> {
  readonly type: T;
  /** Client-assigned id; the server ignores duplicates. */
  readonly commandId: number;
  /** The client's view of the current tick (advisory only). */
  readonly clientTickHint?: number;
  readonly payload: P;
}

export type MoveClickCommand = ClientCommandBase<typeof ClientCommandType.MoveClick, MoveIntent>;
export type ObjectOptionCommand = ClientCommandBase<
  typeof ClientCommandType.ObjectOption,
  ObjectIntent
>;
export type NpcOptionCommand = ClientCommandBase<typeof ClientCommandType.NpcOption, NpcIntent>;
export type ItemOptionCommand = ClientCommandBase<typeof ClientCommandType.ItemOption, ItemIntent>;
export type UseItemOnCommand = ClientCommandBase<typeof ClientCommandType.UseItemOn, UseItemOnIntent>;
export type GroundItemOptionCommand = ClientCommandBase<
  typeof ClientCommandType.GroundItemOption,
  GroundItemIntent
>;
export type CastSpellCommand = ClientCommandBase<typeof ClientCommandType.CastSpell, SpellIntent>;
export type ChatCommand = ClientCommandBase<typeof ClientCommandType.Chat, ChatIntent>;
export type UiActionCommand = ClientCommandBase<typeof ClientCommandType.UiAction, UiActionIntent>;
export type BankActionCommand = ClientCommandBase<typeof ClientCommandType.BankAction, BankIntent>;
export type ShopActionCommand = ClientCommandBase<typeof ClientCommandType.ShopAction, ShopIntent>;
export type RecipeSelectCommand = ClientCommandBase<
  typeof ClientCommandType.RecipeSelect,
  RecipeSelectIntent
>;
export type SetCombatStyleCommand = ClientCommandBase<
  typeof ClientCommandType.SetCombatStyle,
  SetCombatStyleIntent
>;
export type SetPrayerCommand = ClientCommandBase<typeof ClientCommandType.SetPrayer, SetPrayerIntent>;
export type PingCommand = ClientCommandBase<typeof ClientCommandType.Ping, PingIntent>;

/** The discriminated union of every client → server command. */
export type ClientCommand =
  | MoveClickCommand
  | ObjectOptionCommand
  | NpcOptionCommand
  | ItemOptionCommand
  | UseItemOnCommand
  | GroundItemOptionCommand
  | CastSpellCommand
  | ChatCommand
  | UiActionCommand
  | BankActionCommand
  | ShopActionCommand
  | RecipeSelectCommand
  | SetCombatStyleCommand
  | SetPrayerCommand
  | PingCommand;
