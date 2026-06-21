---
doc_type: authority
canonical_path: docs/resources/hides-bones-and-trophies.md
parent_index: docs/resources/00-index.md
system_index: docs/resources/00-index.md
root_index: docs/00-index.md
---

Parent: [`Resources Index`](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/skills/gathering-skills.md`
- `docs/skills/production-skills.md`
- `docs/items/resources/crafting.md`

# Hides, Bones, and Trophies

> **The canonical hide, bone, and trophy taxonomy of Old Town.** Every pelt, feather, bone, and trophy in the world is defined here. Trapping produces these. Tailoring, Bowcraft, and Handicraft consume them.
>
> **Rule:** No hide, bone, or trophy may be introduced without a canonical name, a source creature, and at least one production consumer.

---

## The Hide Ladder

Old Town's hide ladder follows a progression from rabbit to drake. Each creature has a place in the ecosystem and a role in the economy.

| Tier | Creature | Hide Name | Trapping Level | Primary Yield | Visual Identity | Economy Role |
|------|----------|-----------|---------------|---------------|-----------------|-------------|
| 0 | Rabbit | Rabbit Hide | 1 | Leather, meat | Soft, grey, small | Starter hide |
| 1 | Bird | Bellfeather | 1 | Feathers, meat | Light, flighty | Arrow fletching |
| 2 | Fox | Fox Hide | 15 | Soft leather | Red, sleek, warm | Low-tier leather |
| 3 | Hare | Hare Pelt | 25 | Swift leather | Brown, fast, lean | Mid-tier leather |
| 4 | Badger | Badger Hide | 35 | Tough leather | Black-white, striped | Durable leather |
| 5 | Wolf | Greywolf Pelt | 45 | Thick fur | Grey, thick, warm | Mid-tier fur |
| 6 | Boar | Boar Hide | 55 | Bristle leather | Brown, bristly, tough | Tough leather |
| 7 | Bear | Blackbear Hide | 65 | Thick hide | Black, massive, heavy | Heavy armour |
| 8 | Wyrm | Wyrm Scale | 75 | Scale leather | Green, scaled, reptilian | Scale armour |
| 9 | Drake | Drakeskin | 85 | Elite hide | Red, leathery, tough | Elite leather |
| 10 | Drake | Drakebone | 85 | Bone | White, heavy, magical | Blueglass firing |
| 11 | Starfall Beast | Starfall Hide | 95 | Mythic hide | Iridescent, cosmic | Endgame leather |
| 12 | Starfall Beast | Starfall Trophy | 99 | Trophy | Iridescent, legendary | Mastery keepsake |

---

## Individual Creature Definitions

### Rabbit

- **Creature:** Rabbit
- **Hide name:** Rabbit Hide
- **Hide item ID:** `rabbit_hide`
- **Meat item ID:** `rabbit_meat`
- **Tier:** 0
- **Trapping level:** 1
- **Visual identity:** Small, grey, soft. Found in meadows and fields.
- **Economy role:** The starting catch for every trapper. Abundant, low value, high volume.
- **Cultural framing:** Found in the meadows around Old Town. The rabbit is small and soft, the first creature a trapper learns to snare.
- **Habitat:** Meadows, fields, gardens
- **Respawn time:** 5 seconds
- **Secondary drops:** Rabbit meat (100%), Rabbit foot (5%)
- **Production consumers:** Tailoring (starter leather), Cooking (rabbit meat)

### Bird (Bellfeather)

- **Creature:** Bird (Bellfeather)
- **Feather name:** Bellfeather
- **Feather item ID:** `bellfeather`
- **Meat item ID:** `bird_meat`
- **Tier:** 1
- **Trapping level:** 5
- **Visual identity:** Light, flighty, colourful. Found in trees and bushes.
- **Economy role:** Feather source. Essential for arrow fletching.
- **Cultural framing:** Named for the bell-shaped feathers they produce. The birds are found in the Bellwood, their feathers prized by fletchers.
- **Habitat:** Trees, bushes, forests
- **Respawn time:** 5 seconds
- **Secondary drops:** Bird meat (100%), Bird eggs (10%)
- **Production consumers:** Bowcraft (arrow fletching), Cooking (bird meat)

### Fox

- **Creature:** Fox
- **Hide name:** Fox Hide
- **Hide item ID:** `fox_hide`
- **Meat item ID:** `fox_meat`
- **Tier:** 2
- **Trapping level:** 15
- **Visual identity:** Red, sleek, warm. Found in woodlands.
- **Economy role:** Soft leather. The first hide that makes decent leather.
- **Cultural framing:** Found in the woodlands around Old Town. The fox is red and sleek, its hide prized for soft leather.
- **Habitat:** Woodlands, forests, edges
- **Respawn time:** 10 seconds
- **Secondary drops:** Fox meat (100%), Fox tail (15%)
- **Production consumers:** Tailoring (soft leather), Cooking (fox meat)

### Greywolf

- **Creature:** Greywolf
- **Hide name:** Greywolf Pelt
- **Hide item ID:** `greywolf_pelt`
- **Meat item ID:** `wolf_meat`
- **Tier:** 5
- **Trapping level:** 45
- **Visual identity:** Grey, thick, warm. Found in the wilds.
- **Economy role:** Thick fur. The first hide that makes warm, durable gear.
- **Cultural framing:** Found in the wilds beyond the town. The greywolf is a predator, its thick pelt prized for warm fur.
- **Habitat:** Wilds, forests, hills
- **Respawn time:** 30 seconds
- **Secondary drops:** Wolf meat (100%), Wolf fang (10%)
- **Production consumers:** Tailoring (thick fur), Cooking (wolf meat), Handicraft (wolf fang charms)

### Blackbear

- **Creature:** Blackbear
- **Hide name:** Blackbear Hide
- **Hide item ID:** `blackbear_hide`
- **Meat item ID:** `bear_meat`
- **Tier:** 7
- **Trapping level:** 65
- **Visual identity:** Black, massive, heavy. Found in the deep forests.
- **Economy role:** Heavy hide. The first hide that makes truly heavy armour.
- **Cultural framing:** Found in the deep forests of the Greenwold. The blackbear is massive and heavy, its hide used for the toughest leather armour.
- **Habitat:** Deep forests, caves
- **Respawn time:** 1 minute
- **Secondary drops:** Bear meat (100%), Bear claw (10%)
- **Production consumers:** Tailoring (heavy hide), Cooking (bear meat), Handicraft (bear claw trophies)

### Wyrm

- **Creature:** Wyrm
- **Hide name:** Wyrm Scale
- **Hide item ID:** `wyrm_scale`
- **Meat item ID:** `wyrm_meat`
- **Tier:** 8
- **Trapping level:** 75
- **Visual identity:** Green, scaled, reptilian. Found in swamps and marshes.
- **Economy role:** Scale leather. The first hide that makes scale armour.
- **Cultural framing:** Found in the swamps and marshes. The wyrm is a scaled reptile, its scales used for unique scale armour.
- **Habitat:** Swamps, marshes, wetlands
- **Respawn time:** 2 minutes
- **Secondary drops:** Wyrm meat (100%), Wyrm venom (10%)
- **Production consumers:** Tailoring (scale armour), Cooking (wyrm meat), Apothecary (wyrm venom)

### Drake

- **Creature:** Drake
- **Hide name:** Drakeskin
- **Hide item ID:** `drake_hide`
- **Bone name:** Drakebone
- **Bone item ID:** `drakebone`
- **Meat item ID:** `drake_meat`
- **Tier:** 9
- **Trapping level:** 85
- **Visual identity:** Red, leathery, tough. Large, winged, reptilian.
- **Economy role:** Elite hide and bone. The top-tier trapping material before Starfall.
- **Cultural framing:** The drake is a smaller, ground-dwelling cousin of the dragon. Found in the highlands, the drake is red and leathery, its hide used for elite leather and its bones for Blueglass firing.
- **Habitat:** Highlands, cliffs, caves
- **Respawn time:** 3 minutes
- **Secondary drops:** Drake meat (100%), Drake blood (10%), Drake trophy (5%)
- **Production consumers:** Tailoring (elite hide), Smithing (drakebone for Blueglass), Cooking (drake meat), Apothecary (drake blood), Handicraft (drake trophies)

### Starfall Beast

- **Creature:** Starfall Beast
- **Hide name:** Starfall Hide
- **Hide item ID:** `starfall_hide`
- **Trophy name:** Starfall Trophy
- **Trophy item ID:** `starfall_trophy`
- **Meat item ID:** `starfall_meat`
- **Tier:** 12
- **Trapping level:** 99
- **Visual identity:** Iridescent, cosmic, legendary. The ultimate creature.
- **Economy role:** Endgame mythic hide and trophy. The ultimate trapping challenge.
- **Cultural framing:** Named for the legend that it was born from a falling star. The beast is iridescent and cosmic, its hide and trophy the most prized in the world.
- **Habitat:** Starfall Crater, mythic zones
- **Respawn time:** 5 minutes
- **Secondary drops:** Starfall meat (100%), Starfall blood (10%), Starfall trophy (20%)
- **Production consumers:** Tailoring (mythic hide), Handicraft (starfall trophies), Cooking (starfall meat), Apothecary (starfall blood)

---

## Feathers and Sinew

### Feathers

| Feather | Source | Trapping Level | Bowcraft Use | Visual Identity |
|---------|--------|---------------|--------------|----------------|
| Bellfeather | Birds | 5 | Arrow fletching | Light, bell-shaped, silver |
| Riverfeather | River birds | 15 | Arrow fletching | Blue, water-resistant, sleek |
| Wardenfeather | Warden birds | 45 | Elite arrow fletching | Dark, aromatic, rare |
| Drakefeather | Drakes | 85 | Master arrow fletching | Red, leathery, tough |

### Sinew

| Sinew | Source | Trapping Level | Bowcraft Use | Visual Identity |
|-------|--------|---------------|--------------|----------------|
| Rabbit sinew | Rabbits | 1 | Basic bowstring | Weak, grey, thin |
| Wolf sinew | Wolves | 45 | Standard bowstring | Strong, white, thick |
| Bear sinew | Bears | 65 | Heavy bowstring | Tough, yellow, durable |
| Drake sinew | Drakes | 85 | Elite bowstring | Red, magical, strong |

---

## Design Rules

1. **No banned names.** `dragon`, `dragon bones`, `dragonhide` are banned. Use `drake`, `drakebone`, `drakeskin`.
2. **Every creature has a habitat.** Every creature lives somewhere in Old Town: meadows, woodlands, deep forests, swamps, highlands.
3. **Every hide has a consumer.** No hide is skinned for its own sake. It must feed Tailoring, Bowcraft, or Handicraft.
4. **Feather and sinew ladders.** Feathers and sinew have their own ladders, separate from hides.
5. **Visual identity.** Every creature and hide has a visual description that guides asset creation.
6. **Cultural framing.** Every creature has a story that connects it to Old Town's world.
7. **Respawn scaling.** Higher-tier creatures have longer respawn times, creating scarcity.

---

## Related Documents

- [`00-index.md`](00-index.md) — Resources navigation hub
- [`resource-taxonomy.md`](resource-taxonomy.md) — Canonical resource names
- [`ores-and-stone.md`](ores-and-stone.md) — Mining resources
- [`woods-and-timber.md`](woods-and-timber.md) — Woodcutting resources
- [`fish-and-cooking.md`](fish-and-cooking.md) — Fishing resources
- [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) — Gardening resources
- [`bead-materials.md`](bead-materials.md) — Beadwork resources
- [`../skills/gathering-skills.md`](../skills/gathering-skills.md) — Trapping skill definitions
- [`../skills/production-skills.md`](../skills/production-skills.md) — Tailoring and Bowcraft skill definitions

---

*Total creatures defined: 10*
*Total hides defined: 10*
*Total feathers defined: 4*
*Total sinews defined: 4*
*Last updated: 2026-05-30*
