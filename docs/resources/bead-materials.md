---
doc_type: authority
canonical_path: docs/resources/bead-materials.md
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

# Bead Materials

> **The canonical bead material taxonomy of Old Town.** Every glass sand, mineral, crystal, and bead blank in the world is defined here. Mining produces raw minerals. Hearthcraft provides kiln fires. Beadwork transforms them into spell beads.
>
> **Rule:** No bead material may be introduced without a canonical name, a source skill, and a firing requirement.

---

## The Bead Material Ladder

Old Town's bead materials follow a progression from clay blanks to starfall crystals. Each material requires a higher kiln temperature and a higher Beadwork level to craft.

| Tier | Cultural Name | Material Name | Source | Mining Level | Beadwork Level | Firing Requirement | Visual Identity | Economy Role |
|------|---------------|---------------|--------|-------------|---------------|-------------------|-----------------|-------------|
| 0 | Cobbled | Bead Clay | Mining | 1 | 1 | Campfire | Grey, soft, pliable | Starter blank |
| 1 | Pennywrought | Penny Sand | Mining | 1 | 5 | Campfire | Copper-flecked, gritty | Early glass |
| 2 | Pig Iron | Iron Sand | Mining | 15 | 15 | Cooking fire | Rust-red, magnetic | First mineral |
| 3 | Bellmetal | Bell Sand | Mining | 20 | 20 | Cooking fire | Brass-yellow, ringing | Alloy mineral |
| 4 | Blackbar | Black Sand | Mining | 25 | 25 | Cooking fire | Black, flaky, dark | Dark mineral |
| 5 | Wardensteel | Wardenstone Shard | Mining | 35 | 35 | Bead kiln | Blue-grey, legal-script | Midgame mineral |
| 6 | Greenwold | Greenwold Crystal | Mining | 45 | 45 | Bead kiln | Green-veined, living | Nature crystal |
| 7 | Graveiron | Graveiron Shard | Mining | 50 | 50 | Bead kiln | Dark, iron-rich, heavy | Elite mineral |
| 8 | Blueglass | Blueglass Crystal | Mining | 65 | 65 | Bead kiln | Translucent blue, glassy | Magical crystal |
| 9 | Carmine Steel | Carmine Shard | Mining | 75 | 75 | Bead kiln | Deep red, blood-like | Dark crystal |
| 10 | Argent | Argent Crystal | Mining | 85 | 85 | Bead kiln | Silver-white, luminous | Precious crystal |
| 11 | Crownsteel | Crownsteel Shard | Mining | 90 | 90 | Bead kiln | Gold-black, regal | Royal mineral |
| 12 | Starfall | Starfall Bead Blank | Mining | 99 | 99 | Bead kiln | Iridescent, cosmic | Endgame mythic |

---

## Individual Material Definitions

### Bead Clay

- **Canonical name:** Bead Clay
- **Item ID:** `bead_clay`
- **Tier:** 0
- **Mining level:** 1
- **Beadwork level:** 1
- **Firing requirement:** Campfire
- **Visual identity:** Grey, soft, pliable. Found in riverbanks.
- **Economy role:** The starting material for every beadworker. Abundant, low value, high volume.
- **Cultural framing:** Found in the riverbanks of the Wardenbrook. The clay is grey and soft, the first thing a beadworker learns to shape.
- **Source node:** Riverbanks, clay deposits
- **Respawn time:** 5 seconds
- **Production consumers:** Beadwork (clay beads, bead blanks)

### Glass Sand

- **Canonical name:** Glass Sand
- **Item ID:** `glass_sand`
- **Tier:** 3
- **Mining level:** 15
- **Beadwork level:** 15
- **Firing requirement:** Cooking fire
- **Visual identity:** Fine, translucent, glittering. Found in riverbeds.
- **Economy role:** Essential for glass beads. The backbone of early Beadwork.
- **Cultural framing:** Panned from the riverbeds of the Wardenbrook. The sand is naturally glassy and translucent.
- **Source node:** Riverbeds, glass sand deposits
- **Respawn time:** 10 seconds
- **Production consumers:** Beadwork (glass beads, vials), Handicraft (glass charms)

### Wardenstone Shard

- **Canonical name:** Wardenstone Shard
- **Item ID:** `wardenstone_shard`
- **Tier:** 5
- **Mining level:** 35
- **Beadwork level:** 35
- **Firing requirement:** Bead kiln
- **Visual identity:** Blue-grey, legal-script flecks. Found in Wardenstone veins.
- **Economy role:** Midgame mineral. The backbone of mid-tier Beadwork.
- **Cultural framing:** Named for the Wardenstone veins it is found in. The shard is blue-grey with flecks that look like legal script.
- **Source node:** Wardenstone veins, mid-depth mines
- **Respawn time:** 30 seconds
- **Production consumers:** Beadwork (warden beads, ward spells), Handicraft (warden charms)

### Blueglass Crystal

- **Canonical name:** Blueglass Crystal
- **Item ID:** `blueglass_crystal`
- **Tier:** 8
- **Mining level:** 65
- **Beadwork level:** 65
- **Firing requirement:** Bead kiln
- **Visual identity:** Translucent blue, glassy, fragile. Found in Blueglass caves.
- **Economy role:** Magical crystal. Used for glass-steel beads and magical foci.
- **Cultural framing:** Named for its blue, glass-like appearance. The crystal is found in Blueglass caves, glowing faintly.
- **Source node:** Blueglass caves, crystal formations
- **Respawn time:** 2 minutes
- **Production consumers:** Beadwork (blueglass beads, magical foci), Handicraft (blueglass amulets)

### Starfall Bead Blank

- **Canonical name:** Starfall Bead Blank
- **Item ID:** `starfall_bead_blank`
- **Tier:** 12
- **Mining level:** 99
- **Beadwork level:** 99
- **Firing requirement:** Bead kiln
- **Visual identity:** Iridescent, cosmic, shifting colours. The ultimate bead material.
- **Economy role:** Endgame mythic material. The ultimate Beadwork challenge.
- **Cultural framing:** Named for the legend that it is the remains of a fallen star. The blank is iridescent and shifts colour, like the ore.
- **Source node:** Starfall Crater, mythic veins
- **Respawn time:** 5 minutes
- **Production consumers:** Beadwork (starfall beads, mastery spells), Handicraft (starfall trophies)

---

## Firing Requirements

| Firing Method | Hearthcraft Level | Fuel | Temperature | Can Fire |
|---------------|------------------|------|-------------|----------|
| Campfire | 1 | Kindling | Low | Bead clay, penny sand |
| Cooking fire | 15 | Logs | Medium | Iron sand, bell sand, glass sand |
| Bead kiln | 35 | Blackcoal + logs | High | Wardenstone shards and above |
| Master kiln | 75 | Starfall fuel | Extreme | All materials, including Starfall |

---

## Design Rules

1. **No generic names.** Every bead material has a specific, culturally grounded name.
2. **Every material has a source.** Every bead material comes from Mining. No bead material is gathered by Beadwork itself.
3. **Every material has a firing requirement.** Higher-tier materials require higher-tier kiln access.
4. **Firing scaling.** Higher-tier materials require higher temperatures, creating a Hearthcraft dependency.
5. **Visual identity.** Every material has a visual description that guides asset creation.
6. **Cultural framing.** Every material has a story that connects it to Old Town's world.
7. **Kiln dependency.** Beadwork is unique among production skills in requiring Hearthcraft for firing.

---

## Related Documents

- [`00-index.md`](00-index.md) — Resources navigation hub
- [`resource-taxonomy.md`](resource-taxonomy.md) — Canonical resource names
- [`ores-and-stone.md`](ores-and-stone.md) — Mining resources
- [`woods-and-timber.md`](woods-and-timber.md) — Woodcutting resources
- [`fish-and-cooking.md`](fish-and-cooking.md) — Fishing resources
- [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) — Trapping resources
- [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) — Gardening resources
- [`../skills/gathering-skills.md`](../skills/gathering-skills.md) — Mining skill definitions
- [`../skills/production-skills.md`](../skills/production-skills.md) — Beadwork and Hearthcraft skill definitions

---

*Total bead materials defined: 13*
*Last updated: 2026-05-30*
