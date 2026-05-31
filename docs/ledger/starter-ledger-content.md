---
doc_type: authority
canonical_path: docs/ledger/starter-ledger-content.md
parent_index: docs/ledger/00-index.md
root_index: docs/00-index.md
---

Parent: [`Ledger Index`](00-index.md)

Authority references:
- `docs/ledger/district-deeds.md`
- `docs/ledger/oldroad-trails.md`
- `docs/ledger/public-works.md`
- `docs/ledger/charters-and-permits.md`
- `docs/ledger/nooks-and-stash-spots.md`
- `docs/ledger/rewards-and-stamps.md`
- `docs/map/ledger-placement.md`

# Starter Ledger Content

This document is a quick-reference summary of all starter Civic Ledger content. It is the implementation checklist for the first vertical slice.

## Deed Cards

| District | Errand Tasks | Stamped Tasks | Chartered Tasks | Mastered Task |
|----------|--------------|---------------|-----------------|---------------|
| Market Bell | 3 | 2 | 1 | 1 |
| Foundry Row | 2 | 2 | 2 | 1 |
| Lath Yard | 2 | 2 | 2 | 1 |
| Patch Lane | 2 | 2 | 1 | 1 |
| Chalkhouse Court | 2 | 2 | 1 | 1 |
| River Stoop | 2 | 2 | 1 | 1 |
| Oldroad Gate | 2 | 2 | 2 | 1 |
| Sootcellar | 2 | 2 | 1 | 1 |
| Gravegate | 2 | 2 | 2 | 1 |
| Warden Steps | 2 | 2 | 1 | 1 |

**Total starter deed tasks:** 54 tasks across 10 districts.

## Oldroad Trails

| Tier | Name | Steps | Sources |
|------|------|-------|---------|
| 1 | Scrap Trail | 1-2 | Monster drops, skilling rare rolls, fishing oddities |
| 2 | Chalk Trail | 2-3 | Monster drops, skilling rare rolls, quest rewards |
| 3 | Writ Trail | 3-4 | Warden contracts, Cartography surveys, quest rewards |
| 4 | Grave Trail | 3-5 | Monster drops, mining sealed stones, Sleight pickpocketing |
| 5 | Crown Trail | 4-6 | Warden elite contracts, Cartography rare surveys, quest rewards |
| 6 | Starfall Trail | 5-7 | All sources at extreme rarity |

**Total trail tiers:** 6.

## Public Works

| Work | District | Skill XP | Tokens |
|------|----------|----------|--------|
| Bell Run | Market Bell | Wayfaring | Bell Token |
| Soot Sweep | Sootcellar | Combat | Sootcellar Token |
| Kiln Watch | Chalkhouse Court | Hearthcraft | Chalk Token |
| Ledger Sort | Counting House | None (coins) | None |
| Graveflower Round | Gravegate | Favour | Gravegate Token |
| Ferry Rope Duty | River Stoop | Might | River Token |
| Warden Posting | Warden Steps | Wardenry | Warden Token |
| Market Rush | Market Bell | Sleight | Bell Token |

**Total starter works:** 8.

## Charters

| Charter | District | Requirement |
|---------|----------|-------------|
| Foundry Charter | Foundry Row | Mastered Foundry Row deed |
| Lath Charter | Lath Yard | Mastered Lath Yard deed |
| Patch Charter | Patch Lane | Mastered Patch Lane deed |
| Chalk Charter | Chalkhouse Court | Mastered Chalkhouse Court deed |
| River Charter | River Stoop | Mastered River Stoop deed |
| Warden Charter | Warden Steps | Mastered Warden Steps deed |
| Quill Charter | Oldroad Gate | Mastered Oldroad Gate deed |
| Shrine Charter | Shrine Hearth | Mastered Gravegate deed + Favour rite |

**Total starter charters:** 8.

## Permits

| Permit | Unlocks | Requirement |
|--------|---------|-------------|
| Gravegate Permit | Deep crypt | Stamped Gravegate deed |
| Old Kiln Permit | Old kiln | Stamped Chalkhouse Court deed |
| Ferry Pass | Ferry without toll | Stamped River Stoop deed |
| Blacksealed Pass | Blacksealed alley | Stamped Sootcellar deed |
| Foundry Licence | Private furnace daily | Chartered Foundry Row deed |
| Warden Seal | Elite contract weekly | Chartered Warden Steps deed |
| Shrine Leave | Free daily rite | Chartered Gravegate deed + offering |
| Road Writ | Hidden shortcut | Chartered Oldroad Gate deed |

**Total starter permits:** 8.

## Nooks

| Nook | District | Skill | Materials |
|------|----------|-------|-----------|
| Crate Nook | Market Bell, Patch Lane | Carpentry | 2 planks, 1 iron fitting |
| Wall Nook | Lath Yard | Carpentry, Cartography | 2 planks, 1 bronze fitting, 1 map scrap |
| Grave Nook | Gravegate | Favour, Carpentry | 2 planks, 1 grave fitting, 1 grave bead |
| Bell Nook | Foundry Row, Chalkhouse Court, Warden Steps | Civic Ledger | 2 planks, 1 brass fitting, 1 bell token |
| Road Nook | River Stoop, Oldroad Gate | Cartography | 2 planks, 1 iron fitting, 1 route scrap |
| Blacksealed Nook | Sootcellar | Sleight | 2 planks, 1 blacksealed fitting, 1 lockpick |

**Total nook types:** 6.

## Reward Types

| Type | Count in Starter Content |
|------|--------------------------|
| District stamp | 10 |
| Utility item | 6 |
| Service discount | 10 |
| Shop stock unlock | 4 |
| Route unlock | 4 |
| Nook unlock | 6 |
| Charter unlock | 8 |
| Cosmetic | 10 |
| Trail cache | 6 trail tiers |
| Rare trophy | 4 |

## Implementation Checklist

- [ ] 10 deed cards defined in content
- [ ] 6 trail tiers defined in content
- [ ] 12 step types documented and mapped to systems
- [ ] 6 nook types with build rules and locations
- [ ] 8 charters with unlock conditions
- [ ] 8 permits with unlock conditions
- [ ] 8 public works with gameplay and rewards
- [ ] 10 district stamps with names and art
- [ ] 10 Mastered cosmetics with descriptions
- [ ] 4 rare trophies for trophy slot

---

*Last updated: 2026-05-31*
