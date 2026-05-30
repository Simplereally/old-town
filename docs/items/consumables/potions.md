# Potions

> All potion items in Old Town. Potions provide burst effects: healing, energy restoration, prayer restoration, and status cures.

## Potion System Overview

Potions are crafted through the Herblore skill (planned, not in POC). They provide burst effects.

**Potion mechanics:**
- Potions are stackable (up to 28 per inventory slot)
- Drinking a potion consumes 1 dose (a potion has 4 doses)
- A potion vial becomes an `empty_vial` after all doses are consumed
- Potions can be consumed during combat
- Some potions have a cooldown (cannot drink the same potion for N ticks)

## Potion Types

### Health Potions

| Item ID | Name | Effect | Doses | Herblore Level | Notes |
|---------|------|--------|-------|---------------|-------|
| `health_potion` | Health Potion | Heals 20 HP | 4 | 1 | Basic healing potion |
| `health_potion_super` | Super Health Potion | Heals 35 HP | 4 | 40 | Stronger healing |

### Energy Potions

| Item ID | Name | Effect | Doses | Herblore Level | Notes |
|---------|------|--------|-------|---------------|-------|
| `energy_potion` | Energy Potion | Restores 20% run | 4 | 5 | Run energy restoration |
| `energy_potion_super` | Super Energy Potion | Restores 40% run | 4 | 45 | Stronger energy |

### Prayer Potions

| Item ID | Name | Effect | Doses | Herblore Level | Notes |
|---------|------|--------|-------|---------------|-------|
| `prayer_potion` | Prayer Potion | Restores 20 prayer | 4 | 30 | Prayer point restoration |
| `prayer_potion_super` | Super Prayer Potion | Restores 35 prayer | 4 | 65 | Stronger prayer |

### Status Cure Potions

| Item ID | Name | Effect | Doses | Herblore Level | Notes |
|---------|------|--------|-------|---------------|-------|
| `antidote` | Antidote | Cures poison | 1 | 15 | Instant poison cure |
| `antidote_plus` | Antidote Plus | Cures poison + immunity | 1 | 60 | Cures + 5-min immunity |

### Stat Boost Potions

| Item ID | Name | Effect | Doses | Herblore Level | Notes |
|---------|------|--------|-------|---------------|-------|
| `strength_potion` | Strength Potion | +10% Strength | 4 | 10 | Temporary boost |
| `strength_potion_super` | Super Strength Potion | +15% Strength | 4 | 50 | Stronger boost |
| `attack_potion` | Attack Potion | +10% Attack | 4 | 10 | Temporary boost |
| `attack_potion_super` | Super Attack Potion | +15% Attack | 4 | 50 | Stronger boost |
| `defence_potion` | Defence Potion | +10% Defence | 4 | 10 | Temporary boost |
| `defence_potion_super` | Super Defence Potion | +15% Defence | 4 | 50 | Stronger boost |
| `magic_potion` | Magic Potion | +10% Magic | 4 | 35 | Temporary boost |
| `ranged_potion` | Ranged Potion | +10% Ranged | 4 | 35 | Temporary boost |

## Potion Effects Detail

**Health Potions:**
- Heal HP immediately on drinking
- No eat delay (unlike food)
- Can drink while eating (food + potion simultaneously)
- Super health potions heal more but are expensive

**Energy Potions:**
- Restore run energy percentage (not flat amount)
- Useful for long-distance travel
- Super energy potions restore more

**Prayer Potions:**
- Restore prayer points (used for prayers/buffs)
- Essential for sustained combat with prayers active
- Super prayer potions restore more

**Antidote:**
- Cures poison instantly
- Antidote Plus provides 5-minute poison immunity
- Poison is a damage-over-time status effect (planned)

**Stat Boost Potions:**
- Temporary boost to combat stats
- Lasts for 60 ticks (36 seconds)
- Boosts are calculated as percentage of current level
- Cannot stack multiple boosts (highest applies)

## Related Documents

- [`food.md`](food.md) — Food items
- [`00-index.md`](00-index.md) — Consumables overview

---

*Total potion items defined: 16*
