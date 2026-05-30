---
doc_type: authority
canonical_path: docs/consumables/potions.md
parent_index: docs/consumables/00-index.md
system_index: docs/consumables/00-index.md
root_index: docs/00-index.md
---

Parent: [`Consumables Index`](00-index.md)

Authority references:
- `docs/consumables/consumable-system.md`
- `docs/resources/herbs-roots-and-fungi.md`
- `docs/skills/production-skills.md`

# Potions

> **The canonical potion system of Old Town.** Potions are not generic "Health Potion, Strength Potion, Mana Potion." They are tinctures, draughts, tonics, phials, and cordials — grounded in the world of apothecaries, herbs, and glass vials.
>
> **Rule:** No potion may be introduced without a canonical name, an Apothecary level, and a specific effect. Generic potion names are banned.

---

## Potion Naming System

Old Town uses culturally grounded potion names. Each name evokes a specific effect and a specific apothecary tradition.

| Potion Type | Name Pattern | Effect | Example |
|-------------|-------------|--------|---------|
| **Tincture** | Dilute extract, bitter | +3 to a single stat | Arms Tincture |
| **Draught** | Strong, single-serving drink | +3 to a single stat | Might Draught |
| **Tonic** | Medicinal brew | +3 to a single stat | Guard Tonic |
| **Phial** | Small glass bottle | +3 to a single stat | Wit Phial |
| **Cordial** | Sweet, restorative drink | +3 to a single stat | Favour Cordial |
| **Elixir** | Complex, powerful mixture | +3 to a single stat | Vitality Elixir |
| **Bitters** | Bitter, concentrated | +3 to a single stat | Sight Bitters |
| **Salve** | Ointment, rubbed on skin | Cure status | Cleanblood Salve |
| **Wash** | Liquid rinse | Cure status | Argent Wash |
| **Poultice** | Paste, applied to wounds | Heal + restore | Greenwold Poultice |
| **Tea** | Brewed leaves | Utility buff | Road Tea |
| **Oil** | Weapon coating | Damage buff | Carmine Oil |

---

## Stat Potions

Stat potions temporarily boost a combat skill. They are the backbone of the Apothecary economy.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `arms_tincture` | Arms Tincture | +3 Arms | 1 minute | 15 | Ironroot + water | Sharpens the blade hand |
| `might_draught` | Might Draught | +3 Might | 1 minute | 25 | Ironroot + graveyard moss | Swells the muscles |
| `guard_tonic` | Guard Tonic | +3 Guard | 1 minute | 35 | Warden herb + water | Hardens the skin |
| `sight_bitters` | Sight Bitters | +3 Ranged | 1 minute | 45 | Bellflower + warden herb | Sharpens the eye |
| `wit_phial` | Wit Phial | +3 Magic | 1 minute | 55 | Blueglass cap + water | Clears the mind |
| `favour_cordial` | Favour Cordial | +3 Favour | 1 minute | 65 | Warden herb + graveyard moss | Renews the spirit |
| `vitality_elixir` | Vitality Elixir | +3 Vitality | 1 minute | 75 | Bloodroot + warden herb | Steels the body |
| `starfall_philtre` | Starfall Philtre | +5 all stats | 1 minute | 99 | Starfall petal + starfall blood | The ultimate potion |

## Utility Potions

Utility potions restore resources, cure status, or grant utility buffs.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `road_tea` | Road Tea | Restore 50% stamina | Instant | 20 | Greenwold leaf + water | For travellers |
| `cleanblood_salve` | Cleanblood Salve | Cure poison | Instant | 30 | Nightshade + water | Draws out venom |
| `argent_wash` | Argent Wash | Cure curse | Instant | 40 | Silverleaf + water | Cleanses curses |
| `greenwold_poultice` | Greenwold Poultice | Restore 20% stamina + heal 10 HP | Instant | 50 | Greenwold leaf + warden herb | Restores the body |
| `graveyard_balm` | Graveyard Balm | Cure rot | Instant | 60 | Graveyard moss + bloodroot | Heals crypt rot |
| `blueglass_unguent` | Blueglass Unguent | Cure burn | Instant | 70 | Blueglass cap + water | Soothes burns |
| `starfall_balm` | Starfall Balm | Cure all status | Instant | 99 | Starfall petal + starfall blood | The ultimate cure |

## Buff Potions

Buff potions grant temporary combat or skilling buffs.

| Item ID | Name | Effect | Duration | Apothecary Level | Ingredients | Notes |
|---------|------|--------|----------|------------------|-------------|-------|
| `blueglass_tonic` | Blueglass Tonic | +5% precision | 1 minute | 60 | Blueglass cap + water | Focus potion |
| `graveyard_oil` | Graveyard Oil | +5% vs undead | 10 minutes | 70 | Graveyard moss + bloodroot | Weapon coating |
| `carmine_oil` | Carmine Oil | +5% weapon damage | 10 minutes | 80 | Bloodroot + carmine shard | Duelist's oil |
| `warden_oil` | Warden Oil | +5% vs deserters | 10 minutes | 60 | Warden herb + ironroot | Lawful oil |
| `starfall_oil` | Starfall Oil | +10% vs all | 10 minutes | 99 | Starfall petal + starfall blood | Ultimate oil |

---

## Potion Mechanics

### Boost Cap

- Stat potions are limited by the +5 total boost cap (see `docs/skills/skill-system.md`).
- A player with 50 Arms cannot boost above 55 Arms.
- Potions do not stack with food boosts. The higher of the two applies.
- A cape bonus (+1) is always additive after the highest single boost.

### Duration

- Stat potions last 1 minute.
- Buff potions last 1 minute (combat) or 10 minutes (utility).
- Utility potions are instant.
- No potion has a cooldown, but the +5 cap prevents excessive stacking.

### Failure

- Potions can fail during brewing, producing `weak_*` or `spoiled_*` variants.
- Weak potions grant +1 instead of +3.
- Spoiled potions grant no effect and may cause a minor status (nausea: -1 HP/tick for 3 ticks).
- Failure chance decreases with higher Apothecary level.

### Production

- Potions require herbs, water, and glass vials.
- Herbs come from Gardening.
- Water comes from Mining (water sources).
- Glass vials come from Beadwork (glass sand + hearth fire).
- Every potion recipe is defined in JSON content files.

---

## Potion Identity

### Tincture

A tincture is a dilute extract, often bitter. It is the simplest form of potion.

> "The Arms Tincture is a bitter liquid that sharpens the blade hand. It is made from ironroot steeped in water. The apothecary squeezes the root through cloth, and the liquid is bottled in a small glass vial."

### Draught

A draught is a strong, single-serving drink. It is more potent than a tincture.

> "The Might Draught is a thick, red liquid that swells the muscles. It is made from ironroot and graveyard moss, boiled together and strained. The drinker feels the strength surge through their veins."

### Tonic

A tonic is a medicinal brew. It is designed to fortify and protect.

> "The Guard Tonic is a cloudy, grey liquid that hardens the skin. It is made from warden herb and water, boiled and cooled. The drinker feels their skin tighten like leather."

### Phial

A phial is a small glass bottle. It is used for precise, concentrated effects.

> "The Wit Phial is a clear, blue liquid that clears the mind. It is made from blueglass cap and water, distilled to purity. The drinker feels their thoughts sharpen."

### Cordial

A cordial is a sweet, restorative drink. It is designed to renew the spirit.

> "The Favour Cordial is a sweet, golden liquid that renews the spirit. It is made from warden herb and graveyard moss, fermented with honey. The drinker feels their faith restored."

### Salve

A salve is an ointment, rubbed on the skin. It is used for curing status effects.

> "The Cleanblood Salve is a green paste that draws out venom. It is made from nightshade and water, ground into a thick paste. The apothecary rubs it on the wound, and the poison seeps out."

### Wash

A wash is a liquid rinse. It is used for cleansing and purification.

> "The Argent Wash is a silver liquid that cleanses curses. It is made from silverleaf and water, distilled to purity. The drinker rinses their mouth, and the curse fades."

### Oil

An oil is a coating for weapons. It is applied to blades and arrows.

> "The Carmine Oil is a red liquid that makes the blade bite deeper. It is made from bloodroot and carmine shard, ground into oil. The weaponsmith coats the blade, and the weapon thirsts for blood."

---

## Potion Recipes (JSON Format)

Potions are defined in JSON content files with the following schema:

```json
{
  "id": "arms_tincture",
  "name": "Arms Tincture",
  "type": "potion",
  "category": "stat_boost",
  "effect": {
    "stat": "arms",
    "boost": 3,
    "duration": 60
  },
  "requirements": {
    "apothecary": 15,
    "herbs": ["ironroot"],
    "water": 1,
    "vial": 1
  },
  "failure": {
    "weak_boost": 1,
    "spoiled_effect": "nausea"
  }
}
```

---

## Design Rules

1. **No generic names.** `health potion`, `strength potion`, `mana potion`, `antipoison` are banned.
2. **Every potion supports a build.** Arms Tincture supports melee. Wit Phial supports magic. Carmine Oil supports duelists.
3. **Every potion has ingredients.** No potion is self-sufficient. It requires herbs, water, and vials.
4. **Boost cap applies.** Potions are limited by the +5 total boost cap.
5. **Failure chance exists.** Potions can fail, creating weak or spoiled variants.
6. **Content-driven recipes.** Every potion recipe is defined in JSON content files.
7. **Cultural framing.** Every potion has a story: `Cleanblood Salve` draws out venom. `Argent Wash` cleanses curses.
8. **Economy integration.** Every potion requires resources from Gardening, Mining, and Beadwork.

---

## Related Documents

- [`00-index.md`](00-index.md) — Consumables navigation hub
- [`consumable-system.md`](consumable-system.md) — Core consumable authority
- [`food.md`](food.md) — Food system
- [`brews.md`](brews.md) — Brew system
- [`poisons.md`](poisons.md) — Poison system
- [`salves-and-oils.md`](salves-and-oils.md) — Salves and oils
- [`status-effects.md`](status-effects.md) — Status effects
- [`../skills/production-skills.md`](../skills/production-skills.md) — Apothecary skill definitions
- [`../resources/herbs-roots-and-fungi.md`](../resources/herbs-roots-and-fungi.md) — Herb taxonomy

---

*Total potions defined: 20+*
*Last updated: 2026-05-30*
