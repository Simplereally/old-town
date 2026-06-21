---
doc_type: authority
canonical_path: docs/skills/production-skills.md
parent_index: docs/skills/00-index.md
system_index: docs/skills/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skills Index`](00-index.md)

Authority references:
- `docs/skills/skill-system.md`
- `docs/items/tools/crafting.md`
- `docs/items/resources/crafting.md`
- `docs/items/consumables/food.md`
- `docs/items/consumables/potions.md`
- `docs/items/misc/ammunition.md`
- `docs/items/accessories/00-index.md`

# Production Skills

> **The eight production skills that turn raw materials into finished goods.** Every production skill takes input from at least one gathering skill and sends output to at least one combat or utility system. No production skill is a dead end.
>
> **Rule:** Production skills do not gather. They transform. If a skill collects its own raw material, it is a gathering skill, not a production skill.

---

## Smithing

Smithing produces melee weapons, metal armour, arrowheads, and buckles. It is the backbone of the Arms, Might, and Guard equipment pipeline. Every metal item in the game passes through a furnace and an anvil before it reaches a player.

### Primary Inputs Mining provides all ores. Higher-tier ores require higher Mining levels to extract, which naturally gates what a Smith can work with.

### Tool Requirements A hammer is required for every Smithing action. Hammers themselves have Smithing level requirements, so a smith must first forge their own tools before advancing to harder metals.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Cobbled repairs | `cobbled_sticker` | Repair broken starting gear |
| 5 | Pennywrought bars | `pennywrought_shortblade` | First smelting tier |
| 15 | Bellmetal bars | `bellmetal_sabre` | First medium-tier metal |
| 25 | Blackbar bars | `blackbar_greatblade` | First heavy weapons |
| 35 | Wardensteel bars | `wardensteel_cudgel` | First steel-grade alloy |
| 45 | Greenwold bars | `greenwold_spear` | Pre-elite soft gate |
| 50 | Graveiron bars | `graveiron_longblade` | Elite tier inflection point |
| 65 | Blueglass bars | `blueglass_glaive` | Glass-steel hybrid |
| 75 | Carmine Steel bars | `carmine_steel_maul` | High-tier alloy |
| 85 | Argent bars | `argent_billhook` | Near-mastery tier |
| 90 | Crownsteel bars | `crownsteel_fellaxe` | Penultimate tier |
| 99 | Starfall bars | `starfall_greatblade` | Mastery tier, endgame only |

### Output Destination Arms (weapons), Might (heavy weapons), Guard (armour). Smithing also feeds Bowcraft with arrowheads and Tailoring with buckles.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Forge** | Heat and shape metal on an anvil | "Forge the graveiron bar into a blade" |
| **Smelt** | Melt ore into a metal bar | "Smelt the wardenstone in the furnace" |
| **Hammer** | Strike heated metal to shape it | "Hammer the pennywrought into form" |
| **Temper** | Heat-treat to harden steel | "Temper the blueglass edge" |
| **Quench** | Cool hot metal in liquid | "Quench the carmine steel in graveyard water" |

---

## Bowcraft

Bowcraft produces bows, crossbows, arrows, bolts, and thrown weapon parts. It is the sole production pipeline for the Ranged combat system. Without Bowcraft, there are no projectiles and no ranged weapons.

### Primary Inputs Woodcutting provides logs and bow woods. Trapping provides sinew for bowstrings and feathers for arrow fletching. Both inputs must be present for most recipes.

### Tool Requirements A knife is used for shaping staves and fletching arrows. A fletching jig is required for crossbow bolts and precision work. Both tools require Bowcraft levels to use effectively.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Wooden arrows | `cobbled_arrow` | Starting ammunition |
| 5 | Shortbow staves | `pennywrought_shortbow` | First bows |
| 15 | Bellmetal arrows | `bellmetal_arrow` | First metal-tipped arrows |
| 25 | Blackbar crossbows | `blackbar_crossbow` | First crossbows |
| 35 | Wardensteel bolts | `wardensteel_bolt` | Armour-piercing bolts |
| 45 | Greenwold longbows | `greenwold_longbow` | Pre-elite ranged |
| 50 | Graveiron arrows | `graveiron_arrow` | Elite ammunition |
| 65 | Blueglass warbows | `blueglass_warbow` | Heavy draw bows |
| 75 | Carmine Steel bolts | `carmine_steel_bolt` | High-tier bolts |
| 85 | Argent quickbows | `argent_quickbow` | Fast-firing elite bows |
| 90 | Crownsteel crossbows | `crownsteel_crossbow` | Penultimate crossbows |
| 99 | Starfall arrows | `starfall_arrow` | Mastery ammunition |

### Output Destination Ranged (ammunition and weapons). Bowcraft also feeds Handicraft with unstrung bow frames for decorative keepsakes.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Shape** | Carve a stave into a bow form | "Shape the witchwood into a warbow" |
| **Fletch** | Attach feathers to an arrow | "Fletch the graveiron arrow with drake feathers" |
| **String** | Attach a bowstring to a stave | "String the bow with wyrm sinew" |
| **Carve** | Cut intricate details into wood | "Carve the nocks into the starfall stave" |
| **Laminate** | Layer materials for strength | "Laminate the blueglass bow with oak backing" |

---

## Tailoring

Tailoring produces robes, ranged armour, capes, wraps, and cloth gear. It covers both the soft armour worn by Ranged fighters and the flowing garments worn by Magic users.

### Primary Inputs Trapping provides hides and leather. Gardening provides cloth plants, flax, and dye materials. The two input streams are rarely mixed in a single recipe, but both are essential across the level range.

### Tool Requirements A needle is required for all Tailoring actions. Higher-level needles allow finer stitching and tougher materials. No needle, no garment.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Ragged cloth | `cobbled_rags` | Starting cloth repairs |
| 5 | Pennywrought leather | `pennywrought_leather_jerkin` | First soft armour |
| 15 | Bellmetal leather | `bellmetal_leather_jerkin` | First hardened leather |
| 25 | Blackbar hide | `blackbar_hide_chaps` | First hide leggings |
| 35 | Wardensteel range | `wardensteel_range_harness` | First ranged harness |
| 45 | Greenwold range | `greenwold_range_chaps` | Pre-elite ranged gear |
| 50 | Graveiron range | `graveiron_range_harness` | Elite tier inflection |
| 65 | Blueglass range | `blueglass_range_jerkin` | Glass-threaded leather |
| 75 | Carmine Steel range | `carmine_steel_range_harness` | High-tier ranged armour |
| 85 | Argent range | `argent_range_chaps` | Near-mastery range |
| 90 | Crownsteel range | `crownsteel_range_harness` | Penultimate ranged |
| 99 | Starfall range | `starfall_range_harness` | Mastery range armour |

### Output Destination Guard (armour), Ranged (armour). Tailoring also produces the capes that feed into the Handicraft mastery system.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Stitch** | Sew pieces together | "Stitch the warden hide into a jerkin" |
| **Sew** | Join fabric with thread | "Sew the graveiron lining into the cape" |
| **Cut** | Shape material from a pattern | "Cut the pattern for the argent range harness" |
| **Dye** | Colour cloth with natural pigments | "Dye the cloth with oldroad oak bark" |
| **Hem** | Finish the edge of a garment | "Hem the starfall cloak with silver thread" |

---

## Handicraft

Handicraft produces jewellery, charms, keepsakes, rings, trophies, and tools. It is the most horizontally connected production skill, touching every other system in the game.

### Primary Inputs Mining provides gems. Fishing provides pearls and shells. Trapping provides small trophies and curios. The skill draws from three gathering streams, making it naturally interdisciplinary.

### Tool Requirements A mould is used for casting rings and charms. A chisel is used for cutting gems and engraving trophies. Both tools require Handicraft levels.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Clay beads | `clay_bead` | Starting jewellery |
| 5 | Copper rings | `copper_ring` | First metal rings |
| 15 | Clay rings | `clay_ring` | First proper rings |
| 25 | Blackbar rings | `blackbar_ring` | First iron-grade rings |
| 35 | Gold rings | `gold_ring` | First precious metal |
| 45 | Greenwold charms | `greenwold_charm` | Nature-themed charms |
| 50 | Graveiron rings | `graveiron_ring` | Elite tier jewellery |
| 65 | Blueglass amulets | `blueglass_amulet` | Glass-infused foci |
| 75 | Carmine jewellery | `carmine_steel_amulet` | High-tier gems |
| 85 | Argent trophies | `argent_trophy` | Near-mastery trophies |
| 90 | Crownsteel rings | `crownsteel_ring` | Penultimate jewellery |
| 99 | Starfall trophies | `starfall_trophy` | Mastery keepsakes |

### Output Destination All (accessories). Handicraft feeds every combat skill with rings, amulets, charms, and belts. It also produces the mastery capes that grant +1 skill boosts.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Mould** | Cast metal in a form | "Mould the copper ring in the pennywrought cast" |
| **Chisel** | Cut and shape gems | "Chisel the blueglass gem into a facet" |
| **Set** | Secure a gem in a mount | "Set the argent pearl in the crownsteel ring" |
| **Engrave** | Cut designs into metal | "Engrave the wyrm trophy with the warden's mark" |
| **Polish** | Smooth and shine a finished piece | "Polish the starfall trophy to a mirror finish" |

---

## Beadwork

Beadwork produces spell beads, bead pouches, charmwards, and magical foci. It is the production backbone of the Magic combat system. Without beads, a mage has no ammunition and no way to cast.

### Primary Inputs Mining provides glass sand and bead minerals. Hearthcraft provides kiln fires, which are a prerequisite for firing raw beads into finished spell beads. Beadwork is unique among production skills in requiring a utility skill as a processing step.

### Tool Requirements A chisel is used for shaping raw minerals into bead blanks. A mould is used for casting glass beads. Both tools require Beadwork levels.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Raw bead blanks | `cobbled_bead_blank` | Starting bead material |
| 5 | Pennywrought beads | `pennywrought_bead` | First fired beads |
| 15 | Basic beads | `basic_fire_bead` | First elemental beads |
| 25 | Blackbar beads | `blackbar_bead` | Dark-aligned beads |
| 35 | Warden beads | `warden_bead` | Warden-blessed beads |
| 45 | Greenwold beads | `greenwold_bead` | Nature-aligned beads |
| 50 | Graveiron beads | `graveiron_bead` | Elite tier beads |
| 65 | Blueglass beads | `blueglass_bead` | Glass-steel beads |
| 75 | Carmine beads | `carmine_steel_bead` | High-tier beads |
| 85 | Argent beads | `argent_bead` | Near-mastery beads |
| 90 | Crownsteel beads | `crownsteel_bead` | Penultimate beads |
| 99 | Starfall beads | `starfall_bead` | Mastery beads, endgame only |

### Output Destination Magic (spellcasting). Beadwork also feeds Handicraft with decorative bead strands for charms and trophies.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Drill** | Bore a hole through a bead blank | "Drill the wardenstone bead blank" |
| **Glaze** | Apply a glass coating | "Glaze the bead with blueglass dust" |
| **String** | Thread beads onto a cord | "String the graveiron beads for the ward" |
| **Fire** | Bake beads in a kiln | "Fire the carmine beads in the hearth kiln" |
| **Bless** | Consecrate a bead for spell use | "Bless the starfall bead at the shrine" |

---

## Apothecary

Apothecary produces potions, salves, oils, brews, poisons, and antidotes. It is the game's primary source of temporary boosts, healing, and status effects.

### Primary Inputs Gardening provides herbs, roots, and fungi. Mining provides water sources from underground springs. Beadwork provides glass vials crafted from glass sand. The vial is as important as the herb, a bottle without contents is useless and contents without a bottle are wasted.

### Tool Requirements A mortar and pestle is required for grinding herbs and mixing reagents. Higher-level mortars allow finer grinding, which unlocks more potent recipes.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Water vials | `water_vial` | Starting containers |
| 5 | Weak salves | `weak_salve` | First healing items |
| 15 | Basic potions | `health_potion` | First real potions |
| 25 | Antidotes | `antidote` | First status cures |
| 35 | Super potions | `super_strength_potion` | First boost potions |
| 45 | Graveyard brews | `graveyard_brew` | Niche graveyard content |
| 50 | Graveiron brews | `graveiron_brew` | Elite tier potions |
| 65 | Blueglass elixirs | `blueglass_elixir` | Glass-infused potions |
| 75 | Carmine elixirs | `carmine_elixir` | High-tier elixirs |
| 85 | Argent philtres | `argent_philtre` | Near-mastery potions |
| 90 | Crownsteel tonics | `crownsteel_tonic` | Penultimate brews |
| 99 | Starfall philtres | `starfall_philtre` | Mastery potions, endgame only |

### Output Destination All (boosts, heals, buffs). Apothecary feeds every combat skill with temporary level boosts. It also produces antidotes and cures for status effects encountered in Wardenry contracts.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Grind** | Crush herbs in a mortar | "Grind the graveyard moss to powder" |
| **Mix** | Combine reagents into a potion | "Mix the warden herb with spring water" |
| **Brew** | Steep and ferment ingredients | "Brew the blueglass tea for clarity" |
| **Distill** | Extract pure essence | "Distill the carmine root for potency" |
| **Decant** | Pour a potion into a vial | "Decant the starfall elixir into a glass flask" |

---

## Cooking

Cooking produces food, combo food, preserves, pies, stews, and teas. It is the primary source of healing in combat and the main consumer of raw gathering outputs.

### Primary Inputs Fishing provides fish and eels. Gardening provides crops, vegetables, and grains. Trapping provides meat from small beasts. Cooking is the most input-diverse production skill, drawing from three gathering streams.

### Tool Requirements A knife is used for preparing fish and meat. A pot is used for stews, teas, and combo dishes. Both tools require Cooking levels. Some advanced recipes require a fire, which ties Cooking to Hearthcraft.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Raw preparations | `shimpaste` | Starting food paste |
| 5 | Basic fish | `cooked_herring` | First cooked fish |
| 15 | Baked goods | `bread` | First baked items |
| 25 | Meat stews | `meat_stew` | First stews |
| 35 | Combo food | `combo_salmon` | First multi-stage food |
| 45 | Graveyard teas | `graveyard_tea` | Niche teas |
| 50 | Graveiron pies | `graveiron_pie` | First pies |
| 65 | Blueglass desserts | `blueglass_pudding` | Glass-sugar desserts |
| 75 | Carmine feasts | `carmine_feast` | High-tier feasts |
| 85 | Argent combo food | `argent_combo` | Near-mastery combo |
| 90 | Crownsteel banquets | `crownsteel_banquet` | Penultimate feasts |
| 99 | Starfall banquets | `starfall_banquet` | Mastery food, endgame only |

### Output Destination Vitality (food healing). Cooking also feeds Apothecary with brewed teas that serve as mild potion alternatives, and produces combo foods that heal in multiple stages.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Chop** | Cut ingredients into pieces | "Chop the deepwater eel into steaks" |
| **Fry** | Cook in a pan over fire | "Fry the glass eel in warden oil" |
| **Bake** | Cook in an oven or hearth | "Bake the oldroad oak bread" |
| **Stew** | Simmer ingredients in liquid | "Stew the drake meat with herbs" |
| **Preserve** | Salt, smoke, or pickle food | "Preserve the crown turtle in brine" |

---

## Carpentry

Carpentry produces homes, workshops, storage units, stalls, furniture, and skilling stations. It is the only production skill whose output is structural rather than wearable or consumable.

### Primary Inputs Woodcutting provides logs and planks. Higher-tier woods require higher Woodcutting levels, which gates the quality of structures a carpenter can build.

### Tool Requirements A saw is used for cutting planks and shaping beams. A hammer is used for assembly and fastening. Both tools require Carpentry levels. The hammer here is distinct from the Smithing hammer, though both share the same name.

### Key Unlocks

| Level | Unlock | Example Item | Notes |
|-------|--------|--------------|-------|
| 1 | Basic repairs | `cobbled_stool` | Starting furniture |
| 5 | Simple furniture | `pennywrought_chair` | First real furniture |
| 15 | Oak furniture | `oak_table` | First wood-specific furniture |
| 25 | Storage boxes | `blackbar_chest` | First storage |
| 35 | Workshop | `workshop_bench` | First skilling station |
| 45 | Greenwold stalls | `greenwold_stall` | Market stalls |
| 50 | Graveiron storage | `graveiron_chest` | Elite storage |
| 65 | Blueglass furniture | `blueglass_shelf` | Glass-infused furniture |
| 75 | Carmine house | `carmine_house` | Player housing |
| 85 | Argent workshop | `argent_workshop` | Near-mastery workshop |
| 90 | Crownsteel manor | `crownsteel_manor` | Penultimate housing |
| 99 | Starfall estate | `starfall_estate` | Mastery estate, endgame only |

### Output Destination Utility (housing, storage, skilling stations). Carpentry also feeds Bowcraft with unstrung bow staves and produces the stalls that Sleight users interact with.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Saw** | Cut timber into planks | "Saw the witchwood into bow staves" |
| **Plane** | Smooth a rough surface | "Plane the oak planks for the workshop floor" |
| **Join** | Connect pieces with joints | "Join the mortise and tenon for the bench" |
| **Lathe** | Turn wood on a rotating tool | "Lathe the greenwold legs for the table" |
| **Frame** | Build the structural skeleton | "Frame the starfall estate with oldroad beams" |

---

## Production Input and Output Map

This table shows the full flow from gathering to production to consumption. Every production skill appears as a row, with its inputs on the left and its consumers on the right.

| Production Skill | Gathering Inputs | What It Makes | Consumed By |
|------------------|------------------|---------------|-------------|
| Smithing | Mining (ores) | Weapons, armour, arrowheads, buckles | Arms, Might, Guard, Bowcraft, Tailoring |
| Bowcraft | Woodcutting (logs), Trapping (sinew, feathers) | Bows, arrows, bolts, thrown parts | Ranged |
| Tailoring | Trapping (hides), Gardening (cloth) | Robes, leather, capes, wraps | Guard, Ranged, Handicraft |
| Handicraft | Mining (gems), Fishing (pearls), Trapping (trophies) | Rings, amulets, charms, trophies | All combat skills |
| Beadwork | Mining (sand, minerals), Hearthcraft (fires) | Spell beads, foci, pouches | Magic |
| Apothecary | Gardening (herbs), Mining (water, vials) | Potions, salves, brews, poisons | All combat skills, Wardenry |
| Cooking | Fishing (fish), Gardening (crops), Trapping (meat) | Food, pies, stews, teas | Vitality, Apothecary |
| Carpentry | Woodcutting (logs, planks) | Homes, storage, stalls, furniture | Utility, Bowcraft, Sleight |

**Rule:** No production skill consumes only from itself. No production skill outputs only to itself. The table above is a directed acyclic graph. Cycles exist only through gathering skills, never within production.

---

## Design Rules for Production Skills

1. **Transform, do not collect.** A production skill takes finished or semi-finished goods from gathering and changes their form. It never mines its own ore or cuts its own tree.
2. **Tool gating.** Every production action requires a tool. Tools have skill level requirements, creating a soft gate that rewards progression.
3. **Tiered outputs.** Every production skill follows the 13-tier cultural naming system. The example items in each skill's key unlocks table map directly to the tier table in `docs/skills/skill-system.md`.
4. **Multiple consumers.** Every production skill must feed at least two systems. Smithing feeds three combat skills plus Bowcraft and Tailoring. Cooking feeds Vitality and Apothecary. No single consumer can starve a skill of purpose.
5. **Cross-skill dependencies.** Some production skills require inputs from other production skills. Smithing feeds Bowcraft with arrowheads. Tailoring feeds Handicraft with capes. These interlocks are intentional and create economic depth.
6. **No instant mastery.** The gap between level 50 and level 75 is larger than the gap between level 1 and level 50. Production skills follow the same exponential XP curve as all other skills.
7. **Content-driven recipes.** Every recipe, unlock, and output is defined in JSON content files. No production behavior is hardcoded in engine code.

---

## Related Documents

- [`00-index.md`](00-index.md) — Skills navigation hub
- [`skill-system.md`](skill-system.md) — Core skill engine and XP curve
- [`combat-skills.md`](combat-skills.md) — Combat skill definitions
- [`gathering-skills.md`](gathering-skills.md) — Gathering skill definitions
- [`utility-skills.md`](utility-skills.md) — Utility skill definitions
- [`skill-interlocks.md`](skill-interlocks.md) — Skill economy web

---

*Production skills defined: 8*
*Last updated: 2026-05-30*
