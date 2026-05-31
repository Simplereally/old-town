---
doc_type: authority
canonical_path: docs/bosses/boss-quest-hooks.md
parent_index: docs/bosses/00-index.md
root_index: docs/00-index.md
---

Parent: [Bosses Index](00-index.md)

Authority references:
- `docs/bosses/boss-system.md`
- `docs/bosses/boss-categories.md`
- `docs/bosses/starter-bosses.md`
- `docs/bosses/first-ring-bosses.md`
- `docs/bosses/second-ring-boss-seeds.md`
- `docs/quests/quest-system.md`
- `docs/quests/starter-quest-arc.md`
- `docs/creatures/wardenry-contracts.md`
- `docs/areas/area-quest-hooks.md`

# Boss Quest Hooks

This document defines quest hooks that introduce players to bosses and deepen their mastery within each. Bosses and quests are separate systems that overlap. A quest can introduce a boss, and a boss can have quest hooks that unlock new mechanics or rewards.

## Hook Format

Every hook in this document follows the same structure:

| Field | Description |
|-------|-------------|
| **quest_name** | The player-facing name of the quest. |
| **giver** | The NPC who gives the quest. |
| **boss** | The boss the quest is tied to. |
| **premise** | One sentence that explains the quest. |
| **systems** | The skills or systems touched by the quest. |
| **reward** | What the player receives for completing the quest. |
| **hook_line** | A memorable line that the NPC says. |

## Starter Boss Hooks

### Hook 1: The King Below the Ledger

- **quest_name:** The King Below the Ledger
- **giver:** Marn Lock
- **boss:** The Cellar King
- **premise:** The cellar rats have stopped coming up. Marn asks the player to find out what is keeping them below.
- **systems:** Arms, Guard, Sleight
- **reward:** ratcatcher_tail, cellar_king_whisker, small coins
- **hook_line:** "The rats ain't scared of us no more. Something down there's scarier than a broom."

### Hook 2: The Mud That Walked

- **quest_name:** The Mud That Walked
- **giver:** Sella Coalhand
- **boss:** Mudhook Grib
- **premise:** The quarry road is blocked by a mud creature. Sella asks the player to clear the road.
- **systems:** Arms, Guard, Wardenry
- **reward:** pig_iron_scrap_bundle, mudhook_charm, quarry_token
- **hook_line:** "The mud on the North Road ain't mud no more. It's got eyes and a bad temper."

## First-Ring Boss Hooks

### Hook 3: The Bell That Bit Back

- **quest_name:** The Bell That Bit Back
- **giver:** Sella Coalhand
- **boss:** The Cut Bell
- **premise:** The quarry shift bell has started ringing before cave-ins. Sella asks the player to investigate.
- **systems:** Mining, Smithing, Wardenry
- **reward:** Cut Bell access, quarry-safe charm, bell_metal
- **hook_line:** "A bell should warn you after someone pulls it. This one's guessing."

### Hook 4: The Stump That Wouldn't Burn

- **quest_name:** The Stump That Wouldn't Burn
- **giver:** Aunt Bracken
- **boss:** Aunt Bracken's Stump
- **premise:** A stump in the Bellwood Copse refuses to burn. Aunt Bracken asks the player to find out why.
- **systems:** Woodcutting, Gardening, Bowcraft
- **reward:** bark_bundle, bow_stave, stump_ring
- **hook_line:** "Some stumps don't burn. Some stumps don't want to burn. Find out which this one is."

### Hook 5: The Crow That Called the Road

- **quest_name:** The Crow That Called the Road
- **giver:** Orven Roadcap
- **boss:** Crowpost Jack
- **premise:** The crows on Crowmile Road have started attacking travellers. Orven asks the player to find the crow caller.
- **systems:** Wayfaring, Cartography, Wardenry
- **reward:** crow_token, crow_caller_claw, road_scrap
- **hook_line:** "A crow that calls the road is a crow that's got a master. Find the master, and the road opens."

### Hook 6: The Hide That Stitched Itself

- **quest_name:** The Hide That Stitched Itself
- **giver:** Rowen Hidepeg
- **boss:** Hidepeg Horror
- **premise:** A hide in the Patchfield tannery has stitched itself into a creature. Rowen asks the player to unmake it.
- **systems:** Trapping, Tailoring, Wardenry
- **reward:** hide_bundle, sinew_cord, hidepeg_nail
- **hook_line:** "A hide that stitches itself is a hide that's tired of being worn. Unmake it before it wears you."

### Hook 7: The Eel That Ate the Ferry

- **quest_name:** The Eel That Ate the Ferry
- **giver:** Pell Hookline
- **boss:** The Ferry Eel
- **premise:** The Wardenbrook ferry has been attacked by a giant eel. Pell asks the player to save the ferry.
- **systems:** Fishing, Cooking, Wayfaring
- **reward:** eel_meat, eel_skin, ferry_eel_tooth
- **hook_line:** "An eel that eats a ferry is an eel that's hungry for more than fish. Feed it something else."

### Hook 8: The Son That Wouldn't Stay Buried

- **quest_name:** The Son That Wouldn't Stay Buried
- **giver:** Cress Lowgrave
- **boss:** Gravekeeper's Wrong Son
- **premise:** The wrong son of a gravekeeper has risen from the Grave Underways. Cress asks the player to lay him to rest.
- **systems:** Favour, Gardening, Hearthcraft
- **reward:** grave_shovel, grave_lantern, wrong_son_ring
- **hook_line:** "A son that won't stay buried is a son that wasn't buried right. Bury him again, or join him."

### Hook 9: The Worm That Ate the Kiln

- **quest_name:** The Worm That Ate the Kiln
- **giver:** Noll Kilnwatch
- **boss:** Kiln-Worm Noll Saw
- **premise:** The Old Kiln tunnels have collapsed, and a worm is loose. Noll asks the player to clear the tunnels.
- **systems:** Hearthcraft, Beadwork, Mining
- **reward:** worm_segment, ash_bundle, worm_scale
- **hook_line:** "A worm that eats a kiln is a worm that's either very hungry or very wrong. Find out which."

### Hook 10: The Door That Opened Its Mouth

- **quest_name:** The Door That Opened Its Mouth
- **giver:** Vey Falsewick
- **boss:** The Door That Bites
- **premise:** A door in the Sootstairs has started biting. Vey asks the player to find out what is inside.
- **systems:** Sleight, Cartography, Wardenry
- **reward:** door_fragment, lock_fragment, door_hinge
- **hook_line:** "A door that opens its mouth is a door that's either hungry or lying. Find out which before you step through."

## Second-Ring Boss Seed Hooks

### Hook 11: The Crown That Fell From the Tree

- **quest_name:** The Crown That Fell From the Tree
- **giver:** Greenwold Forester
- **boss:** Crownheart Antler-King
- **premise:** The Crownheart Forest has grown dark. The forester asks the player to find the source.
- **systems:** Hunting, Woodcutting, Wayfaring
- **reward:** crownheart_antler, forest_token, rare_hide
- **hook_line:** "A crown that falls from a tree is a crown that wasn't meant for a king. Find out who it was meant for."

### Hook 12: The Shield That Wouldn't Break

- **quest_name:** The Shield That Wouldn't Break
- **giver:** Blackbar Miner
- **boss:** Blackbar Foreman
- **premise:** The Blackbar Foreman's shield has become unbreakable. The miner asks the player to find the weakness.
- **systems:** Mining, Smithing, Arms
- **reward:** blackbar_shield_breaker, ore_bundle, mining_token
- **hook_line:** "A shield that won't break is a shield that's either very strong or very scared. Find out which."

### Hook 13: The Mourner That Wouldn't Stop

- **quest_name:** The Mourner That Wouldn't Stop
- **giver:** Gravekeeper
- **boss:** Mourner Below
- **premise:** A mourner in the Grave Underways has been crying for a month. The gravekeeper asks the player to find out why.
- **systems:** Favour, Gardening, Hearthcraft
- **reward:** mourner_shroud, grave_token, cleanse_salve
- **hook_line:** "A mourner that won't stop is a mourner that's either very sad or very alive. Find out which."

### Hook 14: The Listener That Heard Too Much

- **quest_name:** The Listener That Heard Too Much
- **giver:** Witchwood Beadwife
- **boss:** Witchwood Listener
- **premise:** The Witchwood trees have started listening. The beadwife asks the player to find the listener.
- **systems:** Beadwork, Magic, Sleight
- **reward:** listener_bead, bead_bundle, magic_token
- **hook_line:** "A listener that hears too much is a listener that's either very curious or very dangerous. Find out which."

### Hook 15: The Lantern That Lured the Moth

- **quest_name:** The Lantern That Lured the Moth
- **giver:** Ferry Keeper
- **boss:** Moth Ferry Lantern
- **premise:** The Moth Ferry lantern has attracted a giant moth. The keeper asks the player to save the ferry.
- **systems:** Wayfaring, Cooking, Hearthcraft
- **reward:** lantern_moth_wing, ferry_token, light_salve
- **hook_line:** "A lantern that lures a moth is a lantern that's either very bright or very foolish. Find out which."

### Hook 16: The Champion That Never Lost

- **quest_name:** The Champion That Never Lost
- **giver:** Carmine Yardmaster
- **boss:** Redcord Champion
- **premise:** The Redcord Champion has challenged the player to a duel. The yardmaster asks the player to accept.
- **systems:** Arms, Guard, Wardenry
- **reward:** redcord_glove, combat_token, duelist_charm
- **hook_line:** "A champion that never lost is a champion that's either very good or very careful. Find out which."

### Hook 17: The Penitent That Walked Too Long

- **quest_name:** The Penitent That Walked Too Long
- **giver:** Argent Chapel Priest
- **boss:** Argent Penitent
- **premise:** The Argent Penitent has been walking the chapel road for centuries. The priest asks the player to find out why.
- **systems:** Favour, Gardening, Hearthcraft
- **reward:** argent_chalice, favour_token, cleanse_salve
- **hook_line:** "A penitent that walks too long is a penitent that's either very sorry or very lost. Find out which."

## Cross-Boss Chain Hook

### Hook 18: The Chain That Binds the Kiln

- **quest_name:** The Chain That Binds the Kiln
- **giver:** Noll Kilnwatch
- **boss:** Ashling in the Kiln, Kiln-Worm Noll Saw, Old Kiln Watch
- **premise:** The Old Kiln is haunted by three dangers: the Ashling, the Worm, and the Watch. Noll asks the player to bind them all.
- **systems:** Hearthcraft, Beadwork, Mining, Wardenry
- **reward:** kiln_master_token, ashling_ember, worm_scale, noll_saw_fragment
- **hook_line:** "A kiln that binds three dangers is a kiln that's either very unlucky or very cursed. Bind them, or be the fourth."

## Hook Summary Table

| # | Quest Name | Giver | Boss | Systems | Reward |
|---|------------|-------|------|---------|--------|
| 1 | The King Below the Ledger | Marn Lock | The Cellar King | Arms, Guard, Sleight | ratcatcher_tail, cellar_king_whisker, small coins |
| 2 | The Mud That Walked | Sella Coalhand | Mudhook Grib | Arms, Guard, Wardenry | pig_iron_scrap_bundle, mudhook_charm, quarry_token |
| 3 | The Bell That Bit Back | Sella Coalhand | The Cut Bell | Mining, Smithing, Wardenry | Cut Bell access, quarry-safe charm, bell_metal |
| 4 | The Stump That Wouldn't Burn | Aunt Bracken | Aunt Bracken's Stump | Woodcutting, Gardening, Bowcraft | bark_bundle, bow_stave, stump_ring |
| 5 | The Crow That Called the Road | Orven Roadcap | Crowpost Jack | Wayfaring, Cartography, Wardenry | crow_token, crow_caller_claw, road_scrap |
| 6 | The Hide That Stitched Itself | Rowen Hidepeg | Hidepeg Horror | Trapping, Tailoring, Wardenry | hide_bundle, sinew_cord, hidepeg_nail |
| 7 | The Eel That Ate the Ferry | Pell Hookline | The Ferry Eel | Fishing, Cooking, Wayfaring | eel_meat, eel_skin, ferry_eel_tooth |
| 8 | The Son That Wouldn't Stay Buried | Cress Lowgrave | Gravekeeper's Wrong Son | Favour, Gardening, Hearthcraft | grave_shovel, grave_lantern, wrong_son_ring |
| 9 | The Worm That Ate the Kiln | Noll Kilnwatch | Kiln-Worm Noll Saw | Hearthcraft, Beadwork, Mining | worm_segment, ash_bundle, worm_scale |
| 10 | The Door That Opened Its Mouth | Vey Falsewick | The Door That Bites | Sleight, Cartography, Wardenry | door_fragment, lock_fragment, door_hinge |
| 11 | The Crown That Fell From the Tree | Greenwold Forester | Crownheart Antler-King | Hunting, Woodcutting, Wayfaring | crownheart_antler, forest_token, rare_hide |
| 12 | The Shield That Wouldn't Break | Blackbar Miner | Blackbar Foreman | Mining, Smithing, Arms | blackbar_shield_breaker, ore_bundle, mining_token |
| 13 | The Mourner That Wouldn't Stop | Gravekeeper | Mourner Below | Favour, Gardening, Hearthcraft | mourner_shroud, grave_token, cleanse_salve |
| 14 | The Listener That Heard Too Much | Witchwood Beadwife | Witchwood Listener | Beadwork, Magic, Sleight | listener_bead, bead_bundle, magic_token |
| 15 | The Lantern That Lured the Moth | Ferry Keeper | Moth Ferry Lantern | Wayfaring, Cooking, Hearthcraft | lantern_moth_wing, ferry_token, light_salve |
| 16 | The Champion That Never Lost | Carmine Yardmaster | Redcord Champion | Arms, Guard, Wardenry | redcord_glove, combat_token, duelist_charm |
| 17 | The Penitent That Walked Too Long | Argent Chapel Priest | Argent Penitent | Favour, Gardening, Hearthcraft | argent_chalice, favour_token, cleanse_salve |
| 18 | The Chain That Binds the Kiln | Noll Kilnwatch | Ashling, Worm, Watch | Hearthcraft, Beadwork, Mining, Wardenry | kiln_master_token, ashling_ember, worm_scale, noll_saw_fragment |

## Deferred to Implementation

The following elements are intentionally left out of this document and will be defined during quest implementation:

- Full quest scripts with step-by-step objectives
- Dialogue trees and NPC conversation branches
- Exact item requirements and reward quantities
- Experience point or favour values for completion
- Conditional branching based on player skills or choices
- Quest failure states and retry logic
- Integration with the quest journal UI

These details belong in the quest system's implementation layer, not in the design authority. This document provides the narrative and mechanical skeleton. The quest system fills in the bones.

---

*Last updated: 2026-05-31*
