---
doc_type: authority
canonical_path: docs/consumables/brews.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/resources/herbs-roots-and-fungi.md`
- `docs/skills/production-skills.md`

# Brews

> **The canonical brew system of Old Town.** Brews are the dangerous edge of consumables. They are not for everyday use. They are for desperate moments, boss fights, and duels. Every brew has a powerful primary effect and a punishing downside.
>
> **Rule:** No brew may be introduced without a primary effect, a downside, and a backfire chance. Brews are the riskiest consumables in the game.

---

## The Brew Philosophy

Brews are not potions. Potions are safe, reliable, and repeatable. Brews are volatile, dangerous, and transformative. A brewer is not an apothecary. A brewer is an alchemist, a gambler, a seeker of forbidden power.

**Design principles:**
1. **Every brew has a tradeoff.** The primary effect is powerful. The downside is punishing.
2. **Brews have backfire chance.** 10% chance to apply the downside without the benefit.
3. **Brews are non-stackable.** Each brew takes one inventory slot.
4. **Brews have cooldown.** 5 minutes between brews. Cannot chain brews.
5. **Brews are rare.** Expensive ingredients, high failure rate, limited supply.
6. **Brews are cultural.** The Blacksealed Brew is sealed with wax. The Starfall Brew is brewed under a falling star.

---

## Brew Categories

### Combat Brews

Combat brews boost damage, defence, or stats for a short duration, then crash.

| Item ID | Name | Primary Effect | Downside | Duration | Backfire | Apothecary Level | Ingredients |
|---------|------|---------------|----------|----------|----------|------------------|-------------|
| `blacksealed_brew` | Blacksealed Brew | +5 all stats | -5 all stats after duration | 30 seconds | 10% | 50 | Blackcoal + warden herb + graveyard moss |
| `wyrm_brew` | Wyrm Brew | +10% poison damage | -10% healing received | 30 seconds | 10% | 70 | Wyrm venom + bloodroot + water |
| `carmine_brew` | Carmine Brew | +15% damage in duels | -15% damage in group PvP | 30 seconds | 10% | 80 | Bloodroot + carmine shard + water |
| `starfall_brew` | Starfall Brew | +20% all stats | -20% all stats after duration | 30 seconds | 15% | 99 | Starfall petal + starfall blood + starfall ore |

### Utility Brews

Utility brews grant movement, exploration, or skilling buffs, then crash.

| Item ID | Name | Primary Effect | Downside | Duration | Backfire | Apothecary Level | Ingredients |
|---------|------|---------------|----------|----------|----------|------------------|-------------|
| `road_brew` | Road Brew | +50% stamina, +20% speed | -50% stamina, -20% speed after duration | 30 seconds | 10% | 60 | Greenwold leaf + warden herb + water |
| `graveyard_brew` | Graveyard Brew | +10% vs undead, +5% xp in crypts | -10% vs living, -5% xp outside crypts | 30 seconds | 10% | 65 | Graveyard moss + bloodroot + water |
| `market_brew` | Market Brew | +20% haggling, +10% trade profit | -20% haggling, -10% trade profit after duration | 30 seconds | 10% | 55 | Bellflower + warden herb + water |

### Ritual Brews

Ritual brews grant Favour, Magic, or spiritual buffs, then crash.

| Item ID | Name | Primary Effect | Downside | Duration | Backfire | Apothecary Level | Ingredients |
|---------|------|---------------|----------|----------|----------|------------------|-------------|
| `favour_brew` | Favour Brew | +50 Favour points, +10% Favour xp | -50 Favour points, -10% Favour xp after duration | 30 seconds | 10% | 75 | Warden herb + graveyard moss + starfall pollen |
| `wit_brew` | Wit Brew | +10% Magic accuracy, +5% bead damage | -10% Magic accuracy, -5% bead damage after duration | 30 seconds | 10% | 85 | Blueglass cap + starfall petal + water |
| `starfall_ritual_brew` | Starfall Ritual Brew | +30% all stats, +50 Favour | -30% all stats, -50 Favour after duration | 30 seconds | 15% | 99 | Starfall petal + starfall blood + starfall ore + warden herb |

---

## Brew Mechanics

### Tradeoffs

Every brew has a primary effect and a downside. The downside activates after the primary effect expires.

- **Blacksealed Brew:** +5 all stats for 30 seconds, then -5 all stats for 30 seconds.
- **Wyrm Brew:** +10% poison damage for 30 seconds, then -10% healing received for 30 seconds.
- **Carmine Brew:** +15% damage in duels for 30 seconds, then -15% damage in group PvP for 30 seconds.
- **Starfall Brew:** +20% all stats for 30 seconds, then -20% all stats for 30 seconds.

### Backfire

Brews have a backfire chance. If a brew backfires, the downside is applied immediately, without the primary effect.

- Standard backfire chance: 10%.
- Starfall Brew backfire chance: 15%.
- Backfire chance decreases with higher Apothecary level (max -5% reduction).
- Backfire chance increases with lower-quality ingredients.

### Cooldown

Brews have a 5-minute cooldown. Cannot chain brews.

- The cooldown starts when the brew is consumed.
- Cannot consume another brew until the cooldown expires.
- The cooldown is player-wide, not per-brew.

### Non-Stackable

Brews are non-stackable items. Each brew takes one inventory slot.

- This limits the number of brews a player can carry.
- Creates inventory pressure: brews vs. food vs. potions.
- Encourages strategic choice, not mindless stacking.

### Production

Brews require rare ingredients and high Apothecary levels.

- Blacksealed Brew: Apothecary 50, common ingredients.
- Wyrm Brew: Apothecary 70, wyrm venom (rare).
- Carmine Brew: Apothecary 80, carmine shard (rare).
- Starfall Brew: Apothecary 99, starfall ingredients (mythic).

---

## Brew Identity

### Blacksealed Brew

> The Blacksealed Brew is a sealed bottle of black liquid. The seal must be broken to drink. The power is great, but the crash is hard. It is the signature brew of the Blacksealed Bandits, who use it to win ambushes and then flee before the crash.

### Wyrm Brew

> The Wyrm Brew is distilled from wyrm venom. It turns the drinker's blood to poison, but poisons their own healing. It is used by Wardenry hunters who need to kill wyrms quickly, and by Sleight assassins who need to ensure their target dies.

### Carmine Brew

> The Carmine Brew is the duelist's drink. It sharpens the mind for one-on-one combat, but dulls it for group fights. It is brewed with bloodroot and carmine shard, and it is said to make the drinker see their opponent's every move.

### Starfall Brew

> The Starfall Brew is the endgame brew. It unlocks the drinker's full potential, but leaves them shattered afterwards. It is brewed under a falling star, with starfall petals, blood, and ore. It is said to be able to turn a farmer into a warrior, and a warrior into a god.

### Road Brew

> The Road Brew is for travellers. It grants the stamina of a horse and the speed of a deer, but leaves the drinker exhausted afterwards. It is brewed with greenwold leaf and warden herb, and it is the favourite of Wayfarers and Cartographers.

### Graveyard Brew

> The Graveyard Brew is for crypt hunters. It makes the drinker deadly to undead, but weak to the living. It is brewed with graveyard moss and bloodroot, and it is the signature brew of the Gravebound.

### Favour Brew

> The Favour Brew is for shrine keepers. It grants Favour points and boosts Favour xp, but drains them afterwards. It is brewed with warden herb, graveyard moss, and starfall pollen, and it is used by Favour priests to maintain their shrines.

---

## Brew Recipes (JSON Format)

Brews are defined in JSON content files with the following schema:

```json
{
  "id": "blacksealed_brew",
  "name": "Blacksealed Brew",
  "type": "brew",
  "category": "combat",
  "effect": {
    "primary": "+5 all stats",
    "duration": 30,
    "downside": "-5 all stats",
    "downside_duration": 30
  },
  "backfire": {
    "chance": 0.10,
    "effect": "downside_only"
  },
  "cooldown": 300,
  "requirements": {
    "apothecary": 50,
    "herbs": ["blackcoal", "warden_herb", "graveyard_moss"],
    "water": 1,
    "vial": 1
  }
}
```

---

## Design Rules

1. **Every brew has a tradeoff.** Primary effect + downside. No free power.
2. **Every brew has backfire chance.** 10% standard, 15% for Starfall.
3. **Brews are non-stackable.** Each brew takes one inventory slot.
4. **Brews have cooldown.** 5 minutes. Cannot chain.
5. **Brews are rare.** Expensive ingredients, high failure rate.
6. **Brews are cultural.** Every brew has a story and a faction.
7. **No pure power creep.** Higher-tier brews are more specialized, not universally better.
8. **Content-driven recipes.** Every brew recipe is defined in JSON content files.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`food.md`](food.md) — Food system
- [`potions.md`](potions.md) — Potion system
- [`poisons.md`](poisons.md) — Poison system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`status-effects.md`](status-effects.md) — Status effects
- [`../skills/production-skills.md`](../skills/production-skills.md) — Apothecary skill definitions
- [`../resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) — Herb taxonomy

---

*Total brews defined: 10*
*Last updated: 2026-05-30*
