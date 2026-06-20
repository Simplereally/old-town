import {
  entityId,
  type InteractionOptionDef,
  type SkillDelta,
  type SpellTarget,
  type TileCoord,
} from "@old-town/shared";
import type { PickedEntity } from "../picking/EntityPicker";

/** Minimal interface for looking up content definitions with interaction options. */
export interface ContentResolver {
  getNpc(id: string):
    | {
        name?: string | undefined;
        combatLevel?: number | undefined;
        options: readonly InteractionOptionDef[];
      }
    | undefined;
  getObject(id: string): { options: readonly InteractionOptionDef[] } | undefined;
}

export type NpcAttackSetting =
  | "depends-on-combat-levels"
  | "left-click-where-available"
  | "always-right-click"
  | "hidden";

export type MouseButtonMode = "two-button" | "one-button";

export interface MenuSwapRule {
  readonly actionId: string;
  readonly priority: number;
  readonly entityKind?: PickedEntity["kind"];
}

export interface InputInterpreterSettings {
  readonly npcAttack: NpcAttackSetting;
  readonly mouseButtons: MouseButtonMode;
  readonly menuSwaps: readonly MenuSwapRule[];
}

export interface MenuResolveState {
  readonly playerCombatLevel?: number;
  readonly spellMode?: { readonly spellId: string };
  readonly itemMode?: { readonly itemUid: number };
}

export interface ContextMenuOption {
  readonly label: string;
  readonly actionId: string;
  readonly priority: number;
}

const DEFAULT_INPUT_SETTINGS: InputInterpreterSettings = {
  npcAttack: "depends-on-combat-levels",
  mouseButtons: "two-button",
  menuSwaps: [],
};

const PLAYER_MAX_COMBAT_LEVEL = 126;

export type ClientDecision =
  | { type: "move"; tile: TileCoord }
  | { type: "npcOption"; entityId: number; actionId: string }
  | { type: "objectOption"; entityId: number; actionId: string }
  | { type: "groundItemOption"; entityId: number; actionId: string }
  | { type: "inventoryItemOption"; itemUid: number; actionId: string }
  | { type: "useItemOn"; itemUid: number; target: SpellTarget }
  | { type: "castSpell"; spellId: string; target: SpellTarget }
  | { type: "chat"; text: string }
  | { type: "uiAction"; action: string; targetId?: string; value?: number }
  | { type: "examine"; entity: PickedEntity }
  | { type: "cancelSpellTarget" }
  | { type: "cancelItemTarget" }
  | { type: "none" };

/**
 * Turns raw input events (canvas click, context menu selection, key press) into
 * a small, explicit client decision.  GameEngine applies the decision via the
 * ClientCommandDispatcher without needing to know the mapping rules.
 *
 * Interaction options are content-driven: NPC and object default actions and
 * context-menu rows come from their definition's `options` array.  A minimal
 * fallback is used only when content is missing.
 */
export class InputInterpreter {
  private _settings: InputInterpreterSettings;

  constructor(
    private readonly content: ContentResolver,
    settings: Partial<InputInterpreterSettings> = {},
  ) {
    this._settings = { ...DEFAULT_INPUT_SETTINGS, ...settings };
  }

  setSettings(settings: Partial<InputInterpreterSettings>): void {
    this._settings = { ...this._settings, ...settings };
  }

  get settings(): InputInterpreterSettings {
    return this._settings;
  }

  shouldOpenMenuOnPrimaryClick(): boolean {
    return this._settings.mouseButtons === "one-button";
  }

  /**
   * Return the default action for a clicked entity.  Used for left-click
   * default actions and for the primary context-menu row.
   */
  getDefaultAction(entity: PickedEntity, state: MenuResolveState = {}): string | undefined {
    if (entity.kind === "player") {
      return undefined;
    }
    const top = this.resolveMenuEntries(entity, null, state)[0];
    return top?.actionId;
  }

  /**
   * Build the full context-menu option list for an entity/tile.  Sorted by
   * ascending priority (lowest first, highest last — the UI may render top-to-bottom).
   */
  getContextMenuOptions(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    state: MenuResolveState = {},
  ): ContextMenuOption[] {
    return this.resolveMenuEntries(entity, tile, state);
  }

  /**
   * Decide what to do on a left-click (or tap) on the game canvas.
   */
  interpretCanvasClick(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    playerTile: TileCoord | null,
    spellMode: { spellId: string } | undefined,
    itemMode: { itemUid: number } | undefined,
    state: MenuResolveState = {},
  ): ClientDecision {
    if (itemMode) {
      const target: SpellTarget = entity
        ? { kind: "entity", entityId: entityId(entity.entityId) }
        : tile
          ? { kind: "tile", tile: { x: tile.x, y: tile.y, plane: 0 } }
          : { kind: "none" };
      return { type: "useItemOn", itemUid: itemMode.itemUid, target };
    }
    if (entity?.kind === "player" && !spellMode) {
      return playerTile ? { type: "move", tile: playerTile } : { type: "none" };
    }
    const resolveState: MenuResolveState = spellMode ? { ...state, spellMode } : state;
    const top = this.resolveMenuEntries(entity, tile, resolveState)[0];
    return this.interpretResolvedAction(entity, tile, playerTile, top?.actionId, spellMode);
  }

  /**
   * Decide what to do when a context-menu option is selected.
   */
  interpretContextMenu(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    action: string,
    spellMode?: { spellId: string },
    itemMode?: { itemUid: number },
  ): ClientDecision {
    return this.interpretResolvedAction(entity, tile, null, action, spellMode, itemMode);
  }

  private resolveMenuEntries(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    state: MenuResolveState,
  ): ContextMenuOption[] {
    const options: ContextMenuOption[] = [];

    if (tile) {
      options.push({ label: "Walk here", actionId: "walk_here", priority: 0 });
    }

    if (state.spellMode && (entity || tile)) {
      options.push({
        label: `Cast ${state.spellMode.spellId}`,
        actionId: "cast_spell",
        priority: 1000,
      });
    }

    if (state.itemMode && (entity || tile)) {
      options.push({
        label: "Use item on",
        actionId: "use_item_on",
        priority: 1000,
      });
    }

    if (!entity) {
      return this.sortMenuEntries(this.applyMenuSwaps(options, entity));
    }

    const name = this.getEntityName(entity);
    options.push({ label: `Examine ${name}`, actionId: "examine", priority: -100 });

    switch (entity.kind) {
      case "npc": {
        const def = this.content.getNpc(entity.defId ?? "");
        const contentOptions = def?.options ?? [];
        for (const opt of contentOptions) {
          const adjusted = this.adjustNpcOptionPriority(
            opt,
            def?.combatLevel,
            state.playerCombatLevel,
          );
          if (adjusted) {
            options.push(adjusted);
          }
        }
        if (contentOptions.length === 0) {
          options.push({ label: "Talk-to", actionId: "talk", priority: 1 });
        }
        break;
      }
      case "object": {
        const def = this.content.getObject(entity.defId ?? "");
        const contentOptions = def?.options ?? [];
        for (const opt of contentOptions) {
          options.push({ label: opt.label, actionId: opt.actionId, priority: opt.priority });
        }
        if (contentOptions.length === 0) {
          options.push({ label: "Use", actionId: "use", priority: 1 });
        }
        break;
      }
      case "groundItem": {
        const itemName = entity.itemId ?? "item";
        options.push({
          label: `Pick up ${itemName}${entity.quantity && entity.quantity > 1 ? ` x${entity.quantity}` : ""}`,
          actionId: "pickup",
          priority: 1,
        });
        break;
      }
      case "player": {
        break;
      }
    }

    return this.sortMenuEntries(this.applyMenuSwaps(options, entity));
  }

  private adjustNpcOptionPriority(
    option: InteractionOptionDef,
    npcCombatLevel: number | undefined,
    playerCombatLevel: number | undefined,
  ): ContextMenuOption | undefined {
    if (option.actionId !== "attack") {
      return { label: option.label, actionId: option.actionId, priority: option.priority };
    }

    switch (this._settings.npcAttack) {
      case "hidden":
        return undefined;
      case "always-right-click":
        return { label: option.label, actionId: option.actionId, priority: -10 };
      case "left-click-where-available":
        return { label: option.label, actionId: option.actionId, priority: 90 };
      case "depends-on-combat-levels": {
        if (npcCombatLevel === undefined || playerCombatLevel === undefined) {
          return { label: option.label, actionId: option.actionId, priority: option.priority };
        }
        const leftClickable = shouldNpcAttackBeLeftClick(playerCombatLevel, npcCombatLevel);
        return {
          label: option.label,
          actionId: option.actionId,
          priority: leftClickable ? 90 : -10,
        };
      }
    }
  }

  private interpretResolvedAction(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    playerTile: TileCoord | null,
    action: string | undefined,
    spellMode?: { spellId: string },
    itemMode?: { itemUid: number },
  ): ClientDecision {
    if (action === "cast_spell" && spellMode) {
      const target: SpellTarget = entity
        ? { kind: "entity", entityId: entityId(entity.entityId) }
        : tile
          ? { kind: "tile", tile: { x: tile.x, y: tile.y, plane: 0 } }
          : { kind: "none" };
      return { type: "castSpell", spellId: spellMode.spellId, target };
    }
    if (action === "use_item_on" && itemMode) {
      const target: SpellTarget = entity
        ? { kind: "entity", entityId: entityId(entity.entityId) }
        : tile
          ? { kind: "tile", tile: { x: tile.x, y: tile.y, plane: 0 } }
          : { kind: "none" };
      return { type: "useItemOn", itemUid: itemMode.itemUid, target };
    }
    if (action === "walk_here" && tile) {
      return { type: "move", tile: { x: tile.x, y: tile.y, plane: 0 } };
    }
    if (action === "examine" && entity) {
      return { type: "examine", entity };
    }
    if (!entity || !action) {
      return { type: "none" };
    }
    if (entity.kind === "player") {
      return playerTile ? { type: "move", tile: playerTile } : { type: "none" };
    }
    switch (entity.kind) {
      case "npc": {
        return { type: "npcOption", entityId: entity.entityId, actionId: action };
      }
      case "object": {
        return { type: "objectOption", entityId: entity.entityId, actionId: action };
      }
      case "groundItem": {
        return { type: "groundItemOption", entityId: entity.entityId, actionId: action };
      }
    }
  }

  private applyMenuSwaps(
    options: readonly ContextMenuOption[],
    entity: PickedEntity | null,
  ): ContextMenuOption[] {
    return options.map((option) => {
      const swap = this._settings.menuSwaps.find(
        (candidate) =>
          candidate.actionId === option.actionId &&
          (!candidate.entityKind || candidate.entityKind === entity?.kind),
      );
      return swap ? { ...option, priority: swap.priority } : option;
    });
  }

  private sortMenuEntries(options: readonly ContextMenuOption[]): ContextMenuOption[] {
    return [...options].sort((a, b) => b.priority - a.priority);
  }

  getEntityName(entity: PickedEntity): string {
    if (entity.kind === "npc") {
      return this.content.getNpc(entity.defId ?? "")?.name ?? entity.defId ?? "npc";
    }
    return entity.defId ?? entity.itemId ?? "entity";
  }

  /**
   * Decide what to do on the Escape key.
   */
  interpretEscape(
    spellMode: { spellId: string } | undefined,
    itemMode: { itemUid: number } | undefined,
  ): ClientDecision {
    if (spellMode) {
      return { type: "cancelSpellTarget" };
    }
    if (itemMode) {
      return { type: "cancelItemTarget" };
    }
    return { type: "none" };
  }
}

export function shouldNpcAttackBeLeftClick(playerCombat: number, npcCombat: number): boolean {
  return npcCombat > PLAYER_MAX_COMBAT_LEVEL || npcCombat <= playerCombat;
}

export function calculateCombatLevel(skills: ReadonlyMap<string, SkillDelta>): number {
  const level = (skillId: string, fallback: number): number =>
    skills.get(skillId)?.effectiveLevel ?? skills.get(skillId)?.level ?? fallback;
  const attack = level("attack", 1);
  const strength = level("strength", 1);
  const defence = level("defence", 1);
  const hitpoints = level("hitpoints", 10);
  const prayer = level("prayer", 1);
  const ranged = level("ranged", 1);
  const magic = level("magic", 1);
  const base = (defence + hitpoints + Math.floor(prayer / 2)) / 4;
  const melee = (attack + strength) * 0.325;
  const rangedContribution = Math.floor(ranged * 1.5) * 0.325;
  const magicContribution = Math.floor(magic * 1.5) * 0.325;
  return Math.max(3, Math.floor(base + Math.max(melee, rangedContribution, magicContribution)));
}
