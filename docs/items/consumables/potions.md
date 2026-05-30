# Potions

> All potion items in Old Town. Potions provide burst effects: healing, stat boosts, status cures, and utility buffs. See `docs/consumables/potions.md` for the canonical potion system design.
>
> **Rule:** All potion names must match the canonical consumables system. Banned names: `health potion`, `strength potion`, `mana potion`, `antipoison`, `prayer potion`, `energy potion`, `attack potion`, `defence potion`, `magic potion`, `ranged potion`.

## Potion System Overview

Potions are crafted through the Apothecary skill. They provide burst effects.

**Potion mechanics:**
- Potions are stackable (up to 28 per inventory slot)
- Drinking a potion consumes 1 dose (a potion has 4 doses)
- A potion vial becomes an `empty_vial` after all doses are consumed
- Potions can be consumed during combat
- Some potions have a cooldown (cannot drink the same potion for N ticks)
- Potion names use Old Town terminology: Tincture, Draught, Tonic, Phial, Cordial, Salve, Wash

## Stat Boost Potions

### Tinctures (Arms)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `arms_tincture` | Arms Tincture | +3 Arms | 4 | 15 | Sharpens the blade hand |
| `arms_tincture_super` | Arms Tincture (Super) | +5 Arms | 4 | 75 | Stronger tincture |

### Draughts (Might)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `might_draught` | Might Draught | +3 Might | 4 | 25 | Swells the muscles |
| `might_draught_super` | Might Draught (Super) | +5 Might | 4 | 85 | Stronger draught |

### Tonics (Guard)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `guard_tonic` | Guard Tonic | +3 Guard | 4 | 35 | Hardens the skin |
| `guard_tonic_super` | Guard Tonic (Super) | +5 Guard | 4 | 90 | Stronger tonic |

### Bitters (Ranged)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `sight_bitters` | Sight Bitters | +3 Ranged | 4 | 45 | Sharpens the eye |
| `sight_bitters_super` | Sight Bitters (Super) | +5 Ranged | 4 | 85 | Stronger bitters |

### Phials (Magic)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `wit_phial` | Wit Phial | +3 Magic | 4 | 55 | Clears the mind |
| `wit_phial_super` | Wit Phial (Super) | +5 Magic | 4 | 90 | Stronger phial |

### Cordials (Favour)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `favour_cordial` | Favour Cordial | +3 Favour | 4 | 65 | Renews the spirit |
| `favour_cordial_super` | Favour Cordial (Super) | +5 Favour | 4 | 95 | Stronger cordial |

### Elixirs (Vitality)

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `vitality_elixir` | Vitality Elixir | +3 Vitality | 4 | 75 | Steels the body |
| `vitality_elixir_super` | Vitality Elixir (Super) | +5 Vitality | 4 | 99 | Stronger elixir |

## Utility Potions

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `road_tea` | Road Tea | Restore 50% stamina | 4 | 20 | For travellers |
| `cleanblood_salve` | Cleanblood Salve | Cure poison | 1 | 30 | Draws out venom |
| `argent_wash` | Argent Wash | Cure curse | 1 | 40 | Cleanses curses |
| `greenwold_poultice` | Greenwold Poultice | Restore 20% stamina + heal 10 HP | 1 | 50 | Restores the body |
| `graveyard_balm` | Graveyard Balm | Cure rot | 1 | 60 | Heals crypt rot |
| `blueglass_unguent` | Blueglass Unguent | Cure burn | 1 | 70 | Soothes burns |
| `starfall_balm` | Starfall Balm | Cure all status | 1 | 99 | The ultimate cure |

## Buff Potions

| Item ID | Name | Effect | Doses | Apothecary Level | Notes |
|---------|------|--------|-------|------------------|-------|
| `blueglass_tonic` | Blueglass Tonic | +5% precision | 4 | 60 | Focus potion |
| `graveyard_oil` | Graveyard Oil | +5% vs undead | 4 | 70 | Weapon coating |
| `carmine_oil` | Carmine Oil | +5% weapon damage | 4 | 80 | Duelist's oil |
| `warden_oil` | Warden Oil | +5% vs deserters | 4 | 60 | Lawful oil |
| `starfall_oil` | Starfall Oil | +10% vs all | 4 | 99 | Ultimate oil |

## Potion Effects Detail

**Stat Boost Potions:**
- Temporary boost to combat skills
- Lasts for 60 ticks (36 seconds)
- Boosts are flat +3 or +5 (not percentage)
- Limited by the +5 total boost cap (see `docs/skills/skill-system.md`)
- Cannot stack multiple boosts (highest applies)

**Utility Potions:**
- Cure status effects instantly
- No eat delay
- Can drink while eating (food + potion simultaneously)
- Salves are single-use (1 dose)

**Buff Potions:**
- Grant combat or skilling buffs
- Last 1 minute (combat) or 10 minutes (utility)
- Oils are applied to weapons, not drunk
- No stacking (reapplying overwrites)

## Related Documents

- [`food.md`](food.md) — Food item definitions
- [`00-index.md`](00-index.md) — Consumables overview
- [`../../consumables/00-index.md`](../../consumables/00-index.md) — Canonical consumables system
- [`../../consumables/potions.md`](../../consumables/potions.md) — Canonical potion system design
- [`../../resources/herbs-roots-and-fungi.md`](../../resources/herbs-roots-and-fungi.md) — Herb taxonomy

---

*Total potion items defined: 30+*
*All names match canonical consumables system: Yes*
*Last updated: 2026-05-30*
