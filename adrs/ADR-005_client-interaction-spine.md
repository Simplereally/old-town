# ADR-005: Client Interaction Spine

## Status

Accepted

## Context

`GameEngine` was the biggest shallow module in the client. It owned DOM input handling, entity picking, object default-action inference, command ID generation, socket command construction, spell target mode, context menu callbacks, full-state application, delta fan-out, debug overlay, and frame updates. 870 lines with 10+ private command-building methods.

The problems were:
1. **Packet construction scattered** — every input path had its own `this.socket.sendCommand({ type: ClientCommandType.*, ... })` block.
2. **Command ID and tick hint duplicated** — incremented inline in every method.
3. **Object action inference duplicated** — `inferObjectActionCached` existed in both `GameEngine.ts` and `ContextMenu.ts` (with different capitalisation).
4. **Default action logic buried** — `_executeDefaultAction` was a switch statement inside `_handleCanvasClick`.
5. **Tests poked private methods** — `_sendMoveCommand`, `_inferObjectAction`, etc.
6. **Ground items conflated with inventory items** — both emitted `C2S_ITEM_OPTION` with `itemUid`, but ground items are world entities and inventory items are server-assigned instance IDs.
7. **Context menu had semantic routing callbacks** — `onNpcOption`, `onObjectOption`, `onItemOption`, `onWalkHere`, `onExamine` leaked decision logic into the view layer.
8. **String-heuristic default actions** — `defId.includes("tree")` instead of content-driven options.

## Decision

1. **Extract `ClientCommandDispatcher`.** A new module `apps/client/src/game/net/ClientCommandDispatcher.ts` owns `_commandId`, `clientTickHint`, and all `socket.sendCommand(...)` construction. It exports one method per command type:
   - `move(tile)`, `npcOption(id, actionId)`, `objectOption(id, actionId)`, `groundItemOption(id, actionId)`, `inventoryItemOption(uid, actionId)`, `castSpell(spellId, target)`, `chat(text)`, `uiAction(action, targetId?, value?)`
   - `setCurrentTick(tick)` updates the tick hint for subsequent commands.

2. **Extract `InputInterpreter`.** A new module `apps/client/src/game/input/InputInterpreter.ts` turns raw input events into explicit `ClientDecision` values. It is **content-driven**: NPC and object default actions and context-menu rows come from their definition's `options` array, sorted by priority. A minimal fallback is used only when content is missing.
   - `interpretCanvasClick(entity, tile, playerTile, spellMode)` — left-click default actions
   - `getContextMenuOptions(entity, tile)` — returns pre-built `ContextMenuOption[]` from content
   - `interpretContextMenu(entity, tile, action)` — context menu selection
   - `interpretEscape(spellMode)` — Escape key
   - `getDefaultAction(entity)` — returns highest-priority content option actionId

3. **`ContextMenu` is a view adapter.** It receives pre-built `ContextMenuOption[]` from `InputInterpreter` and renders them. It has **one callback only**: `onOptionSelected(action, entity, tile)`. No semantic routing — `onNpcOption`, `onObjectOption`, `onItemOption`, `onWalkHere`, `onExamine` are all removed.

4. **`GameEngine` delegates, never builds packets.** `GameEngine` receives a `ClientDecision` from `InputInterpreter` and applies it via `_applyDecision(decision)` which maps to `dispatcher` methods. No `ClientCommandType` references remain in `GameEngine`. Player clicks flow through the same interpreter path: `interpretCanvasClick` receives `playerTile` from actor state and returns a `move` decision.

5. **Ground items are distinct from inventory items.**
   - `GroundItemOption` (`C2S_GROUND_ITEM_OPTION`) is a new command type with payload `{ groundItemEntityId: EntityId, actionId }`.
   - `ItemOption` (`C2S_ITEM_OPTION`) stays inventory-only with payload `{ itemUid, actionId }`.
   - The server `IntentKind` adds `GroundItem` alongside `Item`.
   - `ClientCommandDispatcher.groundItemOption()` emits `GroundItemOption`, never `ItemOption`.

6. **Preserve all existing packet shapes.** The `ClientCommandDispatcher` reproduces every exact packet from the original `GameEngine`:
   - `MoveClick`: `{ dest: TileCoord }`
   - `NpcOption`: `{ npcEntityId: EntityId, actionId }`
   - `ObjectOption`: `{ objectEntityId: EntityId, actionId }`
   - `GroundItemOption`: `{ groundItemEntityId: EntityId, actionId }`
   - `ItemOption`: `{ itemUid, actionId }` (inventory only)
   - `CastSpell`: `{ spellId, target: SpellTarget }`
   - `Chat`: `{ text }`
   - `UiAction`: `{ action, targetId?, value? }`

7. **No Zustand, no generic plugin/action registry.** The spine is two concrete modules with typed methods.

8. **Server behavior unchanged except ground item intent.** The server `IntentDispatcher` receives `GroundItem` intents and emits a stub message ("Ground item interaction is not yet implemented."). The intent-to-action wiring is reserved for future story work.

## Consequences

- `GameEngine.ts` shrinks from ~870 lines to ~750 lines. The 10+ command-building private methods, 5 context-menu callbacks, and `_executeDefaultAction` are replaced by a single `_applyDecision` switch.
- `ClientCommandDispatcher.ts` is ~100 lines. Adding a new command type only requires adding one method.
- `InputInterpreter.ts` is ~200 lines. Default actions and context-menu options are content-driven and testable with a mock `ContentResolver`.
- `ContextMenu.ts` is ~120 lines. It renders what it is told and reports the chosen action. No knowledge of NPCs, objects, or ground items.
- `GameEngine.test.ts` no longer pokes private methods. Context-menu tests trigger the full DOM → `onOptionSelected` → `interpretContextMenu` → `_applyDecision` → `dispatcher` wiring.
- `InputInterpreter.test.ts` (26 tests) proves content-driven behavior: highest-priority option wins, fallbacks are minimal, ground items return "pickup", players return undefined.
- `ClientCommandDispatcher.test.ts` (12 tests) proves exact packet shapes, including the new `GroundItemOption`, and that every emitted packet parses through `parseClientCommand`.
- `ContextMenu.test.ts` (8 tests) proves view adapter behavior: renders pre-built options, reports chosen action, no semantic routing.
- The durable terms are:
  - **Inventory item** — server-assigned instance ID, command type `ItemOption`
  - **Ground item** — world entity, command type `GroundItemOption`
  - **Context menu view adapter** — renders options, reports `actionId` string, no semantic callbacks
  - **Content-driven interaction options** — NPC/object `options` array from content definitions, sorted by `priority`
  - **label** — human-facing text, may contain spaces/hyphens/case, e.g. `Talk-to`, `Pick up`
  - **actionId** — engine/wire token, lowercase snake token, e.g. `talk`, `pickup`, `woodcut`
  - **option** — a content/menu row containing label, actionId, priority, distance rules

## Related

- `POC_SPEC.md` §25 (Minimal POC architecture)
- `apps/client/src/game/GameEngine.ts`
- `apps/client/src/game/net/ClientCommandDispatcher.ts`
- `apps/client/src/game/input/InputInterpreter.ts`
- `apps/client/src/game/ui/ContextMenu.ts`
- `apps/client/src/game/GameEngine.test.ts`
- `apps/client/src/game/net/ClientCommandDispatcher.test.ts`
- `apps/client/src/game/input/InputInterpreter.test.ts`
- `apps/client/src/game/ui/ContextMenu.test.ts`
- `packages/shared/src/protocol/commands.ts`
- `packages/shared/src/protocol/command-schemas.ts`
- `apps/server/src/sim/command-buffer.ts`
- `apps/server/src/sim/intent-dispatcher.ts`
