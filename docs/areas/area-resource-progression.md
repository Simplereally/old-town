---
doc_type: authority
canonical_path: docs/areas/area-resource-progression.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/resources/resource-taxonomy.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/skills/skill-system.md`
- `docs/skills/gathering-skills.md`
- `docs/tools-and-intermediates/stations.md`
- `docs/spatial/naming-atlas.md`
- `docs/world/starter-economy-loops.md`

# Area Resource Progression

> **The canonical map of where resources live and how they escalate across Old Town's rings.** This document connects the resource taxonomy to the ground. It tells players and designers which ore appears in which cut, which wood grows in which copse, and why moving from the hub to the first ring to the second ring is not just "better numbers" but a change in cultural context, danger, and identity.
>
> **Rule:** No resource may be placed in an area without passing through this progression map. If a new ore is added to a quarry, it must fit the tier band and identity of that quarry. If a new fish is added to a brook, it must fit the escalation curve of that water.

---

## Design Authority Summary

### What player fantasy does this support?

The fantasy of becoming a local expert. A player who trains Mining does not just "level up." They learn that Tinstone Cut is where tinstone turns into pig iron, that the deeper wardenstone seam is competitive, and that Blackbar Cut waits beyond the barred gate. Resource progression makes skilling feel like learning a place, not like filling a bar.

### What systems does it connect to?

Gathering skills (Mining, Woodcutting, Fishing, Trapping, Gardening), production skills (Smithing, Bowcraft, Tailoring, Cooking, Beadwork, Apothecary), Hearthcraft station fuel, the Civic Ledger deed system, and area gate types. Resource tiers gate equipment tiers, which gate combat effectiveness, which gates access to deeper areas.

### What items, NPCs, areas, and resources does it create?

This document does not create new resource names. It maps existing canonical resources from `docs/resources/resource-taxonomy.md` to existing canonical areas from `docs/areas/first-ring-areas.md` and `docs/areas/second-ring-areas.md`. It formalizes the relationship between `tinstone` and `tinstone_cut`, between `crownheart_log` and `crownheart_forest`, and between `warden_herb` and every field margin where it grows.

### What is starter, midgame, and endgame?

**Starter** is the hub and the near edge of the first ring: penny copper in the quarry, ditch shrimp at the dock, rabbit hides in the patch, oldroad oak on the road. **Midgame** is the full first ring and the entry to the second: wardenstone at the quarry face, bellmaple in the copse heart, redback salmon at the far bank, the first competitive nodes. **Endgame** is the second ring and beyond: crownheart logs, graveiron ore, witchwood timber, carmine pigments, argent fittings. Endgame resources require mastery-level skills and often require group access or deed gates.

### What should players call it in shorthand?

Players do not call it "the resource progression system." They say "the ore," "the wood," "the fish," "the hides," or "the herbs," and every player old enough to walk the first ring knows which ore, wood, fish, hide, or herb is meant by context. This document exists so that designers know what players mean when they say it.

### What is banned because it sounds generic or derivative?

Generic fantasy resource names, infinite nodes, auto-gathering, resource nodes that glow or pulse, numbered zone tiers, and global difficulty scaling. See the Banned Resource Names section for the full list.

### What is deferred to implementation?

Exact node positions, respawn timers, depletion mechanics, resource node JSON, competitive node logic, and exact XP rates per action. See the Deferred to Implementation section for the full list.

### What existing docs must link to it?

`docs/resources/resource-taxonomy.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/skills/skill-system.md`, `docs/skills/gathering-skills.md`, `docs/tools-and-intermediates/stations.md`, `docs/world/starter-economy-loops.md`.

---

## Resource Escalation Philosophy

Resource progression in Old Town is escalation through identity. A tier 4 resource is not just "tier 4." It is `bellmaple` from Bellwood Copse, or `blackcoal` from Tinstone Cut, or `brook_trout` from Wardenbrook. The name carries the place. The place carries the danger. The danger carries the reward.

Three rules govern escalation:

1. **Place before tier.** A resource must sound like it belongs to its area. `tinstone` belongs to Tinstone Cut. `crownheart_log` belongs to Crownheart Forest. If a resource could be dropped into any generic fantasy world, it does not belong here.

2. **Competition before abundance.** Low-tier resources are abundant and instanced. High-tier resources are scarce and competitive. A player should never wait for a rabbit hide. A player should expect to wait for a crownheart tree.

3. **Identity before efficiency.** Players train skills by moving through areas, not by camping the best node forever. Every area has a level band, and when a player outlevels that band, the efficient move is to a new area, not to a faster node in the old one.

---

## Hub Resources

The 96 x 96 starter region contains the lowest-tier resources. These are the materials a player touches in their first hour. They are abundant, safe, and culturally humble.

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| penny_copper | Mining | 1 | surface outcrop | first ore, alloy base |
| ditch_shrimp | Fishing | 1 | town dock | first catch, cooking input |
| rabbit_hide | Trapping | 1 | edge trapline | first hide, tailoring base |
| graveyard_moss | Gardening | 1 | grave edge patch | first herb, apothecary base |
| bead_clay | Mining / Hearthcraft | 1 | riverbank pan | first bead blank |
| oldroad_oak | Woodcutting | 2 | street and road edge | first construction wood |

The hub does not contain competitive nodes. Every hub resource is instanced or so abundant that competition is irrelevant. The hub teaches the action. The first ring teaches the place.

---

## First-Ring Resources

The first ring is where resources gain identity. Each area has a primary skill and a secondary skill, and the resources reflect the area's cultural framing.

### Crowmile Road

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| oldroad_oak | Woodcutting | 2 | fallen logs | construction, bowcraft base |
| crow_feather | Trapping | 1 | road crow drop | arrow fletching, beadwork |
| cart_iron_scrap | Mining / Smithing | 2 | broken cart wheels | smithing salvage |
| chalk_mark | Cartography | 1 | survey points | trail step material |

Crowmile Road is the travel road. Its resources are salvage and travel debris, not pristine ore or virgin timber.

### Bellwood Copse

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| lathwood | Woodcutting | 3 | lathwood tree | bowcraft upgrade |
| bellmaple | Woodcutting | 4 | bellmaple tree | balanced hardwood |
| bell_fang | Trapping | 2 | bell bat drop | beadwork, handicraft |
| warden_herb | Gardening | 5 | forest floor patch | apothecary, cooking |

Bellwood Copse is the first real wood. Its resources escalate from soft lathwood to hard bellmaple, teaching players that woodcutting has a ladder inside a single area.

### Tinstone Cut

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| tinstone | Mining | 1 | tinstone outcrop | alloy partner to penny copper |
| pig_iron_ore | Mining | 2 | iron vein | first significant smithing ore |
| blackcoal | Mining | 4 | coal seam | smelting fuel |
| wardenstone | Mining | 5 | deep vein | midgame ore, first competitive node |

Tinstone Cut is the working quarry. Its resources follow the alloy chain from tin to pig iron to wardenstone, and the deep vein is the first place where miners compete.

### Patchfield

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| rabbit_hide | Trapping | 1 | trapline | starter tailoring |
| fox_hide | Trapping | 3 | bog fox trap | soft leather |
| sinew_cord | Trapping | 2 | fox and bat drops | bowcraft, tailoring |
| warden_herb | Gardening | 5 | field margin patch | apothecary |

Patchfield is the working field. Its resources are hides and sinew, the material base of tailoring and bowcraft. The field margin herbs connect gardening to the broader craft economy.

### Wardenbrook

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| brook_trout | Fishing | 4 | river cast | first river fish |
| bell_herring | Fishing | 3 | deeper cast | common market fish |
| river_curio | Fishing | 2 | oddity pull | random material, trail source |
| redback_salmon | Fishing | 6 | far bank cast | midgame river fish |

Wardenbrook is the working river. Its resources escalate from shallow oddities to deep salmon, and the far bank is the first place where fishers compete for the best cast.

### Lowgrave

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| grave_dust | Trapping / Gardening | 1 | grave mite drop | apothecary, favour |
| bone_chips | Trapping | 2 | grave mite drop | beadwork, favour XP |
| faint_bead | Trapping | 3 | grave wisp drop | beadwork, magic input |
| grave_ash | Trapping / Hearthcraft | 4 | grave wisp drop | hearthcraft, apothecary |

Lowgrave is the working grave. Its resources are rot and bone, the material base of beadwork and hearthcraft. The wisp drops are the first competitive nodes in the grave chain.

### The Old Kiln

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| fire_clay | Mining / Smithing | 3 | clay pit | beadwork, hearthcraft |
| warm_scale | Trapping | 5 | ash drake whelp drop | tailoring, handicraft |
| drake_tooth | Trapping | 5 | ash drake whelp drop | beadwork, magic foci |
| bellmetal_ore | Mining | 3 | kiln seam | smithing alloy |

The Old Kiln is the working fire. Its resources are clay and drake parts, the material base of beadwork and advanced smithing. The drake whelp is a competitive spawn, not a node.

### Sootstairs

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| blackcoal_ash | Mining / Hearthcraft | 2 | soot deposit | hearthcraft, apothecary |
| blank_writ | Trapping / Sleight | 3 | cutpurse drop | favour, ledger input |
| wax_seal | Trapping / Sleight | 3 | cutpurse drop | handicraft, quest item |
| stolen_coin_pouch | Trapping / Sleight | 2 | cutpurse drop | currency, reclaimable |

Sootstairs is the working under-town. Its resources are salvage and contraband, the material base of the black market economy. The cutpurse drops are competitive because the cutpurses themselves are limited spawns.

---

## Second-Ring Resources

The second ring is future content. These areas are not yet built, but their resource identities are fixed. When they arrive, they must fit the escalation curve established here.

### Crownheart Forest

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| crownheart_log | Woodcutting | 11 | crownheart tree | master carpentry, master bowcraft |
| crownheart_resin | Woodcutting / Hearthcraft | 11 | tree tap | adhesive, sealant, magic component |
| ancient_bark | Woodcutting | 11 | fallen crownheart | handicraft, keepsake material |

Crownheart Forest is the deep wood. Its resources are the penultimate timber tier, requiring mastery Woodcutting and competitive node access.

### Blackbar Cut

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| blackcoal | Mining | 4 | deep seam | elite smelting fuel |
| graveiron_ore | Mining | 7 | barred shaft | graveiron alloy base |

Blackbar Cut is the deep quarry. Its resources are midgame and elite ores, requiring group access and a quarry permit gate.

### Grave Underways

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| gravebound_materials | Trapping / Favour | 6-8 | deeper undead | gravebound gear components |
| soot_lantern | Hearthcraft | 5 | craftable requirement | under-way access tool |

Grave Underways is the deep grave. Its resources are gravebound gear materials, requiring Favour rites and under-way navigation.

### Witchwood Verge

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| witchwood_log | Woodcutting | 8 | witchwood tree | elite bowcraft, beadwork |
| witchwood_sap | Woodcutting / Beadwork | 8 | tree tap | magic adhesive, curse ward |
| magic_herbs | Gardening | 7-8 | cluster patch | apothecary, magic input |

Witchwood Verge is the haunted edge. Its resources are magical timber and herbs, requiring high Woodcutting and Gardening, and a Favour rite to ward the curse.

### Moth Ferry Crossing

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| river_fish | Fishing | 5-7 | ferry cast | mid-tier river and ocean fish |

Moth Ferry Crossing is the river gate. Its resources are mid-tier fish that require ferry access and Wayfaring shortcuts.

### Carmine Yard

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| carmine_pigment | Gardening / Tailoring | 9 | dye vat input | advanced dye, carmine steel gear |
| bloodwood_tannin | Gardening / Tailoring | 9 | bloodwood process | leather curing, pit fight gear |

Carmine Yard is the risk district. Its resources are advanced dye and tannin materials, requiring high Tailoring and access to the yard's pit fight economy.

### Argent Chapel Road

| Resource | Skill | Tier | Source | Role |
|----------|-------|------|--------|------|
| silverbark_plank | Woodcutting / Carpentry | 10 | silverbark tree | chapel building, argent gear |
| argent_fitting | Smithing / Handicraft | 10 | chapel forge | argent blessing ritual, argent gear |

Argent Chapel Road is the shrine road. Its resources are near-mastery timber and metal fittings, requiring high Favour and Carpentry to build the chapel.

---

## Tier Progression Table

This table maps every resource tier to the skill level required, the areas where it appears, and the cultural name of the tier.

| Tier | Cultural Name | Level | Hub | First Ring | Second Ring (Future) |
|------|---------------|-------|-----|------------|----------------------|
| 1 | Pennywrought | 1 | penny_copper, ditch_shrimp, rabbit_hide, graveyard_moss, bead_clay | tinstone, crow_feather, chalk_mark | — |
| 2 | Pig Iron | 5 | oldroad_oak | pig_iron_ore, cart_iron_scrap, blackcoal_ash, river_curio, sinew_cord, bone_chips | — |
| 3 | Bellmetal | 15 | — | lathwood, fox_hide, fire_clay, bellmetal_ore, bell_herring, blank_writ, wax_seal | — |
| 4 | Blackbar | 25 | — | bellmaple, blackcoal, brook_trout, grave_ash | — |
| 5 | Wardensteel | 35 | — | warden_herb, wardenstone, warm_scale, drake_tooth | — |
| 6 | Greenwold | 45 | — | redback_salmon | gravebound_materials |
| 7 | Graveiron | 50 | — | — | graveiron_ore, magic_herbs |
| 8 | Blueglass | 65 | — | — | witchwood_log, witchwood_sap, magic_herbs |
| 9 | Carmine Steel | 75 | — | — | carmine_pigment, bloodwood_tannin |
| 10 | Argent | 85 | — | — | silverbark_plank, argent_fitting |
| 11 | Crownsteel | 90 | — | — | crownheart_log, crownheart_resin, ancient_bark |
| 12 | Starfall | 99 | — | — | starfall_ore, starfall_ash, starfall_petal, starfall_crab |

**Note:** Tier 12 resources are named in `docs/resources/resource-taxonomy.md` but do not yet have assigned second-ring areas. They will appear in a future third ring or endgame space.

---

## Resource Identity

What makes each area's resources distinctive is not the tier number. It is the cultural framing.

| Area | Identity | What Makes It Distinctive |
|------|----------|---------------------------|
| Crowmile Road | Travel salvage | Resources are debris, not harvest. Players do not chop a tree. They loot a broken cart. |
| Bellwood Copse | Hardwood ladder | The only first-ring area with two woodcutting tiers in one space. Lathwood and bellmaple teach the wood ladder. |
| Tinstone Cut | Alloy quarry | The only area where ore escalates through the full alloy chain from tin to wardenstone. |
| Patchfield | Hide and sinew | The only area where trapping produces both hides and bowcraft cord in the same trapline. |
| Wardenbrook | River cast | The only area where fish escalate from shallow oddities to deep salmon across a single water body. |
| Lowgrave | Rot and bone | The only area where grave creatures produce beadwork and hearthcraft materials, not just combat loot. |
| The Old Kiln | Fire and clay | The only area where smithing and beadwork share a raw material (fire_clay) and a guardian (ash drake whelp). |
| Sootstairs | Contraband | The only area where resources are stolen goods and black market currency, not raw materials. |

---

## Resource Competition

Not all resources are equal in availability. The competition system creates scarcity at the top and abundance at the bottom.

### Competitive Nodes

Competitive nodes are shared-world. Only one player can gather from them at a time. They yield 20% more XP per action but require waiting or world-hopping.

| Resource | Area | Tier | Why It Is Competitive |
|----------|------|------|----------------------|
| wardenstone | Tinstone Cut | 5 | Deep vein, limited spawn points |
| bellmaple | Bellwood Copse | 4 | Slow-growing hardwood, few mature trees |
| redback_salmon | Wardenbrook | 6 | Far bank cast, limited deep pools |
| grave_ash | Lowgrave | 4 | Grave wisp drop, limited wisp spawns |
| warm_scale | The Old Kiln | 5 | Ash drake whelp drop, guardian spawn |
| drake_tooth | The Old Kiln | 5 | Ash drake whelp drop, guardian spawn |
| crownheart_log | Crownheart Forest (future) | 11 | Ancient tree, extremely limited |
| witchwood_log | Witchwood Verge (future) | 8 | Cursed tree, requires ward to approach |
| graveiron_ore | Blackbar Cut (future) | 7 | Barred shaft, group access only |

### Instanced Nodes

Instanced nodes are per-player. They yield base XP but are always available.

| Resource | Area | Tier | Why It Is Instanced |
|----------|------|------|---------------------|
| rabbit_hide | Patchfield | 1 | Trapline resets per player |
| warden_herb | Patchfield, Bellwood Copse | 5 | Herb patch grows per player |
| fire_clay | The Old Kiln | 3 | Clay pit is abundant and personal |
| chalk_mark | Crowmile Road | 1 | Survey point is personal progress |
| tinstone | Tinstone Cut | 1 | Surface outcrop is abundant |
| ditch_shrimp | Hub | 1 | Dock cast is unlimited |
| graveyard_moss | Hub | 1 | Grave edge patch is personal |

---

## Player Shorthand

Players do not use formal names when talking about resources. They use shorthand that shifts by context.

| Shorthand | What It Means in Context | Example |
|-----------|--------------------------|---------|
| "the ore" | The best ore the speaker can currently mine | "I'm off to the Cut for the ore" means wardenstone if the speaker has 35 Mining, pig iron if they have 5 |
| "the wood" | The best wood the speaker can currently cut | "I need the wood for a new bow" means bellmaple at 25, lathwood at 15 |
| "the fish" | The best fish the speaker can currently catch | "Cooking the fish" means brook trout at 20, redback salmon at 30 |
| "the hides" | The best hide the speaker can currently trap | "Nell wants the hides" means fox hide at 15, rabbit hide at 1 |
| "the herbs" | The best herb the speaker can currently gather | "Brewing with the herbs" means warden_herb at 35, graveyard_moss at 1 |
| "the deep cut" | Blackbar Cut or the wardenstone seam | Context depends on Mining level |
| "the deep wood" | Crownheart Forest or the bellmaple heart | Context depends on Woodcutting level |
| "the far bank" | Redback salmon pool or the ferry crossing | Context depends on Fishing level |

---

## Banned Resource Names

The following names and concepts are banned from Old Town resource design. They sound like generic fantasy or generic MMO systems, not like local materials.

| Banned Name or Concept | Canonical Replacement | Reason |
|------------------------|----------------------|--------|
| iron ore | pig_iron_ore | Generic fantasy name |
| copper ore | penny_copper | Generic fantasy name |
| wood log | oldroad_oak, lathwood, bellmaple | Generic fantasy name |
| common fish | ditch_shrimp, tinfin | Generic fantasy name |
| shark | glass_eel | Generic fantasy fish |
| swordfish | deepwater_eel | Generic fantasy fish |
| manta ray | argent_ray | Generic fantasy fish |
| sea turtle | crown_turtle | Generic fantasy creature |
| dark crab | starfall_crab | Generic fantasy name |
| mithril | wardenstone | Generic fantasy metal |
| adamantite | blackbar_seam | Generic fantasy metal |
| runite | blueglass_ore | Generic fantasy metal |
| magic tree | witchwood | Generic fantasy name |
| elder tree | crownheart | Generic fantasy name |
| dragon bones | drakebone | Generic fantasy material |
| infinite nodes | — | Breaks scarcity and economy |
| auto-gathering | — | Breaks engagement and risk/reward |
| glowing nodes | — | Breaks immersion and visual identity |
| pulsing nodes | — | Breaks immersion and visual identity |
| numbered zone tiers | — | Meta design language |
| global difficulty scale | local skill thresholds | Removes local identity |

---

## Deferred to Implementation

The following work is explicitly deferred. This document is an authority, not an implementation spec.

| Deferred Item | Reason | Likely Epic |
|---------------|--------|-------------|
| Exact node positions per area | Needs terrain data and world-editor tooling | E10 or later |
| Respawn timer values per tier | Needs node system and competition tuning | E09 or later |
| Depletion mechanic details | Needs gathering system implementation | E09 or later |
| Resource node JSON schema | Needs content pipeline and validation | E08 or later |
| Competitive node lock logic | Needs spawn system and competition tuning | E09 or later |
| Instanced node per-player state | Needs player-state system extension | E09 or later |
| Exact XP per resource action | Needs simulation and playtest | E07 or later |
| Resource visual models and sprites | Needs art pipeline | E10 or later |
| Resource drop table weights | Needs loot system and economy calibration | E08 or later |
| Second-ring area terrain data | No maps exist yet | E11 or later |
| Third-ring resource placement | No third ring design exists yet | Post-launch |

---

## Related Documents

- `docs/resources/resource-taxonomy.md` — Canonical resource names and tier ladder
- `docs/areas/first-ring-areas.md` — Full area definitions for all eight first-ring spaces
- `docs/areas/second-ring-areas.md` — Future area definitions for all seven second-ring spaces
- `docs/skills/skill-system.md` — 25 skills, XP curves, and equipment tier requirements
- `docs/skills/gathering-skills.md` — Mining, Woodcutting, Fishing, Trapping, and Gardening definitions
- `docs/tools-and-intermediates/stations.md` — Station requirements for processing resources
- `docs/spatial/naming-atlas.md` — Cultural naming grammar and banned patterns
- `docs/world/starter-economy-loops.md` — First 30-minute playable loops that consume these resources

*Last updated: 2026-05-31*
