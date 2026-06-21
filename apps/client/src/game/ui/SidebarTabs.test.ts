import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarTabs } from "./SidebarTabs";

function setupDom(): void {
  document.body.innerHTML = `
    <div id="inventory-panel" class="hidden"></div>
    <div id="equipment-panel" class="hidden"></div>
    <div id="combat-panel" class="hidden"></div>
    <div id="skills-panel" class="hidden"></div>
    <div id="spellbook-panel" class="hidden"></div>
    <div id="quest-panel" class="hidden"></div>
    <div id="settings-panel" class="hidden"></div>
    <div id="sidebar-placeholder" class="hidden"><h2 id="sidebar-placeholder-title"></h2></div>
    <button type="button" class="sb-tab" data-tab="inventory" data-page="inventory-panel"></button>
    <button type="button" class="sb-tab" data-tab="equipment" data-page="equipment-panel"></button>
    <button type="button" class="sb-tab" data-tab="combat" data-page="combat-panel"></button>
    <button type="button" class="sb-tab" data-tab="skills" data-page="skills-panel"></button>
    <button type="button" class="sb-tab" data-tab="magic" data-page="spellbook-panel"></button>
    <button type="button" class="sb-tab" data-tab="quests" data-page="quest-panel"></button>
    <button type="button" class="sb-tab" data-tab="settings" data-page="settings-panel"></button>
    <button type="button" class="sb-tab" data-tab="prayer"></button>
    <button type="button" class="sb-tab" data-tab="clan"></button>
  `;
}

beforeEach(setupDom);
afterEach(() => {
  document.body.innerHTML = "";
});

describe("SidebarTabs", () => {
  it("starts with no active tab", () => {
    const tabs = new SidebarTabs({ renderPage: vi.fn() });
    expect(tabs.active).toBe("");
    tabs.dispose();
  });

  it("has reports whether a tab id exists in the DOM", () => {
    const tabs = new SidebarTabs({ renderPage: vi.fn() });
    expect(tabs.has("inventory")).toBe(true);
    expect(tabs.has("prayer")).toBe(true);
    expect(tabs.has("nonexistent")).toBe(false);
    tabs.dispose();
  });

  it("select shows the tab's backing page and renders it", () => {
    const renderPage = vi.fn();
    const tabs = new SidebarTabs({ renderPage });
    tabs.select("inventory");
    expect(tabs.active).toBe("inventory");
    expect(document.getElementById("inventory-panel")?.classList.contains("hidden")).toBe(false);
    expect(renderPage).toHaveBeenCalledWith("inventory-panel");
    tabs.dispose();
  });

  it("select hides all other pages when activating a new one", () => {
    const tabs = new SidebarTabs({ renderPage: vi.fn() });
    tabs.select("inventory");
    tabs.select("skills");
    expect(document.getElementById("inventory-panel")?.classList.contains("hidden")).toBe(true);
    expect(document.getElementById("skills-panel")?.classList.contains("hidden")).toBe(false);
    expect(tabs.active).toBe("skills");
    tabs.dispose();
  });

  it("select toggles the active class only on the selected tab button", () => {
    const tabs = new SidebarTabs({ renderPage: vi.fn() });
    tabs.select("combat");
    const combatBtn = document.querySelector<HTMLButtonElement>(".sb-tab[data-tab='combat']");
    const invBtn = document.querySelector<HTMLButtonElement>(".sb-tab[data-tab='inventory']");
    expect(combatBtn?.classList.contains("active")).toBe(true);
    expect(invBtn?.classList.contains("active")).toBe(false);
    tabs.dispose();
  });

  it("select with a scaffold tab (no data-page) shows the placeholder with its label", () => {
    const tabs = new SidebarTabs({ renderPage: vi.fn() });
    tabs.select("prayer");
    expect(tabs.active).toBe("prayer");
    expect(document.getElementById("sidebar-placeholder")?.classList.contains("hidden")).toBe(
      false,
    );
    expect(document.getElementById("sidebar-placeholder-title")?.textContent).toBe("Prayer");
    tabs.dispose();
  });

  it("select with an unknown tab id is a no-op", () => {
    const renderPage = vi.fn();
    const tabs = new SidebarTabs({ renderPage });
    tabs.select("does-not-exist");
    expect(tabs.active).toBe("");
    expect(renderPage).not.toHaveBeenCalled();
    tabs.dispose();
  });

  it("clicking a tab button selects it", () => {
    const renderPage = vi.fn();
    const tabs = new SidebarTabs({ renderPage });
    const btn = document.querySelector<HTMLButtonElement>(".sb-tab[data-tab='equipment']");
    btn?.click();
    expect(tabs.active).toBe("equipment");
    expect(renderPage).toHaveBeenCalledWith("equipment-panel");
    tabs.dispose();
  });

  it("dispose removes click listeners so clicks no longer select", () => {
    const renderPage = vi.fn();
    const tabs = new SidebarTabs({ renderPage });
    const btn = document.querySelector<HTMLButtonElement>(".sb-tab[data-tab='inventory']");
    tabs.dispose();
    btn?.click();
    expect(tabs.active).toBe("");
    expect(renderPage).not.toHaveBeenCalled();
  });
});

describe("SidebarTabs.tabForKey", () => {
  it("maps bound keyboard shortcuts to tab ids", () => {
    expect(SidebarTabs.tabForKey("f")).toBe("combat");
    expect(SidebarTabs.tabForKey("k")).toBe("skills");
    expect(SidebarTabs.tabForKey("q")).toBe("quests");
    expect(SidebarTabs.tabForKey("i")).toBe("inventory");
    expect(SidebarTabs.tabForKey("e")).toBe("equipment");
    expect(SidebarTabs.tabForKey("p")).toBe("prayer");
    expect(SidebarTabs.tabForKey("m")).toBe("magic");
    expect(SidebarTabs.tabForKey("o")).toBe("settings");
  });

  it("returns undefined for unbound keys", () => {
    expect(SidebarTabs.tabForKey("z")).toBeUndefined();
    expect(SidebarTabs.tabForKey("")).toBeUndefined();
  });
});
