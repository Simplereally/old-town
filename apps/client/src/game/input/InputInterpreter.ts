import {
  entityId,
  type InteractionOptionDef,
  type SpellTarget,
  type TileCoord,
} from "@old-town/shared";
import type { PickedEntity } from "../picking/EntityPicker";

/** Minimal interface for looking up content definitions with interaction options. */
export interface ContentResolver {
  getNpc(id: string): { options: readonly InteractionOptionDef[] } | undefined;
  getObject(id: string): { options: readonly InteractionOptionDef[] } | undefined;
}

export interface ContextMenuOption {
  readonly label: string;
  readonly actionId: string;
  readonly priority: number;
}

export type ClientDecision =
  | { type: "move"; tile: TileCoord }
  | { type: "npcOption"; entityId: number; actionId: string }
  | { type: "objectOption"; entityId: number; actionId: string }
  | { type: "groundItemOption"; entityId: number; actionId: string }
  | { type: "inventoryItemOption"; itemUid: number; actionId: string }
  | { type: "castSpell"; spellId: string; target: SpellTarget }
  | { type: "chat"; text: string }
  | { type: "uiAction"; action: string; targetId?: string; value?: number }
  | { type: "examine"; entity: PickedEntity }
  | { type: "cancelSpellTarget" }
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
  constructor(private readonly content: ContentResolver) {}

  /**
   * Return the default action for a clicked entity.  Used for left-click
   * default actions and for the primary context-menu row.
   */
  getDefaultAction(entity: PickedEntity): string | undefined {
    switch (entity.kind) {
      case "npc": {
        const def = this.content.getNpc(entity.defId ?? "");
        const options = def?.options ?? [];
        if (options.length > 0) {
          const sorted = [...options].sort((a, b) => b.priority - a.priority);
          return sorted[0]?.actionId ?? "talk";
        }
        return "talk";
      }
      case "object": {
        const def = this.content.getObject(entity.defId ?? "");
        const options = def?.options ?? [];
        if (options.length > 0) {
          const sorted = [...options].sort((a, b) => b.priority - a.priority);
          return sorted[0]?.actionId ?? "use";
        }
        return "use";
      }
      case "groundItem": {
        return "pickup";
      }
      case "player": {
        return undefined;
      }
    }
  }

  /**
   * Build the full context-menu option list for an entity/tile.  Sorted by
   * ascending priority (lowest first, highest last — the UI may render top-to-bottom).
   */
  getContextMenuOptions(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
  ): ContextMenuOption[] {
    const options: ContextMenuOption[] = [];

    if (tile) {
      options.push({ label: "Walk here", actionId: "walk_here", priority: 0 });
    }

    if (!entity) {
      return options.toSorted((a, b) => a.priority - b.priority);
    }

    const name = entity.defId ?? entity.itemId ?? "entity";
    options.push({ label: `Examine ${name}`, actionId: "examine", priority: 100 });

    switch (entity.kind) {
      case "npc": {
        const def = this.content.getNpc(entity.defId ?? "");
        const contentOptions = def?.options ?? [];
        for (const opt of contentOptions) {
          options.push({ label: opt.label, actionId: opt.actionId, priority: opt.priority });
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

    return options.toSorted((a, b) => a.priority - b.priority);
  }

  /**
   * Decide what to do on a left-click (or tap) on the game canvas.
   */
  interpretCanvasClick(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    playerTile: TileCoord | null,
    spellMode: { spellId: string } | undefined,
  ): ClientDecision {
    if (spellMode) {
      const target: SpellTarget = entity
        ? { kind: "entity", entityId: entityId(entity.entityId) }
        : tile
          ? { kind: "tile", tile: { x: tile.x, y: tile.y, plane: 0 } }
          : { kind: "none" };
      return { type: "castSpell", spellId: spellMode.spellId, target };
    }

    if (entity) {
      if (entity.kind === "player") {
        if (playerTile) {
          return { type: "move", tile: playerTile };
        }
        return { type: "none" };
      }

      const action = this.getDefaultAction(entity);
      if (action) {
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
    }

    if (tile) {
      return { type: "move", tile: { x: tile.x, y: tile.y, plane: 0 } };
    }

    return { type: "none" };
  }

  /**
   * Decide what to do when a context-menu option is selected.
   */
  interpretContextMenu(
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
    action: string,
  ): ClientDecision {
    if (action === "walk_here" && tile) {
      return { type: "move", tile: { x: tile.x, y: tile.y, plane: 0 } };
    }
    if (action === "examine" && entity) {
      return { type: "examine", entity };
    }
    if (!entity) {
      return { type: "none" };
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
      default: {
        return { type: "none" };
      }
    }
  }

  /**
   * Decide what to do on the Escape key.
   */
  interpretEscape(spellMode: { spellId: string } | undefined): ClientDecision {
    if (spellMode) {
      return { type: "cancelSpellTarget" };
    }
    return { type: "none" };
  }
}
