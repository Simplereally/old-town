---
doc_type: authority
canonical_path: docs/consumables/status-effects.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/consumables/poisons.md`
- `docs/consumables/salves-and-oils.md`
- `docs/combat/signature-mechanics.md`

# Status Effects

> **The canonical status effect system of Old Town.** Status effects are not just debuffs. They are part of the world: crypt rot, wyrm venom, curse of the oldroad, and starfall radiation. Every status effect has a source, a cure, and a prevention.
>
> **Rule:** No status effect may be introduced without a source, a cure, and a prevention method. Status effects must be solvable, not permanent.

---

## Status Effect Philosophy

Status effects in Old Town are grounded in the world. They are not abstract "debuffs." They are diseases, poisons, curses, and environmental hazards that the player can encounter, cure, and prevent.

**Design principles:**
1. **Every status has a source.** A creature, an environment, a failed consumable, or a curse.
2. **Every status has a cure.** A salve, a potion, a Favour blessing, or a specific action.
3. **Every status has a prevention.** Equipment, consumables, or blessings that prevent the status.
4. **Status effects are temporary.** None last forever. All can be cured.
5. **Status effects are stacking.** Some status effects can stack (poison + burn = double damage).
6. **Status effects are visible.** The player sees the status icon and knows what is happening.

---

## Status Effect Categories

### Damage Over Time

Damage over time (DoT) status effects deal damage every tick.

| Status | Damage | Duration | Source | Cure | Prevention |
|--------|--------|----------|--------|------|------------|
| **Poison** | 2-8 HP/tick | 10-30 ticks | Poisoned weapons, wyrms, drakes | Cleanblood Salve | Poison immunity, Favour blessing |
| **Burn** | 3 HP/tick | 10 ticks | Fire, failed cooking, lava | Blueglass Unguent | Fire resistance, armour |
| **Rot** | 5 HP/tick, -5% stats | Until leaving | Graveyards, crypts, undead | Graveyard Balm | Graveyard tea, Favour blessing |
| **Bleed** | 2 HP/tick | 10 ticks | Slashing weapons, traps | Cleanblood Salve | Armour, bandages |
| **Starfall Radiation** | 5 HP/tick, -10% stats | Until leaving | Starfall Crater, starfall zones | Starfall Balm | Starfall armour, Favour blessing |

### Stat Reduction

Stat reduction status effects reduce the player's stats.

| Status | Effect | Duration | Source | Cure | Prevention |
|--------|--------|----------|--------|------|------------|
| **Curse** | -10% all stats | 30 ticks | Cursed items, crypts, wyrms | Argent Wash | Favour blessing, curse resistance |
| **Fear** | Cannot attack, -10% stats | 10 ticks | Bosses, wyrms, drakes | Favour Cordial | Courage, bravery, Favour blessing |
| **Slow** | -20% speed | 30 ticks | Ice, cold, crypts | Road Tea | Warmth, boots, Favour blessing |
| **Weakness** | -10% damage | 30 ticks | Failed brews, curses | Starfall Balm | Strength, Favour blessing |
| **Vulnerability** | +10% damage taken | 30 ticks | Failed brews, curses | Starfall Balm | Guard, Favour blessing |

### Control

Control status effects limit the player's actions.

| Status | Effect | Duration | Source | Cure | Prevention |
|--------|--------|----------|--------|------|------------|
| **Stun** | Cannot move or attack | 3 ticks | Bosses, traps, wyrms | None (wait it out) | Stun resistance, Favour blessing |
| **Paralyse** | Cannot move, can attack | 5 ticks | Wyrm traps, drakes | Cleanblood Salve | Paralyse resistance |
| **Silence** | Cannot cast spells | 10 ticks | Bosses, curses, crypts | Argent Wash | Silence resistance, Favour blessing |
| **Root** | Cannot move, can attack | 5 ticks | Bosses, druids, traps | Road Tea | Root resistance, Favour blessing |
| **Blind** | -50% accuracy | 10 ticks | Bosses, wyrms, crypts | Argent Wash | Blind resistance, Favour blessing |

### Environmental

Environmental status effects come from the world, not from combat.

| Status | Effect | Duration | Source | Cure | Prevention |
|--------|--------|----------|--------|------|------------|
| **Cold** | -10% speed, -5% stats | Until leaving | Cold zones, night, winter | Greenwold Poultice | Warmth, Hearthcraft, clothing |
| **Heat** | -10% stats, 1 HP/tick | Until leaving | Deserts, lava, forges | Blueglass Unguent | Cooling, water, clothing |
| **Hunger** | -5% stats | Until eating | No food for 10 minutes | Any food | Regular eating |
| **Thirst** | -10% speed, -5% stats | Until drinking | No water for 10 minutes | Water, tea | Regular drinking |
| **Exhaustion** | -20% stats, cannot run | Until resting | No rest for 30 minutes | Sleep, rest, bed | Regular rest |

---

## Status Effect Mechanics

### Stacking

- **DoT stacking:** Poison + burn = both damage every tick.
- **Stat reduction stacking:** Curse + fear = -20% stats.
- **Control stacking:** Stun + silence = cannot move, attack, or cast.
- **Environmental stacking:** Cold + hunger = -15% stats, -10% speed.

### Duration

- **Combat statuses:** Last 10-30 ticks unless cured.
- **Environmental statuses:** Last until leaving the area or curing.
- **Cursed items:** Last until the item is removed or the curse is cured.
- **Failed consumables:** Last 10-30 ticks unless cured.

### Cure Priority

- **Instant cures:** Salves, potions, and Favour blessings cure instantly.
- **Action cures:** Some statuses require specific actions (sleep for exhaustion, warmth for cold).
- **Time cures:** Some statuses cure automatically after time (stun, paralyse).

### Prevention

- **Equipment:** Armour, boots, and accessories can prevent specific statuses.
- **Consumables:** Potions, teas, and salves can prevent statuses for 10 minutes.
- **Favour blessings:** Favour blessings can prevent statuses for 10 minutes.
- **Skills:** High Guard reduces poison damage. High Favour reduces curse duration.

---

## Status Effect Identity

### Poison

> Poison is the most common status effect. It comes from poisoned weapons, wyrms, drakes, and swamp gas. The victim feels a burning in their veins, and their health drains away. The cure is Cleanblood Salve, which draws the venom out.

### Curse

> Curse is the most feared status effect. It comes from cursed items, crypts, and wyrms. The victim feels a weight on their soul, and their stats drain away. The cure is Argent Wash, which cleanses the curse.

### Rot

> Rot is the most insidious status effect. It comes from graveyards, crypts, and undead. The victim feels their flesh decay, and their health and stats drain away. The cure is Graveyard Balm, which heals the rot.

### Burn

> Burn is the most painful status effect. It comes from fire, failed cooking, and lava. The victim feels their skin blister, and their health drains away. The cure is Blueglass Unguent, which soothes the burn.

### Starfall Radiation

> Starfall Radiation is the most dangerous status effect. It comes from the Starfall Crater and starfall zones. The victim feels their body unravel, and their health and stats drain away. The cure is Starfall Balm, which is the only cure.

---

## Status Effect Icons

| Status | Icon | Colour | Animation |
|--------|------|--------|-----------|
| Poison | Skull | Green | Pulsing green glow |
| Curse | Eye | Purple | Pulsing purple glow |
| Rot | Bone | Black | Black particles |
| Burn | Flame | Orange | Orange flames |
| Bleed | Droplet | Red | Red droplets |
| Starfall Radiation | Star | Purple | Purple star particles |
| Stun | Star | Yellow | Yellow stars around head |
| Paralyse | Lightning | Blue | Blue lightning |
| Silence | Mouth | Grey | Grey mouth |
| Blind | Eye | Grey | Grey eye |
| Cold | Snowflake | Blue | Blue snowflakes |
| Heat | Sun | Red | Red sun |
| Fear | Ghost | White | White ghost |
| Slow | Snail | Grey | Grey snail |
| Weakness | Down arrow | Red | Red down arrow |
| Vulnerability | Up arrow | Red | Red up arrow |

---

## Status Effect Recipes (JSON Format)

Status effects are defined in JSON content files with the following schema:

```json
{
  "id": "poison",
  "name": "Poison",
  "type": "status",
  "category": "dot",
  "effect": {
    "damage_per_tick": 2,
    "duration": 10,
    "total_damage": 20
  },
  "source": {
    "creatures": ["wyrm", "drake"],
    "weapons": ["poisoned_darts", "poisoned_knives"],
    "environmental": ["swamp_gas"]
  },
  "cure": {
    "item": "cleanblood_salve",
    "instant": true
  },
  "prevention": {
    "items": ["cleanblood_prevention"],
    "blessings": ["favour_blessing_poison"],
    "equipment": ["poison_immunity_amulet"]
  }
}
```

---

## Design Rules

1. **Every status has a source.** Creature, environment, item, or failed consumable.
2. **Every status has a cure.** Salve, potion, blessing, or action.
3. **Every status has a prevention.** Equipment, consumable, or blessing.
4. **Status effects are temporary.** None last forever.
5. **Status effects are stacking.** Some can stack for combined effect.
6. **Status effects are visible.** Icons, colours, and animations.
7. **No pure punishment.** Every status can be cured or prevented.
8. **Content-driven definitions.** Every status effect is defined in JSON content files.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`food.md`](food.md) — Food system
- [`potions.md`](potions.md) — Potion system
- [`brews.md`](brews.md) — Brew system
- [`poisons.md`](poisons.md) — Poison system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`../combat/signature-mechanics.md`](../combat/signature-mechanics.md) — Combat mechanics
- [`../skills/production-skills.md`](../skills/production-skills.md) — Apothecary skill definitions

---

*Total status effects defined: 20+*
*Last updated: 2026-05-30*
