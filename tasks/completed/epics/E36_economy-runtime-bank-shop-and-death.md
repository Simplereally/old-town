# E36 — Economy Runtime: Bank, Shop, and Death

## Dependency chain

- Depends on: E35
- Unlocks: E37

## Spec references

- P0 gap 5: Bank / storage runtime
- P0 gap 6: Death + respawn for players
- P0 gap 7: Shop / trade runtime
- docs/content/runtime-gap-list.md
- docs/content/action-wiring-audit.md

## Epic goal

Implement economy runtime systems: bank inventory/storage, player death and respawn, and shop/trade transactions. This closes the remaining P0 gaps that block basic gameplay loops.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E36/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E36-S01` — [Player Death and Respawn System](stories/E36/E36-S01_player-death-and-respawn-system.md)
- [X] `E36-S02` — [Bank Inventory and Storage System](stories/E36/E36-S02_bank-inventory-and-storage-system.md)
- [X] `E36-S03` — [Shop Stock Schema and Transaction Runtime](stories/E36/E36-S03_shop-stock-schema-and-transaction-runtime.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
