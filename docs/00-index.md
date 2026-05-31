# Old Town Documentation Index

> **Master index for all Old Town documentation.** This is the entry point. If you are looking for something, start here.
> 
> **Maintenance rule:** When adding a new document, register it here. When removing a document, remove its link. Never let this index rot.

## Documentation Hierarchy

```
docs/
  00-index.md          ← You are here
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
| Understand creatures, drops, and Wardenry | [`creatures/00-index.md`](creatures/00-index.md) |
| Understand consumables | [`consumables/00-index.md`](consumables/00-index.md) → [`consumable-system.md`](consumables/consumable-system.md) |
| Find an axe or pickaxe | [`items/tools/00-index.md`](items/tools/00-index.md) |
| Find a quest item | [`items/quest/00-index.md`](items/quest/00-index.md) |
| Find coins or arrows | [`items/misc/00-index.md`](items/misc/00-index.md) |
| Find a cape or amulet | [`items/accessories/00-index.md`](items/accessories/00-index.md) → pick a slot |
| See skill requirements for an item | [`skills/00-index.md`](skills/00-index.md) → [`skill-system.md`](skills/skill-system.md) |
| Understand the skill economy | [`skills/00-index.md`](skills/00-index.md) → [`skill-interlocks.md`](skills/skill-interlocks.md) |

### Non-Item Documentation

| What you want | Go to |
|--------------|-------|
| Understand the game engine | `POC_SPEC.md` (in root) |
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

*Last updated: 2026-05-30*
