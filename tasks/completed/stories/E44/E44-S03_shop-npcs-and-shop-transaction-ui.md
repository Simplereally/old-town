# E44-S03 — Shop NPCs and shop transaction UI

## Epic

E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E44-S01 (Service NPC Dialogue Pack), E22-S02 (Shop Trade Transaction System), E36-S03 (Shop Stock Schema and Transaction Runtime)
- Blocks: E44-S04, E44-S05

## Spec references

- `POC_SPEC.md` §16 (Items, inventory, equipment)
- `POC_SPEC.md` §21 (Economy and drops)
- `POC_SPEC.md` §22 (UI system — right-click menu, shop panel)
- `content/shops/` — shop definitions
- `docs/economy/currency-and-value-bands.md` — value bands

## Objective

Wire the shop NPCs (Osric Penny, Letha Lath, Nell Patch, Mother Tallow, etc.) to the shop runtime. When a player selects "Trade" or "Shop", the server opens the shop panel with that NPC's stock. Buy and sell transactions are server-authoritative, update inventory and coins, and refresh the shop panel.

## Required architectural decisions

- **Shop open flow:** `NpcIntent { npcEntityId, actionId: "shop" }` → server loads the shop definition for the NPC → sends `S2C_INTERFACE_OPEN` with shop stock.
- **Shop panel UI:** The shop panel shows the NPC's stock list with buy prices, quantities, and the player's sellable inventory. It supports buy X, sell X, and sell all.
- **Transaction commands:** `C2S_UI_ACTION { action: "shop_buy", itemId, quantity }` / `shop_sell`. Server validates coins, stock, inventory space, and updates both.
- **Restock:** Shop stock is static for POC (infinite or large fixed stock). Dynamic restock is deferred to later economy work.
- **Audit:** Every shop transaction is logged to the item transaction audit table.

## Implementation checklist

- [X] Create shop definitions in `content/shops/` for each shop NPC:
  - `osric_penny_shop` (forge tools, low-tier weapons)
  - `letha_lath_shop` (bowcraft supplies, arrows)
  - `nell_patch_shop` (tailoring supplies, leather)
  - `mother_tallow_shop` (beads, pouches)
  - `finch_quill_shop` (maps, blank scrolls)
- [X] Implement the "shop" action handler in the NPC interaction router.
- [X] Add the shop panel UI and server shop transaction handler.
- [X] Implement buy and sell with quantity.
- [X] Update inventory, coins, and shop panel after each transaction.
- [X] Write test: opening a shop shows the correct stock.
- [X] Write test: buying an item reduces coins and adds the item to inventory.
- [X] Write test: selling an item adds coins and removes the item from inventory.
- [X] Write test: an audit row is created for each transaction.

## Acceptance criteria

- [X] Shop NPCs open the shop panel with their defined stock.
- [X] Players can buy and sell items with quantity selection.
- [X] Transactions are server-authoritative and update coins/inventory.
- [X] Shop panel refreshes after transactions.
- [X] All shop transactions are audited.
- [X] No OSRS shop names or prices are copied.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — buy and sell at a shop

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E44/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
