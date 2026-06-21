# Old Town

A browser-first, lo-fi 3D MMO inspired by 2006/2007 OSRS-era primitives. Built in Three.js + Bun/Node. The server owns all truth; the client is a pure presenter plus intent generator.

## Language

### World

**Tile:**
The fundamental unit of world space. Gameplay truth is integer coordinates (x, y, plane). The renderer interpolates between tile states for visual smoothness.
_Avoid_: grid cell, square, voxel

**Plane:**
A vertical level in the world. Z-axis in tile coordinates.
_Avoid_: floor, level, layer, z-index

**Chunk:**
An 8×8 tile group loaded and unloaded as a unit.
_Avoid_: cell, block, sector

**Region:**
A 64×64 tile area containing multiple chunks. Regions stream in and out of the client's active scene.
_Avoid_: zone, area, sector, map segment

**Terrain:**
The ground layer composed of tiles with materials, heights, and water flags.
_Avoid_: ground, floor, landscape

**RegionMap:**
A loaded region containing terrain tiles, placed objects, NPC spawns, ground item spawns, and area triggers.
_Avoid_: map, level, zone, scene

**Collision Mask:**
Directional bitmask flags on a tile that block movement, line-of-sight, or projectile travel. No physics engine is used.
_Avoid_: collider, hitbox, physics body

### Time & Action

**Tick:**
The 600ms quantum of gameplay time. All gameplay logic advances on tick boundaries.
_Avoid_: turn, frame, step, cycle

**Intent:**
A player's desire sent from client to server (e.g., MoveIntent, ObjectIntent, NpcIntent, ItemIntent, SpellIntent). The server decides whether to honor it.
_Avoid_: command, action, request, event

**Action:**
A queued gameplay operation owned by the server, with a type (weak, normal, strong, soft) and delay in ticks.
_Avoid_: task, job, script, callback

**Action Queue:**
The single server-owned queue where all actions for players and NPCs are scheduled and advanced.
_Avoid_: scheduler, timer, event loop

**Delayed Hit:**
Combat damage that is enqueued to apply on a specific future tick, not immediately.
_Avoid_: pending damage, scheduled attack, future hit

### Entities

**BrainState:**
The NPC AI state machine: idle, wander, aggro, chase, attack, returnHome, dead, or respawning. Determines how an NPC behaves each tick.
_Avoid_: ai state, behavior state, mode

**Entity:**
Anything in the world with a unique instance ID — players, NPCs, objects, or ground items.
_Avoid_: actor, unit, game object, instance

**Player:**
A human-controlled character. The server tracks one entity per connected session.
_Avoid_: character, avatar, user, pawn

**NPC:**
A non-player character — either a friendly figure with dialogue and trade options, or a creature with combat stats and AI.
_Avoid_: mob, monster, bot, agent

**Object:**
A static or interactive world entity such as a tree, rock, door, or furnace. Objects have a definition ID and a placed instance ID.
_Avoid_: prop, scenery, obstacle, structure

**Ground Item:**
An item dropped on a tile, visible to players and interactable for pickup. Distinct from inventory items.
_Avoid_: dropped item, loot, world item, bag

**Resource Node:**
A harvestable source tied to a gathering skill — e.g., a tree for woodcutting or a rock for mining. Nodes can deplete and respawn.
_Avoid_: gathering spot, harvest point, node

### Content

**Item:**
Anything a player can possess, use, or trade. Items are defined in JSON and loaded into a registry.
_Avoid_: loot, gear, object

**Equipment:**
Items worn in body slots (head, body, legs, shield, weapon, ammo, etc.). Equipment provides combat bonuses.
_Avoid_: gear, armor, loadout, outfit

**Skill:**
A player progression ability leveled via XP. Skills are categorized as gathering, processing, combat, or utility.
_Avoid_: ability, talent, profession, stat

**Spell:**
A magic ability with bead costs, level requirements, and effects. Spells are organized into spellbooks.
_Avoid_: ability, power, magic, cast

**Bead:**
The magical reagent consumed when casting spells. Categorized as element, catalyst, or material beads.
_Avoid_: rune, reagent, component, mana

**Quest:**
A multi-stage narrative task with requirements, objectives, triggers, and rewards.
_Avoid_: mission, task, adventure, story

**QuestStage:**
A numbered step within a quest, with journal text, objectives, and triggers.
_Avoid_: step, phase, chapter, part

**Objective:**
A measurable goal within a quest stage (e.g., gather, kill, talk, or interact with an object).
_Avoid_: goal, task, requirement, condition

**Trigger:**
An event that advances a quest to the next stage or fires side effects.
_Avoid_: event, hook, callback, listener

**Dialogue:**
A conversational graph for NPC interactions, composed of nodes and player options.
_Avoid_: conversation, chat, speech, talk tree

**Drop Table:**
A loot definition for creatures, specifying rolls, always-drops, and weighted entries.
_Avoid_: loot table, reward table, spawn list

**Processing Recipe:**
A skill-based transformation performed at a station object, consuming an input item and producing a success item (or failure item).
_Avoid_: craft, recipe, formula, blueprint

**Material:**
A surface color definition for terrain rendering (e.g., grass, dirt path, stone floor).
_Avoid_: texture, surface, paint, fill

### Combat & Effects

**Combatant:**
An entity engaged in combat, tracking target, attack cooldown, style, and auto-retaliate status.
_Avoid_: fighter, warrior, attacker, unit

**HitChance:**
The probability of a combat hit landing, derived from attack roll versus defence roll. Core to the combat feel.
_Avoid_: accuracy, hit rate, success rate

**AutoRetaliate:**
Whether a combatant automatically targets and fights back when attacked by another entity.
_Avoid_: counterattack, revenge, reflect

**Leash:**
The maximum distance an NPC will chase a target from its home tile before returning.
_Avoid_: tether, limit, boundary, range

**Hitsplat:**
A floating visual indicator above an actor showing damage dealt, blocked, healed, or poison applied.
_Avoid_: damage number, floating text, popup, floater

**Projectile:**
A visual object traveling from a start tile to an end tile, representing a ranged or magic attack.
_Avoid_: missile, bolt, arrow, spell effect

**Line of Sight (LoS):**
Whether an unobstructed straight path exists between two tiles. Required for some spells and ranged attacks.
_Avoid_: visibility, sight line, view, ray

### Player State

**Inventory:**
The 28-slot container holding items. Each slot has an item ID, quantity, and optional UID.
_Avoid_: bag, backpack, stash, storage

**Varbits / Vars:**
Generic player state variables used for quest progress, unlocks, and world state. Keys are namespaced strings.
_Avoid_: flags, variables, state bits, conditions

**XP:**
Experience points awarded for skilling, combat, and quest completion. XP is tied to a specific skill.
_Avoid_: exp, experience, points

### Network & Sync

**Delta:**
An incremental state update packet sent from server to client every tick, containing entity changes, hitsplats, and UI updates.
_Avoid_: update, patch, diff, change set

**Snapshot:**
A complete authoritative state sent to a client on connection, resetting all local state.
_Avoid_: full state, sync, refresh, bootstrap

**Spawn Projection:**
The deterministic mapping of an ECS entity to a network spawn packet, including kind, position, appearance, and health.
_Avoid_: serialization, encoding, network object

**Packet Applier:**
The client module that owns all server-to-client packet semantics, applying snapshots and deltas to the local scene.
_Avoid_: packet handler, message processor, sync engine

**Interest Area:**
The 104×104 tile square around a player that determines which entities, chunks, and regions the server syncs to that client.
_Avoid_: view distance, render distance, visibility range, zone

### Interaction

**Option:**
A content-defined interaction row on an NPC or object, containing a human-facing label, an engine action ID, priority, and distance rules.
_Avoid_: action, menu item, choice, entry

**Context Menu:**
The right-click menu showing all available options for a clicked entity or tile.
_Avoid_: radial menu, action menu, popup menu, right-click menu

**Default Action:**
The highest-priority option on an entity, triggered by a left click.
_Avoid_: primary action, main action, quick action

**Examine:**
Flavor text describing an item, object, or NPC, shown when selected from the context menu.
_Avoid_: description, tooltip, info, detail

**Reach:**
The valid distance for interacting with an entity, measured in tiles.
_Avoid_: range, distance, proximity, radius

### Tier & Classification

**Tier:**
An equipment quality level (e.g., pennywrought, lathwood, chalkmarked). Determines base stats and visual identity.
_Avoid_: rank, grade, level, quality

**Family:**
An equipment archetype (e.g., shortblade, cudgel, shortbow, helm). Defines the base shape and animation set.
_Avoid_: type, class, category, archetype

**Style:**
A combat attack style (stab, slash, crush, ranged, magic). Determines which combat bonuses apply.
_Avoid_: stance, mode, form, type
