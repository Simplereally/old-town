# E44-S02 — Bank NPC and bank panel wiring

## Epic

E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E44-S01 (Service NPC Dialogue Pack), E22-S01 (Bank Storage System Runtime), E36-S02 (Bank Inventory and Storage System)
- Blocks: E44-S03, E44-S04, E44-S05

## Spec references

- `POC_SPEC.md` §16.2 (Inventory — 28 slots)
- `POC_SPEC.md` §20.1 (Persistence — `character_bank` table)
- `POC_SPEC.md` §22 (UI system — inventory, bank panel)
- `content/banks/` — bank definitions
- `content/npcs/` — NPC definitions

## Objective

Wire the bank NPC (Tomas Tally) to the bank runtime. When a player selects "Bank" from the NPC options, the server sends the bank inventory to the client and opens the bank panel. Deposits and withdrawals are server-authoritative, persisted, and audited.

## Required architectural decisions

- **Bank open flow:** `NpcIntent { npcEntityId, actionId: "bank" }` → server validates range → opens bank interface → sends `S2C_INTERFACE_OPEN` with bank inventory delta.
- **Bank panel UI:** The bank panel is a grid of slots like the inventory. It shows the player's bank contents. It supports deposit (from inventory) and withdraw (to inventory).
- **Transaction commands:** Client sends `C2S_UI_ACTION { action: "bank_deposit", slotIndex, quantity }` or `bank_withdraw`. Server validates, moves items, persists, and sends inventory + bank deltas.
- **Audit:** Every bank transaction is logged to the item transaction audit table.
- **POC scope:** Bank is local to the current server process. Full persistence is covered by E13; this story wires the runtime UI.

## Implementation checklist

- [X] Implement the "bank" action handler in the NPC interaction router.
- [X] Add bank open packet and client bank panel.
- [X] Implement deposit and withdraw actions with quantity selection.
- [X] Persist bank changes and write to the audit log.
- [X] Update inventory and bank panels from server deltas.
- [X] Write test: opening the bank shows the correct bank contents.
- [X] Write test: depositing an item moves it from inventory to bank.
- [X] Write test: withdrawing an item moves it from bank to inventory.
- [X] Write test: an audit row is created for each transaction.

## Acceptance criteria

- [X] Talking to Tomas Tally and selecting "Bank" opens the bank panel.
- [X] The bank panel shows the player's bank contents.
- [X] Deposit and withdraw actions are server-authoritative.
- [X] Inventory and bank panels update after each transaction.
- [X] Bank transactions are audited.
- [X] No client-side item duplication is possible.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run dev` — deposit and withdraw items at the bank

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E44/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
