# E65-S01 — Seam map and boundary contract for both god files

## Epic

E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: none (post-E49 sequencing is the epic's gate)
- Blocks: E65-S02

## Objective

Read both files completely, map their actual internal coupling (not the assumed one), and
commit a written decomposition contract that S02–S04 execute mechanically. Analysis story —
the only code it lands is characterization tests where coverage gaps would make later slices
unsafe.

## Required work

- [ ] **ActorRenderer seam map**: enumerate its state fields and methods; cluster by
      change-reason (pooling lifecycle / per-frame animation update / equipment attach-detach
      / armour visual application / material+geometry caching); for each cluster: what it
      reads/writes of the others' state, the narrowest interface that would sever it, and
      any E49-rig entanglement to respect (the rig code is FRESH — its module boundaries win
      ties). Deliver as `docs/engine/client-decomposition.md` §ActorRenderer with a
      target-module table (name, owns, exposes, consumes).
- [ ] **UIManager seam map**: enumerate panels + shared services (DOM root management, open/
      close/toggle state, keybind routing, the packet→UIState flow — read how UIState updates
      reach panels today); the target: a `PanelRegistry` host owning shared services + a
      `Panel` interface (mount/update/unmount-shaped — derive the actual interface from what
      panels DO, not from this sketch) + one module per panel. Same doc, §UIManager, same
      table.
- [ ] **Coverage audit**: run the client suite with coverage over both files; every cluster
      slated for extraction needs enough characterization coverage that a botched extraction
      fails a test. Write the missing characterization tests NOW (against current code — they
      migrate with their clusters).
- [ ] **Slice plan**: ordered extraction sequence for S02–S04 with, per slice: modules
      created, tests migrating, expected green checkpoints. Slices sized to one reviewable PR
      each.

## Acceptance criteria

- [ ] The doc's module tables are complete enough that S02–S04 require no further design
      decisions (review criterion: a different engineer could execute them).
- [ ] Characterization coverage in place; suite green.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
