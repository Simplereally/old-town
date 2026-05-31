# Old Town Documentation Index

> **Master index for all Old Town documentation.** This is the entry point. If you are looking for something, start here.
> 
> **Maintenance rule:** When adding a new document, register it here. When removing a document, remove its link. Never let this index rot.

## Documentation Hierarchy

```
docs/
  00-index.md          ← You are here
  performance.md       ← POC debug counters, stress harness, and bottlenecks
  combat/
    00-index.md        ← Combat design entry point
    signature-mechanics.md ← Weapon family identities and mechanics
    mechanics-implementation.md ← Operational rules for every signature mechanic
  accessory-tiers.md   ← Accessory tier system philosophy
  skills/
    00-index.md        ← Skill system entry point
    skill-system.md    ← Core skill authority: 25 skills, XP, requirements
    combat-skills.md   ← Combat skills (Arms, Might, Guard, etc.)
    gathering-skills.md ← Gathering skills (Mining, Woodcutting, etc.)
    production-skills.md ← Production skills (Smithing, Bowcraft, etc.)
    utility-skills.md  ← Utility skills (Wayfaring, Sleight, etc.)
    skill-interlocks.md ← Skill economy web
  resources/
    00-index.md        ← Resource taxonomy entry point
    resource-taxonomy.md ← Canonical resource names and banned list
    ores-and-stone.md  ← Mining resources
    woods-and-timber.md ← Woodcutting resources
    fish-and-cooking.md ← Fishing resources
    hides-bones-and-trophies.md ← Trapping resources
    herbs-roots-and-fungi.md ← Gardening resources
    bead-materials.md ← Beadwork resources
  tools-and-intermediates/
    00-index.md        ← Skill utility substrate entry point
    tool-system.md     ← Shared tool rules
    skill-tools.md     ← Canonical skill tool families
    intermediate-items.md ← Production-chain intermediates
    containers-and-pouches.md ← Container families
    stations.md        ← Skilling stations
    skill-outfits.md   ← Profession identity items
  recipes/
    00-index.md        ← Recipe and production graph entry point
    recipe-system.md   ← Recipe fields, families, and rules
    recipe-chains.md   ← Starter identity chains
    cooking-recipes.md ← Cooking recipe families
    smithing-recipes.md ← Smithing recipe families
    bowcraft-recipes.md ← Bowcraft recipe families
    beadwork-recipes.md ← Beadwork recipe families
  world/
    00-index.md        ← Starter town and world topology entry point
    world-pillars.md   ← Old Town tone and place rules
    starter-town.md    ← Starter hub overview
    districts-and-routes.md ← District layout and routes
    npc-cast.md        ← Named starter NPCs
    shops-and-services.md ← Shop identities and services
    starter-economy-loops.md ← First 30-minute loops
  creatures/
    00-index.md        ← Creature, drop, and Wardenry entry point
    creature-system.md ← Creature definition rules
    starter-creatures.md ← First creature roster
    creature-ecology.md ← Creature placement by district
    combat-roles.md    ← Enemy teaching roles
    drop-table-system.md ← Drop table format and rules
    starter-drop-tables.md ← First drop tables
    wardenry-contracts.md ← Contract ladder and starter contracts
    rare-drops-and-trophies.md ← Rare reward identity
    minibosses.md      ← First named encounters
  favour/
    00-index.md        ← Favour, shrine, and boon entry point
    favour-system.md   ← Core Favour terms and rules
    shrines-and-rites.md ← Shrine types and rites
    offerings-and-training.md ← Offerings and XP methods
    boons-and-oaths.md ← Boons, wards, and oaths
    favour-items.md    ← Favour item families
    shrine-economy.md  ← Shrine sinks and demand loops
    starter-favour-progression.md ← First Favour path
  quests/
    00-index.md        ← Quest and dialogue bible entry point
    quest-system.md    ← Quest rules and dialogue graph fields
    dialogue-style-guide.md ← Dialogue tone rules
    npc-voice-bible.md ← Starter NPC voice profiles
    starter-quest-arc.md ← First quest arc
    smoke-over-old-town.md ← POC quest structure
    rats-under-tallys.md ← Combat and Wardenry intro quest
    a-penny-for-the-forge.md ← Mining and Smithing intro quest
    string-enough-to-sing.md ← Bowcraft and Trapping intro quest
    the-beadwifes-errand.md ← Beadwork and Magic intro quest
    gravegate-flowers.md ← Favour and Gravegate intro quest
    the-missing-bell-clapper.md ← Sleight and Cartography intro quest
    quest-rewards-and-reclaim.md ← Quest rewards and item reclaim
  economy/
    00-index.md        ← Shops, services, prices, and economy entry point
    economy-system.md  ← Core economy rules
    currency-and-value-bands.md ← Currencies and price bands
    shop-system.md     ← Shop stock and policy fields
    starter-shop-stocks.md ← Starter shop stock tables
    services-and-fees.md ← Service fee bands
    banks-storage-and-reclaim.md ← Counting House rules
    repair-and-degradation.md ← Repair and degradation rules
    item-sinks-and-inflation-control.md ← Economy sinks
    reward-calibration.md ← Reward profiles
   ledger/
     00-index.md        ← Civic Ledger entry point
     civic-ledger-system.md ← Core ledger authority and deed tiers
     district-deeds.md  ← Area diary tasks and rewards
     oldroad-trails.md  ← Legacy redirect: canonical authority at trails/00-index.md
     clue-step-types.md ← Legacy: canonical step types at trails/step-types.md
     nooks-and-stash-spots.md ← Legacy: canonical Nook authority at trails/nooks-and-trail-storage.md
    charters-and-permits.md ← Guild-style access and permits
    public-works.md   ← Repeatable town jobs
    rewards-and-stamps.md ← Reward philosophy and types
    starter-ledger-content.md ← Quick-reference summary
  map/
    00-index.md        ← Map placement entry point
    map-placement-system.md ← Core placement authority and rules
    old-town-starter-region.md ← 96x96 region overview
    district-boundaries.md ← District bounding boxes
    spawn-points.md   ← Player spawn and respawn
    npc-placement.md  ← NPC exact tiles
    shop-and-service-placement.md ← Shop and service points
    station-placement.md ← Skilling station tiles
    resource-node-placement.md ← Mining, wood, fish, trap, garden nodes
    creature-spawn-placement.md ← Creature spawn zones
    quest-object-placement.md ← Quest object anchors
    ledger-placement.md ← Ledger physical anchors
    collision-and-route-rules.md ← Collision and path rules
    first-30-minute-paths.md ← Starter walkable loops
  areas/
    00-index.md        ← Area progression entry point
    area-progression-system.md ← Ring structure, unlocks, gates
    first-ring-areas.md ← 8 first-ring areas (Crowmile Road, Bellwood Copse, etc.)
    second-ring-areas.md ← 7 second-ring area seeds
    route-unlocks-and-gates.md ← Route network and traversal
    area-level-bands.md ← Level ranges and danger classification
    area-resource-progression.md ← Resource escalation by area
    area-creature-progression.md ← Creature identities and escalation
    area-quest-hooks.md ← Quest starters and chains
    area-reward-identities.md ← Reward identity and repeat value
  guilds/
    00-index.md        ← Guilds and skill hubs entry point
    guild-system.md    ← Core guild authority: categories, rules, banned patterns
    starter-skill-hubs.md ← 9 starter district skill hubs
    first-ring-guilds.md ← 8 first-ring guilds and access hubs
    second-ring-guild-seeds.md ← 7 second-ring guild concepts
    entry-requirements.md ← Guild access requirements and gates
    guild-services-and-shops.md ← Services, shops, and conveniences
    guild-resource-access.md ← Resource clusters and station quality
    guild-quest-hooks.md ← Quest hooks that introduce and deepen guilds
     guild-rewards.md    ← Reward identity: what guilds offer and what they do not
   activities/
     00-index.md        ← Activities and minigames entry point
     activity-system.md  ← Core activity authority: categories, rules, banned patterns
     activity-categories.md ← 8 activity categories and their design rules
     starter-activities.md ← 8 starter activities in Old Town proper
     first-ring-activities.md ← 8 first-ring activities beyond Old Town
     skilling-bosses.md  ← 3 dangerous skilling encounters: Old Kiln Watch, Wardenbrook Tide, Lowgrave Vigil
     activity-rewards.md ← Reward identity: what activities offer and what they do not
     activity-currencies.md ← Local activity currencies and their sinks
     activity-quest-hooks.md ← Quest hooks that introduce and deepen activities
     activity-balance-rules.md ← Effort bands, XP calibration, and anti-power-creep
    bosses/
      00-index.md        ← Bosses and named encounters entry point
      boss-system.md      ← Core boss authority: categories, rules, banned patterns
      boss-categories.md  ← 8 boss categories and their design rules
      starter-bosses.md   ← 6 starter bosses inside Old Town and nearby
      first-ring-bosses.md ← 8 first-ring area bosses beyond Old Town
      second-ring-boss-seeds.md ← 7 second-ring boss concepts for later expansion
      lair-and-access-rules.md ← How bosses are found, entered, and unlocked
      boss-mechanics.md   ← OSRS-style mechanic primitives for boss design
      unique-drops-and-trophies.md ← Unique drop rules and boss-specific rewards
      boss-quest-hooks.md ← Quest hooks that introduce and deepen bosses
      boss-balance-rules.md ← Effort bands, combat calibration, and anti-power-creep
    trails/
       00-index.md        ← Trails and Oldroad system entry point
       trail-system.md     ← Core Trail authority: terms, rules, banned patterns
       trail-tiers.md      ← Six Trail tiers: Scrap through Starfall
       trail-sources.md    ← Where Trails come from: combat, skilling, Wardenry, Cartography
       step-types.md       ← 16 canonical step types
       riddle-and-phrase-steps.md ← 40 riddle/phrase examples
       sketch-survey-and-map-steps.md ← Sketch, Survey, Dig steps and Cartography rules
       gesture-dress-and-item-steps.md ← Gesture, Dress, Item steps and Nook rules
       skill-and-station-steps.md ← Skill and Station challenge steps
       ambush-and-danger-steps.md ← Trail enemies by tier and ambush rules
       caches-and-rewards.md ← Cache tiers, reward categories, examples
       nooks-and-trail-storage.md ← Nook types, build rules, 30+ locations
       trail-collection-log.md ← Trail log tracking, titles, no-power-rewards
       trail-quest-hooks.md ← Quest hooks that introduce and deepen Trails
       trail-balance-rules.md ← Effort bands, anti-power-creep, and banned patterns
    wardenry/
       00-index.md        ← Wardenry and contract system entry point
      wardenry-system.md  ← Core Wardenry authority: terms, rules, banned patterns
      wardens-and-boards.md ← 8 Wardens by level band and area
      contracts-and-task-generation.md ← 10 contract types and generation rules
      contract-chains-and-marks.md ← Chain milestones and mark rewards
      cancel-skip-block-extend.md ← Tear Up, Repost, Refuse, Widen, Pin rules
      task-tables-starter.md ← Warden Holt's starter task table
      task-tables-first-ring.md ← 5 first-ring Warden task tables
      task-tables-second-ring.md ← 7 second-ring task seeds
      notorious-variants.md ← Notorious Variant definitions and spawn rules
      named-warrants-and-boss-tasks.md ← Named Warrant and boss task rules
      warden-locker-rewards.md ← Warden Locker reward categories and examples
      wardenry-quest-hooks.md ← Quest hooks that introduce and deepen Wardenry
      wardenry-balance-rules.md ← Effort bands, mark calibration, and anti-power-creep
   content/
    00-index.md        ← Content translation entry point
    content-translation-system.md ← Core translation authority and workflow
    content-kind-contracts.md ← Runtime content kinds mapped to source docs
    canonical-id-registry.md ← Stable ID naming rules
    starter-content-manifest.md ← Minimum content set for vertical slice
    schema-gap-analysis.md ← Schema gaps and POC priorities
    seed-skills-manifest.md ← 25 skills as runtime candidates
    seed-items-manifest.md ← Minimum item seed set
    seed-materials-manifest.md ← Bridge docs/resources into content/materials
    seed-objects-and-stations-manifest.md ← Landmarks, shops, stations, quest objects
    seed-resource-nodes-manifest.md ← E09-critical resource nodes
    seed-npcs-and-creatures-manifest.md ← Service NPCs and starter creatures
    seed-map-and-spawns-manifest.md ← Bridge docs/map into content/maps
    seed-recipes-manifest.md ← E09/E08 starter recipes
    seed-drops-and-contracts-manifest.md ← Drop tables and Wardenry contracts
    seed-quests-and-dialogue-manifest.md ← Starter quests and dialogue packs
    seed-shops-services-ledger-manifest.md ← Schema-gap planning
    validation-and-drift-control.md ← 14 validation checks and drift prevention
  spatial/
    00-index.md        ← Spatial simulation entry point
    spatial-system.md  ← Core spatial authority, layers, and design rules
    terrain-grammar.md ← Ground types, object density, and visual storytelling
    movement-ecology.md ← 10 movement types for NPCs and creatures
    monster-movement-and-leashing.md ← Aggression, leashing, and creature behaviour
    spawn-density-and-pressure.md ← Spawn density bands and starter area rules
    safe-danger-gradient.md ← Emotional danger gradient and readable markers
    traversal-and-chokepoints.md ← Road widths, chokepoint design, and flow rules
    landmarks-and-silhouettes.md ← District silhouettes and recognition rules
    naming-atlas.md    ← Cultural naming grammar, patterns, and banned list
    outer-area-seeds.md ← First and second ring expansion areas
    placement-validation-checklist.md ← 15 validation rules for all placement
  consumables/
    00-index.md        ← Consumables system entry point
    consumable-system.md ← Core consumable authority
    food.md            ← Food system
    potions.md         ← Potion system
    brews.md           ← Brew system
    poisons.md         ← Poison system
    salves-and-oils.md ← Salves and oils
    status-effects.md  ← Status effects
  items/
    00-index.md        ← Item system entry point
    melee-armour-tiers.md  ← Melee tier system philosophy
    ranged-tiers.md    ← Ranged weapon tier system philosophy
    ranged-armour-tiers.md ← Ranged armour tier system philosophy
    magic-tiers.md     ← Magic tier system philosophy
    weapons/
      00-index.md      ← Weapons overview
      melee.md         ← Melee weapons (12 families × 13 tiers)
      ranged.md        ← Ranged weapons (14 families × 13 tiers)
      knives.md        ← Thrown knives (13 tiers)
      darts.md         ← Thrown darts (13 tiers)
      javelins.md      ← Javelins (13 tiers)
      throwing-axes.md ← Throwing axes (13 tiers)
      magic.md         ← Magic weapons (6 families × 13 tiers)
    armour/
      00-index.md      ← Armour overview (melee + ranged + magic)
      head.md          ← Helm and Greathelm (melee)
      chest.md         ← Harness, Hauberk, Platecoat (melee)
      legs.md          ← Chausses (melee)
      feet.md          ← Sabatons (melee)
      hands.md         ← Gauntlets (melee)
      shield.md        ← Ward (melee)
      coif.md          ← Coif (ranged)
      jerkin.md        ← Jerkin (ranged)
      chaps.md         ← Chaps (ranged)
      vambraces.md     ← Vambraces (ranged)
      treads.md        ← Treads (ranged)
      buckler.md       ← Buckler (ranged)
      cowl.md          ← Cowl (magic)
      robe.md          ← Robe (magic)
      wraps.md         ← Wraps (magic)
      cuffs.md         ← Cuffs (magic)
      softshoes.md     ← Softshoes (magic)
      charmward.md     ← Charmward (magic)
    consumables/
      00-index.md      ← Consumables overview
      food.md          ← Food items
      potions.md       ← Potion items
    resources/
      00-index.md      ← Resources overview
      wood.md          ← Woodcutting materials
      ore.md           ← Mining materials
      fish.md          ← Fishing materials
      crafting.md      ← Crafting materials
    tools/
      00-index.md      ← Tools overview
      gathering.md     ← Gathering tools (axe, pickaxe, rod)
      crafting.md      ← Crafting tools (hammer, needle, etc.)
    quest/
      00-index.md      ← Quest items overview
      smoke-over-old-town.md  ← POC quest items
    accessories/
      00-index.md      ← Accessories overview (6 slots × 13 tiers)
      capes.md         ← Cape slot
      amulets.md       ← Amulet slot
      rings.md         ← Ring slot
      charms.md        ← Charm slot
      belts.md         ← Belt slot
      trophies.md      ← Trophy slot
    misc/
      00-index.md      ← Misc overview
      currency.md      ← Currency
      ammunition.md    ← Ammunition (9 types × 13 tiers)
      special.md       ← Keys, maps, tokens
  ui-inspiration.md    ← UI visual reference
```

## Quick Navigation

### Item System

| What you want | Go to |
|--------------|-------|
| Understand the melee tier system | [`melee-armour-tiers.md`](melee-armour-tiers.md) |
| Understand the ranged weapon tier system | [`ranged-tiers.md`](ranged-tiers.md) |
| Understand the ranged armour tier system | [`ranged-armour-tiers.md`](ranged-armour-tiers.md) |
| Understand the magic tier system | [`magic-tiers.md`](magic-tiers.md) |
| Find a weapon | [`items/weapons/00-index.md`](items/weapons/00-index.md) → pick melee, ranged, or magic |
| Find armour | [`items/armour/00-index.md`](items/armour/00-index.md) → pick melee, ranged, or magic slot |
| Find food or potions | [`consumables/00-index.md`](consumables/00-index.md) |
| Find wood, ore, or fish | [`resources/00-index.md`](resources/00-index.md) |
| Understand the resource taxonomy | [`resources/00-index.md`](resources/00-index.md) → [`resource-taxonomy.md`](resources/resource-taxonomy.md) |
| Understand skill tools and intermediates | [`tools-and-intermediates/00-index.md`](tools-and-intermediates/00-index.md) |
| Understand recipes and production actions | [`recipes/00-index.md`](recipes/00-index.md) |
| Understand Old Town starter topology | [`world/00-index.md`](world/00-index.md) |
| See map placement, districts, and coordinates | [`map/00-index.md`](map/00-index.md) |
| See spatial behaviour, terrain, and danger | [`spatial/00-index.md`](spatial/00-index.md) |
| Understand creatures, drops, and Wardenry | [`creatures/00-index.md`](creatures/00-index.md) |
| Understand Favour and shrine economy | [`favour/00-index.md`](favour/00-index.md) |
| Understand quests and dialogue | [`quests/00-index.md`](quests/00-index.md) |
| Understand the Civic Ledger, deeds, and trails | [`ledger/00-index.md`](ledger/00-index.md) |
| Understand Oldroad Trails, clues, and Caches | [`trails/00-index.md`](trails/00-index.md) |
| Understand content translation from docs to JSON | [`content/00-index.md`](content/00-index.md) → [`content-translation-system.md`](content/content-translation-system.md) |
| Check ID naming rules | [`content/canonical-id-registry.md`](content/canonical-id-registry.md) |
| See minimum POC content set | [`content/starter-content-manifest.md`](content/starter-content-manifest.md) |
| Check schema gaps | [`content/schema-gap-analysis.md`](content/schema-gap-analysis.md) |
| Understand shops, services, and prices | [`economy/00-index.md`](economy/00-index.md) |
| Understand consumables | [`consumables/00-index.md`](consumables/00-index.md) → [`consumable-system.md`](consumables/consumable-system.md) |
| Find an axe or pickaxe | [`items/tools/00-index.md`](items/tools/00-index.md) |
| Find a quest item | [`items/quest/00-index.md`](items/quest/00-index.md) |
| Find coins or arrows | [`items/misc/00-index.md`](items/misc/00-index.md) |
| Find a cape or amulet | [`items/accessories/00-index.md`](items/accessories/00-index.md) → pick a slot |
| See skill requirements for an item | [`skills/00-index.md`](skills/00-index.md) → [`skill-system.md`](skills/skill-system.md) |
| Understand the skill economy | [`skills/00-index.md`](skills/00-index.md) → [`skill-interlocks.md`](skills/skill-interlocks.md) |
| Understand area progression beyond Old Town | [`areas/00-index.md`](areas/00-index.md) |
| See first-ring area designs | [`areas/00-index.md`](areas/00-index.md) → [`first-ring-areas.md`](areas/first-ring-areas.md) |
| See second-ring area seeds | [`areas/00-index.md`](areas/00-index.md) → [`second-ring-areas.md`](areas/second-ring-areas.md) |
| Check level bands and danger | [`areas/00-index.md`](areas/00-index.md) → [`area-level-bands.md`](areas/area-level-bands.md) |
| Understand guilds and skill hubs | [`guilds/00-index.md`](guilds/00-index.md) |
| See starter skill hubs | [`guilds/00-index.md`](guilds/00-index.md) → [`starter-skill-hubs.md`](guilds/starter-skill-hubs.md) |
| See first-ring guilds | [`guilds/00-index.md`](guilds/00-index.md) → [`first-ring-guilds.md`](guilds/first-ring-guilds.md) |
| See guild entry requirements | [`guilds/00-index.md`](guilds/00-index.md) → [`entry-requirements.md`](guilds/entry-requirements.md) |
| See guild services and shops | [`guilds/00-index.md`](guilds/00-index.md) → [`guild-services-and-shops.md`](guilds/guild-services-and-shops.md) |
| See guild rewards | [`guilds/00-index.md`](guilds/00-index.md) → [`guild-rewards.md`](guilds/guild-rewards.md) |
| Understand bosses and named encounters | [`bosses/00-index.md`](bosses/00-index.md) |
| See starter boss designs | [`bosses/00-index.md`](bosses/00-index.md) → [`starter-bosses.md`](bosses/starter-bosses.md) |
| See first-ring boss designs | [`bosses/00-index.md`](bosses/00-index.md) → [`first-ring-bosses.md`](bosses/first-ring-bosses.md) |
| See second-ring boss seeds | [`bosses/00-index.md`](bosses/00-index.md) → [`second-ring-boss-seeds.md`](bosses/second-ring-boss-seeds.md) |
| Understand boss mechanics | [`bosses/00-index.md`](bosses/00-index.md) → [`boss-mechanics.md`](bosses/boss-mechanics.md) |
| Understand boss drops and trophies | [`bosses/00-index.md`](bosses/00-index.md) → [`unique-drops-and-trophies.md`](bosses/unique-drops-and-trophies.md) |
| Understand boss quest hooks | [`bosses/00-index.md`](bosses/00-index.md) → [`boss-quest-hooks.md`](bosses/boss-quest-hooks.md) |
| Understand boss balance | [`bosses/00-index.md`](bosses/00-index.md) → [`boss-balance-rules.md`](bosses/boss-balance-rules.md) |
| Understand Wardenry and contracts | [`wardenry/00-index.md`](wardenry/00-index.md) |
| See Wardens and task boards | [`wardenry/00-index.md`](wardenry/00-index.md) → [`wardens-and-boards.md`](wardenry/wardens-and-boards.md) |
| See contract types and generation | [`wardenry/00-index.md`](wardenry/00-index.md) → [`contracts-and-task-generation.md`](wardenry/contracts-and-task-generation.md) |
| See contract chains and marks | [`wardenry/00-index.md`](wardenry/00-index.md) → [`contract-chains-and-marks.md`](wardenry/contract-chains-and-marks.md) |
| See starter task table | [`wardenry/00-index.md`](wardenry/00-index.md) → [`task-tables-starter.md`](wardenry/task-tables-starter.md) |
| See first-ring task tables | [`wardenry/00-index.md`](wardenry/00-index.md) → [`task-tables-first-ring.md`](wardenry/task-tables-first-ring.md) |
| See second-ring task seeds | [`wardenry/00-index.md`](wardenry/00-index.md) → [`task-tables-second-ring.md`](wardenry/task-tables-second-ring.md) |
| See Notorious Variants | [`wardenry/00-index.md`](wardenry/00-index.md) → [`notorious-variants.md`](wardenry/notorious-variants.md) |
| See Named Warrants and boss tasks | [`wardenry/00-index.md`](wardenry/00-index.md) → [`named-warrants-and-boss-tasks.md`](wardenry/named-warrants-and-boss-tasks.md) |
| See Warden Locker rewards | [`wardenry/00-index.md`](wardenry/00-index.md) → [`warden-locker-rewards.md`](wardenry/warden-locker-rewards.md) |
| See Wardenry quest hooks | [`wardenry/00-index.md`](wardenry/00-index.md) → [`wardenry-quest-hooks.md`](wardenry/wardenry-quest-hooks.md) |
| See Wardenry balance rules | [`wardenry/00-index.md`](wardenry/00-index.md) → [`wardenry-balance-rules.md`](wardenry/wardenry-balance-rules.md) |

### Non-Item Documentation

| What you want | Go to |
|--------------|-------|
| Understand the game engine | `POC_SPEC.md` (in root) |
| Check POC performance counters and stress baseline | [`performance.md`](performance.md) |
| See what tasks to do next | `tasks/README.md` (in root) |
| See the UI visual target | [`ui-inspiration.md`](ui-inspiration.md) |
| Understand agent conventions | `AGENTS.md` (in root) |
| Understand weapon mechanics | [`combat/signature-mechanics.md`](combat/signature-mechanics.md) |
| Understand accessory mechanics | [`accessory-tiers.md`](accessory-tiers.md) |
| Understand combat implementation | [`combat/mechanics-implementation.md`](combat/mechanics-implementation.md) |
| Understand the skill system | [`skills/00-index.md`](skills/00-index.md) |
| See skill requirements for gear | [`skills/skill-system.md`](skills/skill-system.md) |

## Design Rules for Documentation

1. **Every folder must have a `00-index.md`.** It is the entry point for that folder.
2. **Every `00-index.md` must link to its leaf docs.** An agent should never need to guess what files exist.
3. **No code in design docs.** No JSON schemas, no TypeScript, no pseudo-code. Pure prose, tables, and IDs.
4. **IDs are authoritative.** The item ID table is the source of truth for `content/items/*.json`.
5. **Cross-reference liberally.** If a doc mentions a tier, link to `melee-armour-tiers.md`. If it mentions a weapon, link to the weapons doc.
6. **Keep it tight.** Delete noise, add signal. When a section goes stale, rewrite it in place.

## Document Status Legend

| Status | Meaning |
|--------|---------|
| Complete | Documented and detailed |
| Draft | Structure present, some content missing |
| Planned | Placeholder, content not yet written |

---

*Last updated: 2026-05-31*
