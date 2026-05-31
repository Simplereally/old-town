import type { PickedEntity } from "../picking/EntityPicker";

const _objectActionCache = new Map<string, string>();
function inferObjectActionCache(defId: string): string {
  const cached = _objectActionCache.get(defId);
  if (cached !== undefined) return cached;
  let result = "Use";
  if (defId.includes("tree")) result = "Chop";
  else if (defId.includes("rock") || defId.includes("ore")) result = "Mine";
  else if (defId.includes("door")) result = "Open";
  _objectActionCache.set(defId, result);
  return result;
}

export interface ContextMenuOption {
  readonly label: string;
  readonly action: () => void;
  readonly priority: number;
}

export interface ContextMenuCallbacks {
  onWalkHere: (tile: { x: number; y: number }) => void;
  onExamine: (entity: PickedEntity) => void;
  onNpcOption: (entity: PickedEntity, option: string) => void;
  onObjectOption: (entity: PickedEntity, option: string) => void;
  onItemOption: (entity: PickedEntity, option: string) => void;
}

export interface ContextMenuOptions {
  readonly container: HTMLElement;
  readonly callbacks: ContextMenuCallbacks;
}

/**
 * DOM-based context menu for right-click interactions.
 * Renders a list of options and invokes callbacks on selection.
 */
export class ContextMenu {
  private readonly container: HTMLElement;
  private readonly callbacks: ContextMenuCallbacks;
  private _menuElement: HTMLDivElement | undefined;
  private _visible = false;
  private _clickOutsideListener: ((e: MouseEvent) => void) | undefined;
  private _keydownListener: ((e: KeyboardEvent) => void) | undefined;

  constructor(options: ContextMenuOptions) {
    this.container = options.container;
    this.callbacks = options.callbacks;
  }

  get visible(): boolean {
    return this._visible;
  }

  /**
   * Show the context menu at the given screen position with options for the picked entity.
   */
  show(
    screenX: number,
    screenY: number,
    entity: PickedEntity | null,
    tileUnderCursor: { x: number; y: number } | null,
  ): void {
    this.hide();

    const options = this._buildOptions(entity, tileUnderCursor);
    if (options.length === 0) return;

    this._menuElement = document.createElement("div");
    this._menuElement.className = "context-menu";
    this._menuElement.style.position = "absolute";
    this._menuElement.style.left = `${screenX}px`;
    this._menuElement.style.top = `${screenY}px`;
    this._menuElement.style.background = "rgba(0, 0, 0, 0.85)";
    this._menuElement.style.border = "1px solid #666";
    this._menuElement.style.borderRadius = "4px";
    this._menuElement.style.padding = "4px 0";
    this._menuElement.style.zIndex = "1000";
    this._menuElement.style.minWidth = "140px";
    this._menuElement.style.fontFamily = "monospace";
    this._menuElement.style.fontSize = "12px";
    this._menuElement.style.color = "#fff";
    this._menuElement.style.userSelect = "none";
    this._menuElement.style.cursor = "pointer";

    for (const option of options) {
      const item = document.createElement("div");
      item.className = "context-menu-item";
      item.textContent = option.label;
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        option.action();
        this.hide();
      });
      this._menuElement.appendChild(item);
    }

    this.container.appendChild(this._menuElement);
    this._visible = true;

    this._clickOutsideListener = (e: MouseEvent) => {
      if (this._menuElement && !this._menuElement.contains(e.target as Node)) {
        this.hide();
      }
    };
    this._keydownListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.hide();
      }
    };
    const clickListener = this._clickOutsideListener;
    const keyListener = this._keydownListener;
    setTimeout(() => {
      if (clickListener) {
        document.addEventListener("click", clickListener);
      }
      if (keyListener) {
        document.addEventListener("keydown", keyListener);
      }
    }, 0);
  }

  /** Hide the context menu. */
  hide(): void {
    if (this._menuElement) {
      this._menuElement.remove();
      this._menuElement = undefined;
    }
    this._visible = false;
    if (this._clickOutsideListener) {
      document.removeEventListener("click", this._clickOutsideListener);
      this._clickOutsideListener = undefined;
    }
    if (this._keydownListener) {
      document.removeEventListener("keydown", this._keydownListener);
      this._keydownListener = undefined;
    }
  }

  /** Build interaction options based on the picked entity and tile. */
  private _buildOptions(
    entity: PickedEntity | null,
    tileUnderCursor: { x: number; y: number } | null,
  ): ContextMenuOption[] {
    const options: ContextMenuOption[] = [];

    // Always offer Walk here if we have a tile
    if (tileUnderCursor) {
      options.push({
        label: "Walk here",
        action: () => this._onWalkHere(tileUnderCursor),
        priority: 0,
      });
    }

    if (!entity) {
      return options;
    }

    // Entity-specific options
    switch (entity.kind) {
      case "player": {
        options.push({
          label: `Examine ${entity.defId ?? "player"}`,
          action: () => this._onExamine(entity),
          priority: 10,
        });
        break;
      }
      case "npc": {
        options.push({
          label: `Talk-to ${entity.defId ?? "NPC"}`,
          action: () => this._onNpcOption(entity, "talk-to"),
          priority: 1,
        });
        options.push({
          label: `Attack ${entity.defId ?? "NPC"}`,
          action: () => this._onNpcOption(entity, "attack"),
          priority: 2,
        });
        options.push({
          label: `Cast ${entity.defId ?? "NPC"}`,
          action: () => this._onNpcOption(entity, "cast"),
          priority: 3,
        });
        options.push({
          label: `Examine ${entity.defId ?? "NPC"}`,
          action: () => this._onExamine(entity),
          priority: 10,
        });
        break;
      }
      case "object": {
        const objectDefId = entity.defId ?? "object";
        const actionLabel = this._inferObjectAction(objectDefId);
        options.push({
          label: `${actionLabel} ${objectDefId}`,
          action: () => this._onObjectOption(entity, actionLabel.toLowerCase()),
          priority: 1,
        });
        options.push({
          label: `Examine ${objectDefId}`,
          action: () => this._onExamine(entity),
          priority: 10,
        });
        break;
      }
      case "groundItem": {
        const itemName = entity.itemId ?? "item";
        options.push({
          label: `Pick up ${itemName}${entity.quantity && entity.quantity > 1 ? ` x${entity.quantity}` : ""}`,
          action: () => this._onItemOption(entity, "pick-up"),
          priority: 1,
        });
        options.push({
          label: `Examine ${itemName}`,
          action: () => this._onExamine(entity),
          priority: 10,
        });
        break;
      }
    }

    return options.toSorted((a, b) => a.priority - b.priority);
  }

  private _inferObjectAction(defId: string): string {
    return inferObjectActionCache(defId);
  }

  private _onWalkHere(tile: { x: number; y: number }): void {
    this.callbacks.onWalkHere(tile);
  }

  private _onExamine(entity: PickedEntity): void {
    this.callbacks.onExamine(entity);
  }

  private _onNpcOption(entity: PickedEntity, option: string): void {
    this.callbacks.onNpcOption(entity, option);
  }

  private _onObjectOption(entity: PickedEntity, option: string): void {
    this.callbacks.onObjectOption(entity, option);
  }

  private _onItemOption(entity: PickedEntity, option: string): void {
    this.callbacks.onItemOption(entity, option);
  }
}
