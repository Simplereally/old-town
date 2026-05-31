---
doc_type: authority
canonical_path: docs/areas/route-unlocks-and-gates.md
parent_index: docs/areas/00-index.md
root_index: docs/00-index.md
---

Parent: [Area Progression Index](00-index.md)

Authority references:
- `docs/areas/area-progression-system.md`
- `docs/areas/first-ring-areas.md`
- `docs/areas/second-ring-areas.md`
- `docs/world/districts-and-routes.md`
- `docs/spatial/traversal-and-chokepoints.md`
- `docs/skills/skill-system.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/map/collision-and-route-rules.md`

# Route Unlocks and Gates

This document is the authority for the route network that connects Old Town to the outer world. It defines every walkable path, ferry crossing, under-way descent, and hidden shortcut that leads from the hub to the first ring and onward to the second ring. It is not a fast travel system. Every route is walked, earned, and remembered.

The route network supports the player fantasy of becoming a traveler who knows the land. Players learn which roads are safe, which gates need keys, which ferries run at dawn, and which stairs descend into the black market. The network turns geography into knowledge and knowledge into access.

## Design Summary

| Question | Answer |
|----------|--------|
| What player fantasy does this support? | The fantasy of becoming a traveler who knows the land. Players remember which roads are safe, which gates need keys, and which ferries run at dawn. |
| What systems does it connect to? | Wayfaring, Cartography, Civic Ledger deeds and permits, Favour rites, Warden contracts, Mining, and the 600ms tick movement system. |
| What items, NPCs, areas, and resources does it create? | Route IDs: oldroad_trail, bellwood_path, quarry_road, patch_hedge, warden_ford, gravegate_path, ash_path, soot_descent, deep_wood_road, blackbar_shaft, deep_grave_descent, verge_trail, moth_ferry, carmine_road, argent_road. Gate objects: oldroad_gate_arch, crowmile_rockfall, bellwood_stump, quarry_face, gravegate_iron_gate, soot_stair, kiln_chimney_stack, crownheart_sign, blackbar_gate, grave_underways_stair, witchwood_boundary, moth_ferry_dock, carmine_sign, argent_gate. Items referenced: soot_lantern, tinfin, blackbar_permit. |
| What is starter, midgame, and endgame? | Starter is walking the first-ring roads with no barriers. Midgame is clearing deed-tier gates, wading fords, and climbing quarry faces. Endgame is unlocking second-ring permit gates, ferry crossings, and under-way descents that need multiple conditions. |
| What should players call it in shorthand? | "the road", "the gate", "the ferry", "the stairs", "the shortcut" |
| What is banned because it sounds generic or derivative? | Fast travel, teleportation, flight, mount system, auto-run to destination, waypoint system, dungeon finder, zone levels, region tiers, expansion packs, DLC areas, numbered zones |
| What is deferred to implementation? | Exact tile placements, collision maps, ferry timing, shortcut discovery logic, under-way plane transitions, lantern consumption rules, stamina formula, Cartography thresholds |
| What existing docs must link to it? | `docs/areas/area-progression-system.md`, `docs/areas/first-ring-areas.md`, `docs/areas/second-ring-areas.md`, `docs/world/districts-and-routes.md`, `docs/spatial/traversal-and-chokepoints.md`, `docs/skills/skill-system.md`, `docs/ledger/civic-ledger-system.md`, `docs/map/collision-and-route-rules.md` |

## Route Network

The master network connects Old Town to eight first-ring areas and seven second-ring areas. No second-ring area is reachable without passing through a first-ring area or an Old Town district that leads directly to it.

| From | To | Route Type | Direction | Second-Ring Continuation |
|------|-----|-----------|-----------|--------------------------|
| Old Town (Oldroad Gate) | crowmile_road | walking | West | — |
| Old Town (Lath Yard / Chalkhouse Court) | bellwood_copse | walking | North-west | crownheart_forest, witchwood_verge |
| Old Town (North Quarry Road) | tinstone_cut | walking and climb | North | blackbar_cut |
| Old Town (Patch Lane) | patchfield | walking | South | carmine_yard |
| Old Town (River Stoop) | wardenbrook | walking and wade | East | moth_ferry_crossing |
| Old Town (Gravegate) | lowgrave | walking | South-east | grave_underways |
| Old Town (Foundry Row) | old_kiln | walking | East | — |
| Old Town (Sootcellar) | sootstairs | under-way | Down | — |
| bellwood_copse | crownheart_forest | walking | North-west | — |
| bellwood_copse | witchwood_verge | walking | North-west | — |
| tinstone_cut | blackbar_cut | walking and climb | North | — |
| patchfield | carmine_yard | walking | South | — |
| wardenbrook | moth_ferry_crossing | ferry | East | — |
| lowgrave | grave_underways | under-way | Down | — |
| Old Town (Shrine Hearth) | argent_chapel_road | walking | East | — |

## First-Ring Routes

First-ring routes are the first steps beyond the 96 x 96 starter region. Most are open to new players, but some require skill checks or deed tiers.

| Route | From | To | Gate Type | What Opens It | What Blocks It |
|-------|------|-----|-----------|---------------|----------------|
| Oldroad Trail | Old Town (Oldroad Gate) | crowmile_road | blocked path | Walk past the gate arch. The far rockfall needs 10 mining to clear. | Nothing blocks the entry. The far end is blocked by rockfall until cleared. |
| Bellwood Path | Old Town (Lath Yard) | bellwood_copse | route discovery | Follow the path past the bell tower stump. Cartography survey reveals a hidden trail from Oldroad Gate. | The hidden trail is invisible without Cartography survey. |
| Quarry Road | Old Town (North Quarry Road) | tinstone_cut | blocked path and climb | Continue past the last goblin spawn. The quarry face climb needs 15 mining and basic Wayfaring. | Goblin clusters pressure the road. The quarry face blocks the deep cut without climb readiness. |
| Patch Hedge | Old Town (Patch Lane) | patchfield | walk | Follow the hedge past the tanning frames. No gate. | Nothing blocks entry. |
| Warden Ford | Old Town (River Stoop) | wardenbrook | walk and wade | Wade the shallow ford. Wayfaring level 10 reduces stamina cost and reveals the far bank. | The ford is passable without Wayfaring but costs more stamina. The broken bridge teases future construction. |
| Gravegate Path | Old Town (Gravegate) | lowgrave | locked gate | Walk through the iron gate and down the low path. Needs Stamped tier in Gravegate deeds. | The iron gate checks deed tier. Without Stamped Gravegate standing, the gate stays shut. |
| Ash Path | Old Town (Foundry Row) | old_kiln | walk | Follow the ash path past the chimney stacks. The Kiln smoke is visible from Foundry Row on clear days. | Nothing blocks entry. The Ash Drake Whelp guards the deepest pit. |
| Soot Descent | Old Town (Sootcellar) | sootstairs | under-way gate | Descend the soot-stained stairs past the rat nests. Needs a soot_lantern and 20 Wayfaring. | The stair is dark without a lantern. The descent check fails without sufficient Wayfaring. |

## Second-Ring Routes

Second-ring routes are horizon spaces. Players hear about them before they can walk there. Every route has a barrier that requires midgame standing.

| Route | From | To | Gate Type | What Opens It | What Blocks It |
|-------|------|-----|-----------|---------------|----------------|
| Deep Wood Road | bellwood_copse | crownheart_forest | blocked path | Sign at Bellwood edge reads "Crownheart Forest. No patrol beyond this point." Opens after completing a Warden contract to thin wolf packs. | The sign and the wolf packs block entry. No patrol means no safe passage without Warden clearance. |
| Blackbar Shaft | tinstone_cut | blackbar_cut | permit gate | Gate at Tinstone Cut quarry face reads "Barred by order of the Warden." Opens with a blackbar_permit or Chartered-tier quarry deed. | The gate guard checks permit or deed tier. Without either, the shaft stays barred. |
| Deep Grave Descent | lowgrave | grave_underways | under-way gate | Lowgrave stairwell descends into the crypt network. Needs a soot_lantern and 20 Wayfaring to enter. Deeper levels need higher Favour rites. | The stairwell is sealed without lantern and Wayfaring. Rot pressure blocks deeper levels without Favour wards. |
| Verge Trail | bellwood_copse | witchwood_verge | world-state gate | Blue glow visible from Bellwood Edge on clear nights. Opens after completing a Favour rite to ward against the wood's curse. | The curse effect blocks entry. Without the Favour rite, players turn back at the boundary. |
| Moth Ferry | wardenbrook | moth_ferry_crossing | ferry requirement | Dock beyond the broken bridge. Opens after completing the ferryman quest to restore the boat. Each crossing costs one tinfin. | The ferryman refuses passage without quest completion. The boat is absent until restored. |
| Carmine Road | patchfield | carmine_yard | permit gate | Sign at Patchfield Hedge reads "Carmine Yard. Dyers and duelists." Opens with Stamped-tier Patch Lane deed. | The hedge boundary checks deed tier. Without Stamped Patch standing, the road is closed. |
| Argent Road | Old Town (Shrine Hearth) | argent_chapel_road | locked gate | Sign at Shrine Hearth reads "Argent Chapel Road. Walk with offering." Opens with Stamped-tier Shrine Hearth deed and a Favour rite. | The gate checks both deed tier and Favour standing. Missing either keeps the road locked. |

## Gate Details

Every gate has an in-world representation. No invisible walls.

| Gate | Location | Type | Object or NPC | Interaction |
|------|----------|------|---------------|-------------|
| oldroad_gate_arch | Oldroad Gate | blocked path | Stone arch with cart tracks | Walk through. No check. |
| crowmile_rockfall | Crowmile Road far end | blocked path | Fallen boulders and broken wheels | 10 Mining to clear. Yields cart_iron_scrap. |
| bellwood_stump | Bellwood Copse edge | walk | Bell tower stump | Walk past. Marks the boundary. |
| bellwood_hidden_trail | Oldroad Gate to Bellwood Copse | route discovery | Overgrown side path | Cartography survey reveals it. Shortcut from Foundry Row through wolf gap needs 25 Wayfaring. |
| quarry_face | Tinstone Cut end | blocked path and climb | Cliff face with climb points | 15 Mining to justify the ore. Wayfaring handles the climb stamina. |
| patch_hedge | Patch Lane end | walk | Hedgerow gap | Walk through. No check. |
| warden_ford | River Stoop to Wardenbrook | walk and wade | Shallow river tiles | Wayfaring 10 reduces stamina. Broken bridge is a static object. |
| gravegate_iron_gate | Gravegate to Lowgrave | locked gate | Iron gate 2 tiles wide | Checks Stamped Gravegate deed. Opens for qualified players. |
| soot_stair | Sootcellar to Sootstairs | under-way gate | Soot-stained stairwell | Needs soot_lantern and 20 Wayfaring. Lantern is consumed on entry if not equipped. |
| kiln_chimney_stack | Foundry Row to Old Kiln | walk | Chimney stacks and ash path | Walk past. Smoke is visible from Foundry Row. |
| crownheart_sign | Bellwood Copse edge | blocked path | Wooden signpost | "No patrol beyond this point." Warden contract clears the patrol block. |
| blackbar_gate | Tinstone Cut face | permit gate | Iron gate with ward symbol | Checks for blackbar_permit item or Chartered quarry deed. Guard NPC present. |
| grave_underways_stair | Lowgrave crypt | under-way gate | Stone stairwell into dark | soot_lantern and 20 Wayfaring for entry. Favour rites for deeper levels. |
| witchwood_boundary | Bellwood Copse far edge | world-state gate | Blue glow and strange trail markers | Favour rite removes curse block. Markers are visible but passable only after rite. |
| moth_ferry_dock | Wardenbrook far bank | ferry requirement | Dock with ferry post and note | "Ferry departs at dawn. Return tomorrow." Ferryman NPC appears after quest. |
| carmine_sign | Patchfield far hedge | permit gate | Wooden signpost and hedge gap | Checks Stamped Patch Lane deed. Gap opens for qualified players. |
| argent_gate | Shrine Hearth edge | locked gate | Shrine gate with offering bowl | Checks Stamped Shrine Hearth deed and Favour rite. Both must pass. |

## Traversal Mechanics

Routes are not fast travel. They are walked, waded, climbed, ferried, or descended. Each route type has specific mechanics that connect to skills and items.

### Walking

Walking routes are roads, trails, and paths. Players click to move along them at normal speed. Stamina drains on long walks based on distance and terrain. Wayfaring reduces stamina cost and reveals hidden branches. Main roads between areas are 3 tiles wide per `docs/spatial/traversal-and-chokepoints.md`. Crowmile Road is a 3-tile-wide dirt road. Bellwood Copse path is 2 tiles wide in dense sections. The ash path to The Old Kiln is 3 tiles wide.

### Ferry

Ferry routes are water crossings by boat. The Moth Ferry Crossing is the only ferry route in the first and second rings. Players reach the dock, pay one tinfin, and board the boat. Wayfaring reduces wait time and unlocks ferry shortcuts at higher levels. The dock approach is 2 tiles wide. The ferry runs only after the ferryman quest is complete. Before that, the dock has a note and no boat.

### Under-way

Under-way routes are descents into lower planes or hidden spaces. Sootstairs descends from Sootcellar. Grave Underways descends from Lowgrave. Both need a soot_lantern equipped and 20 Wayfaring to enter. The stairwell is 1-2 tiles wide because it is a threshold, not a throughput space. Wayfaring handles descent stamina. Cartography maps the under-way after first entry. Light scarcity is present but not fully implemented.

### Shortcut

Shortcuts are hidden or faster paths between known points. The Bellwood Copse shortcut from Foundry Row through the wolf gap needs 25 Wayfaring to unlock and Cartography to reveal. Shortcuts are 2 tiles wide where they are alleys or gaps, 1 tile wide where they are secret doors. Cartography survey reveals the path on the map. Wayfaring unlocks the ability to walk it without stamina penalty. Shortcuts are optional. Players can always take the long way.

## Player Shorthand

Players should talk about routes in local terms, not system terms.

| Shorthand | What Players Mean |
|-----------|-------------------|
| "the road" | Any first-ring walking route, usually Crowmile Road |
| "the gate" | Any locked or permit gate, usually Gravegate iron gate or Blackbar Cut gate |
| "the ferry" | Moth Ferry Crossing, or the dock before it opens |
| "the stairs" | Sootstairs descent, or any under-way entry |
| "the shortcut" | The Bellwood Copse wolf gap, or any Cartography-revealed hidden path |
| "the ford" | Wardenbrook crossing |
| "the cut" | Tinstone Cut or Blackbar Cut, depending on context |
| "the brook" | Wardenbrook |
| "the grave" | Lowgrave or Grave Underways |
| "the kiln" | The Old Kiln |
| "the copse" | Bellwood Copse |
| "the patch" | Patchfield |
| "the yard" | Carmine Yard |
| "the crossing" | Moth Ferry Crossing |
| "the shrines" | Argent Chapel Road |
| "the deep wood" | Crownheart Forest |
| "the verge" | Witchwood Verge |
| "the underways" | Grave Underways |
| "I got my permit" | Unlocked a deed-tier gate |
| "Finch showed me a trail" | Unlocked a Cartography route |
| "the ferry is running" | Moth Ferry Crossing is open after quest completion |

## Banned Concepts

The following concepts are banned from route and gate design. They sound like generic MMO systems, not like Old Town local culture.

| Banned Concept | Why It Is Banned | What to Use Instead |
|----------------|------------------|---------------------|
| Fast travel | Removes the road from the game | Walking routes, ferries, under-ways, and shortcuts that are earned |
| Teleportation | Breaks the integer tile world and makes geography meaningless | Under-way descents and ferry crossings that have physical entry points |
| Flight | Incompatible with tile bitmask collision and the lo-fi aesthetic | Climbing checks at quarry faces, Wayfaring shortcuts |
| Mount system | Adds a whole equipment and speed layer that trivializes distance | Wayfaring stamina reduction and shortcut unlocks |
| Auto-run to destination | Removes player attention from the journey | Click-to-move with stamina and visible route landmarks |
| Waypoint system | Turns routes into UI abstractions instead of remembered paths | Cartography map reveal and player-learned landmarks |
| Dungeon finder | Instanced matchmaking breaks the open world | Group crypt entrances at Lowgrave that require local players |
| Zone levels | Implies a global difficulty scale | Local skill thresholds and local gate checks |
| Region tiers | Implies vertical gear gating | Deed tiers, permit gates, and local standing |
| Expansion packs | Meta commercial language | Rings, future areas, post-launch content |
| DLC areas | Meta commercial language | Future rings, unnamed spaces |
| Numbered zones | Game design language | Named places with cultural identity |

## Deferred to Implementation

This document defines the network and the gates. It does not define buildable content. The following are intentionally left for future stories and implementation work.

| Deferred Item | Why It Is Deferred |
|---------------|--------------------|
| Exact tile placements for every gate | Needs world-editor tooling and final region geometry |
| Collision maps for outer area routes | Needs region JSON and tile data first |
| Ferry timing implementation | Needs engine support for scheduled NPC transport and payment handling |
| Shortcut discovery logic | Needs Cartography reveal system and Wayfaring unlock thresholds, plus playtest tuning |
| Under-way plane transitions | Needs multi-plane spatial system and descent collision logic |
| Lantern consumption rules | Needs item equip and consumption system integration |
| Ferry boat model and dock collision | Needs asset pipeline and art pass |
| Gate guard NPC dialogue | Needs dialogue system and quest script integration |
| Permit check implementation | Needs deed tier validation system and inventory permit item checks |
| World-state gate time checks | Needs game clock integration for dusk and dawn states |
| Route stamina formula | Needs Wayfaring tuning and distance calculation against the 600ms tick |
| Cartography survey reveal thresholds | Needs survey system implementation and map reveal tech |

## Related Documents

- `docs/areas/area-progression-system.md` — Ring structure, unlock conditions, and gate types
- `docs/areas/first-ring-areas.md` — First-ring area identities, resources, and creatures
- `docs/areas/second-ring-areas.md` — Second-ring area identities, seeding techniques, and future roles
- `docs/world/districts-and-routes.md` — Old Town districts and starter routes
- `docs/spatial/traversal-and-chokepoints.md` — Road widths, gate widths, and flow rules
- `docs/skills/skill-system.md` — Wayfaring and Cartography skill definitions
- `docs/ledger/civic-ledger-system.md` — Deed tiers, permits, and ledger keepers
- `docs/map/collision-and-route-rules.md` — Collision bitmask rules and route validation

*Last updated: 2026-05-31*
