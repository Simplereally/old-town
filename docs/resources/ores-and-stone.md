---
doc_type: authority
canonical_path: docs/resources/ores-and-stone.md
parent_index: docs/resources/00-index.md
system_index: docs/resources/00-index.md
root_index: docs/00-index.md
---

Parent: [`Resources Index`](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/skills/gathering-skills.md`
- `docs/skills/production-skills.md`
- `docs/items/resources/ore.md`

# Ores and Stone

> **The canonical ore and stone taxonomy of Old Town.** Every mineral, metal, and stone in the world is defined here. Mining produces these. Smithing consumes them.
>
> **Rule:** No ore may be introduced without a canonical name, a tier position, and at least one production consumer.

---

## The Ore Ladder

Old Town's ore ladder follows a 13-tier progression from surface copper to mythic starfall. Each tier corresponds to a cultural equipment tier, creating a coherent world where a `graveiron_pickaxe` mines `blackbar_seam` ore to smelt into `graveiron_bars`.

| Tier | Cultural Name | Ore Name | Mining Level | Smithing Use | Visual Identity | Economy Role |
|------|---------------|----------|-------------|--------------|-----------------|-------------|
| 0 | Cobbled | Stone | 1 | None | Grey, rough rock | Tutorial material |
| 1 | Pennywrought | Penny Copper | 1 | Pennywrought bars | Red-brown, soft | Abundant starter |
| 1 | Pennywrought | Tinstone | 1 | Bellmetal alloy | Pale grey, brittle | Alloy component |
| 2 | Pig Iron | Pig Iron Ore | 15 | Pig Iron bars | Rust-red, heavy | First real ore |
| 3 | Bellmetal | Bellstone | 20 | Bellmetal alloy | Brass-yellow, ringing | First alloy |
| 4 | Blackbar | Blackcoal | 25 | Smelting fuel | Black, flaky | Essential fuel |
| 5 | Wardensteel | Wardenstone | 35 | Wardensteel bars | Blue-grey, legal-script flecks | Midgame workhorse |
| 6 | Greenwold | Greenwold Ore | 45 | Greenwold bars | Green-veined, living | Nature-aligned |
| 7 | Graveiron | Graveiron Ore | 50 | Graveiron bars | Dark grey, iron-rich | Elite inflection |
| 8 | Blueglass | Blueglass Ore | 65 | Blueglass bars | Translucent blue, glassy | Magical mineral |
| 9 | Carmine Steel | Carmine Ore | 75 | Carmine Steel bars | Deep red, blood-like | High-tier alloy |
| 10 | Argent | Argent Ore | 85 | Argent bars | Silver-white, luminous | Near-mastery precious |
| 11 | Crownsteel | Crownsteel Ore | 90 | Crownsteel bars | Gold-black, regal | Penultimate |
| 12 | Starfall | Starfall Ore | 99 | Starfall bars | Iridescent, cosmic | Endgame mythic |

---

## Individual Ore Definitions

### Penny Copper

- **Canonical name:** Penny Copper
- **Item ID:** `penny_copper_ore`
- **Tier:** 1
- **Mining level:** 1
- **Smithing use:** Smelted into Copper Bars (tier 1)
- **Visual identity:** Red-brown, soft, easily scratched. Surface deposits near old roads.
- **Economy role:** The starting ore for every miner. Abundant, low value, high volume.
- **Cultural framing:** Named for the copper coins of the Old Town market. Found in surface deposits along the Wardenbrook riverbanks.
- **Source node:** Surface deposits, riverbanks
- **Respawn time:** 5 seconds
- **Secondary drops:** Stone (50%)
- **Production consumers:** Smithing (Copper Bars)

### Tinstone

- **Canonical name:** Tinstone
- **Item ID:** `tinstone_ore`
- **Tier:** 1
- **Mining level:** 1
- **Smithing use:** Alloyed with Penny Copper to make Bellmetal (tier 3)
- **Visual identity:** Pale grey, brittle, lightweight. Found near Penny Copper deposits.
- **Economy role:** Alloy component. Never used alone, always alloyed.
- **Cultural framing:** Named for its tin content. The "stone" suffix distinguishes it from the metal.
- **Source node:** Surface deposits, often near copper
- **Respawn time:** 5 seconds
- **Secondary drops:** Stone (50%)
- **Production consumers:** Smithing (Bellmetal alloy)

### Pig Iron Ore

- **Canonical name:** Pig Iron Ore
- **Item ID:** `pig_iron_ore`
- **Tier:** 2
- **Mining level:** 15
- **Smithing use:** Smelted into Iron Bars (tier 2)
- **Visual identity:** Rust-red, heavy, magnetic. Found in shallow mines.
- **Economy role:** First ore that requires a real pickaxe. The inflection point from surface mining to shaft mining.
- **Cultural framing:** Named for the pig-shaped ingots it produces. The ore itself is raw iron.
- **Source node:** Shallow mines, hill faces
- **Respawn time:** 10 seconds
- **Secondary drops:** Stone (30%), Blackcoal (10%)
- **Production consumers:** Smithing (Iron Bars)

### Bellstone

- **Canonical name:** Bellstone
- **Item ID:** `bellstone_ore`
- **Tier:** 3
- **Mining level:** 20
- **Smithing use:** Smelted into Bellmetal bars (tier 3)
- **Visual identity:** Brass-yellow, metallic, rings when struck. Found in bell-shaped rock formations.
- **Economy role:** First alloy ore. Requires a mix of copper and tin.
- **Cultural framing:** Named for the bell-like sound it makes when struck. The ore is brass-yellow, hence the bell association.
- **Source node:** Bell-shaped rock formations, old quarry sites
- **Respawn time:** 15 seconds
- **Secondary drops:** Stone (25%), Penny Copper (10%)
- **Production consumers:** Smithing (Bellmetal bars)

### Blackcoal

- **Canonical name:** Blackcoal
- **Item ID:** `blackcoal`
- **Tier:** 4
- **Mining level:** 25
- **Smithing use:** Fuel for smelting steel and higher alloys
- **Visual identity:** Black, flaky, burns with a clean flame. Found in coal seams.
- **Economy role:** The fuel backbone. No steel without blackcoal. High demand, constant market.
- **Cultural framing:** Named for its black colour and coal nature. The "black" prefix distinguishes it from charcoal.
- **Source node:** Coal seams, underground deposits
- **Respawn time:** 20 seconds
- **Secondary drops:** Stone (40%), Iron Ore (5%)
- **Production consumers:** Smithing (fuel for steel, alloys, higher tiers)

### Wardenstone

- **Canonical name:** Wardenstone
- **Item ID:** `wardenstone_ore`
- **Tier:** 5
- **Mining level:** 35
- **Smithing use:** Smelted into Wardensteel bars (tier 5)
- **Visual identity:** Blue-grey stone with pale legal-script flecks. The flecks look like warden's writs.
- **Economy role:** The midgame workhorse. Wardensteel is the most common mid-tier metal. Wardenstone is the most mined ore after the starter tier.
- **Cultural framing:** Named for the Warden's Guard, who use Wardensteel fittings. The legal-script flecks are a natural mineral pattern that looks like writs and warrants.
- **Source node:** Wardenstone veins, mid-depth mines
- **Respawn time:** 30 seconds
- **Secondary drops:** Stone (20%), Blackcoal (15%)
- **Production consumers:** Smithing (Wardensteel bars), Handicraft (Wardenstone shards), Beadwork (Wardenstone beads)

### Greenwold Ore

- **Canonical name:** Greenwold Ore
- **Item ID:** `greenwold_ore`
- **Tier:** 6
- **Mining level:** 45
- **Smithing use:** Smelted into Greenwold bars (tier 6)
- **Visual identity:** Green-veined, living-looking stone. The veins pulse faintly in dim light.
- **Economy role:** Nature-aligned metal. Used for druidic and woodland gear.
- **Cultural framing:** Named for the Greenwold, the deep forest where the veins are found. The ore is believed to be alive by some miners.
- **Source node:** Greenwold veins, forest mines
- **Respawn time:** 40 seconds
- **Secondary drops:** Stone (20%), Wardenstone (10%)
- **Production consumers:** Smithing (Greenwold bars), Handicraft (nature charms)

### Graveiron Ore

- **Canonical name:** Graveiron Ore
- **Item ID:** `graveiron_ore`
- **Tier:** 7
- **Mining level:** 50
- **Smithing use:** Smelted into Graveiron bars (tier 7)
- **Visual identity:** Dark grey, iron-rich, heavy. Found in the Graveiron Hills.
- **Economy role:** The elite inflection point. Graveiron is the first tier that feels "serious." The ore is heavy and dense.
- **Cultural framing:** Named for the Graveiron Hills, where the richest deposits are found. The ore is dark and heavy, like the grave.
- **Source node:** Graveiron Hills, deep mines
- **Respawn time:** 1 minute
- **Secondary drops:** Stone (15%), Blackcoal (20%), Wardenstone (10%)
- **Production consumers:** Smithing (Graveiron bars), Handicraft (graveyard trophies)

### Blueglass Ore

- **Canonical name:** Blueglass Ore
- **Item ID:** `blueglass_ore`
- **Tier:** 8
- **Mining level:** 65
- **Smithing use:** Smelted into Blueglass bars (tier 8)
- **Visual identity:** Translucent blue, glassy, fragile. It shatters if dropped.
- **Economy role:** Magical mineral, not a true metal. Used for glass-steel hybrid gear and magical foci.
- **Cultural framing:** Named for its blue, glass-like appearance. It is a mineral, not a metal, but is smelted like one.
- **Source node:** Blueglass caves, crystal formations
- **Respawn time:** 2 minutes
- **Secondary drops:** Glass sand (30%), Stone (10%)
- **Production consumers:** Smithing (Blueglass bars), Beadwork (Blueglass beads), Handicraft (Blueglass amulets)

### Carmine Ore

- **Canonical name:** Carmine Ore
- **Item ID:** `carmine_ore`
- **Tier:** 9
- **Mining level:** 75
- **Smithing use:** Smelted into Carmine Steel bars (tier 9)
- **Visual identity:** Deep red, blood-like, heavy. Found in the Carmine Mines.
- **Economy role:** High-tier alloy. Used for the most powerful weapons before the mastery tier.
- **Cultural framing:** Named for its deep red colour. "Carmine" is a red pigment, and the ore is the colour of dried blood.
- **Source node:** Carmine Mines, deep shafts
- **Respawn time:** 3 minutes
- **Secondary drops:** Blackcoal (25%), Iron Ore (10%)
- **Production consumers:** Smithing (Carmine Steel bars)

### Argent Ore

- **Canonical name:** Argent Ore
- **Item ID:** `argent_ore`
- **Tier:** 10
- **Mining level:** 85
- **Smithing use:** Smelted into Argent bars (tier 10)
- **Visual identity:** Silver-white, luminous, almost glowing. Found in the Argent Veins.
- **Economy role:** Near-mastery precious metal. Used for the finest gear and jewellery.
- **Cultural framing:** Named for its silver colour. "Argent" is Old Town's word for silver. The ore is precious and rare.
- **Source node:** Argent Veins, deep mountain mines
- **Respawn time:** 4 minutes
- **Secondary drops:** Gold Ore (10%), Stone (10%)
- **Production consumers:** Smithing (Argent bars), Handicraft (Argent jewellery)

### Crownsteel Ore

- **Canonical name:** Crownsteel Ore
- **Item ID:** `crownsteel_ore`
- **Tier:** 11
- **Mining level:** 90
- **Smithing use:** Smelted into Crownsteel bars (tier 11)
- **Visual identity:** Gold-black, regal, heavy. Found in the Crownsteel Deeps.
- **Economy role:** Penultimate tier. Used for the finest gear before Starfall.
- **Cultural framing:** Named for its gold-black colour. The ore is regal and rare, found only in the deepest mines.
- **Source node:** Crownsteel Deeps, deepest shafts
- **Respawn time:** 5 minutes
- **Secondary drops:** Argent Ore (10%), Blackcoal (20%)
- **Production consumers:** Smithing (Crownsteel bars)

### Starfall Ore

- **Canonical name:** Starfall Ore
- **Item ID:** `starfall_ore`
- **Tier:** 12
- **Mining level:** 99
- **Smithing use:** Smelted into Starfall bars (tier 12)
- **Visual identity:** Iridescent, cosmic, shifting colours. It is said to be the remains of a fallen star.
- **Economy role:** Endgame mythic material. The ultimate mining challenge. Server-wide demand.
- **Cultural framing:** Named for the legend that it is the remains of a fallen star. The ore is iridescent and shifts colour in the light.
- **Source node:** Starfall Crater, mythic veins
- **Respawn time:** 5 minutes
- **Secondary drops:** Blueglass Ore (10%), Argent Ore (5%)
- **Production consumers:** Smithing (Starfall bars), Handicraft (Starfall trophies), Beadwork (Starfall beads)

---

## Special Minerals

### Glass Sand

- **Canonical name:** Glass Sand
- **Item ID:** `glass_sand`
- **Mining level:** 15
- **Smithing use:** None (used in Beadwork)
- **Visual identity:** Fine, translucent, glittering sand. Found in riverbeds.
- **Economy role:** Essential for Beadwork. Used to make glass vials and bead blanks.
- **Cultural framing:** Panned from riverbeds. The sand is naturally glassy and translucent.
- **Source node:** Riverbeds, glass sand deposits
- **Respawn time:** 10 seconds
- **Production consumers:** Beadwork (glass beads, vials), Handicraft (glass charms)

### Water

- **Canonical name:** Water
- **Item ID:** `water_vial`
- **Mining level:** 1 (from water sources)
- **Smithing use:** None (used in Apothecary)
- **Visual identity:** Clear, pure, drawn from underground springs.
- **Economy role:** Essential for Apothecary. Used in every potion.
- **Cultural framing:** Drawn from underground springs. The water is pure and cold.
- **Source node:** Water sources, underground springs
- **Respawn time:** Instant (water source)
- **Production consumers:** Apothecary (all potions), Cooking (stews, teas)

---

## Design Rules

1. **No banned names.** `mithril`, `adamantite`, `runite`, `silver`, `gold` are banned. Use the canonical names above.
2. **Every ore has a tier.** The tier determines its level requirement and its equipment tier.
3. **Every ore has a consumer.** No ore is mined for its own sake. It must feed Smithing or another production skill.
4. **Secondary drops.** Every ore node drops secondary materials (stone, coal, lower-tier ore) to create variety.
5. **Respawn scaling.** Higher-tier ores have longer respawn times, creating scarcity and competition.
6. **Visual identity.** Every ore has a visual description that guides asset creation.
7. **Cultural framing.** Every ore has a story that connects it to Old Town's world.

---

## Related Documents

- [`00-index.md`](00-index.md) — Resources navigation hub
- [`resource-taxonomy.md`](resource-taxonomy.md) — Canonical resource names
- [`woods-and-timber.md`](woods-and-timber.md) — Woodcutting resources
- [`fish-and-cooking.md`](fish-and-cooking.md) — Fishing resources
- [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) — Trapping resources
- [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) — Gardening resources
- [`bead-materials.md`](bead-materials.md) — Beadwork resources
- [`../skills/gathering-skills.md`](../skills/gathering-skills.md) — Mining skill definitions
- [`../skills/production-skills.md`](../skills/production-skills.md) — Smithing skill definitions

---

*Total ores defined: 14*
*Total special minerals: 2*
*Last updated: 2026-05-30*
