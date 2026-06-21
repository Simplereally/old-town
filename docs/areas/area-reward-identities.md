---
doc_type: authority
canonical_path: docs/areas/area-reward-identities.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/items/00-index.md`
- `docs/economy/reward-calibration.md`
- `docs/ledger/rewards-and-stamps.md`
- `docs/skills/skill-system.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/area-resource-progression.md`
- `docs/areas/area-creature-progression.md`
- `docs/areas/area-level-bands.md`
- `docs/creatures/starter-drop-tables.md`
- `docs/creatures/rare-drops-and-trophies.md`
- `docs/creatures/wardenry-contracts.md`

# Area Reward Identities

Reward identity is why a player returns to an area after they have seen it once. Every first-ring area must give at least one reason to come back. That reason might be a competitive node, a rare drop, a contract turn-in, a Favour rite, a trail step, or a shop restock. An area that is one-and-done is a failed area.

This document maps what each first-ring area gives the player, what cultural equipment identity comes from that area, and what shorthand players use when they talk about the rewards. It is the bridge between area design and player motivation.

---

## Design Authority Summary

### What player fantasy does this support?

The fantasy of becoming a local specialist. A player does not just "get loot." They learn that Crowmile Road gives travel salvage, that Bellwood Copse gives bowcraft timber, that The Old Kiln gives fire gear. Reward identity makes skilling and combat feel like learning a place, not like filling a bar.

### What systems does it connect to?

Equipment tiers, drop tables, Wardenry contracts, Favour rites, the Civic Ledger deed system, Oldroad Trails, shop stock, competitive nodes, and the Handicraft keepsake loop. Reward identity connects what players do in an area to what they wear, what they display, and what they come back for.

### What items, NPCs, areas, and resources does it create?

This document does not create new item names. It maps existing canonical items from `docs/items/00-index.md`, `docs/creatures/starter-drop-tables.md`, and `docs/creatures/rare-drops-and-trophies.md` to the areas where they originate. It formalizes the relationship between `crowmile_road` and travel salvage, between `bellwood_copse` and bowcraft timber, and between `old_kiln` and fire-resistant gear.

### What is starter, midgame, and endgame?

**Starter** is the first visit: the broken cart on Crowmile Road, the first lathwood tree in Bellwood Copse, the first tinstone outcrop. **Midgame** is the repeat loop: competitive wardenstone mining, bellmaple harvesting, drake whelp hunting, redback salmon fishing. **Endgame** is the area as a landmark in a broader route: Crowmile Fork as a Cartography node, the Kiln as a smithing hub, Lowgrave as a Favour training ground.

### What should players call it in shorthand?

Players say "the gear," "the drops," "the contracts," "the trophies," or "the keepsakes," and every player who has walked the first ring knows which area is meant by context. "I'm off to the Cut for the gear" means wardensteel-tier mining equipment. "Going to the copse for the drops" means bell_fang and bellmaple. This document exists so designers know what players mean when they say it.

### What is banned because it sounds generic or derivative?

Best in Slot items, item levels, item power scores, gear score, iLevel, equipment rating, random stat rolls, loot boxes, gacha mechanics, tier lists, and universal BiS accessories. These are banned because they turn reward identity into a numbers game rather than a cultural choice. See the Banned Concepts section for the full list.

### What is deferred to implementation?

Exact drop rates, drop table JSON, reward amount calibration, shop stock pricing, contract reward tables, trophy acquisition logic, and keepsake crafting recipes. See the Deferred to Implementation section for the full list.

### What existing docs must link to it?

`docs/items/00-index.md`, `docs/economy/reward-calibration.md`, `docs/ledger/rewards-and-stamps.md`, `docs/skills/skill-system.md`, `docs/areas/first-ring-areas.md`, `docs/areas/area-resource-progression.md`, `docs/areas/area-creature-progression.md`, `docs/areas/area-level-bands.md`, `docs/creatures/starter-drop-tables.md`, `docs/creatures/rare-drops-and-trophies.md`, `docs/creatures/wardenry-contracts.md`.

---

## Reward Identity Philosophy

### Repeat Value Is Mandatory

Every first-ring area must give at least one reason to return after the first visit. The reason does not need to be combat. It can be any of the following:

| Repeat Reason | Example Area | What Brings Players Back |
|---------------|--------------|--------------------------|
| Competitive node | Tinstone Cut | Wardenstone seam, shared-world mining |
| Rare drop | The Old Kiln | Warm scale, drake tooth from ash drake whelp |
| Contract turn-in | Lowgrave | Bone chips and grave dust for Wardenry contracts |
| Favour rite | Lowgrave | Offering Stone consumes grave flowers and candles |
| Trail step | Crowmile Road | Chalk marks and bark marks for Oldroad Trails |
| Shop stock | Sootstairs | Marn Lock restocks lockpicks and buys writs |
| Keepsake material | Bellwood Copse | Bell fang for Handicraft charm crafting |
| Trophy hunt | The Old Kiln | Tallow drake scale for trophy slot |

An area with no repeat reason is a sightseeing spot, not a game area.

### Cultural Identity Over Power

The gear from each area should look and sound like it came from that place. Crowmile Road gear is travel-worn and practical. Bellwood Copse gear is wooden and fletched. The Old Kiln gear is warm, brassy, and fire-marked. Players should be able to guess where a stranger got their equipment by looking at it.

### No Best in Slot

No first-ring area contains an item that is universally best for its slot. A trophy from The Old Kiln is narrow and cultural. A keepsake from Bellwood Copse is situational. A weapon from Tinstone Cut is good for mining defence but not for grave combat. Players choose gear by identity and situation, not by a single power number.

---

## First-Ring Reward Identities

### Crowmile Road

**Equipment identity:** Travel and cartography gear. Wayfaring tools, survey kits, light travel wear.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Travel-stamped leather, surveyor's kit, road-worn boots | Cobbled to Pennywrought | Cartography surveys unlock map extensions |
| Materials | crow_feather, cart_iron_scrap, chalk_mark | 1 to 2 | Arrow fletching, smithing salvage, trail steps |
| Consumables | Trail rations, road salve | Errand to Stamped | Travel buffs, minor stamina recovery |
| Keepsakes | Road traveller's charm, broken cart nail | Stamped | Handicraft input, Cartography boost |
| Trophies | Crowmile waymark | Rare | Trophy slot, Wayfaring memory |

**Repeat value.** Players return for cartography survey points, broken cart salvage, and chalk mark trail steps. The road is never fully surveyed. Finch Quill restocks blank maps. The far end near Crowmile Fork teases future travel content.

---

### Bellwood Copse

**Equipment identity:** Bowcraft and wood gear. Lathwood bows, bellmaple arrows, bat-wing leather.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Lathwood shortbow, bellmaple arrows, bat-wing vambraces | Pig Iron to Bellmetal | Woodcutting and Ranged training |
| Materials | lathwood, bellmaple, bell_fang, warden_herb | 2 to 5 | Bowcraft, beadwork, apothecary |
| Consumables | Bark salve, canopy tea | Stamped | Minor healing, Ranged focus |
| Keepsakes | Bell bat charm, lathwood bead | Stamped | Handicraft, Ranged boost |
| Trophies | Bellwood boar tusk (tease) | Rare | Future trophy slot, bowcraft identity |

**Repeat value.** Players return for bellmaple competitive nodes, bell bat fangs for beadwork, and warden_herb patches. The copse heart has paired bats that drop more frequently. Bark marks on trees contain trail steps. The Witchwood Verge tease at the far boundary keeps woodcutters curious.

---

### Tinstone Cut

**Equipment identity:** Mining and smithing gear. Pickaxes, hammers, pig iron and bellmetal armour.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Pennywrought pickaxe, pig iron handaxe, bellmetal sabre | Pennywrought to Bellmetal | Mining and combat training |
| Materials | tinstone, pig_iron_ore, blackcoal, wardenstone | 1 to 5 | Smithing alloy chain, competitive mining |
| Consumables | Smelting flux, quarry grit | Stamped | Smithing aid, Mining boost |
| Keepsakes | Quarry marker, goblin nail | Stamped | Handicraft, Mining memory |
| Trophies | Deep cut stone | Rare | Trophy slot, mining identity |

**Repeat value.** Players return for the wardenstone competitive seam, the only place in the first ring where miners compete for nodes. Goblin clusters drop pig iron scrap. Osric Penny's contracts restock with tinstone and iron turn-ins. The quarry face is a Wayfaring climb landmark.

---

### Patchfield

**Equipment identity:** Trapping and hide gear. Leather armour, sinew cord, fox-hide chaps.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Rabbit-hide wraps, fox-hide jerkin, sinew-thread treads | Cobbled to Pig Iron | Trapping and Tailoring training |
| Materials | rabbit_hide, fox_hide, sinew_cord, warden_herb | 1 to 5 | Tailoring, bowcraft, apothecary |
| Consumables | Field dressing, hedge tea | Errand to Stamped | Healing, Gardening boost |
| Keepsakes | Fox tooth charm, patchfield sprig | Stamped | Handicraft, Trapping memory |
| Trophies | Patchfield pelt | Rare | Trophy slot, trapping identity |

**Repeat value.** Players return for fox trapping, which is the first midgame trapline. Sinew cord feeds bowcraft and tailoring. Field margin herbs are instanced and always available. Nell Patch's contracts send players back for hides. The far hedge teases future wolf content.

---

### Wardenbrook

**Equipment identity:** Fishing and river gear. Nets, rods, river charms, brook-trout jerkin.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Brook-trread softshoes, river-cast cuffs, herring-scale coif | Pennywrought to Bellmetal | Fishing and Cooking training |
| Materials | brook_trout, bell_herring, river_curio, redback_salmon | 2 to 6 | Cooking, trail clues, competitive fishing |
| Consumables | River stew, brook broth | Stamped | Food, Vitality recovery |
| Keepsakes | River curio charm, trout-scale bead | Stamped | Handicraft, Fishing memory |
| Trophies | Redback fin | Rare | Trophy slot, fishing identity |

**Repeat value.** Players return for redback salmon at the far bank, the first competitive fishing pool. River curios contain random materials and trail clues. Warden Holt's patrol route contracts restock. The broken bridge teases future Carpentry content.

---

### Lowgrave

**Equipment identity:** Grave and Favour gear. Beadwork charms, crypt-worn cloth, graveiron tease.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Grave-dust cuffs, wisp-woven cowl, bone-chip charmward | Pig Iron to Blackbar | Favour and Magic training |
| Materials | grave_dust, bone_chips, faint_bead, grave_ash | 1 to 4 | Apothecary, beadwork, hearthcraft |
| Consumables | Grave candles, rot salve | Stamped | Favour rite, disease cure |
| Keepsakes | Wisp bead, gravekeeper's fragment | Stamped | Handicraft, Favour memory |
| Trophies | Gravekeeper's tooth fragment | Rare | Trophy slot, grave identity |

**Repeat value.** Players return for Grave Wisp drops, which are competitive and magic-resistant. The Offering Stone consumes grave flowers and candles for Favour XP. Group crypt entry is the first multiplayer combat content. Sister Writ's rites send players back. Grave Underways tease at the deepest crypt.

---

### The Old Kiln

**Equipment identity:** Smithing and fire gear. Bellmetal plate, warm-scale gauntlets, drake-tooth foci.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Bellmetal harness, warm-scale gauntlets, drake-tooth focus | Bellmetal to Wardensteel | Smithing and combat training |
| Materials | fire_clay, warm_scale, drake_tooth, bellmetal_ore | 3 to 5 | Beadwork, hearthcraft, tailoring, magic foci |
| Consumables | Fire salve, heat draught | Stamped | Fire resistance, Smithing boost |
| Keepsakes | Drake scale charm, kiln ash bead | Stamped | Handicraft, Smithing memory |
| Trophies | Tallow drake scale | Rare | Trophy slot, fire identity |

**Repeat value.** Players return for the Ash Drake Whelp, a competitive miniboss spawn. The Kiln Fire is an advanced smithing station that requires Hearthcraft to maintain. Fire clay feeds beadwork and hearthcraft. Pippa Hearth's contracts restock. The Ash Flats tease future fire magic content.

---

### Sootstairs

**Equipment identity:** Under-town and Sleight gear. Shadow-worn leather, lockpick belts, blacksealed marks.

| Reward Category | What the Area Gives | Tier Range | Why Players Return |
|-----------------|---------------------|------------|-------------------|
| Equipment | Blacksealed treads, cutpurse vambraces, shadow-worn jerkin | Pig Iron to Blackbar | Sleight and combat training |
| Materials | blackcoal_ash, blank_writ, wax_seal, stolen_coin_pouch | 2 to 3 | Hearthcraft, favour, handicraft, currency |
| Consumables | Shadow oil, soot lantern fuel | Stamped | Stealth, under-way navigation |
| Keepsakes | Blacksealed mark, writ seal | Stamped | Handicraft, Sleight memory |
| Trophies | Cutpurse mask | Rare | Trophy slot, under-town identity |

**Repeat value.** Players return for Blacksealed Cutpurse spawns, which are slow and rare. Marn Lock's hidden stall restocks lockpicks and buys writs. Blank writs feed the Civic Ledger. Hidden shrines offer Favour cleanse points. The deepest tunnels tease future black market content.

---

## Equipment Tier Identity by Area

Each first-ring area maps to a specific equipment tier range and a specific cultural gear identity. This is not a hard gate. A player can wear any tier they can craft or buy. But the materials and identity of each tier come from specific places.

| Area | Primary Tier Range | Cultural Gear Identity | Signature Material |
|------|-------------------|------------------------|-------------------|
| Crowmile Road | Cobbled to Pennywrought | Travel and cartography | cart_iron_scrap, chalk_mark |
| Bellwood Copse | Pig Iron to Bellmetal | Bowcraft and wood | lathwood, bellmaple, bell_fang |
| Tinstone Cut | Pennywrought to Bellmetal | Mining and smithing | tinstone, pig_iron_ore, wardenstone |
| Patchfield | Cobbled to Pig Iron | Trapping and hides | rabbit_hide, fox_hide, sinew_cord |
| Wardenbrook | Pennywrought to Bellmetal | Fishing and river | brook_trout, redback_salmon, river_curio |
| Lowgrave | Pig Iron to Blackbar | Grave and Favour | grave_dust, faint_bead, grave_ash |
| The Old Kiln | Bellmetal to Wardensteel | Smithing and fire | fire_clay, warm_scale, drake_tooth |
| Sootstairs | Pig Iron to Blackbar | Under-town and Sleight | blackcoal_ash, blank_writ, wax_seal |

The tier range is a guideline, not a lock. A player with 50 Smithing can make Wardensteel anywhere. But the *identity* of Wardensteel gear, the look and the name, comes from the places where wardenstone is mined and where the Kiln Fire burns.

---

## Repeat Value by Area

### Why Players Return to Crowmile Road

Cartography surveys are personal progress. A player who has walked the road once has not finished it. Chalk marks appear at new survey points. Broken carts respawn and yield fresh scrap. Finch Quill restocks blank maps and buys trail scraps. The road is a loop, not a line.

### Why Players Return to Bellwood Copse

Bellmaple is a competitive node. Multiple woodcutters want the mature trees. Bell bats respawn in pairs at the copse heart, yielding more fangs per hour than solo bats at the edge. Warden_herb patches are instanced and always available. The Witchwood Verge tease keeps high-level woodcutters curious about what comes next.

### Why Players Return to Tinstone Cut

Wardenstone is the first competitive mining node in the game. It yields 20 percent more XP per action but requires waiting or world-hopping. Goblin clusters drop pig_iron_scrap, a smithing input that never goes out of demand. Osric Penny's contracts restock and pay structured coin. The quarry face is a Wayfaring landmark.

### Why Players Return to Patchfield

Fox trapping is the first midgame trapline. Fox hides are soft leather used in midgame tailoring. Sinew cord feeds bowcraft and tailoring simultaneously. Nell Patch's contracts restock. The field margin herbs are instanced. The far hedge wolf tease keeps trappers talking.

### Why Players Return to Wardenbrook

Redback salmon is a competitive fish. The far bank pools are limited and deep. River curios contain random materials and trail clues, making every cast a small lottery. Warden Holt's patrol route contracts restock. The broken bridge tease keeps fishers wondering about the ferry.

### Why Players Return to Lowgrave

Grave wisps are competitive and magic-resistant. Their drops feed beadwork and hearthcraft. The Offering Stone is a Favour training spot that consumes grave flowers and candles. Group crypt entry is multiplayer content. Sister Writ's rites restock. The Grave Underways tease keeps Favour players pushing deeper.

### Why Players Return to The Old Kiln

The Ash Drake Whelp is a competitive miniboss. Its scales and teeth are high-tier crafting materials. The Kiln Fire is an advanced smithing station that no other first-ring area offers. Fire clay feeds beadwork and hearthcraft. Pippa Hearth's contracts restock. The Ash Flats tease keeps smiths burning.

### Why Players Return to Sootstairs

Blacksealed cutpurses are slow rare spawns with valuable drops. Marn Lock's hidden stall is the only place to buy lockpicks in the first ring. Blank writs feed the Civic Ledger deed system. Hidden shrines offer Favour cleanse points. The deepest tunnel tease keeps Sleight players slipping further down.

---

## Rare Drops and Trophies

Every first-ring area has at least one rare drop or trophy that marks a player as having done that content. Trophies sit in the trophy accessory slot and provide no stats. They are bragging rights, not power.

| Area | Rare Drop or Trophy | Source | Identity |
|------|---------------------|--------|----------|
| Crowmile Road | crowmile waymark | Cartography survey completion | Travel memory |
| Bellwood Copse | bellwood boar tusk (tease) | Future beast spawn | Bowcraft identity |
| Tinstone Cut | deep cut stone | Wardenstone seam milestone | Mining identity |
| Patchfield | patchfield pelt | Fox trapping milestone | Trapping identity |
| Wardenbrook | redback fin | Redback salmon catch milestone | Fishing identity |
| Lowgrave | gravekeeper's tooth fragment | Grave wisp rare drop | Grave identity |
| The Old Kiln | tallow drake scale | Ash drake whelp rare drop | Fire identity |
| Sootstairs | cutpurse mask | Blacksealed cutpurse rare drop | Under-town identity |

These trophies are narrow and cultural. A tallow drake scale tells other players you fought the Kiln guardian. A gravekeeper's tooth fragment says you cleansed crypts. They are not best in slot. They are best in story.

---

## Second-Ring Reward Teases

The second ring is not yet built, but its reward identities are fixed. When these areas arrive, they must fit the escalation curve and cultural identity established in the first ring.

| Area | Future Reward Identity | Tier Range | What Players Will Return For |
|------|------------------------|------------|---------------------------|
| Crownheart Forest | Master bowcraft and crownheart timber | Crownsteel | Crownheart logs, competitive ancient trees |
| Blackbar Cut | Graveiron ore and blackbar alloy | Graveiron | Graveiron ore, group quarry combat |
| Grave Underways | Gravebound gear materials | Graveiron to Blueglass | Gravebound materials, multi-level crypt descent |
| Witchwood Verge | Witchwood and curse ward gear | Blueglass | Witchwood logs, magic herb clusters |
| Moth Ferry Crossing | Ferry gear and river crossing tools | Argent tease | Ferry access, mid-tier ocean fish |
| Carmine Yard | Carmine steel and pit fight gear | Carmine Steel | Advanced dyes, pit fight trophies |
| Argent Chapel Road | Argent blessings and chapel gear | Argent | Argent fittings, shrine cleansing rewards |

These teases exist now as rumours, road signs, and dialogue hints. They give first-ring players a reason to keep training beyond the first ring's level bands.

---

## Player Shorthand

Players do not use formal names when talking about rewards. They use shorthand that shifts by context.

| Shorthand | What It Means in Context | Example |
|-----------|--------------------------|---------|
| "the gear" | The best equipment the speaker can currently use from that area | "I'm off to the Cut for the gear" means bellmetal or wardensteel-tier mining equipment |
| "the drops" | The most valuable creature drops the speaker is hunting | "Farming the drops in the copse" means bell_fang and bellmaple |
| "the contracts" | The active Wardenry contracts for that area | "Doing the contracts at the graves" means bone chip and grave dust turn-ins |
| "the trophies" | The rare trophy or keepsake the speaker is chasing | "Going for the trophy at the Kiln" means tallow drake scale |
| "the keepsakes" | The Handicraft materials for charm or accessory crafting | "Need the keepsakes from the Brook" means river curio charms |
| "the nodes" | The competitive resource nodes | "Camping the nodes" means wardenstone, bellmaple, or redback salmon |
| "the rites" | The Favour rite locations | "Doing the rites" means Offering Stone or hidden shrine cleanses |
| "the scrap" | The salvage and common drops | "Selling the scrap" means cart_iron_scrap, pig_iron_scrap, or blackcoal_ash |

---

## Banned Concepts

The following concepts are banned from reward identity design. They sound like generic MMO systems or generic fantasy, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| Best in Slot (BiS) | Turns all reward choice into a single number chase | Cultural identity, situational gear, trophy slots |
| Item levels | Implies a vertical power scale that invalidates old content | Equipment tiers with cultural names: Pennywrought, Bellmetal, Wardensteel |
| Item power scores | Reduces gear identity to a single stat | Visual identity, area origin, situational bonuses |
| Gear score | Global number that gates content | Combat level for PvP brackets only; area access is local |
| iLevel | Meta design language that strips gear of story | Tier names that carry place and culture |
| Equipment rating | Generic evaluation system | Player shorthand: "the gear," "the drops," "the trophies" |
| Random stat rolls | Removes predictability and planning from crafting | Fixed stats per tier, fixed recipes, fixed materials |
| Loot boxes | Gambling mechanics break player trust | Rare drops with fixed sources, trophy hunting, contract rewards |
| Gacha | Same as loot boxes | Competitive nodes, rare spawns, contract turn-ins |
| Tier lists | Meta community language that collapses identity into ranking | Area identity tables, equipment tier identity by place |
| Universal BiS accessories | Accessories that are best everywhere | Narrow trophies, situational keepsakes, cultural charms |
| Gear score gates | Content locked behind a number | Local skill thresholds, danger classes, deed tiers |

---

## Deferred to Implementation

The following work is explicitly deferred. This document defines reward identity and cultural framing, not buildable content.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| Exact drop rates per creature | Needs loot system and economy calibration | E08 or later |
| Drop table JSON schema | Needs content pipeline and validation | E08 or later |
| Reward amount calibration | Needs simulation and playtest | E07 or later |
| Shop stock pricing | Needs economy calibration and shop system | E07 or later |
| Contract reward tables | Needs Wardenry system implementation | E08 or later |
| Trophy acquisition logic | Needs trophy system and drop rules | E09 or later |
| Keepsake crafting recipes | Needs Handicraft system and recipe JSON | E08 or later |
| Competitive node lock logic | Needs spawn system and competition tuning | E09 or later |
| Rare drop frequency tuning | Needs live player data and feedback | Post-launch |
| Second-ring reward tables | No second-ring maps exist yet | E11 or later |
| Trophy visual models | Needs art pipeline | E10 or later |
| Keepsake effect values | Needs simulation and playtest | E07 or later |

---

## Related Documents

- `docs/items/00-index.md` — Item system overview, tier names, and equipment slots
- `docs/economy/reward-calibration.md` — Reward philosophy and Wardenry reward bands
- `docs/ledger/rewards-and-stamps.md` — Civic Ledger reward types, stamps, cosmetics, and rare trophies
- `docs/skills/skill-system.md` — Equipment tiers: Cobbled, Pennywrought, Pig Iron, Bellmetal, Blackbar, Wardensteel, Greenwold, Graveiron, Blueglass, Carmine Steel, Argent, Crownsteel, Starfall
- `docs/areas/first-ring-areas.md` — Full area definitions for all eight first-ring spaces
- `docs/areas/area-resource-progression.md` — Resource tiers and identity per area
- `docs/areas/area-creature-progression.md` — Creature drops and combat roles per area
- `docs/areas/area-level-bands.md` — Level bands, danger classes, and risk/reward curve
- `docs/creatures/starter-drop-tables.md` — Drop table format and starter creature drops
- `docs/creatures/rare-drops-and-trophies.md` — Rare reward identity and trophy canon
- `docs/creatures/wardenry-contracts.md` — Contract types, starter contracts, and contract rewards

*Last updated: 2026-05-31*
