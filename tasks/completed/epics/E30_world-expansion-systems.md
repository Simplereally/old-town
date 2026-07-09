# E30 — World Expansion Systems

## Dependency chain

- Depends on: E26, E29
- Unlocks: E31

## Spec references

- docs/content/runtime-gap-list.md (P2 gaps 16–21)
- docs/content/action-wiring-audit.md
- docs/world/ledger-deeds.md
- docs/world/oldroad-trails.md
- docs/world/nooks.md
- docs/world/charters.md
- docs/world/public-works.md
- docs/favour/boons-oaths-rites.md

## Epic goal

Implement deep Old Town world systems: Ledger deeds, Oldroad Trails, Nooks, Charters/permits, Public works, and full Favour boons/oaths/rites. This epic closes the gap where these systems are documented but have no runtime implementation.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E30/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E30-S01` — [Ledger Deed System](../stories/E30/E30-S01_ledger-deed-system.md) ✅
- [X] `E30-S02` — [Oldroad Trails and Discovery](../stories/E30/E30-S02_oldroad-trails-and-discovery.md) ✅
- [X] `E30-S03` — [Nooks and Hidden Areas](../stories/E30/E30-S03_nooks-and-hidden-areas.md) ✅
- [X] `E30-S04` — [Charters and Permits](../stories/E30/E30-S04_charters-and-permits.md) ✅
- [X] `E30-S05` — [Public Works System](../stories/E30/E30-S05_public-works-system.md) ✅
- [X] `E30-S06` — [Full Favour Boons, Oaths, and Rites](../stories/E30/E30-S06_full-favour-boons-oaths-and-rites.md) ✅

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
