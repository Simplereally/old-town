/**
 * SidebarTabs — the OSRS resizable-mode tab strip controller.
 *
 * Owns the two `.sb-tab` rows (top: game panels, bottom: social/system) and the
 * single swappable `#sidebar-body`. Exactly one tab is active at a time: its
 * backing page (`data-page`) is shown and rendered, every other page is hidden.
 * Tabs with no backing system fall back to the shared scaffold placeholder.
 *
 * This is a deep module: callers only deal with `select`, `active`, `tabForKey`
 * and `dispose`. All DOM lookups, visibility toggling, active-state classes,
 * placeholder text and keyboard mapping live here, behind that small surface.
 */

/** Sidebar page panels (one visible at a time; the rest are `.hidden`). */
const SIDEBAR_PAGES = [
  "inventory-panel",
  "equipment-panel",
  "combat-panel",
  "skills-panel",
  "spellbook-panel",
  "quest-panel",
  "settings-panel",
  "sidebar-placeholder",
] as const;

/** Labels for scaffold tabs that have no backing system yet. */
const SCAFFOLD_TAB_LABELS: Record<string, string> = {
  prayer: "Prayer",
  clan: "Clan Chat",
  friends: "Friends List",
  account: "Account Management",
  logout: "Logout",
  emotes: "Emotes",
  music: "Music Player",
};

/** Keyboard shortcut key -> sidebar tab id. */
const TAB_KEY_BINDINGS: Record<string, string> = {
  f: "combat",
  k: "skills",
  q: "quests",
  i: "inventory",
  e: "equipment",
  p: "prayer",
  m: "magic",
  o: "settings",
};

export interface SidebarTabsOptions {
  /** Render a page's content when its tab becomes active. */
  renderPage(pageId: string): void;
}

export class SidebarTabs {
  private readonly tabs = new Map<string, HTMLButtonElement>();
  private readonly cleanup: Array<() => void> = [];
  private _active = "";

  constructor(private readonly opts: SidebarTabsOptions) {
    for (const btn of document.querySelectorAll<HTMLButtonElement>(".sb-tab")) {
      const id = btn.dataset.tab;
      if (!id) continue;
      this.tabs.set(id, btn);
      const handler = () => this.select(id);
      btn.addEventListener("click", handler);
      this.cleanup.push(() => btn.removeEventListener("click", handler));
    }
  }

  /** The id of the currently-active tab (empty before the first `select`). */
  get active(): string {
    return this._active;
  }

  /** Whether a tab with this id exists in the DOM. */
  has(tabId: string): boolean {
    return this.tabs.has(tabId);
  }

  /** Map a (lower-cased) keyboard key to a tab id, if one is bound. */
  static tabForKey(key: string): string | undefined {
    return TAB_KEY_BINDINGS[key];
  }

  /** Activate a tab: show + render its page (or the placeholder) and update highlights. */
  select(tabId: string): void {
    const btn = this.tabs.get(tabId);
    if (!btn) return;

    for (const pageId of SIDEBAR_PAGES) {
      document.getElementById(pageId)?.classList.add("hidden");
    }

    const pageId = btn.dataset.page;
    if (pageId) {
      document.getElementById(pageId)?.classList.remove("hidden");
      this.opts.renderPage(pageId);
    } else {
      this._showPlaceholder(SCAFFOLD_TAB_LABELS[tabId] ?? tabId);
      this.opts.renderPage("sidebar-placeholder");
    }

    for (const [, other] of this.tabs) {
      other.classList.toggle("active", other === btn);
    }
    this._active = tabId;
  }

  private _showPlaceholder(title: string): void {
    const titleEl = document.getElementById("sidebar-placeholder-title");
    if (titleEl) titleEl.textContent = title;
    document.getElementById("sidebar-placeholder")?.classList.remove("hidden");
  }

  dispose(): void {
    for (const off of this.cleanup) off();
    this.cleanup.length = 0;
  }
}
