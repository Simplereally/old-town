import type { ContextMenuOption } from "../input/InputInterpreter";
import type { PickedEntity } from "../picking/EntityPicker";

export interface ContextMenuCallbacks {
  /**
   * Called when the player selects any option from the context menu.
   * `actionId` is the canonical action token (e.g. "walk_here", "examine", "talk", "woodcut").
   */
  onOptionSelected: (
    actionId: string,
    entity: PickedEntity | null,
    tile: { x: number; y: number } | null,
  ) => void;
}

export interface ContextMenuOptions {
  readonly container: HTMLElement;
  readonly callbacks: ContextMenuCallbacks;
}

/**
 * DOM-based context menu for right-click interactions.
 * Pure view adapter: renders pre-built options and reports the chosen action.
 * No semantic routing — the caller (GameEngine + InputInterpreter) decides what
 * each action means.
 */
export class ContextMenu {
  private readonly container: HTMLElement;
  private readonly callbacks: ContextMenuCallbacks;
  private _menuElement: HTMLDivElement | undefined;
  private _visible = false;
  private _clickOutsideListener: ((e: MouseEvent) => void) | undefined;
  private _keydownListener: ((e: KeyboardEvent) => void) | undefined;
  private _lastEntity: PickedEntity | null = null;
  private _lastTile: { x: number; y: number } | null = null;

  constructor(options: ContextMenuOptions) {
    this.container = options.container;
    this.callbacks = options.callbacks;
  }

  get visible(): boolean {
    return this._visible;
  }

  /**
   * Show the context menu at the given screen position with the provided options.
   */
  show(
    screenX: number,
    screenY: number,
    options: readonly ContextMenuOption[],
    entity: PickedEntity | null,
    tileUnderCursor: { x: number; y: number } | null,
  ): void {
    this.hide();

    if (options.length === 0) return;

    this._lastEntity = entity;
    this._lastTile = tileUnderCursor;

    this._menuElement = document.createElement("div");
    this._menuElement.className = "context-menu";
    this._menuElement.style.left = `${screenX}px`;
    this._menuElement.style.top = `${screenY}px`;

    for (const option of options) {
      const item = document.createElement("div");
      item.className = "context-menu-item";
      item.textContent = option.label;
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.callbacks.onOptionSelected(option.actionId, this._lastEntity, this._lastTile);
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
    setTimeout(() => {
      if (this._visible && this._clickOutsideListener) {
        document.addEventListener("click", this._clickOutsideListener);
      }
      if (this._visible && this._keydownListener) {
        document.addEventListener("keydown", this._keydownListener);
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
    this._lastEntity = null;
    this._lastTile = null;
    if (this._clickOutsideListener) {
      document.removeEventListener("click", this._clickOutsideListener);
      this._clickOutsideListener = undefined;
    }
    if (this._keydownListener) {
      document.removeEventListener("keydown", this._keydownListener);
      this._keydownListener = undefined;
    }
  }
}
