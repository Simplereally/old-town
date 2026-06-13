# E27-S02 — Server-Side Recipe Selection Handler

## Designer: Design Document

**Epic:** E27 — Recipe Selection and Crafting  
**Story:** E27-S02 — Server-Side Recipe Selection Handler  
**Depends on:** E27-S01 (Recipe Selection UI Protocol)  
**Blocks:** E27-S03 (Recipe UI Client Rendering)  
**Spec references:** POC_SPEC.md §9 (Skilling & Processing), §10 (Action Queue System), §12 (Interaction Model), §8.3 (Delta Packet)

---

## 1. Feature Summary

Implement the server-side recipe selection handler. Replace the current auto-selection flow with explicit player choice.

**Current behavior (to replace):**
- Player clicks "Cook" on a range.
- `matchingRecipes()` finds recipes matching station + inventory.
- If exactly 1 recipe matches, the server auto-enqueues it without player choice.
- If >1 recipe matches, the server sends a `RecipeListPacket`.
- The `RecipeSelect` intent (`C2S_RECIPE_SELECT`) is accepted by the command buffer but silently dropped by the intent dispatcher.

**New behavior (to implement):**
- Player clicks "Cook" / "Smith" / "Craft" / etc. on a station.
- Server sends a `RecipeListPacket` filtered by station + inventory + level.
- Player selects a recipe in the client UI.
- Client sends `RecipeSelectCommand`.
- Server validates the selection (level, materials, station, distance, line-of-sight).
- If valid, server enqueues a `process` or `begin_process` action with the explicit `recipeId`.
- On each process tick, server consumes inputs, rolls success/failure, produces output, awards XP, and emits a `RecipeResultPacket`.

---

## 2. Data Model

### 2.1 Content-layer types (no changes)

`ProcessingRecipeDef` already contains all fields needed. No schema changes.

```ts
type ProcessingRecipeDef = {
  id: string;
  name: string;
  skill: string;
  requiredLevel: number;
  actionTicks: number;
  stationObjectIds: string[];
  inputItemId: string;
  inputQuantity: number;
  successItemId: string;
  successQuantity: number;
  failureItemId?: string;
  failureQuantity?: number;
  failureChance: number;
  xp: number;
};
```

### 2.2 ECS component types (no changes)

The `inventory`, `skills`, `position`, and `object` components are unchanged.

### 2.3 Action queue payloads (already defined)

`ProcessActionPayload` and `BeginProcessActionPayload` already carry `recipeId`:

```ts
interface ProcessActionPayload {
  kind: "process";
  stationEntityId: EntityId;
  recipeId: string;
}

interface BeginProcessActionPayload {
  kind: "begin_process";
  stationEntityId: EntityId;
  recipeId: string;
}
```

---

## 3. Protocol Changes

### 3.1 `RecipeListPacket` — fix server emission shape

The `RecipeListPacket` type in `packages/shared/src/protocol/packets.ts` (E27-S01) is:

```ts
export interface RecipeListPacket {
  readonly interfaceId: string;
  readonly recipes: readonly RecipeListEntry[];
}

export interface RecipeListEntry {
  readonly recipeId: string;
  readonly name: string;
  readonly levelRequired: number;
  readonly ingredients: readonly { readonly itemId: string; readonly quantity: number }[];
  readonly productId: string;
  readonly productQuantity: number;
}
```

The server currently emits an invalid shape in `skilling-system.ts` (lines 460–470). It passes `type`, `stationEntityId`, and malformed entry fields (`outputItemId`, `outputQuantity`, `level`).

**Fix:** The server must emit the exact `RecipeListPacket` shape:

```ts
ctx.deltas.markRecipeList({
  interfaceId: "recipe",               // canonical recipe panel id
  recipes: recipes.map((recipe) => ({
    recipeId: recipe.id,
    name: recipe.name,
    levelRequired: recipe.requiredLevel,
    ingredients: [{ itemId: recipe.inputItemId, quantity: recipe.inputQuantity }],
    productId: recipe.successItemId,
    productQuantity: recipe.successQuantity,
  })),
});
```

**Note:** E27-S03 may extend `RecipeListPacket` with `stationEntityId` and `stationName`. This design does **not** modify the shared protocol type; it only fixes the server to emit the valid shape already defined by E27-S01. If S03 extends the type later, S02 will be updated to include the new fields.

### 3.2 `RecipeResultPacket` — already defined

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

The server currently never emits this. The design specifies exact emission logic in §5.

### 3.3 `RecipeSelectCommand` — already defined

```ts
export interface RecipeSelectIntent {
  readonly recipeId: string;
  readonly stationEntityId: EntityId;
}
```

No changes.

---

## 4. Server Logic

### 4.1 Intent dispatch path

**File:** `apps/server/src/sim/intent-dispatcher.ts`

Add a `case` for `IntentKind.RecipeSelect` inside `dispatchSingleIntent`.

```ts
import { handleRecipeSelect } from "../systems/skilling-system";

// inside dispatchSingleIntent switch:
case IntentKind.RecipeSelect: {
  ctx.actionRuntime.cancel(owner, { type: ActionQueueType.Weak });
  handleRecipeSelect(
    ctx,  // IntentDispatcherContext satisfies SkillingContext
    owner,
    intent.payload.stationEntityId,
    intent.payload.recipeId,
    serverTime,
    tick,
  );
  return;
}
```

**Rules:**
- Cancels weak actions before handling (same as all other object/item/skilling intents).
- Does **not** route through `handleObjectIntent` — recipe selection is a direct skilling intent, not an object interaction.
- If `handleRecipeSelect` returns `false`, the dispatcher emits nothing extra (the skilling system already emits chat feedback).

### 4.2 Recipe list generation

**File:** `apps/server/src/systems/skilling-system.ts`

Update `matchingRecipes` to filter by level in addition to station + inventory.

```ts
function matchingRecipes(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
): ProcessingRecipeDef[] {
  const station = ctx.world.getComponent(stationEntityId, "object");
  const inventory = ctx.world.getComponent(owner, "inventory");
  const skills = ctx.world.getComponent(owner, "skills");
  if (!station || !inventory || !skills) {
    return [];
  }
  return Array.from(ctx.registries.processingRecipe.values()).filter(
    (recipe) =>
      recipe.stationObjectIds.includes(station.objectId) &&
      hasItem(inventory, recipe.inputItemId, recipe.inputQuantity) &&
      getCurrentLevel(skills, recipe.skill) >= recipe.requiredLevel,
  );
}
```

**Note:** The old `matchingRecipe` helper (singular, returning `recipes[0]`) is removed. It is no longer needed because auto-selection is removed.

### 4.3 `handleProcessingIntent` — replace auto-selection with explicit list

```ts
function handleProcessingIntent(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  serverTime: number,
  tick?: number,
): boolean {
  const recipes = matchingRecipes(ctx, owner, stationEntityId);
  if (recipes.length === 0) {
    systemMessage(ctx.deltas, owner, "You have nothing suitable to cook.", serverTime);
    return true;
  }

  // Always send the recipe list — never auto-select, even for a single recipe.
  ctx.deltas.markRecipeList({
    interfaceId: "recipe",
    recipes: recipes.map((recipe) => ({
      recipeId: recipe.id,
      name: recipe.name,
      levelRequired: recipe.requiredLevel,
      ingredients: [{ itemId: recipe.inputItemId, quantity: recipe.inputQuantity }],
      productId: recipe.successItemId,
      productQuantity: recipe.successQuantity,
    })),
  });
  return true;
}
```

**Rules:**
- Does **not** check distance before sending the list. The player may browse recipes while walking.
- Does **not** path to the station. The player clicked the station; the client already sent the intent.
- If the player is out of range when they select a recipe, `handleRecipeSelect` handles pathing.

### 4.4 Recipe selection validation

**File:** `apps/server/src/systems/skilling-system.ts`

Update `validateProcessAction` to add line-of-sight checking.

```ts
function validateProcessAction(
  ctx: SkillingContext,
  owner: EntityId,
  stationEntityId: EntityId,
  recipe: ProcessingRecipeDef,
): string | undefined {
  const actorTile = tileOf(ctx.world, owner);
  const stationTile = tileOf(ctx.world, stationEntityId);
  const station = ctx.world.getComponent(stationEntityId, "object");
  const inventory = ctx.world.getComponent(owner, "inventory");
  const skills = ctx.world.getComponent(owner, "skills");
  const catalog = catalogFromItems(ctx.registries.item);

  if (!actorTile || !stationTile || !station || !inventory || !skills) {
    return "You cannot do that.";
  }
  if (!recipe.stationObjectIds.includes(station.objectId)) {
    return "You need a different cooking station.";
  }
  if (chebyshev(actorTile, stationTile) > 1) {
    return "You need to get closer.";
  }
  if (!ctx.collision.hasLineOfSight(actorTile, stationTile)) {
    return "You cannot see the station.";
  }
  if (getCurrentLevel(skills, recipe.skill) < recipe.requiredLevel) {
    return `You need level ${recipe.requiredLevel} ${recipe.skill}.`;
  }
  if (!hasItem(inventory, recipe.inputItemId, recipe.inputQuantity)) {
    return "You have nothing suitable to cook.";
  }
  const outputItemId = recipe.failureItemId ?? recipe.successItemId;
  const outputQuantity = recipe.failureItemId ? recipe.failureQuantity : recipe.successQuantity;
  if (!hasSpaceFor(inventory, catalog, outputItemId, outputQuantity)) {
    return "Your inventory is full.";
  }
  return undefined;
}
```

**Validation order (must match exactly):**
1. Entity existence (actor, station, inventory, skills).
2. Station compatibility.
3. Distance (Chebyshev <= 1 tile).
4. Line-of-sight (`collision.hasLineOfSight`).
5. Level requirement.
6. Material availability.
7. Output inventory space.

**Error messages (must match exactly for test assertions):**
- Wrong station: `"You need a different cooking station."`
- Out of range: `"You need to get closer."`
- No LoS: `"You cannot see the station."`
- Low level: `"You need level ${level} ${skill}."`
- Missing materials: `"You have nothing suitable to cook."`
- Inventory full: `"Your inventory is full."`

### 4.5 `handleRecipeSelect` — already exists, no structural changes

`handleRecipeSelect` (lines 474–509) is already correct in shape. It:
1. Looks up the recipe.
2. Calls `validateProcessAction`.
3. If valid, enqueues `process`.
4. If out of range, paths and enqueues `begin_process`.
5. If invalid, emits chat feedback.

No changes to the function body are required beyond the `validateProcessAction` update.

### 4.6 Recipe processing — `handleProcess`

**File:** `apps/server/src/systems/skilling-system.ts`

Add `RecipeResultPacket` emission at the end of `handleProcess`.

```ts
export function handleProcess(
  ctx: SkillingContext,
  action: ActionExecution,
  payload: ProcessActionPayload,
  tick: number,
  serverTime: number,
): void {
  // ... existing validation and inventory logic ...

  const failed = ctx.rng.nextFloat() < recipe.failureChance;
  const itemId = failed ? (recipe.failureItemId ?? recipe.successItemId) : recipe.successItemId;
  const quantity = failed ? recipe.failureQuantity : recipe.successQuantity;

  // ... existing add/remove item logic ...
  // ... existing quest dispatch ...
  // ... existing XP award ...

  // NEW: emit RecipeResultPacket
  ctx.deltas.markRecipeResult({
    recipeId: recipe.id,
    success: !failed,
    productItemId: itemId,
    productQuantity: quantity,
    xpReward: failed ? undefined : recipe.xp,
    message: failed
      ? "You fail to produce anything useful."
      : `You successfully create ${recipe.name}.`,
  });
}
```

**Rules:**
- `success: false` when `recipe.failureChance` roll succeeds.
- `productItemId` is the produced item (failure item or success item).
- `xpReward` is omitted on failure.
- `message` is a human-readable string for the client to display.

### 4.7 Object action routing — extend `PROCESS_ACTION_IDS`

**Files:**
- `apps/server/src/systems/object-interaction-router.ts` (line 39–40)
- `apps/server/src/systems/skilling-system.ts` (line 85)

Update both `PROCESS_ACTION_IDS` sets to include all processing action IDs:

```ts
const PROCESS_ACTION_IDS = new Set([
  "cook", "use", "smith", "smelt", "craft", "fire", "weave", "tan", "dye", "mix",
]);
```

**Note:** `object-interaction-router.ts` also has `GATHER_ACTION_IDS = new Set(["chop", "woodcut", "mine"])` which is missing `"fish"`. The implementer should add `"fish"` to the router's set for consistency with `skilling-system.ts`.

### 4.8 Delta accumulator — clean up duplicate `DirtyState`

**File:** `apps/server/src/sim/delta-accumulator.ts`

Remove the duplicate `DirtyState` interface declaration (lines 50–64). The first declaration (lines 29–48) already contains `recipeLists`, `recipeResults`, `deathNotices`, `respawnNotices`, and `contractComplete`. The second declaration is a subset and causes confusion. The `markRecipeList` and `markRecipeResult` methods already exist and are functional.

---

## 5. Client Logic

No client-side code changes in this story. The client is E27-S03.

However, the server must guarantee that the client receives:
1. `RecipeListPacket` via `TickDeltaPacket.recipeLists` when the player clicks a station.
2. `RecipeResultPacket` via `TickDeltaPacket.recipeResults` after each process tick.
3. `InterfaceClosePacket { interfaceId: "recipe" }` when the player walks away or the action is cancelled. (See §6.)

### 5.1 Interface close on action cancellation

When a weak skilling action is cancelled (e.g., by movement), the server should send `InterfaceClosePacket { interfaceId: "recipe" }` so the client closes the recipe panel. The cancellation already happens in `handleMoveIntent` (via `actionRuntime.cancel`). Add a helper:

```ts
// In intent-dispatcher.ts, inside the Move case:
ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
```

Or more generally, cancel any open recipe interface when a weak action is cancelled by movement, item, or new object click.

**File:** `apps/server/src/sim/intent-dispatcher.ts`

In each intent case that cancels weak actions, add:
```ts
ctx.deltas.markInterfaceClose({ interfaceId: "recipe" });
```

This applies to: `Move`, `Item`, `UiAction` (unequip), `Object`, `Npc`, `GroundItem`, `Spell`, `BankAction`, `ShopAction`.

---

## 6. Content Requirements

No new content items, recipes, or drops are introduced by this story. The server uses the existing 17 processing recipes in `/content/processing-recipes/`.

**Content registry requirement:** The `processingRecipe` registry must be loaded at boot time. This is already true via `makeRegistries`.

**Object definition requirement:** Crafting station objects must have at least one `options` entry with an `actionId` that is in `PROCESS_ACTION_IDS`. This is already true for existing stations.

---

## 7. Testing Criteria

### 7.1 Unit tests — `apps/server/src/systems/__tests__/recipe-selection.test.ts`

**Fix existing test file.** The current test file has compile errors and tests the old auto-selection behavior. Rewrite it to match the new explicit-selection contract.

**Test cases (all must pass):**

1. **Sends recipe list when multiple recipes match.**
   - Setup: player has raw fish, level 1, fire station with 2 recipes (level 1 and level 10).
   - Call `handleObjectSkillingIntent` with actionId `"use"`.
   - Assert `deltas.peek().recipeLists` has length 1.
   - Assert list contains 1 recipe (only the level 1 one — level filter applied).

2. **Sends recipe list even when exactly 1 recipe matches.**
   - Setup: player has raw fish, level 1, fire station with 1 recipe.
   - Call `handleObjectSkillingIntent` with actionId `"use"`.
   - Assert `deltas.peek().recipeLists` is defined.
   - Assert `deltas.peek().recipeLists?.[0]?.recipes.length` is 1.
   - Assert no chat message.

3. **Recipe list is filtered by level.**
   - Setup: player level 1, station has recipes requiring level 1 and level 10.
   - Call `handleObjectSkillingIntent`.
   - Assert list contains only the level 1 recipe.

4. **Recipe list is empty when no recipes match.**
   - Setup: player has no raw fish.
   - Call `handleObjectSkillingIntent`.
   - Assert `deltas.peek().recipeLists` is undefined.
   - Assert chat message: `"You have nothing suitable to cook."`.

5. **Handles recipe selection and enqueues process.**
   - Setup: player has raw fish, in range, valid station.
   - Call `handleRecipeSelect` with `recipeId = "cook_fish"`.
   - Assert result is `true`.
   - Assert action runtime debug state contains a `process` entry with `recipeId`.

6. **Rejects invalid recipe id.**
   - Call `handleRecipeSelect` with nonexistent recipe.
   - Assert result is `false`.
   - Assert chat: `"Invalid recipe selection."`.

7. **Rejects recipe when level requirement not met.**
   - Setup: player level 1, recipe requires level 10.
   - Call `handleRecipeSelect`.
   - Assert result is `false`.
   - Assert chat: `"You need level 10 cooking."`.

8. **Rejects recipe when materials missing.**
   - Setup: player has no raw fish.
   - Call `handleRecipeSelect`.
   - Assert result is `false`.
   - Assert chat: `"You have nothing suitable to cook."`.

9. **Rejects recipe when wrong station.**
   - Setup: player has raw fish, wrong station entity.
   - Call `handleRecipeSelect`.
   - Assert result is `false`.
   - Assert chat: `"You need a different cooking station."`.

10. **Rejects recipe when out of range and enqueues begin_process.**
    - Setup: player 10 tiles away.
    - Call `handleRecipeSelect`.
    - Assert result is `true`.
    - Assert action runtime debug state contains `begin_process`.

11. **Rejects recipe when line of sight blocked.**
    - Setup: player adjacent but LoS blocked by a wall.
    - Call `handleRecipeSelect`.
    - Assert result is `false`.
    - Assert chat: `"You cannot see the station."`.

12. **Process tick consumes materials and produces output.**
    - Setup: player has raw fish, process action enqueued.
    - Advance action runtime to execution.
    - Call `handleProcess`.
    - Assert inventory has 1 less raw fish, 1 more cooked fish.
    - Assert `deltas.peek().inventoryDeltas` is defined.
    - Assert `deltas.peek().recipeResults` is defined with `success: true`.
    - Assert `deltas.peek().recipeResults?.[0]?.xpReward` equals recipe xp.

13. **Process tick emits failure result when rng fails.**
    - Setup: recipe with `failureChance: 1`.
    - Advance and call `handleProcess`.
    - Assert inventory has burnt fish.
    - Assert `recipeResults` has `success: false`.
    - Assert `xpReward` is undefined.

14. **Process tick stops when input is exhausted.**
    - Setup: player has 1 raw fish.
    - Enqueue and execute process.
    - Assert inventory has 0 raw fish.
    - Advance action runtime again.
    - Assert action queue is empty (no further executions).
    - Assert chat: `"You have nothing suitable to cook."`.

15. **Intent dispatcher routes RecipeSelect.**
    - Setup: create a `CommandBuffer`, enqueue a `RecipeSelectCommand`.
    - Call `dispatchIntentGroup`.
    - Assert `handleRecipeSelect` was invoked (verify via action runtime debug state).

### 7.2 Unit tests — `skilling-system.test.ts` (existing)

The existing `skilling-system.test.ts` has a test `"routes object Use/Cook through the tick queue and repeats until input is missing"` that currently auto-selects. Update this test to:
1. Expect `recipeLists` in the delta after `handleObjectSkillingIntent`.
2. Then call `handleRecipeSelect` to enqueue the process.
3. Continue with the existing process assertions.

Also update the `"rejects cooking when the player has no matching raw input"` test to expect `recipeLists` is undefined and chat is present.

### 7.3 Integration validation

- `bun run test` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.

---

## 8. Economy Impact

**No economy impact** — this is a UX/selection flow change, not an economy change.

The recipe selection system does not introduce new items, alter drop tables, change shop prices, or affect trade values. It only changes **how** players select recipes. All item creation, consumption, and XP awards remain server-authoritative and use the existing `ProcessingRecipeDef` content.

---

## 9. Risks & Open Questions

| Risk | Mitigation |
|------|------------|
| **Auto-selection removal breaks existing skilling tests** | The `skilling-system.test.ts` cooking loop test expects auto-selection. The implementer must update that test to use the explicit two-step flow (intent → list → select → process). |
| **RecipeListPacket shape mismatch** | The current server code emits an invalid shape. The design fixes it to match the E27-S01 protocol type. If E27-S03 later extends the type, S02 will be updated. |
| **Duplicate `DirtyState` interface** | The second `DirtyState` declaration in `delta-accumulator.ts` is redundant. Removing it is a no-op but cleans up the file. |
| **LoS check on every process tick** | `validateProcessAction` is called inside `handleProcess` on every tick. Adding `hasLineOfSight` adds a small raycast cost. Acceptable for POC; if profiling shows it matters, cache the result per tick. |
| **Movement cancellation does not close recipe panel** | The design adds `markInterfaceClose({ interfaceId: "recipe" })` in every intent case that cancels weak actions. If any case is missed, the client panel may stay open. Verify all cancel sites. |
| **`PROCESS_ACTION_IDS` divergence between router and skilling system** | Two files define `PROCESS_ACTION_IDS`. They must be kept in sync. The design adds all processing IDs to both. Consider extracting a shared constant in a future refactor. |
| **`matchingRecipes` now filters by level** | Recipes above the player's level are hidden from the list. This is correct for the POC. If the design later needs to show locked recipes (grayed out), the filter must be removed and level gating moved to selection-time only. |

---

## 10. File Checklist

Implementer must touch these files in order:

1. `apps/server/src/sim/intent-dispatcher.ts` — add `RecipeSelect` dispatch case, add `markInterfaceClose` at all weak-action cancel sites (§4.1, §5.1)
2. `apps/server/src/systems/skilling-system.ts` — update `matchingRecipes` (level filter), rewrite `handleProcessingIntent` (always send list), fix `markRecipeList` shape, add `markRecipeResult` in `handleProcess`, add LoS to `validateProcessAction`, extend `PROCESS_ACTION_IDS` (§4.2–§4.6)
3. `apps/server/src/systems/object-interaction-router.ts` — extend `PROCESS_ACTION_IDS` and `GATHER_ACTION_IDS` (§4.7)
4. `apps/server/src/sim/delta-accumulator.ts` — remove duplicate `DirtyState` interface (§4.8)
5. `apps/server/src/systems/__tests__/recipe-selection.test.ts` — rewrite to match explicit-selection contract (§7.1)
6. `apps/server/src/systems/skilling-system.test.ts` — update existing cooking tests for explicit selection (§7.2)

---

## Design sign-off

- [x] Feature Summary is complete and bounded
- [x] Data Model specifies exact fields (no changes needed)
- [x] Protocol Changes specify exact wire fixes (shape correction, no type additions)
- [x] Server Logic covers intent dispatch, list generation, validation, processing, result emission, routing, delta cleanup
- [x] Client Logic is minimal (no client authority)
- [x] Content Requirements are minimal (no hardcoding)
- [x] Testing Criteria are exhaustive and runnable
- [x] Economy Impact section is present
- [x] Risks & Open Questions enumerate every seam
