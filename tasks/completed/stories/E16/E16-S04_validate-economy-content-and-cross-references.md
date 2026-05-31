# E16-S04 — Validate Economy Content and Cross-References

## Epic

E16 — Economy Schema Gaps

## Dependency chain

- Depends on: E16-S03
- Blocks: E20-S01

## Spec references

- POC_SPEC.md §13
- POC_SPEC.md §15
- POC_SPEC.md §20
- docs/economy/shop-system.md
- docs/economy/banks-storage-and-reclaim.md
- docs/economy/services-and-fees.md

## Objective

Create starter economy content (shops, banks, service fees) and add cross-reference validation to the content loader. Validate all economy content passes `bun run content:validate`.

## Implementation checklist

- [X] Create `content/shops/` directory with at least 3 starter shop definitions (e.g., `general_store.json`, `weapon_shop.json`, `magic_shop.json`).
- [X] Create `content/banks/` directory with at least 1 starter bank definition (e.g., `old_town_bank.json`).
- [X] Create `content/service-fees/` directory with at least 2 starter service fee definitions (e.g., `repair.json`, `teleport.json`).
- [X] Add cross-reference validation in `content-references.ts` for `shopDefSchema` → `itemId` references.
- [X] Add cross-reference validation in `content-references.ts` for `serviceFeeSchema` → `itemId` and `questId` references.
- [X] Write a passing test for economy content validation.
- [X] Run `bun run content:validate` and fix any errors.

## Acceptance criteria

- [X] Starter shop content exists and validates.
- [X] Starter bank content exists and validates.
- [X] Starter service fee content exists and validates.
- [X] Cross-reference validation catches invalid references.
- [X] `bun run content:validate` passes with zero errors.
- [X] All tests pass.
- [X] `bun run typecheck` passes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run content:validate`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E16/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
