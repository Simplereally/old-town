# E57-S01 — Trade protocol, session state machine, and validation rules

## Epic

E57 — Player-to-Player Trading

## Dependency chain

- Depends on: none
- Blocks: E57-S02

## Objective

Define the whole trade contract in `packages/shared` — intents, packets, the state machine,
and the validation table — before any engine code. The state machine must be a pure,
independently-testable module.

## Implementation guidance

- Find how existing intents are declared and registered (search `MoveIntent`/`ItemIntent`
  schema + the `ClientCommand` union + wire validation from E48) and mirror exactly.
- **C2S `TradeIntent`** (one discriminated union):
  - `{kind:"request", targetEntityId}` — initiate with a nearby player
  - `{kind:"respond", accept:boolean}` — answer an incoming request
  - `{kind:"offer_add", itemUid, quantity}` / `{kind:"offer_remove", itemUid, quantity}`
  - `{kind:"accept"}` — accept current screen (offer screen or confirm screen)
  - `{kind:"unaccept"}` — retract accept on the offer screen
  - `{kind:"cancel"}` — abort at any point
- **S2C `TradeStatePacket`**: full authoritative snapshot of the trade as seen by the receiving
  player — phase (`requested|offering|confirming|completed|cancelled`), both offers (item id,
  uid, quantity — resolve display client-side from content), both accept flags, partner name,
  cancel reason code when terminal. Send the FULL state every change (trades are tiny; deltas
  here buy nothing and invite desync bugs). Register in the E48 S2C wire-validation scheme.
- **Pure state machine** `packages/shared/src/trade/trade-machine.ts`:
  `reduce(state, event) -> {state, effects}` where events are validated intents from either
  side plus `partner_left|owner_moved|tick_timeout`. Encode: any `offer_*` in `offering`
  clears both accepts; both-accepted in `offering` → `confirming` with a FROZEN manifest;
  any `offer_*` in `confirming` is rejected (not a transition — an error effect); both-accepted
  in `confirming` → `settle` effect. Include a 100-tick inactivity timeout → cancel.
- **Validation table** (documented as a matrix in the module docstring, each row a test):
  request requires target is a player, within 8 tiles, not already trading, not the requester;
  offer_add requires the uid exists in the sender's inventory with ≥ quantity, item is
  tradeable, offer slot count ≤ 12 per side (OSRS-like), total quantity fits partner's free
  inventory space AT SETTLEMENT (checked again at commit — the machine only sanity-checks).

## Required work

- [ ] Shared types + zod schemas + C2S/S2C registration, with parse round-trip tests.
- [ ] `trade-machine.ts` pure reducer + exhaustive transition tests (every cell of the matrix,
      including the same-tick modify+accept ordering rule: modify events sort before accept
      events within one tick — the reducer takes an ordered event list per tick).
- [ ] Frozen-manifest structure: `{a:[{itemId,uid,qty}], b:[...]}, frozenAtTick` — the ONLY
      thing S02 settles against.

## Acceptance criteria

- [ ] The machine is UI-and-engine-free (no world/three imports) and 100% branch-covered.
- [ ] Wire schemas reject malformed payloads (fuzz the obvious: negative qty, unknown kinds).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
