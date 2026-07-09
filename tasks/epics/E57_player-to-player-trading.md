# E57 — Player-to-Player Trading

## Dependency chain

- Depends on: nothing hard. Soft: E58 (ignore list gates trade requests), E60 (audit surface),
  E62 (do it first if possible — trading adds a snapshot-adjacent component and you want the
  migration chain in place before the schema grows)
- Unlocks: the player economy; the single most-requested MMO pillar missing from the engine

## Spec references

- `apps/server/src/persistence/economy.ts` — the atomic economy commit layer was designed for
  this: "A commit may touch multiple characters (a trade moves both sides), appends ledger
  rows..." — multi-character commits, idempotency keys, ledger + outbox in one transaction
- `apps/server/src/sim/simulation-kernel.ts:380–392` — `economyCommit` wiring into the dispatch
  context via `saveQueue.markEconomyCommit` (only on adapters that support atomic economy)
- `apps/server/src/items/item-audit.ts` + `packages/shared/src/persistence/item-audit.ts` —
  idempotency-keyed transaction audit (comment: "bank moves, trades, death resolution")
- `apps/server/src/systems/interaction-reach.ts` — proximity rules pattern
- `simulation-kernel.ts:426–467` — the Interruptions phase (dialogue modal blocking) is the
  exact pattern a trade modal follows
- `apps/client/src/game/ui/UIManager.ts` — bank/shop panel patterns to mirror;
  `GameEngine.sendBankCommand` (line 740) / `sendShopCommand` (749) — the command-sending
  pattern for a new `sendTradeCommand`
- Item `tradeable` flag — already in the item content schema (verify exact field name in
  `packages/shared/src/content-schemas/item.ts` before use)

## Epic goal

OSRS-style secure two-phase trading between adjacent players: request → offer screen (both
sides stage items, quantity-editable) → both accept → confirmation screen (read-only summary)
→ both accept → atomic swap committed through the economy layer with full audit. Every classic
trade scam (last-second item swap, quantity sleight, accept-race) is structurally impossible,
not just discouraged.

## Design invariants (bind every story)

- The swap is ONE atomic economy commit touching both characters, idempotency key
  `trade:<tradeSessionId>`. Partial application must be impossible — on any failure both
  inventories are untouched.
- Any change to either offer clears BOTH accepts (screen 1) — the OSRS anti-scam rule.
- The confirmation screen's contents are frozen server-side at screen-transition; the commit
  executes exactly the frozen manifest or aborts.
- A trade is a modal: it blocks the owner's other actions via the existing Interruptions
  machinery, and movement/combat/disconnect/death cancels it (both sides notified).
- Single-threaded tick = no true races, but SAME-TICK intent pairs (accept+modify arriving in
  one tick's command group) must resolve deterministically: process modifications before
  accepts within the trade phase; document the ordering.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E57/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E57-S01` — [Trade protocol, session state machine, and validation rules](../stories/E57/E57-S01_trade-protocol-state-machine-and-validation.md)
- [ ] `E57-S02` — [Server trade engine and atomic settlement](../stories/E57/E57-S02_server-trade-engine-and-atomic-settlement.md)
- [ ] `E57-S03` — [Client trade UI with anti-scam affordances](../stories/E57/E57-S03_client-trade-ui.md)
- [ ] `E57-S04` — [Adversarial hardening and end-to-end suite](../stories/E57/E57-S04_adversarial-hardening-and-e2e.md)

## Epic acceptance criteria

- [ ] Two clients can trade items and coins end-to-end; the audit log shows one paired,
      idempotency-keyed transaction; a server kill between accept and commit never duplicates
      or destroys items (idempotent replay of the commit).
- [ ] All four classic scams are demonstrated to be impossible in tests (offer-swap after
      accept, quantity edit after accept, confirm-screen mismatch, decline-then-commit).
- [ ] Untradeable items cannot be offered; the client never even lists them as offerable.
- [ ] A mid-trade disconnect, death, or 15-tile teleport cancels cleanly for both sides.
