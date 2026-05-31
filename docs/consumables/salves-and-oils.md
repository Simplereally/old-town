---
doc_type: authority
canonical_path: docs/consumables/salves-and-oils.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/resources/herbs-roots-and-fungi.md`
- `docs/skills/production-skills.md`
- `docs/favour/favour-items.md`

# Salves and Oils

> **The canonical salve and oil system of Old Town.** Salves cure status effects. Oils coat weapons with buffs. They are the practical, everyday side of the Apothecary — not as dramatic as brews or poisons, but just as essential.
>
> **Rule:** No salve or oil may be introduced without a specific effect, a target (player or weapon), and a duration.

---

## Salves

Salves are ointments, pastes, and balms applied to the player. They cure status effects and restore health or stamina.

### Cure Salves

Cure salves remove specific status effects.

| Item ID | Name | Cures | Apothecary Level | Ingredients | Notes |
|---------|------|-------|------------------|-------------|-------|
| `cleanblood_salve` | Cleanblood Salve | Poison | 30 | Nightshade + water | Draws out venom |
| `argent_wash` | Argent Wash | Curse | 40 | Silverleaf + water | Cleanses curses |
| `graveyard_balm` | Graveyard Balm | Rot | 60 | Graveyard moss + bloodroot | Heals crypt rot |
| `blueglass_unguent` | Blueglass Unguent | Burn | 70 | Blueglass cap + water | Soothes burns |
| `starfall_balm` | Starfall Balm | All status | 99 | Starfall petal + starfall blood | The ultimate cure |

### Restore Salves

Restore salves heal HP or restore stamina.

| Item ID | Name | Effect | Apothecary Level | Ingredients | Notes |
|---------|------|--------|------------------|-------------|-------|
| `greenwold_poultice` | Greenwold Poultice | Restore 20% stamina + heal 10 HP | 50 | Greenwold leaf + warden herb | Restores the body |
| `warden_salve` | Warden Salve | Heal 20 HP | 45 | Warden herb + water | Battlefield medicine |
| `ironroot_paste` | Ironroot Paste | Heal 15 HP | 25 | Ironroot + water | Basic healing |
| `graveyard_poultice` | Graveyard Poultice | Heal 25 HP + cure rot | 65 | Graveyard moss + bloodroot | Crypt medicine |
| `carmine_balm` | Carmine Balm | Heal 30 HP + +5% damage | 80 | Bloodroot + carmine shard | Duelist's balm |
| `starfall_salve` | Starfall Salve | Heal 50 HP + cure all | 99 | Starfall petal + starfall blood | Ultimate healing |

### Preventive Salves

Preventive salves grant immunity to status effects.

| Item ID | Name | Prevents | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|----------|----------|------------------|-------------|-------|
| `cleanblood_prevention` | Cleanblood Prevention | Poison | 10 minutes | 40 | Nightshade + warden herb | Poison immunity |
| `argent_prevention` | Argent Prevention | Curse | 10 minutes | 50 | Silverleaf + warden herb | Curse immunity |
| `graveyard_prevention` | Graveyard Prevention | Rot | 10 minutes | 70 | Graveyard moss + bloodroot | Rot immunity |
| `starfall_prevention` | Starfall Prevention | All status | 10 minutes | 99 | Starfall petal + starfall blood | Status immunity |

---

## Oils

Oils are coatings applied to weapons. They grant combat buffs.

### Weapon Oils

Weapon oils buff damage against specific targets or grant general damage boosts.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `carmine_oil` | Carmine Oil | +5% weapon damage | 10 minutes | 80 | Bloodroot + carmine shard | Duelist's oil |
| `graveyard_oil` | Graveyard Oil | +5% vs undead | 10 minutes | 70 | Graveyard moss + bloodroot | Crypt hunter's oil |
| `warden_oil` | Warden Oil | +5% vs deserters | 10 minutes | 60 | Warden herb + ironroot | Lawful oil |
| `blueglass_oil` | Blueglass Oil | +5% vs golems | 10 minutes | 50 | Blueglass cap + water | Golem hunter's oil |
| `greenwold_oil` | Greenwold Oil | +5% vs beasts | 10 minutes | 40 | Greenwold leaf + water | Hunter's oil |
| `starfall_oil` | Starfall Oil | +10% vs all | 10 minutes | 99 | Starfall petal + starfall blood | Ultimate oil |

### Ammo Oils

Ammo oils are applied to arrows, bolts, and darts.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `carmine_arrow_oil` | Carmine Arrow Oil | +5% arrow damage | 10 minutes | 80 | Bloodroot + carmine shard | Ranged duelist |
| `graveyard_arrow_oil` | Graveyard Arrow Oil | +5% vs undead | 10 minutes | 70 | Graveyard moss + bloodroot | Ranged crypt hunter |
| `starfall_arrow_oil` | Starfall Arrow Oil | +10% vs all | 10 minutes | 99 | Starfall petal + starfall blood | Ranged ultimate |

### Armour Oils

Armour oils are applied to armour for defensive buffs.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `warden_armour_oil` | Warden Armour Oil | +5% Guard | 10 minutes | 60 | Warden herb + ironroot | Defensive oil |
| `graveyard_armour_oil` | Graveyard Armour Oil | +5% vs undead | 10 minutes | 70 | Graveyard moss + bloodroot | Crypt defender |
| `starfall_armour_oil` | Starfall Armour Oil | +10% all defence | 10 minutes | 99 | Starfall petal + starfall blood | Ultimate defence |

---

## Salve and Oil Mechanics

### Application

- **Salves:** Applied to the player by right-clicking. Instant effect.
- **Oils:** Applied to weapons by right-clicking the oil and selecting the weapon. 10-minute duration.
- **Stacking:** Salves and oils do not stack. Reapplying overwrites the previous effect.
- **Duration:** Oils last 10 minutes. Salves are instant.
- **Cooldown:** No cooldown for salves or oils.

### Production

- Salves and oils are crafted by Apothecary.
- Salves require herbs, water, and wax.
- Favour-facing salves and washes also feed shrine cleanse loops.
- Oils require herbs, oil base (from Trapping or Cooking), and wax.
- Oil base comes from animal fat (bear fat, drake fat) or plant oil (olive oil, nut oil).

### Trade

- Salves are legal and sold in the market.
- Oils are legal and sold in the market.
- Both are tradeable and stackable (up to 28 per slot).

---

## Salve and Oil Identity

### Cleanblood Salve

> Cleanblood Salve is a green paste that draws out venom. It is made from nightshade and water, ground into a thick paste. The apothecary rubs it on the wound, and the poison seeps out. It is the standard battlefield medicine for poisoned soldiers.

### Argent Wash

> Argent Wash is a silver liquid that cleanses curses. It is made from silverleaf and water, distilled to purity. The drinker rinses their mouth, and the curse fades. It is used by Favour priests to cleanse the faithful.

### Carmine Oil

> Carmine Oil is a red liquid that makes the blade bite deeper. It is made from bloodroot and carmine shard, ground into oil. The weaponsmith coats the blade, and the weapon thirsts for blood. It is the duelist's oil, used by Carmine Steel fighters.

### Graveyard Oil

> Graveyard Oil is a black liquid that wards off undead. It is made from graveyard moss and bloodroot, ground into oil. The weaponsmith coats the blade, and the weapon glows faintly in the dark. It is the crypt hunter's oil, used by Gravebound fighters.

### Starfall Oil

> Starfall Oil is a purple liquid that unlocks the weapon's full potential. It is made from starfall petals and starfall blood, ground into oil. The weaponsmith coats the blade, and the weapon glows with cosmic light. It is the ultimate oil, used by master fighters.

---

## Salve and Oil Recipes (JSON Format)

Salves and oils are defined in JSON content files with the following schema:

```json
{
  "id": "cleanblood_salve",
  "name": "Cleanblood Salve",
  "type": "salve",
  "category": "cure",
  "effect": {
    "cure": "poison",
    "instant": true
  },
  "requirements": {
    "apothecary": 30,
    "herbs": ["nightshade"],
    "water": 1,
    "wax": 1
  }
}
```

```json
{
  "id": "carmine_oil",
  "name": "Carmine Oil",
  "type": "oil",
  "category": "weapon",
  "effect": {
    "damage_boost": 0.05,
    "duration": 600,
    "target": "weapon"
  },
  "requirements": {
    "apothecary": 80,
    "herbs": ["bloodroot", "carmine_shard"],
    "oil_base": 1,
    "wax": 1
  }
}
```

---

## Design Rules

1. **Every salve has a cure.** No salve exists without a specific status to cure.
2. **Every oil has a buff.** No oil exists without a specific combat buff.
3. **Salves are instant.** Oils have duration.
4. **No stacking.** Salves and oils do not stack. Reapplying overwrites.
5. **Legal trade.** Salves and oils are legal and sold in the market.
6. **Content-driven recipes.** Every salve and oil recipe is defined in JSON content files.
7. **Cultural framing.** Every salve and oil has a story: `Cleanblood Salve` draws out venom. `Carmine Oil` makes the blade thirst.
8. **Economy integration.** Every salve and oil requires resources from Gardening, Mining, and Trapping.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`food.md`](food.md) — Food system
- [`potions.md`](potions.md) — Potion system
- [`brews.md`](brews.md) — Brew system
- [`poisons.md`](poisons.md) — Poison system
- [`status-effects.md`](status-effects.md) — Status effects
- [`../favour/favour-items.md`](../favour/favour-items.md) — Favour items and cordials
- [`../skills/production-skills.md`](../skills/production-skills.md) — Apothecary skill definitions
- [`../resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) — Herb taxonomy

---

*Total salves defined: 15+*
*Total oils defined: 12+*
*Last updated: 2026-05-30*
