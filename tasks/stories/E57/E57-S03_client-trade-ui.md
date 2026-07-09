# E57-S03 — Client trade UI with anti-scam affordances

## Epic

E57 — Player-to-Player Trading

## Dependency chain

- Depends on: E57-S02
- Blocks: E57-S04

## Objective

The trade window, request flow, and the affordances that make scams visibly impossible.

## Implementation guidance

- **Entry point**: "Trade with <name>" on the player context menu — find how player-target
  menu options are assembled in `InputInterpreter`/`ContextMenu` (menu options for NPCs like
  Attack already exist; mirror). Sends `TradeIntent{kind:"request"}` via a new
  `GameEngine.sendTradeCommand` following the `sendBankCommand` pattern
  (`GameEngine.ts:740`).
- **Incoming request**: a chat-line style prompt ("<name> wishes to trade with you") that is
  clickable to accept — NOT a modal popup (OSRS convention; also spam-safe). Find how system
  chat messages render and add a clickable variant, or a small toast in UIManager's idiom.
- **Trade window** (offer phase): two panes (yours editable, theirs read-only), item icons via
  the existing `IconAtlas`, click-to-offer from inventory (quantity prompt for stacks —
  reuse whatever quantity input the bank UI uses), accept button + BOTH accept-state
  indicators. Follow UIManager panel conventions strictly (E65 will modularize; don't invent a
  new pattern now — match bank/shop).
- **Anti-scam affordances** (each one a test):
  - any change to the partner's offer flashes the changed slot for ~2 ticks and plays the
    accept-cleared state prominently;
  - the confirm screen renders from the FROZEN manifest in the packet — client-side it is a
    different component that cannot re-render from live offers;
  - partner value summary line: total item count per side ("You give 3 items · You receive 1
    item") to make lopsided edits legible (no gp-value pricing exists yet — counts only, note
      for a future economy-pricing epic).
- **State handling**: the window renders purely from the latest `TradeStatePacket` (full-state
  packets by design) — zero client-side trade state beyond "window open". Cancelled/completed
  → window closes with a system chat line giving the reason.

## Required work

- [ ] Context-menu option + request toast + sendTradeCommand plumbing.
- [ ] Offer + confirm screens rendering from packets; inventory offer interactions; quantity
      handling; untradeable items visually disabled (and not sendable).
- [ ] UIManager tests (jsdom, existing patterns): render from a fixture packet; accept-clear
      flash on offer change; frozen confirm screen ignores subsequent offer-shaped data;
      close-on-terminal with reason line.
- [ ] Manual two-browser QA against `bun run dev` — record the flow (request both directions,
      edit-after-accept, decline, walk-away cancel) in the story note.

## Acceptance criteria

- [ ] Complete trade between two real clients; every anti-scam affordance observable.
- [ ] Zero client-authoritative trade state (code-review criterion: the window has no setter
      mutated from user input except "send intent").

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
