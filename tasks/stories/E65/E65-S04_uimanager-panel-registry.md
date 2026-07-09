# E65-S04 — UIManager decomposition: panel registry and per-panel modules

## Epic

E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: E65-S03
- Blocks: E65-S05

## Objective

UIManager becomes a registry hosting shared UI services; every panel becomes a module
implementing the S01 `Panel` interface.

## Required work

- [ ] Registry + `Panel` interface per the S01 contract (shared services: DOM root, open/
      close state + exclusivity rules, keybind routing, UIState subscription — whatever S01
      mapped; panels receive services, never reach into the registry's internals).
- [ ] Migrate panels one green commit at a time, LARGEST/RISKIEST FIRST (likely bank or
      inventory — the first migration hardens the interface while attention is high; trivial
      panels sweep up after). Every panel: one module + its jsdom test file (existing
      UIManager tests split along the same lines; `UIManager.test.ts` keeps registry-level
      tests only).
- [ ] Panels added by concurrent epics (E57 trade, E58 chat tabs/friends — if landed)
      migrate as part of the sweep; if those epics are mid-flight, coordinate: their files
      adopt the Panel interface on their branch or here, never both.
- [ ] Keyboard/interaction behavior identical (characterization tests from S01 are the net);
      manual pass over every panel: open, close, interact, exclusivity, hotkeys.

## Acceptance criteria

- [ ] UIManager ≤ ~300 lines (registry + services); each panel independently instantiable in
      jsdom with a mock services object (proven by its tests).
- [ ] No panel imports another panel (review criterion; the guard in S05 enforces it after).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
