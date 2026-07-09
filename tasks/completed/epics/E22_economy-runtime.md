# E22 — Economy Runtime

## Dependency chain

- Depends on: E16
- Unlocks: E26

## Spec references

- docs/content/runtime-gap-list.md (P0 gaps 5, 7)
- docs/content/action-wiring-audit.md (action IDs: `bank`, `trade`, `sell`, `buy`)
- docs/economy/shop-system.md
- docs/economy/banks-storage-and-reclaim.md

## Epic goal

Implement the runtime economy systems: bank storage and shop trading. This epic closes the gap where bank and shop schemas exist but have no server-side transaction logic, UI packets, or inventory integration.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E22/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E22-S01` — [Bank Storage System Runtime](../stories/E22/E22-S01_bank-storage-system-runtime.md)
- [X] `E22-S02` — [Shop Trade Transaction System](../stories/E22/E22-S02_shop-trade-transaction-system.md)
- [X] `E22-S03` — [Economy UI Protocol and Client Rendering](../stories/E22/E22-S03_economy-ui-protocol-and-client-rendering.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
