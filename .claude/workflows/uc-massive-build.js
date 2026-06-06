export const meta = {
  name: "uc-massive-old-town-build",
  description:
    "Execute 20+ agents across 6 phases to close all identified gaps in the Old Town game.",
  phases: [
    { title: "Foundation", detail: "Fix type errors and orphaned content" },
    { title: "Server Action Routing", detail: "Wire all missing action handlers and routing" },
    {
      title: "Server Systems",
      detail: "Implement death penalty, status effects, service fees, doors, spell effects",
    },
    { title: "Content Alignment", detail: "Rewrite contracts, shops, add item models" },
    { title: "Client UI", detail: "Add UI panels, packet wiring, layers, HTML" },
    { title: "Validation and Docs", detail: "Run all tests, fix failures, update audit docs" },
  ],
};

// PHASE 1: FOUNDATION
phase("Foundation");
log("Phase 1: Foundation — fixing type errors and orphaned content");

const foundation = await parallel([
  () =>
    agent(
      "Read these files and fix the type errors:\n" +
        "1. packages/shared/src/protocol/__tests__/recipe.test.ts — line 75 has \"Type 'number' is not assignable to type 'EntityId'\". Change the number to a valid EntityId string.\n" +
        "2. apps/server/src/sim/command-buffer.ts — line 90 has \"Function lacks ending return statement and return type does not include 'undefined'\". Add a default return statement.\n" +
        "After fixing, run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run typecheck\n" +
        'If typecheck passes, report "Foundation type fixes complete." If not, fix remaining errors and report them.',
      { label: "Fix type errors", phase: "Foundation" },
    ),
  () =>
    agent(
      "Read these files and fix orphaned content warnings:\n" +
        "1. content/resource-nodes/starter-nodes.json — find the 8 unused nodes: tinfin_ripple, river_curio_spot, rabbit_snare_point, bog_fox_track, bird_lure_spot, grave_flower_patch, allotment_patch, herb_pot_table.\n" +
        "   Either: a) Add them to content/maps/old-town-*.json as resource node placements, OR b) Remove them from starter-nodes.json if they are not intended for the starter region.\n" +
        "2. content/drops/starter-drops.json — find goblin_drops and rat_drops. These are not referenced by any NPC.\n" +
        "   Read content/npcs/starter-npcs.json and assign goblin_drops to the mud-goblin NPC and rat_drops to the cellar-rat NPC.\n" +
        "3. Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run content:validate\n" +
        "   Fix all warnings about orphaned content.\n" +
        "4. Run: bun run test to ensure no tests break.\n" +
        "Report what you fixed and any remaining warnings.",
      { label: "Fix orphaned content", phase: "Foundation" },
    ),
]);

log("Phase 1 complete: " + foundation.filter(Boolean).length + " agents succeeded");

// PHASE 2: SERVER ACTION ROUTING
phase("Server Action Routing");
log("Phase 2: Server Action Routing — wiring all missing action handlers");

const routing = await parallel([
  () =>
    agent(
      "Read apps/server/src/systems/object-interaction-router.ts carefully.\n" +
        "The file currently handles these actions:\n" +
        "- GATHER_ACTION_IDS: chop, woodcut, mine, fish\n" +
        "- PROCESS_ACTION_IDS: cook, use\n" +
        "You must add support for ALL of these missing actions:\n" +
        "1. smelt — routes to handleProcessingIntent (like cook/use)\n" +
        "2. smith — routes to handleProcessingIntent\n" +
        "3. craft — routes to handleProcessingIntent\n" +
        "4. fire — routes to handleProcessingIntent\n" +
        "5. weave — routes to handleProcessingIntent\n" +
        "6. tan — routes to handleProcessingIntent\n" +
        "7. dye — routes to handleProcessingIntent\n" +
        "8. mix — routes to handleProcessingIntent\n" +
        "9. enter — routes to a new handler that checks if the object has a transition/destination and teleports the player\n" +
        "10. ring — routes to a new handler that emits a SoundPacket and a local chat message\n" +
        "11. read — routes to a new handler that shows object text (check object.text or object.dialogueId)\n" +
        "12. inspect — routes to a new handler that shows object description text\n" +
        "For each new action, add it to the appropriate action set (or create a new set) and implement the handler.\n" +
        "Also fix the out-of-range handling: when chebyshev(actorTile, objectTile) > 1, the router calls handleMoveIntent but does NOT re-attempt the action after movement. For non-skilling actions (inspect, read, pray, survey), add a begin_interact action that re-attempts after pathing completes.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report what actions you wired and any issues.",
      { label: "Wire object actions", phase: "Server Action Routing" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/sim/intent-dispatcher.ts\n" +
        "2. apps/server/src/sim/command-buffer.ts\n" +
        "3. apps/server/src/systems/skilling-system.ts\n" +
        "You must wire the RecipeSelect intent end-to-end:\n" +
        "1. In command-buffer.ts, ensure RecipeSelectCommand is parsed and converted to a RecipeSelectIntent.\n" +
        "2. In intent-dispatcher.ts, add a case for IntentKind.RecipeSelect (or equivalent) that:\n" +
        "   - Gets the player's current station object (the one they are interacting with)\n" +
        "   - Validates the selected recipe ID is valid for that station\n" +
        "   - Checks the player has the required materials/levels\n" +
        '   - Enqueues a "process" action with the selected recipe ID\n' +
        "   - Returns a success message or error\n" +
        "3. In skilling-system.ts, ensure the process action handler accepts a specific recipe ID instead of auto-selecting the first match.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the wiring you added.",
      { label: "Wire RecipeSelect", phase: "Server Action Routing" },
    ),
  () =>
    agent(
      "Read apps/server/src/sim/simulation-kernel.ts.\n" +
        'Find the tick phase named "QuestTriggersVarbits". This phase currently ONLY calls saveQueue.flushDue() — it does NOT process quest triggers or varbits. This is misleading.\n' +
        "You must do one of these two things:\n" +
        '1. Rename it to "PersistenceFlush" and update all references, OR\n' +
        "2. Implement actual quest trigger checking in this phase (check if any active quest objectives are met and auto-advance stages).\n" +
        "Recommended: Implement option 2. Add a real quest trigger check that:\n" +
        "- Iterates all active quests\n" +
        '- Checks if any objective requirements are met (e.g., "kill 5 rats" when player has killed 5)\n' +
        "- Auto-advances the quest stage if so\n" +
        "- Emits quest progress deltas\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report what you changed.",
      { label: "Fix quest trigger phase", phase: "Server Action Routing" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/systems/combat-system.ts\n" +
        "2. apps/server/src/systems/contract-system.ts\n" +
        "When a player kills a creature in combat, the contract system must be notified.\n" +
        "In combat-system.ts, find the code that handles creature death (where the player lands the killing blow). After that code, add a call to track the contract objective:\n" +
        "contractSystem.trackContractObjective(playerId, 'kill', creatureId);\n" +
        "If contract-system.ts does not have a trackContractObjective method, create one. It should:\n" +
        "- Look up the player's active contracts\n" +
        "- Find any contract with an objective matching the killed creature\n" +
        "- Increment the kill count\n" +
        "- If the objective is complete, mark the contract as ready-for-completion\n" +
        "- Emit a contract progress delta\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the kill tracking you wired.",
      { label: "Wire contract kill tracking", phase: "Server Action Routing" },
    ),
]);

log("Phase 2 complete: " + routing.filter(Boolean).length + " agents succeeded");

// PHASE 3: SERVER SYSTEMS
phase("Server Systems");
log("Phase 3: Server Systems — implementing new systems and extending existing ones");

const systems = await parallel([
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/systems/death-system.ts\n" +
        "2. apps/server/src/systems/ground-item-system.ts\n" +
        "3. apps/server/src/ecs/components.ts\n" +
        "4. apps/server/src/ecs/world.ts\n" +
        "Currently, when a player dies:\n" +
        "- They are teleported to the spawn point\n" +
        "- Their health is restored\n" +
        "- They are cleared of combat target\n" +
        "You must add a REAL death penalty:\n" +
        "1. When player health reaches 0, spawn a GRAVE entity at the player's death tile.\n" +
        "2. The grave entity should store the player's dropped inventory items.\n" +
        "3. The player's inventory should be emptied (or partial — keep the 3 most valuable items).\n" +
        "4. Emit a DeathNoticePacket to the client.\n" +
        "5. Emit a GraveSpawnPacket to all interested clients.\n" +
        "6. After respawn (5 ticks / 3 seconds), the player must visit their grave to reclaim items.\n" +
        "7. Graves should despawn after 10 minutes if not reclaimed.\n" +
        "8. Add a grave component to the ECS components.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the death penalty system you built.",
      { label: "Build death penalty system", phase: "Server Systems" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/systems/spell-system.ts\n" +
        "2. apps/server/src/items/inventory.ts\n" +
        "3. content/spells/starter-spells.json\n" +
        'Currently, spell-system.ts rejects "alchemy" and "enchant" effects with "That spell is not yet implemented."\n' +
        "You must implement:\n" +
        "1. applyAlchemyEffect(playerId, spell):\n" +
        "   - Get the item in the player's active slot (or selected item)\n" +
        "   - Calculate the item's alchemy value (from item value or a formula)\n" +
        "   - Remove the item from inventory\n" +
        "   - Add coins equal to the alchemy value\n" +
        '   - Emit a system message: "You alchemize the [item] into [X] coins."\n' +
        "2. applyEnchantEffect(playerId, spell):\n" +
        "   - Get the item to enchant (from spell.fromItemId or player's active slot)\n" +
        "   - Validate the player has the required magic level\n" +
        "   - Remove the fromItem\n" +
        "   - Add the toItem (from spell.toItemId)\n" +
        '   - Emit a system message: "You enchant the [item] into [new item]."\n' +
        "Both should consume beads, validate level, check cooldown, and emit the spell cast packet.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the spell effects you implemented.",
      { label: "Implement spell alchemy/enchant", phase: "Server Systems" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/ecs/components.ts\n" +
        "2. apps/server/src/sim/simulation-kernel.ts\n" +
        "3. content/status-effects/starter-status-effects.json\n" +
        "4. apps/server/src/systems/consumable-system.ts\n" +
        "You must create a NEW file: apps/server/src/systems/status-effect-system.ts\n" +
        "This system should:\n" +
        "1. Have a tick phase that runs every tick (like combat-system or consumable-system).\n" +
        "2. Maintain a StatusEffectComponent on entities with active status effects.\n" +
        "3. For each active status effect:\n" +
        "   - Apply damage per tick (if DOT)\n" +
        "   - Apply healing per tick (if HOT)\n" +
        "   - Modify stats (if buff/debuff)\n" +
        "   - Decrement duration\n" +
        "   - Remove expired effects\n" +
        "4. Wire into simulation-kernel.ts as a new tick phase.\n" +
        "5. Allow consumables to apply status effects when consumed (e.g., a poison cure potion removes poison).\n" +
        "6. Emit status effect deltas to clients (add to DeltaAccumulator).\n" +
        "The ECS component should look like:\n" +
        "StatusEffectComponent = {\n" +
        "  activeEffects: Array<{\n" +
        "    effectId: string;\n" +
        "    durationTicks: number;\n" +
        "    damagePerTick?: number;\n" +
        "    healPerTick?: number;\n" +
        "    statModifiers?: Record<string, number>;\n" +
        "  }>;\n" +
        "}\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the status effect system you built.",
      { label: "Build status effect system", phase: "Server Systems" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/systems/shop-system.ts\n" +
        "2. content/service-fees/starter-service-fees.json\n" +
        "3. apps/server/src/sim/intent-dispatcher.ts\n" +
        "4. apps/server/src/ecs/components.ts\n" +
        "You must create a NEW file: apps/server/src/systems/service-fee-system.ts\n" +
        "This system handles NPC service interactions beyond buying/selling:\n" +
        "1. repair: Deduct coins, restore item durability.\n" +
        "2. teleport: Deduct coins/beads, teleport player to destination.\n" +
        "3. identify: Deduct coins, reveal item properties.\n" +
        "4. enchant: Deduct coins/beads, apply enchantment.\n" +
        "5. craft: Deduct coins, craft item (public crafting service).\n" +
        "6. Additional services: tanning, smelting, bead firing, blessing, reclaim, contract reroll, ferry, map copy, cleanse.\n" +
        "For each service type:\n" +
        "- Read the service fee from content/service-fees/starter-service-fees.json\n" +
        "- Validate the player has the required currency/items\n" +
        "- Apply the service\n" +
        "- Deduct the fee\n" +
        "- Emit a success message\n" +
        "Wire into intent-dispatcher.ts so that when a player clicks a service action on an NPC, it routes to this system.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the service fee system you built.",
      { label: "Build service fee system", phase: "Server Systems" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/server/src/systems/object-interaction-router.ts\n" +
        "2. apps/server/src/ecs/components.ts\n" +
        "3. content/objects/starter-objects.json\n" +
        "4. apps/server/src/world/collision.ts\n" +
        "You must create a NEW file: apps/server/src/systems/door-system.ts\n" +
        "This system handles door and chest open/close mechanics:\n" +
        '1. When player clicks "open" on a door:\n' +
        "   - Toggle the door's state: closed to open, or open to closed\n" +
        "   - If door is now open, update collision to make that tile walkable\n" +
        "   - If door is now closed, update collision to make that tile blocked\n" +
        "   - Emit an animation delta (door rotation or state change)\n" +
        "   - Emit a sound packet\n" +
        '2. When player clicks "open" on a chest:\n' +
        "   - Toggle the chest state\n" +
        "   - If opened, spawn the chest's contents as ground items (or show them in a loot panel)\n" +
        "   - Emit an animation delta\n" +
        "3. Add a DoorStateComponent to the ECS:\n" +
        "   DoorStateComponent = {\n" +
        "     isOpen: boolean;\n" +
        "     openDuration?: number;\n" +
        "     linkedDoorId?: EntityId;\n" +
        "   }\n" +
        'Wire the "open" action in object-interaction-router.ts to route to this system.\n' +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the door system you built.",
      { label: "Build door system", phase: "Server Systems" },
    ),
]);

log("Phase 3 complete: " + systems.filter(Boolean).length + " agents succeeded");

// PHASE 4: CONTENT ALIGNMENT
phase("Content Alignment");
log("Phase 4: Content Alignment — fixing contracts, shops, item models");

const content = await parallel([
  () =>
    agent(
      "Read these files:\n" +
        "1. docs/content/seed-drops-and-contracts-manifest.md\n" +
        "2. content/contracts/starter-contracts.json\n" +
        "3. content/npcs/starter-npcs.json\n" +
        "4. content/drops/starter-drops.json\n" +
        "The current contracts are generic placeholders (slay_goblins, clear_wolves, etc.).\n" +
        "You must rewrite content/contracts/starter-contracts.json to match the 6 Old Town-specific contracts from the design:\n" +
        "1. rats-under-tallys-contract\n" +
        '   - display_name: "Rats Under Tally\'s"\n' +
        "   - giver: warden-holt\n" +
        "   - target: cellar-rat\n" +
        "   - count: 5\n" +
        "   - rewards: coins x20, rat-tail x1, 50 wardenry XP\n" +
        "   - ledger_tier: Stamped\n" +
        "2. mud-on-the-north-road\n" +
        '   - display_name: "Mud on the North Road"\n' +
        "   - giver: warden-holt\n" +
        "   - target: mud-goblin\n" +
        "   - count: 3\n" +
        "   - rewards: coins x50, pig-iron-scrap x1, 100 wardenry XP\n" +
        "   - ledger_tier: Stamped\n" +
        "3. bats-in-the-bell-rafters\n" +
        '   - display_name: "Bats in the Bell Rafters"\n' +
        "   - giver: warden-holt\n" +
        "   - target: bell-bat\n" +
        "   - count: 4\n" +
        "   - rewards: coins x40, bellfeathers x5, 80 wardenry XP\n" +
        "   - ledger_tier: Stamped\n" +
        "4. foxes-in-patch-lane\n" +
        '   - display_name: "Foxes in Patch Lane"\n' +
        "   - giver: warden-holt\n" +
        "   - target: bog-fox\n" +
        "   - count: 2\n" +
        "   - rewards: coins x60, fox-hide x1, 120 wardenry XP\n" +
        "   - ledger_tier: Stamped\n" +
        "5. mites-at-gravegate\n" +
        '   - display_name: "Mites at Gravegate"\n' +
        "   - giver: warden-holt\n" +
        "   - target: grave-mite\n" +
        "   - count: 5\n" +
        "   - rewards: coins x30, grave-dust x3, 70 wardenry XP\n" +
        "   - ledger_tier: Stamped\n" +
        "6. smoke-in-the-old-kiln\n" +
        '   - display_name: "Smoke in the Old Kiln"\n' +
        "   - giver: warden-holt\n" +
        "   - target: ash-drake-whelp\n" +
        "   - count: 1\n" +
        "   - rewards: coins x100, warm-scale x1, 200 wardenry XP\n" +
        "   - ledger_tier: Chartered\n" +
        "Make sure the schema validates. Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run content:validate\n" +
        "Fix any validation errors. Report the contracts you wrote.",
      { label: "Rewrite Old Town contracts", phase: "Content Alignment" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. docs/content/seed-shops-services-ledger-manifest.md\n" +
        "2. docs/economy/starter-shop-stocks.md\n" +
        "3. docs/economy/shop-system.md\n" +
        "4. content/shops/starter-shops.json\n" +
        "5. content/npcs/starter-npcs.json\n" +
        "The current shops are generic (general_store, weapon_shop, magic_shop).\n" +
        "You must create the 10 Old Town shops with proper stock, prices, and NPC linkage:\n" +
        "1. counting_house — NPC: tomas_tally (banker/shop hybrid)\n" +
        "2. general_stall — NPC: general_stall_keeper\n" +
        "3. penny_and_sons_forge — NPC: osric_penny (smithing shop)\n" +
        "4. lath_and_twine — NPC: letha_lath (bowcraft shop)\n" +
        "5. patch_and_awl — NPC: nell_patch (tailoring shop)\n" +
        "6. chalkhouse — NPC: mother_tallow (beadwork shop)\n" +
        "7. warden_board — NPC: warden_holt (contract board)\n" +
        "8. shrine_hearth — NPC: sister_writ (favour shop)\n" +
        "9. river_stoop — NPC: river_stoop_keeper (fishing/food shop)\n" +
        "10. sootcellar_blacksealed_shop — NPC: blacksealed_merchant\n" +
        "For each shop, define:\n" +
        "- stock array with item_id, base_price, initial_stock, max_stock, restock_ticks\n" +
        "- buy_policy and sell_policy\n" +
        "- unlock conditions (if any)\n" +
        "If the NPC does not exist in starter-npcs.json, add them as a minimal NPC entry.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run content:validate\n" +
        "Fix any validation errors. Report the shops you created.",
      { label: "Create Old Town shops", phase: "Content Alignment" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. content/items/*.json (all item files)\n" +
        "2. docs/items/00-index.md\n" +
        "3. apps/server/src/systems/appearance-system.ts\n" +
        "Every equippable item (weapons, armour, tools) should have a model field that maps to a client renderable ID.\n" +
        "For each item file:\n" +
        '- If the item is equippable (has equipSlot or wieldSlot), add: "model": "model_[item_id]"\n' +
        '- If the item is a tool (axe, pickaxe, rod), add: "model": "model_[item_id]"\n' +
        "- If the item already has a model field, keep it\n" +
        "For example:\n" +
        '- pennywrought_shortblade -> "model": "model_pennywrought_shortblade"\n' +
        '- lathwood_shortbow -> "model": "model_lathwood_shortbow"\n' +
        '- patchhide_coif -> "model": "model_patchhide_coif"\n' +
        "Also add a model field for all starter armour pieces (head, chest, legs, feet, hands, shield, coif, jerkin, chaps, vambraces, treads, buckler, cowl, robe, wraps, cuffs, softshoes, charmward).\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run content:validate\n" +
        "Fix any validation errors. Report the items you added model fields to.",
      { label: "Add item model fields", phase: "Content Alignment" },
    ),
]);

log("Phase 4 complete: " + content.filter(Boolean).length + " agents succeeded");

// PHASE 5: CLIENT UI
phase("Client UI");
log("Phase 5: Client UI — adding panels, packet wiring, layers, and HTML");

const client = await parallel([
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/client/src/game/ui/UIState.ts\n" +
        "2. apps/client/src/game/ui/UIManager.ts\n" +
        "3. apps/client/src/game/ui/UIManager.test.ts\n" +
        "4. apps/client/index.html\n" +
        "You must add the following to UIState.ts:\n" +
        "1. xpDrops: Array of { skillId, amount, timestamp }\n" +
        "2. contract: { active: ContractData | null; completed: ContractData[] }\n" +
        "3. recipeList: { stationId: string | null; recipes: Recipe[] }\n" +
        "4. statusEffects: Array of { effectId, durationTicks, iconColor }\n" +
        "5. deathScreen: { isDead: boolean; respawnCountdown: number }\n" +
        "6. Add addXpDrops, setContract, setRecipeList, setStatusEffects, setDeathScreen methods with notify callbacks.\n" +
        "You must add the following to UIManager.ts:\n" +
        "1. _renderContractPanel() — shows active contract progress, objectives, and completion status\n" +
        "2. _renderRecipeList() — shows available recipes at current station with levels, ingredients, outputs\n" +
        "3. _renderStatusEffects() — shows buff/debuff bar\n" +
        "4. _renderDeathScreen() — shows death overlay with respawn countdown\n" +
        '5. Enhance _renderBank() to add deposit buttons (when bank is open, inventory items show "deposit" button)\n' +
        '6. Enhance _renderShop() to add sell buttons (when shop is open, inventory items show "sell" button)\n' +
        "7. Enhance _renderSkills() to add XP progress bars and raw XP numbers\n" +
        "8. Add keybindings for new panels (if needed)\n" +
        "For each render method, add the corresponding HTML panel element to index.html if it does not exist.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the UI panels you added.",
      { label: "Overhaul UIState and UIManager", phase: "Client UI" },
    ),
  () =>
    agent(
      "Read apps/client/src/game/net/ClientPacketApplier.ts carefully.\n" +
        "Currently, these packets are received but NOT applied to UIState or scene:\n" +
        "1. xpDrops — server sends XP drop data, but client drops it\n" +
        "2. deathNotices — server sends death notice, but client does nothing\n" +
        "3. respawnNotices — server sends respawn notice, but client does nothing\n" +
        "4. sounds — server sends sound packets, but client has no audio manager\n" +
        "5. recipeLists — server sends available recipes, but client ignores them\n" +
        "6. recipeResults — server sends craft result, but client ignores it\n" +
        "7. contractComplete — server sends contract completion, but client only logs to debug\n" +
        "8. statusEffects — server sends active effects, but client ignores them\n" +
        "9. overheadText — entity update has overheadText, but only chat messages create overhead text\n" +
        "10. animation — entity update has animation changes, but updateAnimation is never called\n" +
        "11. moveSpeed — entity update has moveSpeed, but it is never used\n" +
        "12. facingEntity — entity update has facingEntity, but only facingTile is processed\n" +
        "13. graphic — entity update has graphic, but no overlay layer exists\n" +
        "14. bank — full state packet has bank field, but it is never applied to UIState\n" +
        "You must wire ALL of these:\n" +
        "1. Add packet.xpDrops -> UIState.addXpDrops\n" +
        "2. Add packet.deathNotices -> UIState.setDeathScreen + ActorRenderer.hide\n" +
        "3. Add packet.respawnNotices -> UIState.setDeathScreen(false) + ActorRenderer.show\n" +
        "4. Add packet.sounds -> (log for now, audio manager later)\n" +
        "5. Add packet.recipeLists -> UIState.setRecipeList\n" +
        "6. Add packet.recipeResults -> (show result notification)\n" +
        "7. Add packet.contractComplete -> UIState.setContract + show notification\n" +
        "8. Add entity update changes.statusEffects -> UIState.setStatusEffects\n" +
        "9. Add entity update changes.overheadText -> ChatOverheadLayer.show\n" +
        "10. Add entity update changes.animation -> ctx.actors.updateAnimation\n" +
        "11. Add entity update changes.moveSpeed -> ctx.actors.updateMoveSpeed\n" +
        "12. Add entity update changes.facingEntity -> compute direction and update rotation\n" +
        "13. Add entity update changes.graphic -> (spawn transient graphic if OverlayLayer exists)\n" +
        "14. Add packet.bank -> UIState.setBank\n" +
        "Also update applyFullState to apply the bank field.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the packet wiring you added.",
      { label: "Wire ClientPacketApplier", phase: "Client UI" },
    ),
  () =>
    agent(
      "Read apps/client/index.html and docs/ui-inspiration.md.\n" +
        "You must add the following HTML panels to index.html if they do not exist:\n" +
        "1. minimap-panel — a small canvas element for the minimap, positioned in the top-right corner\n" +
        "2. recipe-panel — a panel that opens when using a station, showing recipe list\n" +
        "3. contract-panel — a panel showing active contract progress\n" +
        "4. status-effects-panel — a small buff bar showing active status effects\n" +
        "5. death-screen — a full-screen overlay for death/respawn\n" +
        "6. notification-toast — a temporary notification overlay for events (contract complete, recipe result, etc.)\n" +
        "For each panel:\n" +
        "- Add a div with appropriate id and class\n" +
        "- Add CSS for positioning and visibility\n" +
        "- Make it toggleable via UIManager\n" +
        "- Ensure it does not break existing layout\n" +
        "Also check if these panels already exist (they might be partially there). If they exist, enhance them.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the HTML panels you added.",
      { label: "Add HTML panels", phase: "Client UI" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. apps/client/src/game/GameEngine.ts\n" +
        "2. apps/client/src/game/scene/HitsplatLayer.ts\n" +
        "3. apps/client/src/game/scene/ProjectileLayer.ts\n" +
        "4. apps/client/src/game/scene/ChatOverheadLayer.ts\n" +
        "You must create TWO new layer files:\n" +
        "1. apps/client/src/game/scene/XpDropLayer.ts\n" +
        "   - Renders floating XP numbers above the player or at a HUD position\n" +
        "   - Accepts { skillId, amount, position } entries\n" +
        "   - Animates numbers upward with fade-out\n" +
        "   - Removes after 2 seconds\n" +
        "   - Style: skill-specific color (e.g., green for woodcutting, brown for mining, red for combat)\n" +
        "2. apps/client/src/game/scene/MinimapLayer.ts\n" +
        "   - Renders a small minimap in the corner\n" +
        "   - Shows player position as a dot\n" +
        "   - Shows nearby entities (NPCs, objects, players) as small dots\n" +
        "   - Shows revealed tiles from cartography survey data\n" +
        "   - Supports click-to-move\n" +
        "   - Updates every frame\n" +
        "Then update GameEngine.ts to:\n" +
        "- Create and manage these layers\n" +
        "- Pass them to the renderer loop\n" +
        "- Call their update methods every frame\n" +
        "Also update UIManager.ts to:\n" +
        '- Toggle minimap visibility on "M" key press\n' +
        "- Show XP drops when UIState.xpDrops changes\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run test\n" +
        "Fix any test failures. Report the layers you created.",
      { label: "Create XpDropLayer and MinimapLayer", phase: "Client UI" },
    ),
]);

log("Phase 5 complete: " + client.filter(Boolean).length + " agents succeeded");

// PHASE 6: VALIDATION AND DOCS
phase("Validation and Docs");
log("Phase 6: Validation — running all tests, fixing failures, updating docs");

const validation = await parallel([
  () =>
    agent(
      "Run the full validation suite:\n" +
        "1. cd /Users/jasminecaruana/Documents/Josh/Code/old-town\n" +
        "2. bun run test\n" +
        "3. bun run typecheck\n" +
        "4. bun run content:validate\n" +
        "5. bun run format:check\n" +
        "For each failing test:\n" +
        "- Read the test file\n" +
        "- Understand what it expects\n" +
        "- Fix the code OR the test (if the test is outdated due to your changes)\n" +
        "- Re-run until all tests pass\n" +
        "For each type error:\n" +
        "- Read the error location\n" +
        "- Fix the type\n" +
        "For each content validation warning:\n" +
        "- Fix the content\n" +
        "For each format issue:\n" +
        "- Run bun run format\n" +
        "This is the FINAL validation. Do not stop until all four commands pass with zero errors.\n" +
        "Report: number of tests passed, type errors remaining, content validation errors, format status.",
      { label: "Run full validation suite", phase: "Validation and Docs" },
    ),
  () =>
    agent(
      "Read these files:\n" +
        "1. docs/content/runtime-gap-list.md\n" +
        "2. docs/content/first-30-minute-playability-audit.md\n" +
        "3. docs/content/action-wiring-audit.md\n" +
        "You must update all three audit documents to reflect the changes made by this workflow:\n" +
        "1. runtime-gap-list.md:\n" +
        '   - Mark resolved gaps as "Implemented"\n' +
        "   - Add new gaps discovered during this build\n" +
        "   - Re-classify remaining gaps (P0, P1, P2)\n" +
        '   - Update the "What Works Right Now" section\n' +
        "2. first-30-minute-playability-audit.md:\n" +
        "   - Re-evaluate all 7 loops (A through G)\n" +
        "   - Update the Playable? column\n" +
        "   - Update the Blocking Gaps column\n" +
        "   - Update the summary table\n" +
        "3. action-wiring-audit.md:\n" +
        "   - Update the status of all action IDs\n" +
        '   - Mark newly wired actions as "Supported"\n' +
        "   - Add any new action IDs introduced\n" +
        "Be honest. If something is still broken, say so. If something is now working, celebrate it.\n" +
        "Run: cd /Users/jasminecaruana/Documents/Josh/Code/old-town && bun run format:check\n" +
        "Fix any format issues. Report the updated audit status.",
      { label: "Update audit docs", phase: "Validation and Docs" },
    ),
]);

log("Phase 6 complete: " + validation.filter(Boolean).length + " agents succeeded");

return {
  foundation: foundation.filter(Boolean),
  routing: routing.filter(Boolean),
  systems: systems.filter(Boolean),
  content: content.filter(Boolean),
  client: client.filter(Boolean),
  validation: validation.filter(Boolean),
  totalAgents: 20,
  completedAgents: [foundation, routing, systems, content, client, validation].flat().filter(Boolean).length,
}
