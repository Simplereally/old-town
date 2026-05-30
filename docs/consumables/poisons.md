---
doc_type: authority
canonical_path: docs/consumables/poisons.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/resources/herbs-roots-and-fungi.md`
- `docs/skills/production-skills.md`

# Poisons

> **The canonical poison system of Old Town.** Poisons are not just debuffs. They are an economy: Sleight assassins, Wardenry hunters, and ranged combatants all need them. A poisoned weapon is a statement.
>
> **Rule:** No poison may be introduced without a damage value, a duration, and an application method. Poisons are tools of the underworld.

---

## The Poison Philosophy

Poisons are the dark side of the Apothecary. They are not sold in the market. They are traded in back alleys, brewed in hidden workshops, and applied in secret. A poisoner is not a healer. A poisoner is a killer, a hunter, a shadow.

**Design principles:**
1. **Poisons are applied to weapons.** Darts, knives, throwing axes, and arrows can be poisoned.
2. **Poisons deal damage over time.** 2-8 HP per tick for 10 ticks.
3. **Poisons can be cured.** Cleanblood Salve and Argent Wash cure poison.
4. **Some creatures are immune.** Undead, constructs, and Starfall beasts are immune.
5. **Poisons are tradeable.** They are crafted by Apothecary and sold on the black market.
6. **Poisons have levels.** Higher-tier poisons deal more damage and require higher Apothecary levels.

---

## Poison Categories

### Weapon Poisons

Weapon poisons are applied to darts, knives, throwing axes, and arrows.

| Item ID | Name | Damage | Duration | Application | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|-------------|------------------|-------------|-------|
| `blacksalt_venom` | Blacksalt Venom | 2 HP/tick | 10 ticks | Darts, knives | 35 | Nightshade + black salt | Common poison |
| `wyrm_venom` | Wyrm Venom | 4 HP/tick | 10 ticks | Darts, knives | 55 | Wyrm venom + nightshade | Potent poison |
| `drake_venom` | Drake Venom | 6 HP/tick | 10 ticks | Darts, knives | 75 | Drake blood + wyrm venom | Elite poison |
| `starfall_toxin` | Starfall Toxin | 8 HP/tick | 10 ticks | Darts, knives | 95 | Starfall blood + drake venom | Ultimate poison |

### Trap Poisons

Trap poisons are applied to traps for Trapping.

| Item ID | Name | Effect | Duration | Application | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|-------------|------------------|-------------|-------|
| `blacksalt_trap` | Blacksalt Trap Poison | 2 HP/tick, slow | 10 ticks | Traps | 40 | Nightshade + black salt + glue | Trap upgrade |
| `wyrm_trap` | Wyrm Trap Poison | 4 HP/tick, paralyse | 5 ticks | Traps | 60 | Wyrm venom + nightshade + glue | Trap upgrade |
| `drake_trap` | Drake Trap Poison | 6 HP/tick, fear | 5 ticks | Traps | 80 | Drake blood + wyrm venom + glue | Trap upgrade |

### Environmental Poisons

Environmental poisons are found in the world, not crafted.

| Poison | Source | Damage | Duration | Cure | Notes |
|--------|--------|--------|----------|------|-------|
| **Swamp Gas** | Swamps | 1 HP/tick | Until leaving | Cleanblood Salve | Found in Greenwold swamps |
| **Wyrm Spit** | Wyrms | 3 HP/tick | 10 ticks | Cleanblood Salve | Wyrm attack |
| **Drake Breath** | Drakes | 5 HP/tick | 10 ticks | Cleanblood Salve | Drake attack |
| **Crypt Miasma** | Crypts | 2 HP/tick, -5% stats | Until leaving | Graveyard Balm | Found in graveyards |
| **Starfall Radiation** | Starfall Crater | 5 HP/tick, -10% stats | Until leaving | Starfall Balm | Found in Starfall zones |

---

## Poison Mechanics

### Application

- Poisons are applied to weapons by right-clicking the poison and selecting the weapon.
- One poison vial coats 10 weapons (10 darts, 10 knives, etc.).
- Poisoned weapons glow faintly (green for common, red for elite, purple for ultimate).
- Poisoned weapons lose their poison after 10 hits or 10 minutes, whichever comes first.

### Damage

- Poison damage is applied every tick for the duration.
- Poison damage is not reduced by armour or Guard.
- Poison damage is magical damage, not physical damage.
- Poison damage is affected by the victim's Vitality (higher Vitality reduces poison damage).

### Cure

- **Cleanblood Salve:** Cures poison instantly. Requires Apothecary 30.
- **Argent Wash:** Cures poison and curse instantly. Requires Apothecary 40.
- **Starfall Balm:** Cures all status effects instantly. Requires Apothecary 99.
- **Favour Blessing:** Prevents poison for 10 minutes. Requires Favour 50.

### Immunity

- **Undead:** Immune to poison (no blood to poison).
- **Constructs:** Immune to poison (no biology to poison).
- **Starfall Beasts:** Immune to poison (cosmic biology).
- **Wyrms:** Immune to Wyrm Venom (they produce it).
- **Drakes:** Immune to Drake Venom (they produce it).

### Stacking

- Poison does not stack. Reapplying poison resets the duration.
- If a victim is poisoned by a stronger poison, the weaker poison is overwritten.
- If a victim is poisoned by a weaker poison, the stronger poison is unaffected.

---

## Poison Identity

### Blacksalt Venom

> Blacksalt Venom is a common poison made from black salt and nightshade. It is cheap, effective, and easy to make. It is the poison of street thugs, back-alley assassins, and desperate hunters. The venom is black and gritty, and it burns the skin.

### Wyrm Venom

> Wyrm Venom is distilled from wyrm venom. It is more potent than blacksalt, but harder to produce. It is the poison of Wardenry hunters, who use it to kill wyrms before the wyrm can kill them. The venom is green and thick, and it smells of rotting meat.

### Drake Venom

> Drake Venom is extracted from drake blood. It is the most potent common poison. It is expensive and rare, and it is the poison of elite assassins and master hunters. The venom is red and hot, and it steams when exposed to air.

### Starfall Toxin

> Starfall Toxin is the endgame poison. It is made from starfall blood and drake venom. It is said to be able to poison a god. It is the poison of master assassins, who use it to kill targets that cannot be killed by any other means. The toxin is purple and iridescent, and it glows in the dark.

---

## Poison Economy

### Production

- Poisons are crafted by Apothecary. They require herbs, venom, and vials.
- Herbs come from Gardening (nightshade, bloodroot).
- Venom comes from Trapping (wyrm venom, drake blood, starfall blood).
- Vials come from Beadwork (glass sand + hearth fire).

### Trade

- Poisons are tradeable. They are sold on the black market, not in the town market.
- The black market is a hidden NPC shop that requires Sleight 50 to access.
- Poisons are expensive. Blacksalt Venom costs 100 coins. Starfall Toxin costs 10,000 coins.
- Poisons are illegal in some zones. Carrying poison in a town zone may trigger guard confrontation.

### Consumption

- Poisons are consumed by applying them to weapons.
- One poison vial coats 10 weapons.
- Poisoned weapons are consumed in combat (10 hits or 10 minutes).
- Poisoned weapons are tradeable. The poison is visible to the buyer.

---

## Poison Recipes (JSON Format)

Poisons are defined in JSON content files with the following schema:

```json
{
  "id": "blacksalt_venom",
  "name": "Blacksalt Venom",
  "type": "poison",
  "category": "weapon",
  "damage": {
    "per_tick": 2,
    "duration": 10,
    "total": 20
  },
  "application": {
    "weapons": ["darts", "knives", "throwing_axes", "arrows"],
    "charges": 10,
    "duration": 600
  },
  "immunity": ["undead", "constructs", "starfall_beasts"],
  "requirements": {
    "apothecary": 35,
    "herbs": ["nightshade", "black_salt"],
    "vial": 1
  },
  "trade": {
    "legal": false,
    "black_market": true,
    "price": 100
  }
}
```

---

## Design Rules

1. **Every poison has damage and duration.** No poison exists without a clear effect.
2. **Every poison has a cure.** Cleanblood Salve, Argent Wash, or Starfall Balm.
3. **Some creatures are immune.** Undead, constructs, Starfall beasts.
4. **Poisons are tradeable.** But they are illegal in town zones.
5. **Poisons are level-gated.** Higher-tier poisons require higher Apothecary levels.
6. **Poisons are cultural.** Every poison has a story: Blacksalt Venom is street poison. Starfall Toxin is god-killer.
7. **No pure power creep.** Higher-tier poisons are more specialized, not universally better.
8. **Content-driven recipes.** Every poison recipe is defined in JSON content files.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`food.md`](food.md) — Food system
- [`potions.md`](potions.md) — Potion system
- [`brews.md`](brews.md) — Brew system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`status-effects.md`](status-effects.md) — Status effects
- [`../skills/production-skills.md`](../skills/production-skills.md) — Apothecary skill definitions
- [`../resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) — Herb taxonomy
- [`../resources/hides-bones-and-trophies.md`](../resources/hides-bones-and-trophies.md) — Venom taxonomy

---

*Total poisons defined: 10+*
*Last updated: 2026-05-30*
