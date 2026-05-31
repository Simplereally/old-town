---
doc_type: authority
canonical_path: docs/areas/area-quest-hooks.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/quests/quest-system.md`
- `docs/quests/starter-quest-arc.md`
- `docs/quests/dialogue-style-guide.md`
- `docs/trails/00-index.md`
- `docs/trails/trail-quest-hooks.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/areas/route-unlocks-and-gates.md`
- `docs/areas/area-creature-progression.md`
- `docs/areas/area-resource-progression.md`

# Area Quest Hooks

Quest hooks are the small mysteries that pull players from the Market Bell into the first ring and beyond. They are not epic narratives. They are local problems: a broken cart wheel on Crowmile Road, a missing patrol report at Wardenbrook, a kiln fire that has gone cold. Each hook teaches a system, introduces an NPC voice, and gives players a reason to walk somewhere new.

This document maps every first-ring area to its quest hooks, chains those hooks into cross-area stories, and defines the world-state triggers that unlock gates, routes, and second-ring teases. It is the bridge between the starter quest arc and the outer world.

---

## Quest Hook Philosophy

Old Town quests begin with broken things, not chosen heroes. A quest hook is a reason to leave the district and come back changed. The philosophy is simple:

- Every hook must teach something: a skill, a system, a route, or an NPC relationship.
- Every hook must connect to at least one starter quest or existing system.
- Every hook must end with a reason to revisit the giver.
- No hook may invent a world-ending threat, a prophecy, or a destiny.

The tone is civic, practical, and slightly suspicious. NPCs do not ask players to save the kingdom. They ask players to find a missing permit, deliver a message to a ferryman, or prove that a grave flower was planted in the wrong soil. The stakes are personal, local, and grounded in the trade language of the town.

---

## Design Authority Summary

### What player fantasy does this support?

The fantasy of becoming a local problem-solver rather than a wandering mercenary. Players learn that the world outside the district is full of small mysteries that matter to the people who live there. A player who completes the Crowmile hooks feels like a traveler who knows the road. A player who completes the Lowgrave hooks feels like someone the shrine keepers trust with the dead.

### What systems does it connect to?

The quest system, dialogue system, Civic Ledger deeds, Oldroad Trails, Wardenry contracts, Favour rites, route gates, area unlocks, and all 25 skills. Every hook is a tutorial disguised as an errand.

### What items, NPCs, areas, and resources does it create?

This document creates quest hook definitions for all eight first-ring areas and seven second-ring teases. It defines hook IDs, giver NPCs, trigger conditions, objective summaries, reward types, and chain connections. It does not create new items, creatures, or resources beyond those already defined in `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, and `docs/resources/resource-taxonomy.md`.

### What is starter, midgame, and endgame?

Starter is the first-ring near edge, where hooks are solo errands with no combat requirement. Midgame is the first-ring deep, where hooks require skill checks, creature combat, or cross-area travel. Endgame is second-ring unlock hooks, where completion opens a gate, restores a ferry, or clears a patrol block.

### What should players call it in shorthand?

Players call individual quests "the hook" or "the contract." They call connected sequences "the chain." They call trail-based mysteries "the trail." They call Wardenry-based hooks "the patrol" or "the clearance."

### What is banned because it sounds generic or derivative?

Chosen-one framing, world-ending threats, prophecy, ancient evil, destiny, fate, hero's journey, save the world, dark lord, cosmic threat, generic escort quests, generic delivery quests, "kill 10 rats" without context, lore dumps, and NPCs who exist only to explain systems.

### What is deferred to implementation?

Quest JSON, dialogue graphs, quest objective tracking, world-state implementation, reward distribution tables, quest completion logic, exact trigger conditions, and chain branching. This document defines identity and connection, not buildable content.

### What existing docs must link to it?

`docs/quests/quest-system.md`, `docs/quests/starter-quest-arc.md`, `docs/quests/dialogue-style-guide.md`, `docs/ledger/oldroad-trails.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/areas/route-unlocks-and-gates.md`, `docs/areas/area-creature-progression.md`, `docs/areas/area-resource-progression.md`.

---

## First-Ring Quest Hooks

Each first-ring area has two to three quest hooks: a starter hook for new arrivals, a midgame hook that teaches depth, and an optional chain hook that connects to another area or a starter quest.

### Crowmile Road

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| crowmile_broken_cart | The Wheel on the Road | Finch Quill | Walk past the broken cart at the road midpoint | Salvage `cart_iron_scrap` from three broken carts and bring them to Finch | `chalk_mark` trail step, Cartography XP | Teaches salvage, object interaction, and Cartography survey |
| crowmile_finch_quill | Finch's Missing Quill | Finch Quill | Talk to Finch after completing The Wheel on the Road | Retrieve Finch's writing quill from a crow nest near the road end | Blank map item, Finch Quill shop unlock | Teaches vertical object looting and crow combat |
| crowmile_rockfall_clear | The Rockfall Block | Finch Quill | Reach the far end of Crowmile Road | Clear the `crowmile_rockfall` with 10 Mining or report back to Finch | Route unlock toward Crowmile Fork, `cart_iron_scrap` stack | Connects to `docs/areas/route-unlocks-and-gates.md` rockfall gate |

**Chain connection.** The Wheel on the Road leads to Finch's Missing Quill, which leads to The Rockfall Clear. Completing the chain unlocks Finch Quill as a map vendor and reveals a hidden trail step on the road.

### Bellwood Copse

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| bellwood_lath_contract | Letha's Lathwood Request | Letha Lath (via contract board) | Enter Bellwood Copse with Woodcutting level 5 | Cut 10 `lathwood` logs and deliver them to Letha Lath at Lath Yard | Bowcraft XP, `lathwood` stack, Letha reputation | Connects to `String Enough to Sing` starter quest and bowcraft loop |
| bellwood_bark_mark | The Bark Mark | Letha Lath | Find a marked tree while cutting lathwood | Survey the bark mark with Cartography, follow the mark to a hidden cache | `chalk_mark` trail step, Cartography XP, `bell_fang` | Teaches Cartography survey and hidden object discovery |
| bellwood_wolf_sign | The Wolf Gap | Letha Lath | Reach the far edge of Bellwood Copse | Investigate wolf signs at the copse boundary and report back | Wayfaring XP, shortcut reveal tease toward Foundry Row | Connects to `docs/areas/route-unlocks-and-gates.md` hidden trail |

**Chain connection.** Letha's Lathwood Request leads to The Bark Mark, which is an Oldroad Trail source. The Wolf Gap is a standalone tease that connects to the Crownheart Forest chain later.

### Tinstone Cut

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| tinstone_penny_debt | Penny's Tinstone Debt | Osric Penny | Enter Tinstone Cut with Mining level 1 | Mine 10 `tinstone` and deliver to Osric Penny at Foundry Row | Smithing XP, `tinstone` stack, Penny reputation | Connects to `A Penny for the Forge` starter quest |
| tinstone_sealed_stone | The Sealed Stone | Osric Penny | Mine a sealed stone at the quarry face | Open the sealed stone to reveal a trail clue, then bring the clue to Osric | `writ_trail` step, Mining XP, `pig_iron_ore` sample | Teaches Mining rare rolls and Oldroad Trails |
| tinstone_grib_clearance | Gribs in the Deep Cut | Warden Holt (via contract board) | Reach the deep tunnels where `mudhook_grib` spawns | Clear three gribs and report to Warden Holt | Wardenry contract XP, `bead_clay` stack, `blank_writ` | Connects to `docs/creatures/wardenry-contracts.md` and creature progression |

**Chain connection.** Penny's Tinstone Debt leads to The Sealed Stone, which produces a trail step. Gribs in the Deep Cut is a Warden contract that teaches magic-weak creature combat and connects to the Blackbar Cut permit gate later.

### Patchfield

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| patchfield_nell_hide | Nell's Hide Request | Nell Patch | Enter Patchfield with Trapping level 1 | Trap 5 `rabbit_hide` and deliver to Nell Patch at Patch Lane | Tailoring XP, `rabbit_hide` stack, Nell reputation | Connects to starter economy loops and tailoring |
| patchfield_fox_tooth | The Fox Tooth | Nell Patch | Trap a `bog_fox` in Patchfield | Bring the `fox_tooth` to Nell as proof of reaching the far hedge | `fox_hide`, `sinew_cord`, Tailoring XP | Teaches fox trapping and far-hedge exploration |
| patchfield_hedge_mark | The Hedge Mark | Nell Patch | Find a torn scrap on the far hedge | Deliver the scrap to Nell, who recognizes it as a Carmine Yard dye recipe tease | `carmine_pigment` sample (single), Gardening XP | Connects to `docs/areas/second-ring-areas.md` Carmine Yard tease |

**Chain connection.** Nell's Hide Request leads to The Fox Tooth, which leads to The Hedge Mark. The Hedge Mark is the first second-ring tease, hinting at Carmine Yard before players can go there.

### Wardenbrook

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| wardenbrook_ferry_note | The Ferry Note | Edda Tinfin | Wade the Wardenbrook ford and find the ferry post | Read the ferry post note and report back to Edda Tinfin at River Stoop | Fishing XP, `river_curio`, Edda reputation | Connects to `docs/areas/second-ring-areas.md` Moth Ferry Crossing tease |
| wardenbrook_holt_patrol | Holt's Patrol Report | Warden Holt | Follow a patrol route marker at the far bank | Check three patrol markers and return the report to Warden Holt | Wardenry contract XP, `brook_trout` stack, Wayfaring XP | Teaches Wardenry patrol system and far-bank exploration |
| wardenbrook_bridge_rumor | The Broken Bridge | Edda Tinfin | Reach the broken bridge at the ford end | Investigate the bridge damage and bring a `shell_chip` from the river snapper nest | `redback_salmon` catch unlock tease, Fishing XP | Connects to route unlocks and future bridge restoration |

**Chain connection.** The Ferry Note leads to The Broken Bridge, which is a prerequisite for the Moth Ferry Crossing quest chain. Holt's Patrol Report is a standalone Warden contract that teaches patrol route reading.

### Lowgrave

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| lowgrave_soll_shovel | Soll's Missing Shovel | Gravekeeper Soll | Enter Lowgrave through the Gravegate iron gate | Find Soll's shovel in a crypt edge mound and return it | Favour XP, `grave_dust` stack, Soll reputation | Connects to `Gravegate Flowers` starter quest and Favour system |
| lowgrave_offering_stone | The Offering Stone | Sister Writ | Reach the Offering Stone in Lowgrave | Place `grave_flowers` and a candle at the stone, then report to Sister Writ | Favour rite XP, `faint_bead` drop tease, shrine boon progress | Connects to `docs/favour/favour-system.md` and grave rites |
| lowgrave_wisp_clearance | Wisp Swarm Clearance | Sister Writ | Enter a group crypt instance in Lowgrave | Clear a `grave_wisp` swarm with at least one other player | Group combat XP, `grave_ash`, Wardenry contract credit | Teaches group crypt instances and magic-resistant combat |

**Chain connection.** Soll's Missing Shovel leads to The Offering Stone, which is a Favour rite tutorial. Wisp Swarm Clearance is a group combat hook that connects to the Grave Underways unlock later.

### The Old Kiln

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| kiln_pippa_clay | Pippa's Fire Clay | Pippa Hearth | Enter The Old Kiln with Smithing level 15 | Gather 10 `fire_clay` from the clay pits and deliver to Pippa Hearth | Hearthcraft XP, `fire_clay` stack, Pippa reputation | Connects to Hearthcraft and smithing station loops |
| kiln_cold_fire | The Cold Kiln | Pippa Hearth | Reach the Kiln Fire station and find it unlit | Relight the Kiln Fire using `blackcoal_ash` and Hearthcraft level 20 | Advanced smithing station unlock, `bellmetal_ore` sample | Teaches Hearthcraft station maintenance and advanced smelting |
| kiln_drake_smoke | The Drake Smoke | Pippa Hearth | Approach the Drake Pit and survive the `ash_drake_whelp` encounter | Report the drake smoke sighting to Pippa and bring back one `warm_scale` | `drake_tooth`, `warm_scale`, miniboss combat XP | Connects to `docs/creatures/starter-creatures.md` ash_drake_whelp and Kiln Ash Flats tease |

**Chain connection.** Pippa's Fire Clay leads to The Cold Kiln, which unlocks the advanced smithing station. The Drake Smoke is a standalone miniboss hook that connects to future fire magic content.

### Sootstairs

| Hook ID | Quest Name | Giver | Trigger | Objective | Reward | System Connection |
|---------|------------|-------|---------|-----------|--------|-------------------|
| sootstairs_marn_seal | Marn's Wax Seal | Marn Lock | Enter Sootstairs with a `soot_lantern` and 20 Wayfaring | Find three `wax_seal` drops from `blacksealed_cutpurse` and bring them to Marn Lock | Sleight XP, lockpick item, Marn Lock shop unlock | Connects to `The Missing Bell-Clapper` starter quest and Sleight system |
| sootstairs_blacksealed_writ | The Blacksealed Writ | Marn Lock | Find a `blank_writ` on a cutpurse | Decode the writ using Sleight and deliver it to Marn | `stolen_coin_pouch`, ledger entry, `blank_writ` stack | Teaches Sleight decoding and Civic Ledger input |
| sootstairs_hidden_shrine | The Hidden Shrine | Sister Writ | Find the Hidden Shrine in the deeper tunnels | Cleanse the shrine with a candle and Favour level 15 | Favour cleanse XP, under-way navigation XP, Sootstairs safe zone | Connects to `docs/favour/favour-system.md` and under-way exploration |

**Chain connection.** Marn's Wax Seal leads to The Blacksealed Writ, which produces ledger input. The Hidden Shrine is a Favour hook that teaches under-way cleansing and connects to the Sootstairs Deep tease.

---

## Quest Chains

Quest chains are sequences of hooks that connect across areas, teaching players that the world is a network of relationships rather than a list of isolated zones. Each chain has a starting hook, a middle hook in a different area, and an end hook that unlocks something.

### The Crowmile Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Crowmile Road | The Wheel on the Road | Finch Quill as a recurring NPC |
| 2 | Crowmile Road | Finch's Missing Quill | Blank maps and cartography shop |
| 3 | Bellwood Copse | The Bark Mark | Hidden trail step from Crowmile to Bellwood |
| 4 | Crowmile Road | The Rockfall Clear | Crowmile Fork access and far-road travel |

**Chain identity.** This chain teaches travel, salvage, and map-making. It turns Crowmile Road from a scary first walk into a known route with a friendly scribe at the midpoint.

### The Lathwood Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Old Town (Lath Yard) | `String Enough to Sing` (starter quest) | Letha Lath as a bowcraft mentor |
| 2 | Bellwood Copse | Letha's Lathwood Request | Lathwood cutting and bowcraft upgrade |
| 3 | Bellwood Copse | The Wolf Gap | Crownheart Forest tease and hidden shortcut |
| 4 | Crownheart Forest (future) | Warden contract: Thin the Wolf Packs | Crownheart Forest gate unlock |

**Chain identity.** This chain teaches woodcutting escalation and the concept that the deep wood is guarded, not open. Players learn that `lathwood` is a step, not a destination.

### The Penny Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Old Town (Foundry Row) | `A Penny for the Forge` (starter quest) | Osric Penny as a smithing mentor |
| 2 | Tinstone Cut | Penny's Tinstone Debt | Tinstone mining and alloy introduction |
| 3 | Tinstone Cut | The Sealed Stone | Oldroad Trail source and quarry face tease |
| 4 | Tinstone Cut | Gribs in the Deep Cut | Warden contract system and deep tunnel access |
| 5 | Blackbar Cut (future) | Permit gate quest | `blackbar_permit` and deep ore access |

**Chain identity.** This chain teaches mining depth, alloy progression, and the permit system. Players learn that the deep cut is barred for a reason, and that reason is civic, not magical.

### The Gravegate Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Old Town (Gravegate) | `Gravegate Flowers` (starter quest) | Sister Writ as a Favour mentor |
| 2 | Lowgrave | Soll's Missing Shovel | Lowgrave access and gravekeeper relationship |
| 3 | Lowgrave | The Offering Stone | Favour rite system and grave flower consumption |
| 4 | Lowgrave | Wisp Swarm Clearance | Group crypt instances and combat cooperation |
| 5 | Grave Underways (future) | Soot lantern descent quest | Multi-level crypt access |

**Chain identity.** This chain teaches Favour escalation, group combat, and the concept that the dead have layers. Players learn that Gravegate is a threshold, not a destination.

### The Bell-Clapper Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Old Town (Market Bell) | `The Missing Bell-Clapper` (starter quest) | Sleight and Cartography introduction |
| 2 | Sootstairs | Marn's Wax Seal | Black market access and Sleight practice |
| 3 | Sootstairs | The Blacksealed Writ | Civic Ledger input and under-town politics |
| 4 | Old Town (Market Bell) | Return the clapper evidence | Market Bell restoration and Mara Bellkeeper reputation |
| 5 | Bellwood Copse | The Bark Mark (cross-chain) | Hidden trail step that references the bell-clapper theft |

**Chain identity.** This chain teaches civic mystery, cross-town routing, and the concept that theft in Old Town is a puzzle, not a combat encounter. It connects Sootstairs to the Market Bell and hints that the clapper was hidden in more than one place.

### The Ferry Chain

| Step | Area | Hook | What It Unlocks |
|------|------|------|-----------------|
| 1 | Wardenbrook | The Ferry Note | Moth Ferry Crossing tease and ferryman rumor |
| 2 | Wardenbrook | The Broken Bridge | Bridge damage investigation and river snapper combat |
| 3 | Wardenbrook | Holt's Patrol Report | Wardenry patrol system and far-bank standing |
| 4 | Moth Ferry Crossing (future) | Ferry restoration quest | Ferry mechanic and new region access |

**Chain identity.** This chain teaches river travel, patrol contracts, and the concept that some routes are closed until someone fixes them. The ferry is not a menu option. It is a boat that needs a quest.

---

## World-State Triggers

Quest completion changes the world. Not with cutscenes or global announcements, but with local, visible differences: a gate opens, an NPC appears, a note changes, a route becomes walkable.

### First-Ring Unlocks

| Quest Completion | World-State Change | Area Affected |
|------------------|--------------------|---------------|
| `The Wheel on the Road` | Finch Quill sets up a permanent map stall at the Crowmile midpoint | Crowmile Road |
| `The Rockfall Clear` | `crowmile_rockfall` is removed, opening the road to Crowmile Fork | Crowmile Road |
| `Letha's Lathwood Request` | Letha Lath offers recurring lathwood contracts at Lath Yard | Bellwood Copse / Old Town |
| `Penny's Tinstone Debt` | Osric Penny offers recurring tinstone contracts at Foundry Row | Tinstone Cut / Old Town |
| `Gribs in the Deep Cut` | Warden Holt offers recurring grib contracts, deep tunnel access is marked safe | Tinstone Cut |
| `Nell's Hide Request` | Nell Patch offers recurring hide contracts at Patch Lane | Patchfield / Old Town |
| `The Ferry Note` | Edda Tinfin mentions the ferryman in regular fishing chat | Wardenbrook / Old Town |
| `Soll's Missing Shovel` | Gravekeeper Soll offers recurring grave maintenance tasks | Lowgrave / Old Town |
| `The Offering Stone` | Sister Writ offers recurring Favour rites at Shrine Hearth and Lowgrave | Lowgrave / Old Town |
| `Pippa's Fire Clay` | Pippa Hearth offers recurring clay contracts at Foundry Row | The Old Kiln / Old Town |
| `The Cold Kiln` | Kiln Fire station is permanently lit and usable for advanced smithing | The Old Kiln |
| `Marn's Wax Seal` | Marn Lock's hidden stall becomes permanently accessible | Sootstairs |
| `The Hidden Shrine` | Hidden Shrine becomes a permanent Favour cleanse point | Sootstairs |

### Second-Ring Unlock Triggers

| Quest Completion | World-State Change | Area Unlocked |
|------------------|--------------------|---------------|
| Complete `The Wolf Gap` + Warden contract "Thin the Wolf Packs" | `crownheart_sign` patrol block is removed | Crownheart Forest |
| Complete `Gribs in the Deep Cut` + Chartered quarry deed | `blackbar_gate` opens with permit check | Blackbar Cut |
| Complete `Wisp Swarm Clearance` + `soot_lantern` + 20 Wayfaring | `grave_underways_stair` descent is permitted | Grave Underways |
| Complete `The Bark Mark` + Favour rite to ward curse | `witchwood_boundary` curse block is removed | Witchwood Verge |
| Complete `The Ferry Note` + `The Broken Bridge` + ferry restoration quest | `moth_ferry_dock` boat appears, ferryman NPC spawns | Moth Ferry Crossing |
| Complete `The Hedge Mark` + Stamped Patch Lane deed | `carmine_sign` hedge gap opens | Carmine Yard |
| Complete `The Offering Stone` + Stamped Shrine Hearth deed + Favour rite | `argent_gate` opens | Argent Chapel Road |

### Cross-Area Route Unlocks

| Trigger | Route Unlocked | Shortcut Type |
|---------|----------------|---------------|
| Complete `Finch's Missing Quill` + Cartography survey | Crowmile Road to Bellwood Copse hidden trail | Cartography reveal |
| Complete `The Wolf Gap` + 25 Wayfaring | Foundry Row to Bellwood Copse wolf gap shortcut | Wayfaring shortcut |
| Complete `The Rockfall Clear` + 10 Mining | Crowmile Road far end to Crowmile Fork | Blocked path clear |
| Complete `Holt's Patrol Report` + 10 Wayfaring | Wardenbrook far bank patrol route | Wayfaring stamina reduction |

---

## Second-Ring Quest Teases

Second-ring areas are not yet built, but their quest hooks are already seeded in first-ring dialogue, road signs, and trail steps. These teases are lighter than first-ring hooks. They are promises, not contracts.

### Crownheart Forest

**Tease ID:** `crownheart_wolf_contract`
**Seeded by:** Letha Lath mentions crownheart bows she cannot yet make. The `crownheart_sign` reads "No patrol beyond this point."
**Future hook:** A Warden contract to thin wolf packs at the Bellwood edge. Completion removes the patrol block and opens the deep wood.
**System connection:** Wardenry contracts, Woodcutting mastery, Cartography landmarks.

### Blackbar Cut

**Tease ID:** `blackbar_permit_quest`
**Seeded by:** The `blackbar_gate` reads "Barred by order of the Warden." Osric Penny mentions ore he cannot yet smelt.
**Future hook:** A quarry permit quest that requires Chartered-tier deeds and a recommendation from Warden Holt. Completion opens the barred shaft.
**System connection:** Civic Ledger deeds, Mining depth, group combat.

### Grave Underways

**Tease ID:** `grave_underways_descent`
**Seeded by:** Sister Writ mentions "the deeper dead" in Favour training. The `grave_underways_stair` is sealed without a lantern.
**Future hook:** A descent quest that requires a `soot_lantern`, 20 Wayfaring, and completion of Wisp Swarm Clearance. Deeper levels need higher Favour rites.
**System connection:** Favour wards, under-way navigation, multi-level crypts.

### Witchwood Verge

**Tease ID:** `witchwood_curse_rite`
**Seeded by:** Blue glow visible from Bellwood Edge on clear nights. Finch Quill trail step: "Where the wood watches back."
**Future hook:** A Favour rite to ward against the wood's curse. Completion removes the boundary block and allows witchwood cutting.
**System connection:** Favour rites, Woodcutting, Beadwork, curse ward mechanics.

### Moth Ferry Crossing

**Tease ID:** `moth_ferry_restoration`
**Seeded by:** Ferry post note: "Ferry departs at dawn. Return tomorrow." Edda Tinfin mentions the crossing in fishing chat.
**Future hook:** A quest to restore the ferry boat, gather materials, and convince the ferryman to return. Each crossing costs one `tinfin`.
**System connection:** Wayfaring shortcuts, Cartography region maps, Fishing.

### Carmine Yard

**Tease ID:** `carmine_dye_source`
**Seeded by:** Nell Patch mentions red dye she cannot yet source. The `carmine_sign` reads "Carmine Yard. Dyers and duelists."
**Future hook:** A deed-tier quest that requires Stamped Patch Lane standing and a introduction from Nell Patch. Completion opens the yard.
**System connection:** Tailoring, Handicraft, civic wagering, dye mechanics.

### Argent Chapel Road

**Tease ID:** `argent_shrine_walk`
**Seeded by:** Sign at Shrine Hearth: "Argent Chapel Road. Walk with offering." Finch Quill trail step references "the silver shrines."
**Future hook:** A pilgrimage quest that requires Stamped Shrine Hearth deeds and a Favour rite. Completion opens the shrine road.
**System connection:** Favour progression, Carpentry building, Argent blessing.

---

## Player Shorthand

Players do not use formal quest names when talking to each other. They use shorthand that shifts by context and familiarity.

| Shorthand | What Players Mean |
|-----------|-------------------|
| "the hook" | Any first-ring quest, especially the first one in an area |
| "the chain" | A connected sequence of quests across areas, like the Penny Chain or the Gravegate Chain |
| "the trail" | An Oldroad Trail-based quest or a quest that produces a trail step |
| "the contract" | A Wardenry-based quest or a repeatable NPC contract |
| "Finch's chain" | The Crowmile Chain starting with The Wheel on the Road |
| "Penny's debt" | `tinstone_penny_debt` or the full Penny Chain |
| "the grave chain" | The Gravegate Chain starting with `Gravegate Flowers` |
| "the bell chain" | The Bell-Clapper Chain starting with `The Missing Bell-Clapper` |
| "the ferry chain" | The Ferry Chain starting with The Ferry Note |
| "the wolf gap" | The Bellwood Copse tease that leads to Crownheart Forest |
| "the deep cut" | The Tinstone Cut tease that leads to Blackbar Cut |
| "the deep grave" | The Lowgrave tease that leads to Grave Underways |
| "the verge" | The Witchwood Verge tease and its curse ward hook |
| "the yard" | The Carmine Yard tease and its dye source hook |
| "the shrines" | The Argent Chapel Road tease and its pilgrimage hook |
| "I got my permit" | Unlocked a deed-tier or permit gate quest |
| "Finch showed me a trail" | Completed a Cartography-revealed quest hook |
| "the ferry is running" | Completed the ferry restoration tease |

---

## Banned Concepts

The following concepts are banned from area quest hook design. They sound like generic fantasy or generic MMO quest design, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| Chosen-one framing | Removes player agency and local grounding | Broken bells, missing permits, civic mysteries |
| World-ending threat | Inflates stakes beyond the town's scale | Local problems: a closed gate, a cold kiln, a lost shovel |
| Prophecy | Generic fantasy narrative device | Rumors, trail steps, and NPC gossip |
| Ancient evil | Generic fantasy antagonist | Rot pressure, blacksealed cutpurses, drake whelp guardians |
| Destiny or fate | Removes player choice | Deed tiers, permits, and earned standing |
| Hero's journey | Generic narrative arc | Local problem-solver arc: arrive, learn, help, return |
| Save the world | Stakes are too high for first-ring content | Save the kiln fire, clear the road, restore the ferry |
| Dark lord | Generic fantasy villain | Warden Holt's paperwork, Marn Lock's black market, Sister Writ's rites |
| Cosmic threat | Breaks the lo-fi, grounded tone | Drake smoke, grave rot, witchwood curse |
| Generic escort quest | Passive, low-interaction gameplay | Patrol route checks, cart salvage, ferry restoration |
| Generic delivery quest | No teaching value, no choice | Item handoffs with dialogue branches and reputation consequences |
| "Kill 10 rats" without context | Grind disguised as quest | `Rats Under Tally's`, which teaches combat, drops, and Wardenry |
| Lore dumps | Breaks dialogue skimmability | Short NPC lines, trail steps, and object examine text |
| NPCs who only explain systems | Wastes voice and relationship potential | NPCs who have their own problems and happen to teach while solving them |
| Numbered quest tiers | Meta design language | Named hooks with cultural identity |
| Zone quest hubs | Generic MMO structure | Distributed hooks tied to specific NPCs in specific areas |
| Quest markers on the ground | Breaks immersion and exploration | Cartography survey, NPC directions, and trail step clues |

---

## Deferred to Implementation

The following work is explicitly deferred. This document defines quest hook identity, chain connections, and world-state triggers. It does not define buildable quest content.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| Quest JSON schema and content files | Needs quest system implementation and validation pipeline | E08 or later |
| Dialogue graphs for quest givers | Needs dialogue system and NPC voice definitions | E08 or later |
| Quest objective tracking and UI | Needs quest log system and client UI | E08 or later |
| World-state implementation for gate unlocks | Needs world-state persistence and trigger system | E09 or later |
| Reward distribution tables and XP values | Needs economy calibration and playtest | E07 or later |
| Quest completion logic and chain branching | Needs quest script engine and condition evaluation | E08 or later |
| Exact trigger conditions and proximity checks | Needs spatial system and interaction range tuning | E09 or later |
| Cross-chain interaction (e.g., Bell-Clapper + Bark Mark) | Needs quest variable system and global state | E09 or later |
| Second-ring quest script writing | Needs second-ring area maps and NPC placements | E11 or later |
| Ferry restoration quest mechanics | Needs ferry system and boat model | E11 or later |
| Permit gate quest implementation | Needs deed tier validation and inventory permit checks | E09 or later |
| Group crypt instance quest triggers | Needs instancing system and group formation | E10 or later |
| Warden contract quest integration | Needs contract board system and spawn rules | E09 or later |
| Oldroad Trail step placement in quest rewards | Needs trail system and reward table wiring | E09 or later |
| Reputation system integration for quest givers | Needs NPC reputation and standing system | E10 or later |

---

## Related Documents

- `docs/quests/quest-system.md` — Quest rules, tone, and dialogue node fields
- `docs/quests/starter-quest-arc.md` — Seven starter quests that lead into these hooks
- `docs/quests/dialogue-style-guide.md` — NPC voice rules and example tone
- `docs/trails/00-index.md` — Trails and Oldroad system entry point
- `docs/trails/trail-quest-hooks.md` — Quest hooks that introduce and deepen Trails
- `docs/trails/trail-system.md` — Core Trail authority: terms, rules, banned patterns
- `docs/areas/first-ring-areas.md` — Full area definitions for all eight first-ring spaces
- `docs/areas/second-ring-areas.md` — Future area definitions and seeding techniques
- `docs/areas/route-unlocks-and-gates.md` — Route network, gate types, and traversal mechanics
- `docs/areas/area-creature-progression.md` — Creature combat roles and escalation by area
- `docs/areas/area-resource-progression.md` — Resource identity and tier placement by area
- `docs/creatures/wardenry-contracts.md` — Contract ladder and Wardenry integration
- `docs/favour/favour-system.md` — Favour rites, boons, and shrine mechanics
- `docs/skills/skill-system.md` — Skill thresholds and training methods
- `docs/ledger/civic-ledger-system.md` — Deed tiers, permits, and ledger keepers
- `docs/world/starter-economy-loops.md` — First 30-minute playable loops

*Last updated: 2026-05-31*
