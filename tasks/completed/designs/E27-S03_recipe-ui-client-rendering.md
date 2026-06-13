# E27-S03 — Recipe UI Client Rendering

## Designer: Design Document

**Epic:** E27 — Recipe Selection and Crafting  
**Story:** E27-S03 — Recipe UI Client Rendering  
**Depends on:** E27-S02 (Server-Side Recipe Selection Handler)  
**Blocks:** (none)  
**Spec references:** POC_SPEC.md §14 (UI & HUD), §9 (Skilling & Processing), §8 (Networking)

---

## 1. Feature Summary

Implement the client-side recipe selection UI. When a player uses a crafting station, the server sends a `RecipeListPacket` via the tick-delta `recipeLists` field or `interfaceOpens`. The client renders a scrollable recipe list inside a new panel, allows single-click selection, shows a "Make" button for the selected recipe, and displays result feedback (success/failure, item produced, XP gained) when the server sends a `RecipeResultPacket` via `recipeResults`.

The client is presentation-only. All recipe validation, material consumption, success rolls, and XP awards happen server-side. The client sends only `RecipeSelect` intent commands.

---

## 2. Data Model

### 2.1 UIState additions

`UIState` gains two new authoritative fields and a client-side selection field:

```ts
// UIState.ts
export class UIState {
  private _recipeList: RecipeListPacket | undefined;
  private _recipeResult: RecipeResultPacket | undefined;
  // ... existing fields ...

  get recipeList(): RecipeListPacket | undefined {
    return this._recipeList;
  }

  setRecipeList(packet: RecipeListPacket): void {
    this._recipeList = packet;
    this._recipeResult = undefined; // clear stale result on new list
    this._notify();
  }

  clearRecipeList(): void {
    this._recipeList = undefined;
    this._recipeResult = undefined;
    this._notify();
  }

  get recipeResult(): RecipeResultPacket | undefined {
    return this._recipeResult;
  }

  setRecipeResult(packet: RecipeResultPacket): void {
    this._recipeResult = packet;
    this._notify();
  }

  clearRecipeResult(): void {
    this._recipeResult = undefined;
    this._notify();
  }
}
```

### 2.2 IUIState interface additions

`IUIState` in `ClientPacketApplier.ts` must declare the new contract:

```ts
export interface IUIState {
  // ... existing methods ...
  setRecipeList(packet: RecipeListPacket): void;
  clearRecipeList(): void;
  setRecipeResult(packet: RecipeResultPacket): void;
  clearRecipeResult(): void;
}
```

### 2.3 UIManager private selection state

Selection is purely client-side chrome. It does not sync to the server until the player clicks Make.

```ts
// UIManager.ts
export class UIManager {
  private _selectedRecipeId: string | undefined;
  private _selectedQuantity: number = 1;
  // ...
}
```

---

## 3. Protocol Changes

### 3.1 Required additions to existing types

The `RecipeListPacket` and `RecipeListEntry` types in `packages/shared/src/protocol/packets.ts` were defined in E27-S01 but are missing fields the UI needs. S03 extends them without breaking existing wire shape:

**`RecipeListPacket` additions:**

```ts
export interface RecipeListPacket {
  readonly interfaceId: string;
  readonly stationEntityId: number;     // NEW — required for RecipeSelect command
  readonly stationName: string;          // NEW — header text (e.g. "Bakery Range")
  readonly recipes: readonly RecipeListEntry[];
}
```

**`RecipeListEntry` additions:**

```ts
export interface RecipeListEntry {
  readonly recipeId: string;
  readonly name: string;
  readonly skillId: string;              // NEW — for skill icon / colour
  readonly levelRequired: number;
  readonly xp: number;                   // NEW — for XP preview display
  readonly ingredients: readonly { readonly itemId: string; readonly quantity: number }[];
  readonly productId: string;
  readonly productQuantity: number;
}
```

**`RecipeResultPacket` — already sufficient:**

```ts
export interface RecipeResultPacket {
  readonly recipeId: string;
  readonly success: boolean;
  readonly productItemId?: string;
  readonly productQuantity?: number;
  readonly xpReward?: number;
  readonly message?: string;
}
```

### 3.2 ClientCommandDispatcher — new method

```ts
// ClientCommandDispatcher.ts
recipeSelect(recipeId: string, stationEntityId: number): void {
  this._sendCommand({
    type: ClientCommandType.RecipeSelect,
    commandId: ++this._commandId,
    clientTickHint: this._currentTick,
    payload: { recipeId, stationEntityId },
  });
}
```

### 3.3 UIManagerCallbacks — new callback

```ts
export interface UIManagerCallbacks {
  // ... existing callbacks ...
  sendRecipeCommand(recipeId: string, stationEntityId: number): void;
}
```

---

## 4. Server Logic

No server logic changes in S03. The server must:

1. Send `RecipeListPacket` via `TickDeltaPacket.recipeLists` or `InterfaceOpenPacket.recipe` when the player opens a crafting station.
2. Send `RecipeResultPacket` via `TickDeltaPacket.recipeResults` after processing a `RecipeSelect` command.
3. Send `InterfaceClosePacket { interfaceId: "recipe" }` when the player walks away or the station interaction ends.

(These are owned by E27-S02 and already implemented.)

---

## 5. Client Logic

### 5.0 Panel Behavior & Keyboard Shortcut

**Open:** The server sends `RecipeListPacket` via `TickDeltaPacket.recipeLists` or `InterfaceOpenPacket`. The client renders the panel automatically when a recipe list is present.

**Close:** The server sends `InterfaceClosePacket { interfaceId: "recipe" }` when the player walks away or the action is cancelled. The client calls `uiState.clearRecipeList()` on receipt. The panel also closes when the player presses Escape (handled by existing `interfaceCloses` logic).

**Keyboard shortcut:** The recipe panel is **context-only** — it opens automatically when using a crafting station and has no dedicated toggle key. The bar button `🔨` is present for manual access but the primary flow is automatic open/close.

### 5.1 ClientPacketApplier — apply recipe packets

In `applyTickDelta`, add two new blocks after the `interfaceCloses` handling:

```ts
// ClientPacketApplier.ts — applyTickDelta

if (packet.recipeLists && packet.recipeLists.length > 0) {
  // Take the first list; player can only interact with one station at a time.
  ctx.uiState.setRecipeList(packet.recipeLists[0]);
}

if (packet.recipeResults && packet.recipeResults.length > 0) {
  // Show the most recent result.
  ctx.uiState.setRecipeResult(packet.recipeResults[packet.recipeResults.length - 1]);
}
```

Also extend `interfaceOpens` handling:

```ts
if (packet.interfaceOpens) {
  for (const open of packet.interfaceOpens) {
    // ... existing dialogue / shop ...
    if (open.recipe) {
      ctx.uiState.setRecipeList(open.recipe);
    }
  }
}

if (packet.interfaceCloses) {
  for (const close of packet.interfaceCloses) {
    // ... existing dialogue / bank / shop ...
    if (close.interfaceId === "recipe") {
      ctx.uiState.clearRecipeList();
    }
  }
}
```

### 5.2 index.html — new recipe panel

Insert the `recipe-panel` inside `#ui-right`, after `shop-panel`:

```html
<div id="ui-right">
  <!-- ... existing panels ... -->
  <div id="recipe-panel" class="ui-panel hidden">
    <div class="ui-panel-header" id="recipe-header">Recipe</div>
    <div class="ui-panel-body" id="recipe-body">
      <div id="recipe-list"></div>
      <div id="recipe-detail" class="recipe-detail hidden">
        <div id="recipe-ingredients"></div>
        <div id="recipe-output"></div>
        <div id="recipe-quantity" class="recipe-quantity">
          <button type="button" class="qty-btn active" data-qty="1">1</button>
          <button type="button" class="qty-btn" data-qty="5">5</button>
          <button type="button" class="qty-btn" data-qty="10">10</button>
          <button type="button" class="qty-btn" data-qty="x">X</button>
        </div>
        <button type="button" id="recipe-make-btn" class="recipe-make-btn">Make</button>
      </div>
      <div id="recipe-feedback" class="recipe-feedback hidden"></div>
    </div>
  </div>
</div>
```

Add a bar button in `#ui-bar-right`:

```html
<button type="button" class="ui-bar-btn" data-panel="recipe-panel">🔨</button>
```

### 5.3 CSS additions

Append to the `<style>` block in `index.html`:

```css
/* Recipe panel */
#recipe-panel {
  width: 220px;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 160px;
  overflow-y: auto;
}

.recipe-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  background: rgba(40, 40, 50, 0.8);
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
  user-select: none;
}

.recipe-row:hover {
  background: rgba(60, 60, 75, 0.9);
  border-color: #666;
}

.recipe-row.selected {
  background: rgba(80, 70, 50, 0.9);
  border-color: #d4a843;
}

.recipe-row .recipe-name {
  flex: 1;
  font-size: 11px;
}

.recipe-row .recipe-level {
  font-size: 10px;
  color: #aaa;
  margin-left: 4px;
}

.recipe-row .recipe-level.too-high {
  color: #ff4444;
}

/* Unmet requirements: entire row dims but remains selectable */
.recipe-row.unmet {
  opacity: 0.6;
}

.recipe-detail {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #444;
}

.recipe-detail.hidden {
  display: none;
}

.recipe-ingredients {
  font-size: 11px;
  margin-bottom: 6px;
}

.recipe-ingredients .ingredient-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  color: #ccc;
}

.recipe-ingredients .ingredient-row.missing {
  color: #ff4444;
}

.recipe-output {
  font-size: 11px;
  color: #d4a843;
  margin-bottom: 8px;
}

.recipe-make-btn {
  width: 100%;
  padding: 6px 0;
  background: linear-gradient(180deg, #5a6c3a 0%, #4a5c2a 50%, #3a4c1a 100%);
  border: 1px solid rgba(100, 120, 60, 0.5);
  color: #e8dcc8;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 3px;
}

.recipe-make-btn:hover {
  background: linear-gradient(180deg, #6a7c4a 0%, #5a6c3a 50%, #4a5c2a 100%);
}

.recipe-make-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipe-quantity {
  display: flex;
  gap: 2px;
  margin-bottom: 6px;
}

.qty-btn {
  flex: 1;
  padding: 3px 0;
  background: rgba(40, 40, 50, 0.8);
  border: 1px solid #444;
  color: #ccc;
  font-family: "Courier New", monospace;
  font-size: 10px;
  cursor: pointer;
  border-radius: 2px;
}

.qty-btn:hover {
  background: rgba(60, 60, 75, 0.9);
}

.qty-btn.active {
  background: rgba(80, 70, 50, 0.9);
  border-color: #d4a843;
  color: #d4a843;
}

.recipe-feedback {
  margin-top: 8px;
  padding: 6px;
  border-radius: 2px;
  font-size: 11px;
  text-align: center;
}

.recipe-feedback.hidden {
  display: none;
}

.recipe-feedback.success {
  background: rgba(40, 80, 40, 0.8);
  border: 1px solid #4a9a4a;
  color: #88ff88;
}

.recipe-feedback.failure {
  background: rgba(80, 40, 40, 0.8);
  border: 1px solid #ff4444;
  color: #ff8888;
}
```

### 5.4 UIManager — integration

**Constructor additions:**

```ts
private _recipeClickListeners: Array<() => void> = [];
private _recipeMakeListener: (() => void) | undefined;

constructor(...) {
  // ... existing setup ...
  this._bindRecipeMakeButton();
}
```

**Dispose additions:**

```ts
dispose(): void {
  // ... existing cleanup ...
  for (const listener of this._recipeClickListeners) {
    listener();
  }
  this._recipeClickListeners = [];
  const makeBtn = document.getElementById("recipe-make-btn");
  if (makeBtn && this._recipeMakeListener) {
    makeBtn.removeEventListener("click", this._recipeMakeListener);
  }
}
```

**Panel order and keybindings:**

```ts
private readonly panelOrder = [
  "inventory-panel",
  "equipment-panel",
  "skills-panel",
  "spellbook-panel",
  "quest-panel",
  "chat-box",
  "bank-panel",
  "shop-panel",
  "recipe-panel",
];

private readonly keyBindings: Record<string, string> = {
  i: "inventory-panel",
  e: "equipment-panel",
  k: "skills-panel",
  m: "spellbook-panel",
  q: "quest-panel",
  c: "chat-box",
  b: "bank-panel",
  s: "shop-panel",
  d: "debug-overlay",
};
```

**`_renderAll` addition:**

```ts
private _renderAll(): void {
  // ... existing render calls ...
  this._renderRecipes();
}
```

**`_renderRecipes` implementation:**

```ts
private _renderRecipes(): void {
  const body = document.getElementById("recipe-body");
  const listEl = document.getElementById("recipe-list");
  const detailEl = document.getElementById("recipe-detail");
  const feedbackEl = document.getElementById("recipe-feedback");
  const headerEl = document.getElementById("recipe-header");
  const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
  if (!body || !listEl || !detailEl || !feedbackEl || !headerEl || !makeBtn) return;

  // Clear old click listeners.
  for (const listener of this._recipeClickListeners) {
    listener();
  }
  this._recipeClickListeners = [];

  const list = this.uiState.recipeList;
  const result = this.uiState.recipeResult;

  if (!list) {
    listEl.innerHTML = "";
    detailEl.classList.add("hidden");
    feedbackEl.classList.add("hidden");
    headerEl.textContent = "Recipe";
    return;
  }

  headerEl.textContent = list.stationName || "Recipe";

  // Render list.
  listEl.innerHTML = "";
  for (const entry of list.recipes) {
    const row = document.createElement("div");
    row.classList.add("recipe-row");
    if (this._selectedRecipeId === entry.recipeId) {
      row.classList.add("selected");
    }

    const nameSpan = document.createElement("span");
    nameSpan.classList.add("recipe-name");
    nameSpan.textContent = entry.name;

    const levelSpan = document.createElement("span");
    levelSpan.classList.add("recipe-level");
    const skill = this.uiState.skills.get(entry.skillId);
    const playerLevel = skill?.level ?? 1;
    levelSpan.textContent = `Lvl ${entry.levelRequired}`;
    if (playerLevel < entry.levelRequired) {
      levelSpan.classList.add("too-high");
      row.classList.add("unmet");
    }

    row.appendChild(nameSpan);
    row.appendChild(levelSpan);

    const clickHandler = () => {
      this._selectedRecipeId = entry.recipeId;
      this._renderRecipes();
    };
    row.addEventListener("click", clickHandler);
    this._recipeClickListeners.push(() => row.removeEventListener("click", clickHandler));

    listEl.appendChild(row);
  }

  // Render detail for selected recipe.
  const selected = list.recipes.find((r) => r.recipeId === this._selectedRecipeId);
  if (selected) {
    detailEl.classList.remove("hidden");

    const ingredientsEl = document.getElementById("recipe-ingredients");
    if (ingredientsEl) {
      ingredientsEl.innerHTML = "";
      for (const ing of selected.ingredients) {
        const ingRow = document.createElement("div");
        ingRow.classList.add("ingredient-row");
        const def = this.content.getItem(ing.itemId);
        const name = def?.name ?? ing.itemId;
        ingRow.textContent = `${name} x${ing.quantity}`;
        ingredientsEl.appendChild(ingRow);
      }
    }

    const outputEl = document.getElementById("recipe-output");
    if (outputEl) {
      const def = this.content.getItem(selected.productId);
      const name = def?.name ?? selected.productId;
      outputEl.textContent = `Makes: ${name} x${selected.productQuantity} (+${selected.xp} XP)`;
    }

    // Render quantity selector (visual-only for POC)
    const qtyEl = document.getElementById("recipe-quantity");
    if (qtyEl) {
      const qtyBtns = qtyEl.querySelectorAll(".qty-btn");
      qtyBtns.forEach((btn) => {
        btn.classList.remove("active");
      });
      const activeBtn = qtyEl.querySelector(`[data-qty="${this._selectedQuantity ?? 1}"]`);
      if (activeBtn) activeBtn.classList.add("active");
    }

    const skill = this.uiState.skills.get(selected.skillId);
    const canMake = (skill?.level ?? 1) >= selected.levelRequired;
    makeBtn.disabled = !canMake;
    makeBtn.textContent = canMake ? "Make" : "Level too low";
  } else {
    detailEl.classList.add("hidden");
    makeBtn.disabled = true;
  }

  // Render feedback.
  if (result) {
    feedbackEl.classList.remove("hidden");
    feedbackEl.classList.remove("success", "failure");
    feedbackEl.classList.add(result.success ? "success" : "failure");
    const productDef = result.productItemId ? this.content.getItem(result.productItemId) : undefined;
    const productName = productDef?.name ?? result.productItemId ?? "unknown";
    const xpText = result.xpReward ? ` (+${result.xpReward} XP)` : "";
    feedbackEl.textContent = result.message
      ?? (result.success ? `You made ${productName} x${result.productQuantity ?? 1}${xpText}.`
                         : `You failed to make ${productName}.`);
  } else {
    feedbackEl.classList.add("hidden");
  }
}
```

**`_bindRecipeMakeButton`:**

```ts
private _bindRecipeMakeButton(): void {
  const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
  if (!makeBtn) return;

  this._recipeMakeListener = () => {
    const list = this.uiState.recipeList;
    const selected = this._selectedRecipeId;
    if (!list || !selected) return;
    this.callbacks.sendRecipeCommand(selected, list.stationEntityId);
  };
  makeBtn.addEventListener("click", this._recipeMakeListener);
}
```

---

## 6. Content Requirements

No new content items, recipes, or drops are introduced by this story. The UI renders existing recipe definitions and item definitions already loaded by `ContentClient`.

**Content registry requirement:** The `ContentClient` must be able to resolve item names from `itemId` strings. This is already true via `content.getItem(itemId)`.

**Note:** If `RecipeListEntry` does not include `skillId` and `xp` on the wire, the UI cannot render skill colours or XP preview. The implementer must ensure the server populates these fields (see §3.1).

---

## 7. Testing Criteria

### 7.1 Unit tests — `UIManager.test.ts`

Add these test cases to the existing test suite:

1. **Renders recipe list when `setRecipeList` is called.**
   - Call `uiState.setRecipeList({ interfaceId: "recipe", stationEntityId: 42, stationName: "Range", recipes: [...] })`
   - Assert `#recipe-list` contains the correct number of `.recipe-row` elements.
   - Assert `#recipe-header` text equals "Range".

2. **Highlights selected recipe on click.**
   - Render a list with two recipes.
   - Click the first row.
   - Assert the first row has `selected` class and the second does not.

3. **Shows detail panel and Make button on selection.**
   - Render a list and click a recipe.
   - Assert `#recipe-detail` is visible.
   - Assert `#recipe-make-btn` text is "Make" and it is not disabled (when player level >= required).
   - Assert `#recipe-output` shows product name and XP.

4. **Disables Make button when level requirement is not met.**
   - Render a recipe requiring level 10.
   - Set player skill level to 5.
   - Click the recipe.
   - Assert `#recipe-make-btn` is disabled and text is "Level too low".

5. **Sends `RecipeSelect` command on Make click.**
   - Render a list, click a recipe, click Make.
   - Assert `callbacks.sendRecipeCommand` was called with `(recipeId, stationEntityId)`.

6. **Shows success feedback on `setRecipeResult`.**
   - Call `uiState.setRecipeResult({ recipeId: "...", success: true, productItemId: "cooked_fish", productQuantity: 1, xpReward: 40, message: "You cook the fish." })`
   - Assert `#recipe-feedback` has `success` class and contains the message.

7. **Shows failure feedback on `setRecipeResult`.**
   - Call `uiState.setRecipeResult({ recipeId: "...", success: false, message: "You burn the fish." })`
   - Assert `#recipe-feedback` has `failure` class and contains the message.

8. **Clears panel on `clearRecipeList`.**
   - Call `uiState.setRecipeList(...)` then `uiState.clearRecipeList()`.
   - Assert `#recipe-list` is empty, `#recipe-detail` is hidden, `#recipe-feedback` is hidden.

9. **Disposes without error with recipe panel attached.**
    - Same as existing dispose test; verify no exception.

### 7.2 Unit tests — `ClientPacketApplier.test.ts`

Add these test cases:

1. **Applies `recipeLists` from tick delta.**
   - Call `applyTickDelta` with `recipeLists: [{ interfaceId: "recipe", stationEntityId: 5, stationName: "Range", recipes: [] }]`.
   - Assert `ctx.uiState.setRecipeList` called with the first packet.

2. **Applies `recipeResults` from tick delta.**
   - Call `applyTickDelta` with `recipeResults: [{ recipeId: "r1", success: true, xpReward: 10 }]`.
   - Assert `ctx.uiState.setRecipeResult` called with the last result.

3. **Opens recipe via `interfaceOpens`.**
   - Call `applyTickDelta` with `interfaceOpens: [{ interfaceId: "recipe", recipe: { ... } }]`.
   - Assert `ctx.uiState.setRecipeList` called.

4. **Closes recipe via `interfaceCloses`.**
   - Call `applyTickDelta` with `interfaceCloses: [{ interfaceId: "recipe" }]`.
   - Assert `ctx.uiState.clearRecipeList` called.

### 7.3 Integration validation

- `bun run test` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.

---

## 8. Economy Impact

**No economy impact** — this is a UI presentation change. The recipe UI does not introduce new items, alter drop tables, change shop prices, or affect trade values. All item creation, consumption, and XP awards remain server-authoritative and are unchanged by this client story.

---

## 9. Risks & Open Questions

| Risk | Mitigation |
|------|------------|
| **`RecipeListPacket` lacks `stationEntityId`** | The server must include `stationEntityId` in the packet so the client can dispatch `RecipeSelect` commands. If E27-S02 omitted this, the wire type must be extended before S03 can be fully implemented. |
| **`RecipeListEntry` lacks `skillId` and `xp`** | The server must include these fields for the UI to render skill colours and XP preview. Without them, the list renders only name and level. |
| **No client-side recipe content registry** | `ContentClient` does not load recipes today. The design avoids this by using the wire payload for all recipe data. |
| **Multiple `recipeLists` in one tick** | The design takes `packet.recipeLists[0]`. If the server ever sends multiple stations simultaneously, the UI will only show the first. This is acceptable for the POC because a player cannot use two stations at once. |
| **Selection state lost on re-render** | Selection is stored in `UIManager._selectedRecipeId`, not `UIState`. It survives re-renders but resets when the panel is closed or a new recipe list arrives. This is correct client-only behaviour. |
| **Make button spam** | The button is never disabled after clicking (server does not send a "crafting in progress" state). The design keeps the button always enabled while a valid recipe is selected. The server will ignore duplicate or invalid commands. This is acceptable for POC. |

---

## 9.5 Quantity Selection

The recipe panel includes a quantity selector row: **1 / 5 / 10 / X / All**. This matches the old-school production interface convention. The default is **Make 1**. For the POC, the quantity selector is visual-only — the server processes one unit per click. A future story may wire the quantity buttons to batch-processing commands.

---

## 10. Visual Design — ASCII Wireframe

```
┌─────────────────────────┐
│ Range                   │  ← stationName (header)
├─────────────────────────┤
│ Cooked Fish      Lvl 1  │  ← recipe-row (selected)
│ [highlighted]             │
│ Fish Stew        Lvl 5  │  ← recipe-row
│ Fish Pie         Lvl 10 │  ← recipe-row (level too high, red text)
│                         │
│ ─────────────────────── │
│ Raw Fish x1             │  ← ingredients
│                         │
│ Makes: Cooked Fish x1   │  ← output
│ (+40 XP)                │
│                         │
│ [ 1 ] [ 5 ] [ 10 ] [X]  │  ← Quantity selector (default: Make 1)
│ [      Make      ]      │  ← Make button (disabled if level too low)
│                         │
│ You cook the fish.      │  ← feedback (success, green)
│ (+40 XP)                │
└─────────────────────────┘
```

---

## 11. File Checklist

Implementer must touch these files in order:

1. `packages/shared/src/protocol/packets.ts` — extend `RecipeListPacket` and `RecipeListEntry` (§3.1)
2. `apps/client/src/game/ui/UIState.ts` — add recipe fields and methods (§2.1)
3. `apps/client/src/game/net/ClientPacketApplier.ts` — add `IUIState` methods and delta handling (§2.2, §5.1)
4. `apps/client/src/game/net/ClientCommandDispatcher.ts` — add `recipeSelect` method (§3.2)
5. `apps/client/src/game/ui/UIManager.ts` — add rendering, selection, callbacks (§5.4)
6. `apps/client/index.html` — add panel HTML, bar button, CSS (§5.2, §5.3)
7. `apps/client/src/game/ui/UIManager.test.ts` — add recipe UI tests (§7.1)
8. `apps/client/src/game/net/ClientPacketApplier.test.ts` — add recipe packet tests (§7.2)

---

## Design sign-off

- [ ] Feature Summary is complete and bounded
- [ ] Data Model specifies exact fields, getters, setters, clearers
- [ ] Protocol Changes specify exact wire additions
- [ ] Server Logic is correct (no client authority)
- [ ] Client Logic is exact (HTML, CSS, rendering, commands)
- [ ] Content Requirements are minimal (no hardcoding)
- [ ] Testing Criteria are exhaustive and runnable
- [ ] Economy Impact section is present
- [ ] Risks & Open Questions enumerate every seam
