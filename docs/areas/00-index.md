---
doc_type: authority
canonical_path: docs/areas/00-index.md
parent_index: docs/00-index.md
root_index: docs/00-index.md
---

Parent: [Documentation Index](../00-index.md)

Authority references:
- `docs/areas/area-progression-system.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/areas/route-unlocks-and-gates.md`
- `docs/areas/area-level-bands.md`
- `docs/areas/area-resource-progression.md`
- `docs/areas/area-creature-progression.md`
- `docs/areas/area-quest-hooks.md`
- `docs/areas/area-reward-identities.md`
- `docs/spatial/outer-area-seeds.md`
- `docs/world/districts-and-routes.md`
- `docs/skills/skill-system.md`

# Area Progression Index

> **The entry point for Old Town's area progression design authority.** This section defines what exists beyond the 96 x 96 starter region: how players unlock new areas, what they find there, and why they return.

## What This Section Covers

The `docs/areas/` directory answers the design question: **What does the player unlock after Old Town stops being enough?**

It covers the first expansion ring (8 areas) and the second ring (7 areas) in design authority form. No maps, no JSON, no runtime code. Pure design authority: names, identities, systems, progression rules, and deferred implementation notes.

## Documents

| Document | Status | Summary |
|----------|--------|---------|
| [`area-progression-system.md`](area-progression-system.md) | Draft | Ring structure, unlock conditions, gate types, route system |
| [`first-ring-areas.md`](first-ring-areas.md) | Draft | Full authority for 8 first-ring areas: Crowmile Road, Bellwood Copse, Tinstone Cut, Patchfield, Wardenbrook, Lowgrave, The Old Kiln, Sootstairs |
| [`second-ring-areas.md`](second-ring-areas.md) | Draft | Lighter seed authority for 7 second-ring areas: Crownheart Forest, Blackbar Cut, Grave Underways, Witchwood Verge, Moth Ferry Crossing, Carmine Yard, Argent Chapel Road |
| [`route-unlocks-and-gates.md`](route-unlocks-and-gates.md) | Draft | Route network, unlock conditions, traversal mechanics, gate details |
| [`area-level-bands.md`](area-level-bands.md) | Draft | Level ranges per area, XP scaling, risk/reward curves, danger classification |
| [`area-resource-progression.md`](area-resource-progression.md) | Draft | Resource escalation by area, tiering, resource identity, competition |
| [`area-creature-progression.md`](area-creature-progression.md) | Draft | Creature identities, abilities, spawn logic, escalation patterns |
| [`area-quest-hooks.md`](area-quest-hooks.md) | Draft | Quest starters, chains, world-state triggers per area |
| [`area-reward-identities.md`](area-reward-identities.md) | Draft | Equipment identity, repeat value, why players return per area |

## Design Rules for Area Progression

1. **Local names only.** No zone levels, no region tiers, no global difficulty. Every area is named by the people who live there.
2. **Every area needs a reason to return.** One-and-done areas are failures. Repeat value is mandatory.
3. **Gates are visible and in-world.** No invisible walls. Every barrier has a sign, an NPC, a physical object, or a local reason.
4. **Routes are walked, not fast-travelled.** No teleportation, no flight, no mounts. Wayfaring and Cartography govern travel efficiency.
5. **Second ring is seeded, not built.** Players hear about these places before they can go there. Road signs, NPC dialogue, and ledger trails create the sense of a larger world.

## Quick Navigation

| What you want | Go to |
|---------------|-------|
| Understand how area rings work | [`area-progression-system.md`](area-progression-system.md) |
| See the 8 first-ring areas in detail | [`first-ring-areas.md`](first-ring-areas.md) |
| See the 7 second-ring area seeds | [`second-ring-areas.md`](second-ring-areas.md) |
| Understand routes and gates | [`route-unlocks-and-gates.md`](route-unlocks-and-gates.md) |
| Check level bands and danger | [`area-level-bands.md`](area-level-bands.md) |
| Find what resources appear where | [`area-resource-progression.md`](area-resource-progression.md) |
| Find what creatures spawn where | [`area-creature-progression.md`](area-creature-progression.md) |
| See quest hooks and chains | [`area-quest-hooks.md`](area-quest-hooks.md) |
| Understand reward identity and repeat value | [`area-reward-identities.md`](area-reward-identities.md) |

## Related Documents

- `docs/spatial/outer-area-seeds.md` — First and second ring expansion area seeds
- `docs/spatial/naming-atlas.md` — Naming grammar and banned patterns
- `docs/world/districts-and-routes.md` — Old Town districts and starter routes
- `docs/skills/skill-system.md` — Skill thresholds and equipment tiers
- `docs/ledger/civic-ledger-system.md` — Deed tiers and permits
- `docs/quests/quest-system.md` — Quest rules and tone
- `docs/creatures/creature-system.md` — Creature definitions and combat roles

---

*Last updated: 2026-05-31*
