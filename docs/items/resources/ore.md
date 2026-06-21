# Ore

> All ore materials in Old Town. Gathered through Mining. See `docs/resources/ores-and-stone.md` for the canonical resource taxonomy.
>
> **Rule:** All ore names must match the canonical resource taxonomy. Banned names: `mithril`, `adamantite`, `runite`, `silver`, `gold`.

## Ore Tier System

| Item ID | Canonical Name | Mining Level | Mining XP | Smithing Use | Tier | Notes |
|---------|---------------|-------------|----------|--------------|------|-------|
| `stone` | Stone | 1 | 5 | None | 0 | Tutorial, grey rock |
| `penny_copper_ore` | Penny Copper | 1 | 15 | Pennywrought bars | 1 | Starter ore, abundant |
| `tinstone_ore` | Tinstone | 1 | 15 | Bellmetal alloy | 1 | Alloy component |
| `pig_iron_ore` | Pig Iron Ore | 15 | 35 | Pig Iron bars | 2 | First real ore |
| `bellstone_ore` | Bellstone | 20 | 40 | Bellmetal alloy | 3 | Brass-yellow, ringing |
| `blackcoal` | Blackcoal | 25 | 50 | Smelting fuel | 4 | Essential fuel for steel |
| `wardenstone_ore` | Wardenstone | 35 | 80 | Wardensteel bars | 5 | Midgame workhorse |
| `greenwold_ore` | Greenwold Ore | 45 | 90 | Greenwold bars | 6 | Green-veined, living |
| `graveiron_ore` | Graveiron Ore | 50 | 100 | Graveiron bars | 7 | Elite inflection |
| `blueglass_ore` | Blueglass Ore | 65 | 130 | Blueglass bars | 8 | Magical mineral |
| `carmine_ore` | Carmine Ore | 75 | 150 | Carmine Steel bars | 9 | High-tier alloy |
| `argent_ore` | Argent Ore | 85 | 170 | Argent bars | 10 | Near-mastery precious |
| `crownsteel_ore` | Crownsteel Ore | 90 | 190 | Crownsteel bars | 11 | Penultimate |
| `starfall_ore` | Starfall Ore | 99 | 220 | Starfall bars | 12 | Endgame mythic |

## Special Minerals

| Item ID | Canonical Name | Mining Level | Use | Notes |
|---------|---------------|-------------|-----|-------|
| `glass_sand` | Glass Sand | 15 | Beadwork | Panned from riverbeds |
| `water_vial` | Water | 1 | Apothecary | From underground springs |

## Ore Properties

| Ore | Smelting Level | Bar Output | Fuel Required | Notes |
|-----|---------------|------------|---------------|-------|
| Penny Copper | 1 | Penny Copper Bar | None | Basic smelting |
| Tinstone | 1 | Tin Bar | None | Alloy component |
| Pig Iron Ore | 15 | Iron Bar | None | Pig Iron precursor |
| Bellstone | 20 | Bellmetal Bar | None | First alloy |
| Blackcoal | 25 | N/A | N/A | Fuel only |
| Wardenstone | 35 | Wardensteel Bar | Blackcoal | Midgame alloy |
| Greenwold Ore | 45 | Greenwold Bar | Blackcoal | Nature alloy |
| Graveiron Ore | 50 | Graveiron Bar | Blackcoal | Elite alloy |
| Blueglass Ore | 65 | Blueglass Bar | Blackcoal | Glass-steel hybrid |
| Carmine Ore | 75 | Carmine Steel Bar | Blackcoal | High-tier alloy |
| Argent Ore | 85 | Argent Bar | Blackcoal | Precious metal |
| Crownsteel Ore | 90 | Crownsteel Bar | Blackcoal | Penultimate alloy |
| Starfall Ore | 99 | Starfall Bar | Blackcoal | Mythic alloy |

## Smelting (Alloys)

| Bar | Ingredients | Level | Resulting Tier |
|-----|------------|-------|----------------|
| Penny Copper Bar | Penny Copper Ore | 1 | Pennywrought |
| Bellmetal Bar | Penny Copper + Tinstone | 15 | Bellmetal |
| Iron Bar | Pig Iron Ore | 15 | Pig Iron |
| Steel Bar | Iron + Blackcoal | 30 | Blackbar |
| Wardensteel Bar | Wardenstone + Blackcoal | 35 | Wardensteel |
| Greenwold Bar | Greenwold Ore + Blackcoal | 45 | Greenwold |
| Graveiron Bar | Graveiron Ore + Blackcoal | 50 | Graveiron |
| Blueglass Bar | Blueglass Ore + Blackcoal | 65 | Blueglass |
| Carmine Steel Bar | Carmine Ore + Blackcoal | 75 | Carmine Steel |
| Argent Bar | Argent Ore + Blackcoal | 85 | Argent |
| Crownsteel Bar | Crownsteel Ore + Blackcoal | 90 | Crownsteel |
| Starfall Bar | Starfall Ore + Blackcoal | 99 | Starfall |

## Related Documents

- [`wood.md`](wood.md) — Woodcutting materials
- [`fish.md`](fish.md) — Fishing materials
- [`crafting.md`](crafting.md) — Crafting materials
- [`00-index.md`](00-index.md) — Resources overview
- [`../../resources/ores-and-stone.md`](../../resources/ores-and-stone.md) — Canonical ore taxonomy

---

*Total ore materials defined: 16*
*All names match canonical taxonomy: Yes*
*Last updated: 2026-05-30*
