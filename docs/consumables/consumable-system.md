---
doc_type: authority
canonical_path: docs/consumables/consumable-system.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/skills/production-skills.md`
- `docs/skills/skill-system.md`
- `docs/combat/signature-mechanics.md`

# Consumable System

> **The core authority for Old Town's consumables.** Consumables are not just healing items. They are the day-to-day economy that makes the world feel alive. A fisherman sells eel broth to warriors. An apothecary brews tinctures for duelists. A cook bakes hand pies for travellers.
>
> **Rule:** Every consumable must support a build, a playstyle, or a profession. No consumable exists purely to restore a number.

---

## Consumable Families

Old Town recognizes six consumable families. Each family has a distinct purpose, production skill, and gameplay identity.

| Family | Production Skill | Purpose | Examples |
|--------|-----------------|---------|----------|
| **Food** | Cooking | Healing, stamina, buffs | Bread, pies, stews, teas |
| **Potions** | Apothecary | Direct temporary stat boosts | Tinctures, draughts, tonics, phials |
| **Brews** | Apothecary | Powerful effects with tradeoffs | Blacksealed Brew, Graveyard Brew |
| **Poisons** | Apothecary | Damage over time, debuffs | Blacksalt Venom, Wyrm Venom |
| **Salves** | Apothecary | Status cures, anti-rot, anti-venom | Cleanblood Salve, Argent Wash |
| **Oils** | Apothecary | Weapon/ammo coatings | Carmine Oil, Graveyard Oil |

---

## Core Mechanics

### Consumption Timing

All consumables share a common timing system:

- **Instant:** Effect applies immediately on the tick it is consumed.
- **Eat delay:** 3 ticks (1.8 seconds) before another consumable can be used.
- **Tick eating:** Food can be consumed during combat, but the heal applies on the next tick.
- **Stackable:** Most consumables stack up to 28 per inventory slot.
- **Non-stackable:** Brews, salves, and oils are non-stackable (single-use items).

### Overhealing and Overboosting

- **Overhealing:** Food can heal above maximum HP up to a cap of 10% over max.
- **Overboosting:** Potions can boost above maximum level up to the +5 cap (see `docs/skills/skill-system.md`).
- **No double overhealing:** The overheal cap is 10% above max. Eating more food at max HP does not increase the overheal beyond this cap.

### Burn and Failure

- **Food burn:** Food can be burned during cooking, failing to heal and producing `burnt_*` items.
- **Potion failure:** Potions can fail during brewing, producing `weak_*` or `spoiled_*` items.
- **Brew instability:** Brews have a chance to backfire, applying the downside without the benefit.

---

## Food System

### Food Categories

| Category | Purpose | Examples | Where Eaten |
|----------|---------|----------|-------------|
| **Market Food** | Cheap, common healing | Bellbread, hand pies, market stew | Town, market, bank |
| **Workshop Food** | Skilling stamina, focus | Graveyard tea, eel broth | Workshop, forge, kiln |
| **Trail Food** | Exploration, travel | Warden ration, dried meat | Road, wilderness, ferry |
| **Combat Food** | Reliable healing | Rockclaw roll, deepwater eel | Combat, dungeon, contract |
| **Combo Food** | Small heal + instant effect | Tinfin pie, salmon roll | Combat, PvP |
| **Stews** | Strong buffs, slower | Market stew, warden stew | Camp, safe zone |
| **Teas** | Utility, Favour, Magic | Graveyard tea, blueglass tea | Shrine, workshop, crypt |

### Food Mechanics

- **Healing:** Food restores HP immediately. Higher-tier food heals more HP.
- **Stamina:** Some food restores stamina (Wayfaring resource). Trail food and workshop food often restore stamina.
- **Buffs:** Some food grants temporary buffs: +5% crafting speed, +10% XP, +2 Favour.
- **Combo:** Combo food heals in two stages. The first heal is instant, the second is a smaller heal applied 3 ticks later.
- **Burn chance:** Higher-tier food has a higher burn chance during cooking. A burnt food item heals 1 HP and is worth nothing.

### Food Identity

Old Town food is not generic fantasy fare. It is rooted in the world:

- **Bellbread** — the staple bread of Old Town, baked with bell flour. Every household has a recipe.
- **Hand pies** — portable, two-bite food for travellers. Sold at market stalls.
- **Market stew** — sold in bowls at the town market. Made with whatever is fresh.
- **Warden ration** — dried, preserved food for wardens on contract. Hardtack, dried meat, and nuts.
- **Eel broth** — hearty broth made from river eels, served at workshops. Keeps workers warm.
- **Crab cakes** — made from rockclaw, served at coastal workshops. A celebration food.
- **Graveyard tea** — strong tea brewed with graveyard moss, served at the forge. Not for drinking; for dipping bread.
- **Crown turtle soup** — served at royal and master ceremonies. A symbol of status.
- **Starfall crab cakes** — served at the endgame feast. Made only when a starfall crab is caught.

---

## Potion System

### Potion Categories

| Potion | Effect | Duration | Production Level | Item ID |
|--------|--------|----------|------------------|---------|
| **Arms Tincture** | +3 Arms | 1 minute | 15 | `arms_tincture` |
| **Might Draught** | +3 Might | 1 minute | 25 | `might_draught` |
| **Guard Tonic** | +3 Guard | 1 minute | 35 | `guard_tonic` |
| **Sight Bitters** | +3 Ranged | 1 minute | 45 | `sight_bitters` |
| **Wit Phial** | +3 Magic | 1 minute | 55 | `wit_phial` |
| **Favour Cordial** | +3 Favour | 1 minute | 65 | `favour_cordial` |
| **Vitality Elixir** | +3 Vitality | 1 minute | 75 | `vitality_elixir` |
| **Road Tea** | Restore stamina | Instant | 20 | `road_tea` |
| **Cleanblood Salve** | Cure poison | Instant | 30 | `cleanblood_salve` |
| **Argent Wash** | Cure curse | Instant | 40 | `argent_wash` |
| **Greenwold Poultice** | Restore stamina + heal | Instant | 50 | `greenwold_poultice` |
| **Blueglass Tonic** | +5 precision | 1 minute | 60 | `blueglass_tonic` |
| **Graveyard Oil** | +5% vs undead | 1 minute | 70 | `graveyard_oil` |
| **Carmine Oil** | +5% weapon damage | 1 minute | 80 | `carmine_oil` |
| **Starfall Philtre** | +5 all stats | 1 minute | 99 | `starfall_philtre` |

### Potion Mechanics

- **Boost cap:** Potions are limited by the +5 total boost cap (see `docs/skills/skill-system.md`).
- **Duration:** Most potions last 1 minute. Brews last 30 seconds.
- **Stacking:** Potions do not stack with food boosts. The higher of the two applies.
- **Failure:** Potions can fail during brewing, producing weak or spoiled variants.
- **Cooldown:** No potion has a cooldown, but the +5 cap prevents excessive stacking.

### Potion Identity

Old Town potions are not generic "Health Potion, Strength Potion, Mana Potion." They are grounded in the world:

- **Tincture** — a dilute extract, often bitter. Arms Tincture sharpens the blade hand.
- **Draught** — a strong, single-serving drink. Might Draught swells the muscles.
- **Tonic** — a medicinal brew. Guard Tonic hardens the skin.
- **Phial** — a small glass bottle. Wit Phial clears the mind.
- **Cordial** — a sweet, restorative drink. Favour Cordial renews the spirit.
- **Salve** — an ointment, rubbed on the skin. Cleanblood Salve draws out venom.
- **Wash** — a liquid rinse. Argent Wash cleanses curses.
- **Poultice** — a paste applied to wounds. Greenwold Poultice restores the body.
- **Oil** — a coating for weapons. Carmine Oil makes the blade bite deeper.
- **Brew** — a complex, dangerous mixture. Blacksealed Brew unlocks hidden power.

---

## Brew System

### Brew Categories

| Brew | Primary Effect | Downside | Duration | Production Level |
|------|---------------|----------|----------|------------------|
| **Blacksealed Brew** | +5 all stats | -5 all stats after duration | 30 seconds | 50 |
| **Graveyard Brew** | +10% vs undead | -10% vs living | 30 seconds | 60 |
| **Wyrm Brew** | +10% poison damage | -10% healing received | 30 seconds | 70 |
| **Carmine Brew** | +15% damage in duels | -15% damage in group PvP | 30 seconds | 80 |
| **Starfall Brew** | +20% all stats | -20% all stats after duration | 30 seconds | 99 |

### Brew Mechanics

- **Tradeoffs:** Every brew has a downside that activates after the primary effect expires.
- **Backfire chance:** Brews have a 10% chance to backfire, applying the downside without the benefit.
- **Duration:** All brews last 30 seconds.
- **Non-stackable:** Brews are non-stackable items. Each brew takes one inventory slot.
- **Cooldown:** 5 minutes between brews. Cannot chain brews.

### Brew Identity

Brews are the dangerous edge of consumables. They are not for everyday use. They are for desperate moments, boss fights, and duels.

- **Blacksealed Brew** — a sealed bottle of black liquid. The seal must be broken to drink. The power is great, but the crash is hard.
- **Graveyard Brew** — brewed with graveyard moss and drake blood. It makes the drinker deadly to undead, but weak to the living.
- **Wyrm Brew** — distilled from wyrm venom. It turns the drinker's blood to poison, but poisons their own healing.
- **Carmine Brew** — the duelist's drink. It sharpens the mind for one-on-one combat, but dulls it for group fights.
- **Starfall Brew** — the endgame brew. It unlocks the drinker's full potential, but leaves them shattered afterwards.

---

## Poison System

### Poison Categories

| Poison | Application | Damage | Duration | Production Level |
|--------|-------------|--------|----------|------------------|
| **Blacksalt Venom** | Darts, knives | 2 HP/tick | 10 ticks | 35 |
| **Wyrm Venom** | Darts, knives | 4 HP/tick | 10 ticks | 55 |
| **Drake Venom** | Darts, knives | 6 HP/tick | 10 ticks | 75 |
| **Starfall Toxin** | Darts, knives | 8 HP/tick | 10 ticks | 95 |

### Poison Mechanics

- **Application:** Poisons are applied to darts, knives, and throwing weapons. The poisoned weapon deals bonus damage over time.
- **Damage:** Poison damage is applied every tick for the duration.
- **Cure:** Poison can be cured with Cleanblood Salve or Argent Wash.
- **Immunity:** Some creatures are immune to poison (undead, constructs, Starfall beasts).
- **Stacking:** Poison does not stack. Reapplying poison resets the duration.
- **Production:** Poisons are crafted by Apothecary. They require herbs and venom.

### Poison Identity

Poisons are the tools of the underworld. They are used by Sleight, Wardenry, and ranged combat.

- **Blacksalt Venom** — a common poison made from black salt and nightshade. Cheap, effective, and easy to make.
- **Wyrm Venom** — distilled from wyrm venom. More potent than blacksalt, but harder to produce.
- **Drake Venom** — extracted from drake blood. The most potent common poison. Expensive and rare.
- **Starfall Toxin** — the endgame poison. Made from starfall blood. It is said to be able to poison a god.

---

## Salve and Oil System

### Salve Categories

| Salve | Effect | Cure | Production Level | Item ID |
|-------|--------|------|------------------|---------|
| **Cleanblood Salve** | Cure poison | Poison | 30 | `cleanblood_salve` |
| **Argent Wash** | Cure curse | Curse | 40 | `argent_wash` |
| **Greenwold Poultice** | Restore stamina + heal | Stamina drain | 50 | `greenwold_poultice` |
| **Graveyard Balm** | Cure rot | Rot | 60 | `graveyard_balm` |
| **Blueglass Unguent** | Cure burn | Burn | 70 | `blueglass_unguent` |
| **Starfall Balm** | Cure all status | All | 99 | `starfall_balm` |

### Oil Categories

| Oil | Effect | Duration | Production Level | Item ID |
|-----|--------|----------|------------------|---------|
| **Carmine Oil** | +5% weapon damage | 10 minutes | 80 | `carmine_oil` |
| **Graveyard Oil** | +5% vs undead | 10 minutes | 70 | `graveyard_oil` |
| **Warden Oil** | +5% vs deserters | 10 minutes | 60 | `warden_oil` |
| **Blueglass Oil** | +5% vs golems | 10 minutes | 50 | `blueglass_oil` |
| **Starfall Oil** | +10% vs all | 10 minutes | 99 | `starfall_oil` |

### Salve and Oil Mechanics

- **Application:** Salves are applied to the player. Oils are applied to weapons.
- **Duration:** Oils last 10 minutes. Salves are instant.
- **Stacking:** Oils do not stack. Reapplying an oil overwrites the previous one.
- **Production:** Salves and oils are crafted by Apothecary. They require herbs, oils, and wax.

---

## Status Effects

### Status Effect Categories

| Status | Effect | Source | Cure | Prevention |
|--------|--------|--------|------|------------|
| **Poison** | 2-8 HP/tick | Poisoned weapons, wyrms | Cleanblood Salve | Poison immunity |
| **Curse** | -10% stats | Cursed items, crypts | Argent Wash | Favour blessing |
| **Rot** | -5 HP/tick, -5% stats | Graveyards, crypts | Graveyard Balm | Graveyard tea |
| **Burn** | -3 HP/tick, -5% stats | Fire, failed cooking | Blueglass Unguent | Fire resistance |
| **Stamina Drain** | Cannot run, -10% speed | Cold, exhaustion | Greenwold Poultice | Warmth, rest |
| **Bleed** | -2 HP/tick | Slashing weapons, traps | Cleanblood Salve | Armour, bandages |
| **Fear** | Cannot attack, -10% stats | Bosses, wyrms | Favour Cordial | Courage, bravery |
| **Slow** | -20% speed | Ice, cold | Road Tea | Warmth, boots |

### Status Effect Mechanics

- **Duration:** Most status effects last 10-30 ticks unless cured.
- **Curing:** Status effects are cured with salves, potions, or Favour blessings.
- **Prevention:** Some status effects can be prevented with equipment, blessings, or consumables.
- **Stacking:** Status effects do not stack. Reapplying a status effect resets the duration.
- **Immunity:** Some creatures are immune to certain status effects (undead immune to poison, constructs immune to curse).

---

## Design Rules

1. **No generic names.** `health potion`, `strength potion`, `mana potion`, `antipoison` are banned.
2. **Every consumable supports a build.** Carmine Oil supports sabres. Graveyard Tea supports crypt runs. Road Tea supports Wayfaring.
3. **Every consumable has a tradeoff.** Brews have downsides. Poisons have immunity. Oils have duration limits.
4. **No pure power creep.** Higher-tier consumables are more specialized, not universally better.
5. **Production skill lock.** Every consumable requires a production skill level. No consumable is usable by everyone.
6. **Content-driven recipes.** Every consumable recipe is defined in JSON content files, not hardcoded.
7. **Cultural framing.** Every consumable has a story that connects it to Old Town's world.
8. **Economy integration.** Every consumable requires resources from gathering skills. No consumable is self-sufficient.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`food.md`](food.md) — Food system
- [`potions.md`](potions.md) — Potion system
- [`brews.md`](brews.md) — Brew system
- [`poisons.md`](poisons.md) — Poison system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`status-effects.md`](status-effects.md) — Status effects
- [`../skills/production-skills.md`](../skills/production-skills.md) — Cooking and Apothecary skill definitions
- [`../resources/resource-taxonomy.md`](../resources/resource-taxonomy.md) — Canonical resource names

---

*Total consumable families: 6*
*Total consumables defined: 40+*
*Last updated: 2026-05-30*
