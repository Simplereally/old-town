---
doc_type: authority
canonical_path: docs/trails/ambush-and-danger-steps.md
parent_index: docs/trails/00-index.md
root_index: docs/00-index.md
---

Parent: [`Trails Index`](00-index.md)

Authority references:
- `docs/trails/step-types.md`
- `docs/trails/trail-tiers.md`
- `docs/creatures/starter-creatures.md`
- `docs/combat/mechanics-implementation.md`

# Ambush and Danger Steps

Ambush Steps spawn a Trail enemy when the player reaches the step location. They add danger and unpredictability to higher-tier Trails.

## Ambush Philosophy

Ambushes should be readable, tied to the clue fantasy, and not mandatory death traps. A player who solves the step correctly should survive the ambush. A player who is underleveled or unprepared may need to flee or return with better gear.

## Ambush by Tier

| Tier | Enemy Type | Danger Level |
|------|------------|--------------|
| Scrap | None, or Cellar Rat prank | None |
| Chalk | Bell Bat or Road Crow nuisance | Low |
| Writ | false_clerk (False Clerk) | Medium |
| Grave | grave_scratcher (Grave Scratcher), grave_mite (Grave Mite), grave_wisp (Grave Wisp) | Medium-High |
| Crown | crown_courier (Crown Courier), hired_duelist (Hired Duelist), bellstruck_stranger (Bellstruck Stranger) | High |
| Starfall | bellstruck_stranger (Bellstruck Stranger), wrong_walker (Wrong Walker), starless_witness (Starless Witness) | High |

## Named Trail Enemies

| Enemy ID | Name | Tier | Description |
|----------|------|------|-------------|
| false_clerk | False Clerk | Writ | A blacksealed clerk who appears at step locations. Weak but annoying. |
| grave_scratcher | Grave Scratcher | Grave | A creature that emerges from graves during dig steps. Medium threat. |
| grave_mite | Grave Mite | Grave | A small swarm creature that bursts from disturbed graves. Medium-low threat. |
| grave_wisp | Grave Wisp | Grave | A floating light that drains warmth. Appears near crypt entrances. Medium threat. |
| crown_courier | Crown Courier | Crown | A fast enemy that delivers a message before attacking. Mid-high threat. |
| hired_duelist | Hired Duelist | Crown | A swordsman paid to challenge the player at step locations. Mid-high threat. |
| bellstruck_stranger | Bellstruck Stranger | Crown | A wandering NPC who rings a bell before attacking. Mid-level threat. |
| wrong_walker | Wrong Walker | Starfall | A trail fool who leads the player astray. High-level threat. |
| starless_witness | Starless Witness | Starfall | A rare enemy that appears only during Starfall Trails. High threat. |

## Ambush Examples

| Step | Enemy | Location | Tier |
|------|-------|----------|------|
| A false clerk demands your permit | false_clerk | Counting House | Writ |
| A false clerk blocks the door | false_clerk | Sootcellar | Writ |
| A grave scratcher claws its way out during your survey | grave_scratcher | Lowgrave | Grave |
| A Bell Bat descends when you ring the bell | Bell Bat | Market Bell | Chalk |
| A Crown Courier arrives with a sealed message | crown_courier | Counting House | Crown |
| A Wrong Walker appears and asks you to follow | wrong_walker | Oldroad Gate | Starfall |
| A Starless Witness watches from the shadows | starless_witness | Wardenbrook | Starfall |

## Ambush Rules

1. Ambushes begin at Writ or Grave tier, not starter Scrap.
2. Ambushes should be readable and tied to the clue fantasy.
3. Trail enemies can drop Trail-specific scraps, cosmetics, or Cache upgrades.
4. Trail enemies should not be mandatory death traps.
5. A player can flee from an ambush and return later.
6. Ambush enemies despawn after a time limit if not engaged.
7. Ambush enemies do not block other players. They are instance-only.

## Trail Enemy Drops

Trail enemies can drop:

- Trail-specific scraps (used for Nook building or collection)
- Cosmetics (masks, trims, emotes)
- Cache upgrades (improve the next Cache reward)
- Rare items (unique to the enemy)

Drop rates are provisional tuning. The design intent is that Trail enemies are rewarding but not farmable.

## Danger Scaling

Danger scales with tier and player level:

- Writ: enemies are level 20-30. A prepared player can defeat them easily.
- Grave: enemies are level 40-50. A prepared player may need food or prayer.
- Crown: enemies are level 60-70. A prepared player may need good gear.
- Starfall: enemies are level 80-90. A prepared player may need a team or high-level gear.

---

*Last updated: 2026-06-01*
