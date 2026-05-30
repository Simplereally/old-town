---
doc_type: authority
canonical_path: docs/resources/fish-and-cooking.md
parent_index: docs/resources/00-index.md
system_index: docs/resources/00-index.md
root_index: docs/00-index.md
---

Parent: [`Resources Index`](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/skills/gathering-skills.md`
- `docs/skills/production-skills.md`
- `docs/items/resources/fish.md`
- `docs/items/consumables/food.md`

# Fish and Cooking

> **The canonical fish and food taxonomy of Old Town.** Every fish, eel, shellfish, and prepared dish in the world is defined here. Fishing produces raw fish. Cooking produces edible food.
>
> **Rule:** No fish or food item may be introduced without a canonical name, a tier position, and at least one healing value or production consumer.

---

## The Fish Ladder

Old Town's fish ladder follows a progression from ditch shrimp to starfall crab. Each fish has a place in the ecosystem and a role in the economy.

| Tier | Cultural Name | Fish Name | Fishing Level | Cooking Level | Heals (HP) | Fishing XP | Visual Identity | Economy Role |
|------|---------------|-----------|--------------|--------------|-----------|-----------|-----------------|-------------|
| 0 | Cobbled | Ditch Shrimp | 1 | 1 | 3 | 10 | Tiny, translucent, grey | Starter catch |
| 1 | Pennywrought | Tinfin | 5 | 5 | 5 | 15 | Small, silver, tin-coloured | Early coastal |
| 2 | Pig Iron | Bell Herring | 10 | 10 | 7 | 20 | Medium, silver, bell-shaped | Market staple |
| 3 | Bellmetal | Brook Trout | 20 | 20 | 9 | 30 | Small, spotted, river-dwelling | First river fish |
| 4 | Blackbar | River Eel | 30 | 30 | 11 | 40 | Long, brown, slippery | River delicacy |
| 5 | Wardensteel | Redback Salmon | 40 | 40 | 13 | 50 | Medium, red-striped, migratory | Mid-tier river |
| 6 | Greenwold | Green Trout | 50 | 50 | 15 | 60 | Green-tinged, rare | Woodland river |
| 7 | Graveiron | Rockclaw | 60 | 60 | 18 | 70 | Large, clawed, shelled | First profitable |
| 8 | Blueglass | Deepwater Eel | 70 | 70 | 22 | 80 | Long, translucent, deep-sea | Mid-tier ocean |
| 9 | Carmine Steel | Glass Eel | 80 | 80 | 26 | 100 | Translucent, blue-veined | High-tier ocean |
| 10 | Argent | Argent Ray | 85 | 85 | 28 | 115 | Flat, silver, luminous | Near-mastery |
| 11 | Crownsteel | Crown Turtle | 90 | 90 | 30 | 120 | Large, slow, valuable | Rare delicacy |
| 12 | Starfall | Starfall Crab | 95 | 95 | 32 | 130 | Deep-sea, iridescent, cosmic | Endgame catch |

---

## Individual Fish Definitions

### Ditch Shrimp

- **Canonical name:** Ditch Shrimp
- **Raw Item ID:** `raw_ditch_shrimp`
- **Cooked Item ID:** `cooked_ditch_shrimp`
- **Tier:** 0
- **Fishing level:** 1
- **Cooking level:** 1
- **Heals:** 3 HP
- **Visual identity:** Tiny, translucent, grey. Found in ditches and shallow pools.
- **Economy role:** The starting catch for every angler. Abundant, low value, high volume.
- **Cultural framing:** Found in the ditches and shallow pools around Old Town. The shrimp are tiny and grey, barely worth catching, but they teach the basics.
- **Fishing spot:** Ditches, shallow pools
- **Bait:** None
- **Cooking method:** Fire
- **Burn chance:** 5%
- **Production consumers:** Cooking (food), Handicraft (shells)

### Tinfin

- **Canonical name:** Tinfin
- **Raw Item ID:** `raw_tinfin`
- **Cooked Item ID:** `cooked_tinfin`
- **Tier:** 1
- **Fishing level:** 5
- **Cooking level:** 5
- **Heals:** 5 HP
- **Visual identity:** Small, silver, tin-coloured. Found in coastal waters.
- **Economy role:** Early coastal fish. Slightly better than shrimp.
- **Cultural framing:** Named for its tin-coloured scales. The fish is small and silver, found in the coastal waters near the Tinworks.
- **Fishing spot:** Coastal waters
- **Bait:** None
- **Cooking method:** Fire
- **Burn chance:** 10%
- **Production consumers:** Cooking (food)

### Bell Herring

- **Canonical name:** Bell Herring
- **Raw Item ID:** `raw_bell_herring`
- **Cooked Item ID:** `cooked_bell_herring`
- **Tier:** 2
- **Fishing level:** 10
- **Cooking level:** 10
- **Heals:** 7 HP
- **Visual identity:** Medium, silver, bell-shaped. Found in coastal waters.
- **Economy role:** Common market fish. The staple of the early fishing economy.
- **Cultural framing:** Named for the bell-shaped silver schools they swim in. The herring is the backbone of the coastal economy.
- **Fishing spot:** Coastal waters, harbours
- **Bait:** None
- **Cooking method:** Fire
- **Burn chance:** 12%
- **Production consumers:** Cooking (food), Market (trade)

### Brook Trout

- **Canonical name:** Brook Trout
- **Raw Item ID:** `raw_brook_trout`
- **Cooked Item ID:** `cooked_brook_trout`
- **Tier:** 3
- **Fishing level:** 20
- **Cooking level:** 20
- **Heals:** 9 HP
- **Visual identity:** Small, spotted, river-dwelling. Found in brooks and streams.
- **Economy role:** First river fish. Requires a fly rod.
- **Cultural framing:** Found in the brooks and streams of the Greenwold. The trout is small and spotted, a favourite of anglers.
- **Fishing spot:** Brooks, streams
- **Bait:** Feather
- **Cooking method:** Fire
- **Burn chance:** 15%
- **Production consumers:** Cooking (food)

### River Eel

- **Canonical name:** River Eel
- **Raw Item ID:** `raw_river_eel`
- **Cooked Item ID:** `cooked_river_eel`
- **Tier:** 4
- **Fishing level:** 30
- **Cooking level:** 30
- **Heals:** 11 HP
- **Visual identity:** Long, brown, slippery. Found in rivers.
- **Economy role:** River delicacy. Valued for its rich, oily flesh.
- **Cultural framing:** Found in the Wardenbrook. The eel is long and slippery, prized by cooks for its rich flavour.
- **Fishing spot:** Rivers
- **Bait:** Worm
- **Cooking method:** Fire
- **Burn chance:** 18%
- **Production consumers:** Cooking (food, eel broth)

### Redback Salmon

- **Canonical name:** Redback Salmon
- **Raw Item ID:** `raw_redback_salmon`
- **Cooked Item ID:** `cooked_redback_salmon`
- **Tier:** 5
- **Fishing level:** 40
- **Cooking level:** 40
- **Heals:** 13 HP
- **Visual identity:** Medium, red-striped, migratory. Found in rivers.
- **Economy role:** Mid-tier river fish. Better healing than trout.
- **Cultural framing:** Named for the red stripe along its back. The salmon migrates up the Wardenbrook to spawn.
- **Fishing spot:** Rivers, salmon runs
- **Bait:** Feather
- **Cooking method:** Fire
- **Burn chance:** 20%
- **Production consumers:** Cooking (food, salmon pies)

### Rockclaw

- **Canonical name:** Rockclaw
- **Raw Item ID:** `raw_rockclaw`
- **Cooked Item ID:** `cooked_rockclaw`
- **Tier:** 7
- **Fishing level:** 60
- **Cooking level:** 60
- **Heals:** 18 HP
- **Visual identity:** Large, clawed, shelled. Found in ocean shallows.
- **Economy role:** First profitable ocean catch. The inflection point for fishing wealth.
- **Cultural framing:** Named for its rock-hard claws. The crab is large and shelled, found in the rocky shallows of the coast.
- **Fishing spot:** Ocean shallows, rocky coasts
- **Bait:** Lobster pot
- **Cooking method:** Fire
- **Burn chance:** 25%
- **Production consumers:** Cooking (food, crab cakes)

### Deepwater Eel

- **Canonical name:** Deepwater Eel
- **Raw Item ID:** `raw_deepwater_eel`
- **Cooked Item ID:** `cooked_deepwater_eel`
- **Tier:** 8
- **Fishing level:** 70
- **Cooking level:** 70
- **Heals:** 22 HP
- **Visual identity:** Long, translucent, deep-sea. Found in deep ocean.
- **Economy role:** Mid-tier ocean staple. The backbone of the ocean fishing economy.
- **Cultural framing:** Named for its habitat in the deep waters off the coast. The eel is translucent and long, a deep-sea delicacy.
- **Fishing spot:** Deep ocean
- **Bait:** Harpoon
- **Cooking method:** Fire
- **Burn chance:** 28%
- **Production consumers:** Cooking (food, eel broth)

### Glass Eel

- **Canonical name:** Glass Eel
- **Raw Item ID:** `raw_glass_eel`
- **Cooked Item ID:** `cooked_glass_eel`
- **Tier:** 9
- **Fishing level:** 80
- **Cooking level:** 80
- **Heals:** 26 HP
- **Visual identity:** Translucent, blue-veined, glass-like. Found in deep ocean.
- **Economy role:** High-tier ocean catch. The fish version of Blueglass.
- **Cultural framing:** Named for its translucent, glass-like body. The eel is blue-veined and almost see-through, a rare delicacy.
- **Fishing spot:** Deep ocean, glass waters
- **Bait:** Harpoon
- **Cooking method:** Fire
- **Burn chance:** 30%
- **Production consumers:** Cooking (food, glass eel broth), Handicraft (glass eel scales)

### Argent Ray

- **Canonical name:** Argent Ray
- **Raw Item ID:** `raw_argent_ray`
- **Cooked Item ID:** `cooked_argent_ray`
- **Tier:** 10
- **Fishing level:** 85
- **Cooking level:** 85
- **Heals:** 28 HP
- **Visual identity:** Flat, silver, luminous. Found in elite ocean waters.
- **Economy role:** Near-mastery flatfish. Elite healing.
- **Cultural framing:** Named for its silver, luminous body. The ray is flat and wide, gliding through the deep waters like a silver coin.
- **Fishing spot:** Elite ocean, deep waters
- **Bait:** Harpoon
- **Cooking method:** Fire
- **Burn chance:** 32%
- **Production consumers:** Cooking (food, ray steaks)

### Crown Turtle

- **Canonical name:** Crown Turtle
- **Raw Item ID:** `raw_crown_turtle`
- **Cooked Item ID:** `cooked_crown_turtle`
- **Tier:** 11
- **Fishing level:** 90
- **Cooking level:** 90
- **Heals:** 30 HP
- **Visual identity:** Large, slow, valuable. Found in rare waters.
- **Economy role:** Rare and valuable. The crown jewel of fishing.
- **Cultural framing:** Named for the crown-shaped pattern on its shell. The turtle is large and slow, found only in the rarest waters.
- **Fishing spot:** Rare waters, hidden coves
- **Bait:** Special bait
- **Cooking method:** Fire
- **Burn chance:** 35%
- **Production consumers:** Cooking (food, crown turtle soup)

### Starfall Crab

- **Canonical name:** Starfall Crab
- **Raw Item ID:** `raw_starfall_crab`
- **Cooked Item ID:** `cooked_starfall_crab`
- **Tier:** 12
- **Fishing level:** 95
- **Cooking level:** 95
- **Heals:** 32 HP
- **Visual identity:** Deep-sea, iridescent, cosmic. The ultimate catch.
- **Economy role:** Endgame deep-sea catch. The ultimate fishing challenge.
- **Cultural framing:** Named for the legend that it was born from a falling star. The crab is iridescent and cosmic, found only in the deepest trenches.
- **Fishing spot:** Deep trenches, starfall waters
- **Bait:** Starfall bait
- **Cooking method:** Fire
- **Burn chance:** 38%
- **Production consumers:** Cooking (food, starfall crab cakes), Handicraft (starfall shells)

---

## Old Town Food Identity

Old Town food is not generic fantasy fare. It is rooted in the world: market food, road food, workshop food, and ritual food.

### Market Food

- **Hand pies** — portable, two-bite food for travellers
- **Market stew** — sold in bowls at the town market
- **Bellbread** — the staple bread of Old Town, baked with bell flour
- **Warden ration** — dried, preserved food for wardens on contract

### Workshop Food

- **Eel broth** — hearty broth made from river eels, served at workshops
- **Crab cakes** — made from rockclaw, served at the coastal workshops
- **Graveyard tea** — strong tea brewed with graveyard moss, served at the forge

### Ritual Food

- **Crown turtle soup** — served at royal and master ceremonies
- **Starfall crab cakes** — served at the endgame feast
- **Salmon pie** — traditional festival food, made with redback salmon

### Cooking Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Bake** | Cook in an oven | "Bake the bellbread in the workshop oven" |
| **Stew** | Simmer in a pot | "Stew the rockclaw with warden herbs" |
| **Broil** | Cook over open flame | "Broil the glass eel on the hearth" |
| **Fry** | Cook in oil | "Fry the ditch shrimp in warden oil" |
| **Preserve** | Salt, smoke, or pickle | "Preserve the salmon for the winter" |

---

## Design Rules

1. **No banned names.** `shark`, `swordfish`, `manta ray`, `sea turtle`, `dark crab`, `lobster` are banned. Use the canonical names above.
2. **Every fish has a place.** Every fish has a named habitat: Wardenbrook, coastal waters, deep ocean, starfall trenches.
3. **Every fish has a consumer.** No fish is caught for its own sake. It must feed Cooking or Handicraft.
4. **Healing scaling.** Higher-tier fish heal more HP. The scaling is roughly linear with tier.
5. **Burn chance scaling.** Higher-tier fish have higher burn chance, creating risk/reward.
6. **Visual identity.** Every fish has a visual description that guides asset creation.
7. **Cultural framing.** Every fish has a story that connects it to Old Town's world.

---

## Related Documents

- [`00-index.md`](00-index.md) — Resources navigation hub
- [`resource-taxonomy.md`](resource-taxonomy.md) — Canonical resource names
- [`ores-and-stone.md`](ores-and-stone.md) — Mining resources
- [`woods-and-timber.md`](woods-and-timber.md) — Woodcutting resources
- [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) — Trapping resources
- [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) — Gardening resources
- [`bead-materials.md`](bead-materials.md) — Beadwork resources
- [`../skills/gathering-skills.md`](../skills/gathering-skills.md) — Fishing skill definitions
- [`../skills/production-skills.md`](../skills/production-skills.md) — Cooking skill definitions

---

*Total fish defined: 13*
*Total food types: 13*
*Last updated: 2026-05-30*
