# E44-S05 — Warden board and shrine starter activities

## Epic

E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E44-S01 (Service NPC Dialogue Pack), E38-S01 (Wardenry Contract Schema and Runtime), E26-S01 (Contract Runtime State Machine)
- Blocks: E45-S01

## Spec references

- `POC_SPEC.md` §18.1 (Quest design rule — content-driven)
- `docs/world/districts-and-routes.md` — Warden Steps, Shrine Hearth
- `docs/wardenry/00-index.md` — Wardenry contracts entry point
- `content/contracts/` — contract definitions
- `content/objects/` — warden board, shrine hearth

## Objective

Add the Warden Board and Shrine Hearth as interactive objects that offer starter directed activities. The Warden Board gives simple contracts (e.g., "Kill 5 cellar rats"), and the Shrine Hearth lets players make favour offerings. These are the first non-quest, repeatable activities in Old Town.

## Required architectural decisions

- **Warden Board:** An object with option "Check" that opens the contract board UI. It lists available starter contracts. Selecting a contract starts the contract runtime state machine.
- **Shrine Hearth:** An object with option "Offer" that opens a small offering UI. Players can offer candles or coins to gain favour. The favour system is lightweight for POC.
- **Contract content:** Add 2-3 starter contracts in `content/contracts/`:
  - "Cellar Sweep" — kill 5 cellar rats
  - "Tinstone Run" — gather 10 tinstone
  - "Road Watch" — kill 3 mud goblins
- **Reward:** Contracts give coins, XP, and a small Wardenry reputation/favour bump. Rewards are content-defined.
- **No hardcoded logic:** Contract objectives, rewards, and completion checks are data-driven via the contract schema.

## Implementation checklist

- [X] Create or update the Warden Board and Shrine Hearth object definitions.
- [X] Add starter contract definitions in `content/contracts/`.
- [X] Implement the Warden Board "Check" interaction to open the contract board UI.
- [X] Implement the Shrine Hearth "Offer" interaction with a simple offering UI.
- [X] Wire contract acceptance, objective tracking, and reward distribution.
- [X] Write test: accepting a contract updates the player's active contract state.
- [X] Write test: completing a contract objective triggers reward distribution.
- [X] Write test: an offering at the shrine updates favour vars.

## Acceptance criteria

- [X] The Warden Board lists and starts starter contracts.
- [X] Contract objectives are tracked and rewarded server-side.
- [X] The Shrine Hearth accepts offerings and updates favour state.
- [X] All contract and favour behavior is content-driven.
- [X] UI panels are wired to the server runtime.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — accept a contract and complete an objective

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E44/` only after all criteria pass.
- [X] Update the parent epic checklist and move the epic to `tasks/completed/epics/`.
